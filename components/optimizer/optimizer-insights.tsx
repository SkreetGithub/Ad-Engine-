"use client"

import { Brain, Lightbulb, Target, Gauge } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const insights = [
  {
    icon: Brain,
    label: "AI Confidence",
    value: "94%",
    detail: "High prediction accuracy",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Lightbulb,
    label: "Suggestions Applied",
    value: "12/15",
    detail: "80% adoption rate",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Target,
    label: "Conversion Score",
    value: "8.7",
    detail: "Above average",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  {
    icon: Gauge,
    label: "Efficiency Rating",
    value: "A+",
    detail: "Top 5% performance",
    color: "text-primary",
    bg: "bg-primary/10",
  },
]

export function OptimizerInsights() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {insights.map((insight) => {
        const Icon = insight.icon
        return (
          <Card key={insight.label} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${insight.bg}`}>
                  <Icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {insight.label}
                  </p>
                  <p className={`font-mono text-xl font-bold ${insight.color}`}>{insight.value}</p>
                  <p className="text-[10px] text-muted-foreground">{insight.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
