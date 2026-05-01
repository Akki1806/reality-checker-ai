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

  const systemPrompt = `You are a brutally honest but logical advisor.
Analyze the user's goal for feasibility.

Rules:
- No motivational fluff
- Be realistic and data-driven
- Clearly explain if unrealistic
- Suggest a better plan

Scoring:
- Assign a realityScore from 0 to 100 based on how achievable the goal is
- 0–30 → Unrealistic (impossible timeline, magical thinking, no basis in reality)
- 31–60 → Risky (achievable but requires exceptional execution, high failure rate)
- 61–100 → Realistic (well-scoped, achievable with consistent effort)
- The feasibility field must match the score range exactly

Tone:
- If brutalHonesty = true → harsh and direct, no softening
- If false → balanced and constructive

Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "feasibility": "Realistic" or "Risky" or "Unrealistic",
  "realityScore": 0-100,
  "reason": "...",
  "plan": "..."
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

    let parsed: { feasibility: string; realityScore: unknown; reason: string; plan: string };
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
    const score = Number(parsed.realityScore);
    if (
      !parsed.feasibility ||
      !validFeasibility.includes(parsed.feasibility) ||
      typeof parsed.reason !== "string" ||
      typeof parsed.plan !== "string" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100
    ) {
      req.log.error({ parsed }, "Claude returned invalid shape");
      res.status(500).json({ error: "AI returned an unexpected response structure" });
      return;
    }

    res.json({
      feasibility: parsed.feasibility as "Realistic" | "Risky" | "Unrealistic",
      realityScore: Math.round(score),
      reason: parsed.reason,
      plan: parsed.plan,
    });
  } catch (err) {
    req.log.error({ err }, "Error calling Claude API");
    res.status(500).json({ error: "Failed to analyze goal. Please try again." });
  }
});

export default router;
