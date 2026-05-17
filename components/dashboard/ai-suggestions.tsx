"use client"

import { Brain, ArrowRight, Sparkles, Clock, DollarSign, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: string
  title: string
  description: string
  impact: "high" | "medium" | "low"
  type: "content" | "budget" | "timing"
  projectedGain: string
}

const suggestions: Suggestion[] = [
  {
    id: "1",
    title: "Shift budget to 15s video format",
    description: "Your 15-second reels are generating 4.2x more engagement than static posts. Reallocate $3 from static to short-form video.",
    impact: "high",
    type: "content",
    projectedGain: "+$180/week",
  },
  {
    id: "2",
    title: "Post between 6-8 PM EST",
    description: "Analysis shows your audience is 67% more active during evening hours. Scheduling ads in this window will maximize impressions.",
    impact: "high",
    type: "timing",
    projectedGain: "+45% reach",
  },
  {
    id: "3",
    title: "Increase weekend spend by $2",
    description: "Weekend campaigns show 52% higher conversion rates. A small $2 increase could yield $120+ in additional revenue.",
    impact: "medium",
    type: "budget",
    projectedGain: "+$120/week",
  },
]

const typeIcons = {
  content: Sparkles,
  budget: DollarSign,
  timing: Clock,
}

const impactColors = {
  high: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-accent/10 text-accent border-accent/20",
  low: "bg-chart-2/10 text-chart-2 border-chart-2/20",
}

export function AiSuggestions() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
            AI Optimization Suggestions
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => {
          const TypeIcon = typeIcons[suggestion.type]
          return (
            <div
              key={suggestion.id}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <TypeIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    impactColors[suggestion.impact]
                  )}>
                    {suggestion.impact} impact
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {suggestion.projectedGain}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-[10px] text-primary hover:bg-primary/10 hover:text-primary"
                >
                  Apply <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
