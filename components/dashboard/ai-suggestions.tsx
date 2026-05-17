"use client"

import { ArrowRight, Sparkles, Clock, DollarSign, Target, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { useAddy } from "@/components/providers/addy-provider"
import { formatProfitRatio, profitRatioProgress, cxGoalLabel } from "@/lib/addy"
import { getStrategyById } from "@/lib/strategies-catalog"
import Link from "next/link"

export function AiSuggestions() {
  const { addy, activeCompany } = useAddy()

  if (!activeCompany) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <AddyAvatar size="md" className="mx-auto mb-3" />
          <p>{addy.name} needs a company to manage.</p>
          <Button asChild variant="link" className="mt-2 text-primary">
            <Link href="/companies">Add a company</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const profitGap = activeCompany.targetProfitRatio - activeCompany.currentProfitRatio
  const profitPct = profitRatioProgress(
    activeCompany.currentProfitRatio,
    activeCompany.targetProfitRatio
  )
  const primaryStrategy = activeCompany.strategyIds[0]
    ? getStrategyById(activeCompany.strategyIds[0])
    : null

  const suggestions = [
    profitGap > 0.3 && {
      id: "profit",
      title: `Close the profit gap for ${activeCompany.name}`,
      description: `${addy.name} sees ${formatProfitRatio(activeCompany.currentProfitRatio)} ROAS vs your ${formatProfitRatio(activeCompany.targetProfitRatio)} target. Shift budget to top performers and pause underperformers.`,
      impact: "high" as const,
      type: "budget" as const,
      projectedGain: `+${formatProfitRatio(profitGap)} toward goal`,
    },
    activeCompany.cxScore < 80 && {
      id: "cx",
      title: "Lift customer experience in ad copy",
      description: `Your CX goal is ${cxGoalLabel(activeCompany.customerExperienceGoal)}. ${activeCompany.customerExperienceNotes || "Addy recommends warmer hooks and clearer support cues in creatives."}`,
      impact: "high" as const,
      type: "content" as const,
      projectedGain: `CX ${activeCompany.cxScore}% → 85%+`,
    },
    primaryStrategy && {
      id: "strategy",
      title: `Double down on ${primaryStrategy.name}`,
      description: `This strategy fits ${activeCompany.name}'s goals and averages ${primaryStrategy.avgRoi}% ROI. ${addy.name} will align new creatives to this playbook.`,
      impact: "medium" as const,
      type: "content" as const,
      projectedGain: `${primaryStrategy.successRate}% success rate`,
    },
    {
      id: "timing",
      title: "Evening window for social ads",
      description: `${addy.name} recommends scheduling Meta ads 6–8 PM in your audience timezone for higher engagement on social feeds.`,
      impact: "medium" as const,
      type: "timing" as const,
      projectedGain: "+45% reach",
    },
  ].filter(Boolean) as Array<{
    id: string
    title: string
    description: string
    impact: "high" | "medium" | "low"
    type: "content" | "budget" | "timing"
    projectedGain: string
  }>

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

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AddyAvatar size="sm" />
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {addy.name}&apos;s recommendations
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              For {activeCompany.name} · profit {profitPct}% to goal
            </p>
          </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      impactColors[suggestion.impact]
                    )}
                  >
                    {suggestion.impact} impact
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {suggestion.projectedGain}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-[10px] text-primary hover:bg-primary/10"
                  asChild
                >
                  <Link href="/campaigns">
                    Apply <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
