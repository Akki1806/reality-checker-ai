import { Router } from "express";
import { AnalyzeGoalBody } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzeGoalBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body: goal and brutalHonesty are required" });
    return;
  }

  const { goal, brutalHonesty } = parseResult.data;

  const systemPrompt = `You are a brutally honest but logical advisor that evaluates goals for feasibility.

Tone:
- brutalHonesty=true → blunt, direct, no softening
- brutalHonesty=false → balanced, constructive but honest

Instructions:
1. Detect the goal category: "money", "fitness", "career", "business", or "other"
2. Assign a realityScore from 0–100:
   - 0–30 → Unrealistic (magical thinking, impossible timeline, no basis in reality)
   - 31–60 → Risky (achievable but high failure rate, needs exceptional execution)
   - 61–100 → Realistic (well-scoped, achievable with consistent effort)
3. Write scoreReason: one short sentence (max 20 words) explaining the exact score
4. Write reason: exactly 2–3 key factors as a single structured paragraph — no bullet points, no filler
5. Write plan: exactly 3–4 bullet points, each under 20 words, sharp and immediately actionable

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "feasibility": "Realistic" | "Risky" | "Unrealistic",
  "realityScore": 0-100,
  "scoreReason": "...",
  "category": "money" | "fitness" | "career" | "business" | "other",
  "reason": "...",
  "plan": ["...", "...", "...", "..."]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Goal: "${goal}"\nBrutal Honesty Mode: ${brutalHonesty}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      req.log.error({ block }, "Unexpected content block type from Claude");
      res.status(500).json({ error: "Unexpected response format from AI" });
      return;
    }

    let parsed: {
      feasibility: string;
      realityScore: unknown;
      scoreReason: unknown;
      category: unknown;
      reason: string;
      plan: unknown;
    };

    try {
      const cleaned = block.text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.error({ raw: block.text }, "Failed to parse Claude JSON response");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const validFeasibility = ["Realistic", "Risky", "Unrealistic"];
    const validCategories = ["money", "fitness", "career", "business", "other"];
    const score = Number(parsed.realityScore);

    if (
      !validFeasibility.includes(parsed.feasibility) ||
      !Number.isFinite(score) || score < 0 || score > 100 ||
      typeof parsed.scoreReason !== "string" ||
      !validCategories.includes(parsed.category as string) ||
      typeof parsed.reason !== "string" ||
      !Array.isArray(parsed.plan) || parsed.plan.length === 0 ||
      !(parsed.plan as unknown[]).every((p) => typeof p === "string")
    ) {
      req.log.error({ parsed }, "Claude returned invalid shape");
      res.status(500).json({ error: "AI returned an unexpected response structure" });
      return;
    }

    res.json({
      feasibility: parsed.feasibility as "Realistic" | "Risky" | "Unrealistic",
      realityScore: Math.round(score),
      scoreReason: parsed.scoreReason as string,
      category: parsed.category as string,
      reason: parsed.reason,
      plan: (parsed.plan as string[]).slice(0, 4),
    });
  } catch (err) {
    req.log.error({ err }, "Error calling Claude API");
    res.status(500).json({ error: "Failed to analyze goal. Please try again." });
  }
});

export default router;
