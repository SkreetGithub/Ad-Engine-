"use client"

import { DollarSign, TrendingUp, Eye, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiData {
  label: string
  value: string
  change: number
  changeLabel: string
  icon: React.ElementType
  highlight?: boolean
}

const kpiData: KpiData[] = [
  {
    label: "Total Revenue",
    value: "$2,847",
    change: 23.5,
    changeLabel: "vs last week",
    icon: DollarSign,
    highlight: true,
  },
  {
    label: "Ad Spend",
    value: "$42.50",
    change: -12.3,
    changeLabel: "optimized",
    icon: TrendingUp,
  },
  {
    label: "Impressions",
    value: "48.2K",
    change: 18.7,
    changeLabel: "vs last week",
    icon: Eye,
  },
  {
    label: "Orders",
    value: "34",
    change: 31.2,
    changeLabel: "vs last week",
    icon: ShoppingCart,
    highlight: true,
  },
]

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon
        const isPositive = kpi.change > 0
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
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  kpi.highlight ? "bg-primary/10" : "bg-secondary"
                )}>
                  <Icon className={cn("h-5 w-5", kpi.highlight ? "text-primary" : "text-muted-foreground")} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-accent" />
                )}
                <span className={cn("font-mono text-xs font-semibold", isPositive ? "text-primary" : "text-accent")}>
                  {isPositive ? "+" : ""}{kpi.change}%
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
