import { Router } from "express";
import { AnalyzeGoalBody } from "@workspace/api-zod";

const router = Router();

function analyzeGoal(goal: string, brutalHonesty: boolean) {
  const lower = goal.toLowerCase().trim();

  if (lower.length < 10) {
    return {
      feasibility: "Unrealistic" as const,
      reason: brutalHonesty
        ? "That's not even a goal. That's a word. Come back when you have a real plan."
        : "Your goal is too vague to evaluate meaningfully. Please provide more detail.",
      plan: "Start by writing out your goal in at least 2–3 sentences: what you want, by when, and why.",
    };
  }

  const aggressiveKeywords = [
    "million", "billionaire", "overnight", "passive income", "get rich",
    "famous", "viral", "quit my job tomorrow", "retire in a year",
  ];
  const isAggressive = aggressiveKeywords.some((kw) => lower.includes(kw));

  const shortTimeline = /in (\d+)\s*(day|week)/i.test(lower);

  if (isAggressive || shortTimeline) {
    return {
      feasibility: "Unrealistic" as const,
      reason: brutalHonesty
        ? "This goal has the fingerprints of wishful thinking all over it. The timeline or the target (or both) are detached from reality."
        : "This goal sets expectations that are very difficult to meet given typical timelines and constraints.",
      plan: "Reframe the goal around what you can reliably do in 90 days. Build compounding momentum through smaller wins rather than betting everything on a single outcome.",
    };
  }

  const moderateKeywords = [
    "start a business", "launch", "lose weight", "learn", "improve",
    "build", "create", "side project", "freelance", "promotion",
  ];
  const isModerate = moderateKeywords.some((kw) => lower.includes(kw));

  if (isModerate) {
    return {
      feasibility: "Risky" as const,
      reason: brutalHonesty
        ? "This is achievable but most people fail at it — not because they can't, but because they underestimate the sustained effort required."
        : "This goal is achievable but carries real risk. Success depends heavily on consistent effort and avoiding common planning traps.",
      plan: "Break this into 3 phases over 6–12 months. Define specific, measurable checkpoints for month 1, month 3, and month 6. Identify the single most likely reason you'll quit and build a contingency for it.",
    };
  }

  return {
    feasibility: "Realistic" as const,
    reason: brutalHonesty
      ? "This looks doable — but don't mistake a reasonable goal for a guaranteed outcome. Execution is where most people stumble."
      : "This goal is well-scoped and achievable with consistent effort and a clear plan.",
    plan: "Define weekly milestones and schedule a dedicated review every 2 weeks. Track your progress in writing — people who document their journey are significantly more likely to follow through.",
  };
}

router.post("/analyze", (req, res) => {
  const parseResult = AnalyzeGoalBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body: goal and brutalHonesty are required" });
    return;
  }

  const { goal, brutalHonesty } = parseResult.data;

  try {
    const result = analyzeGoal(goal, brutalHonesty);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error analyzing goal");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
