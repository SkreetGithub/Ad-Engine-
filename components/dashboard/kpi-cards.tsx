"use client"

import { DollarSign, TrendingUp, Eye, Heart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAddy } from "@/components/providers/addy-provider"
import { formatProfitRatio, profitRatioProgress } from "@/lib/addy"

export function KpiCards() {
  const { activeCompany } = useAddy()

  const profitPct = activeCompany
    ? profitRatioProgress(activeCompany.currentProfitRatio, activeCompany.targetProfitRatio)
    : 0

  const kpiData = activeCompany
    ? [
        {
          label: "Profit ratio",
          value: formatProfitRatio(activeCompany.currentProfitRatio),
          change: profitPct - 100,
          changeLabel: `goal ${formatProfitRatio(activeCompany.targetProfitRatio)}`,
          icon: TrendingUp,
          highlight: true,
        },
        {
          label: "Customer experience",
          value: `${activeCompany.cxScore}%`,
          change: activeCompany.cxScore - 75,
          changeLabel: "vs 75% benchmark",
          icon: Heart,
          highlight: activeCompany.cxScore >= 75,
        },
        {
          label: "Active strategies",
          value: String(activeCompany.strategyIds.length),
          change: activeCompany.strategyIds.length,
          changeLabel: "assigned to brand",
          icon: Eye,
        },
        {
          label: "Brand status",
          value: activeCompany.status === "active" ? "Live" : "Paused",
          change: activeCompany.status === "active" ? 1 : -1,
          changeLabel: activeCompany.industry,
          icon: DollarSign,
        },
      ]
    : [
        {
          label: "Companies",
          value: "—",
          change: 0,
          changeLabel: "add a company",
          icon: DollarSign,
        },
      ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon
        const isPositive = kpi.change >= 0
        return (
          <Card
            key={kpi.label}
            className={cn(
              "relative overflow-hidden border-border bg-card transition-all hover:border-primary/30",
              kpi.highlight && "glow-green border-primary/20"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </span>
                  <span className="font-mono text-2xl font-bold text-foreground">{kpi.value}</span>
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    kpi.highlight ? "bg-primary/10" : "bg-secondary"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", kpi.highlight ? "text-primary" : "text-muted-foreground")}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-accent" />
                )}
                <span
                  className={cn(
                    "font-mono text-xs font-semibold",
                    isPositive ? "text-primary" : "text-accent"
                  )}
                >
                  {isPositive && kpi.change > 0 ? "+" : ""}
                  {typeof kpi.change === "number" && kpi.label !== "Brand status"
                    ? `${Math.round(kpi.change)}%`
                    : ""}
                </span>
                <span className="text-xs text-muted-foreground">{kpi.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
