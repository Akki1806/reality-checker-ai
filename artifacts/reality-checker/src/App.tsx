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
import { Terminal, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

function RealityCheckerApp() {
  const [goalText, setGoalText] = useState("");
  const [isBrutalMode, setIsBrutalMode] = useState(false);
  const mutation = useAnalyzeGoal();

  const handleCheckReality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;

    mutation.mutate({
      data: { goal: goalText, brutalHonesty: isBrutalMode }
    });
  };

  const getFeasibilityBadgeVariant = (feasibility: string) => {
    switch (feasibility) {
      case "Realistic":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20";
      case "Risky":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20";
      case "Unrealistic":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-background text-foreground font-sans dark selection:bg-primary/30">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-card border border-border rounded-xl flex items-center justify-center mb-2 shadow-sm">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Reality Checker AI</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            A clear-eyed advisor for goal-setters. We evaluate your goals with objective precision.
          </p>
        </div>

        {/* Input Card */}
        <Card className="border-border shadow-lg bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleCheckReality} className="flex flex-col gap-6">
              <div className="space-y-2">
                <Label htmlFor="goal-input" className="text-sm font-medium text-muted-foreground">
                  Your Target Goal
                </Label>
                <Input
                  id="goal-input"
                  data-testid="input-goal"
                  placeholder="Enter your goal... (e.g. build a startup in 2 weeks)"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="font-mono text-sm min-h-[50px] bg-background/50 focus-visible:ring-primary/50"
                  disabled={mutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Brutal Honesty Mode
                    {isBrutalMode && <ShieldAlert className="w-3.5 h-3.5 text-primary" />}
                  </Label>
                  <p className="text-xs text-muted-foreground">
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
                className="w-full font-semibold tracking-wide h-12 shadow-primary/20 shadow-lg"
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
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Analysis Failed</p>
              <p className="text-destructive/80">
                {mutation.error?.error || "An unexpected error occurred while evaluating your goal. Please try again."}
              </p>
            </div>
          </div>
        )}

        {/* Result Card */}
        {mutation.isSuccess && mutation.data && (
          <Card 
            data-testid="card-result"
            className="border-border shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg text-muted-foreground font-mono">Analysis Result</CardTitle>
                <Badge 
                  data-testid={`badge-feasibility-${mutation.data.feasibility.toLowerCase()}`}
                  variant="outline" 
                  className={cn("font-mono px-3 py-1 text-sm border", getFeasibilityBadgeVariant(mutation.data.feasibility))}
                >
                  {mutation.data.feasibility.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="sr-only">Analysis details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2" data-testid="section-reasoning">
                <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  Reasoning
                </h3>
                <div className="p-4 rounded-md bg-background/50 border border-border font-mono text-sm leading-relaxed text-foreground/90">
                  {mutation.data.reason}
                </div>
              </div>

              <div className="space-y-2" data-testid="section-plan">
                <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  Suggested Plan
                </h3>
                <div className="p-4 rounded-md bg-background/50 border border-border font-mono text-sm leading-relaxed text-foreground/90">
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
