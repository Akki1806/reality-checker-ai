import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAnalyzeGoal } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Terminal, ShieldAlert, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

function getScoreColors(score: number) {
  if (score <= 30) return {
    text: "text-red-400",
    bg: "bg-red-500",
    glow: "rgba(239,68,68,0.35)",
    cardGlow: "0 0 40px -8px rgba(239,68,68,0.2), 0 0 0 1px rgba(239,68,68,0.12)",
    barFrom: "#ef4444",
    barTo: "#dc2626",
  };
  if (score <= 60) return {
    text: "text-amber-400",
    bg: "bg-amber-400",
    glow: "rgba(251,191,36,0.35)",
    cardGlow: "0 0 40px -8px rgba(251,191,36,0.2), 0 0 0 1px rgba(251,191,36,0.12)",
    barFrom: "#f59e0b",
    barTo: "#d97706",
  };
  return {
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    glow: "rgba(52,211,153,0.35)",
    cardGlow: "0 0 40px -8px rgba(52,211,153,0.2), 0 0 0 1px rgba(52,211,153,0.12)",
    barFrom: "#34d399",
    barTo: "#10b981",
  };
}

function getFeasibilityBadgeStyle(feasibility: string) {
  switch (feasibility) {
    case "Realistic":  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    case "Risky":      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    case "Unrealistic":return "bg-red-500/10 text-red-400 border-red-500/25";
    default:           return "bg-muted text-muted-foreground border-border";
  }
}

function ScoreDisplay({ score }: { score: number }) {
  const colors = getScoreColors(score);

  return (
    <div className="flex flex-col items-center gap-4 py-6" data-testid="display-reality-score">
      <div className="relative flex flex-col items-center">
        <div
          className={cn("text-[6rem] leading-none font-bold tabular-nums tracking-tighter font-mono select-none", colors.text)}
          style={{ textShadow: `0 0 60px ${colors.glow}, 0 0 20px ${colors.glow}` }}
        >
          {score}
        </div>
        <div className="text-[0.65rem] font-mono uppercase tracking-[0.25em] text-muted-foreground/60 mt-1">
          / 100 — Reality Score
        </div>
      </div>

      <div className="w-full max-w-[260px] space-y-1.5">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${score}%`,
              background: `linear-gradient(90deg, ${colors.barFrom}, ${colors.barTo})`,
              boxShadow: `0 0 8px ${colors.glow}`,
            }}
          />
        </div>
        <div className="flex justify-between text-[0.6rem] font-mono">
          <span className="text-red-500/50">Unrealistic</span>
          <span className="text-amber-400/50">Risky</span>
          <span className="text-emerald-400/50">Realistic</span>
        </div>
      </div>
    </div>
  );
}

function RealityCheckerApp() {
  const [goalText, setGoalText] = useState("");
  const [isBrutalMode, setIsBrutalMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const mutation = useAnalyzeGoal();
  const { toast } = useToast();

  const handleShare = async () => {
    if (!mutation.data) return;
    const { feasibility, realityScore, reason, plan } = mutation.data;
    const text = `Reality Check AI Result:\n\nGoal: ${goalText}\n\nScore: ${realityScore}/100\nFeasibility: ${feasibility}\n\nReason:\n${reason}\n\nPlan:\n${plan}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ description: "Copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ description: "Failed to copy. Please try again.", variant: "destructive" });
    }
  };

  const handleCheckReality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;
    mutation.mutate({ data: { goal: goalText, brutalHonesty: isBrutalMode } });
  };

  const resultColors = mutation.data ? getScoreColors(mutation.data.realityScore) : null;

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 text-foreground font-sans dark selection:bg-primary/30 overflow-hidden">

      {/* Gradient background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(200,120,40,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(30,40,80,0.5),transparent)]" />

      {/* Noise grain overlay */}
      <div className="absolute inset-0 opacity-[0.025] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col gap-8 py-12">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 px-4">
          <div className="relative h-14 w-14 flex items-center justify-center mb-1 shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md" />
            <div className="relative h-14 w-14 bg-card border border-white/8 rounded-2xl flex items-center justify-center shadow-lg shadow-black/40">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight w-full">
            Reality Checker AI
          </h1>
          <p className="text-sm text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
            A clear-eyed advisor for goal-setters. Evaluated with objective precision.
          </p>
        </div>

        {/* Input Card */}
        <Card className="border-white/8 shadow-2xl shadow-black/40 bg-card/60 backdrop-blur-md">
          <CardContent className="pt-6">
            <form onSubmit={handleCheckReality} className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="goal-input" className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
                  Your Target Goal
                </Label>
                <Input
                  id="goal-input"
                  data-testid="input-goal"
                  placeholder="Enter your goal..."
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="font-mono text-sm h-12 bg-white/4 border-white/8 focus-visible:ring-primary/40 focus-visible:border-primary/40 placeholder:text-muted-foreground/40"
                  disabled={mutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/6">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Brutal Honesty Mode
                    {isBrutalMode && <ShieldAlert className="w-3.5 h-3.5 text-primary" />}
                  </Label>
                  <p className="text-xs text-muted-foreground/60">
                    Removes all sugarcoating. Not for the faint of heart.
                  </p>
                </div>
                <Switch
                  data-testid="toggle-brutal-mode"
                  checked={isBrutalMode}
                  onCheckedChange={setIsBrutalMode}
                  disabled={mutation.isPending}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <Button
                type="submit"
                data-testid="button-check-reality"
                disabled={!goalText.trim() || mutation.isPending}
                className="w-full font-semibold tracking-wide h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all duration-200"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 text-primary-foreground" />
                    Analyzing Feasibility...
                  </span>
                ) : (
                  "Check Reality"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {mutation.isError && (
          <div className="p-4 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-sm font-mono flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">Analysis Failed</p>
              <p className="text-destructive/70 text-xs">
                {(mutation.error as { error?: string } | null)?.error || "An unexpected error occurred. Please try again."}
              </p>
            </div>
          </div>
        )}

        {/* Result Card */}
        {mutation.isSuccess && mutation.data && (
          <Card
            data-testid="card-result"
            className="border-white/8 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 bg-card/60 backdrop-blur-md"
            style={{ boxShadow: resultColors ? resultColors.cardGlow : undefined }}
          >
            {/* Score-colored top accent bar */}
            <div
              className="h-px w-full"
              style={{ background: resultColors ? `linear-gradient(90deg, transparent, ${resultColors.barFrom}80, transparent)` : undefined }}
            />

            <CardHeader className="pb-2 pt-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/60">
                  Analysis Result
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    data-testid={`badge-feasibility-${mutation.data.feasibility.toLowerCase()}`}
                    variant="outline"
                    className={cn("font-mono px-3 py-1 text-xs border tracking-wide", getFeasibilityBadgeStyle(mutation.data.feasibility))}
                  >
                    {mutation.data.feasibility.toUpperCase()}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="button-share-result"
                    onClick={handleShare}
                    className="h-7 px-3 text-xs font-mono gap-1.5 border-white/10 bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all"
                  >
                    {copied ? (
                      <><Check className="w-3 h-3 text-emerald-400" />Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" />Share</>
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription className="sr-only">Analysis details</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pb-6">

              {/* Score */}
              <div
                className="rounded-xl border border-white/5 bg-white/[0.02]"
                style={{ boxShadow: resultColors ? `inset 0 0 60px -20px ${resultColors.glow}` : undefined }}
              >
                <ScoreDisplay score={mutation.data.realityScore} />
              </div>

              {/* Reasoning */}
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150" data-testid="section-reasoning">
                <h3 className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2 pl-1">
                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                  Reasoning
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-sm leading-relaxed text-foreground/80">
                  {mutation.data.reason}
                </div>
              </div>

              {/* Plan */}
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300" data-testid="section-plan">
                <h3 className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2 pl-1">
                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                  Suggested Plan
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-sm leading-relaxed text-foreground/80">
                  {mutation.data.plan}
                </div>
              </div>

            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RealityCheckerApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
