"use client"

import { DollarSign, ArrowRight, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const spendData = [
  { day: "Mon", current: 5, optimal: 3, revenue: 120 },
  { day: "Tue", current: 8, optimal: 10, revenue: 280 },
  { day: "Wed", current: 6, optimal: 4, revenue: 195 },
  { day: "Thu", current: 10, optimal: 12, revenue: 410 },
  { day: "Fri", current: 7, optimal: 8, revenue: 350 },
  { day: "Sat", current: 4, optimal: 10, revenue: 520 },
  { day: "Sun", current: 3, optimal: 8, revenue: 480 },
]

interface Recommendation {
  label: string
  current: string
  optimal: string
  impact: string
  priority: "high" | "medium"
}

const recommendations: Recommendation[] = [
  {
    label: "Weekend budget",
    current: "$7/day",
    optimal: "$10/day",
    impact: "+$200 revenue/week",
    priority: "high",
  },
  {
    label: "Weekday budget",
    current: "$8/day",
    optimal: "$5/day",
    impact: "Save $21/week",
    priority: "medium",
  },
  {
    label: "Peak hours boost",
    current: "Even split",
    optimal: "70% evening",
    impact: "+45% reach",
    priority: "high",
  },
]

export function SpendOptimizer() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Spend Optimization
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 20%, 95%)",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="current" name="Current" radius={[3, 3, 0, 0]} maxBarSize={16}>
                {spendData.map((_, index) => (
                  <Cell key={`cell-current-${index}`} fill="hsl(38, 95%, 55%)" opacity={0.6} />
                ))}
              </Bar>
              <Bar dataKey="optimal" name="AI Optimal" radius={[3, 3, 0, 0]} maxBarSize={16}>
                {spendData.map((_, index) => (
                  <Cell key={`cell-optimal-${index}`} fill="hsl(142, 72%, 50%)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-accent opacity-60" />
            Current Spend
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            AI Optimal
          </div>
        </div>

        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div
              key={rec.label}
              className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Zap className={cn("h-3 w-3", rec.priority === "high" ? "text-primary" : "text-accent")} />
                <div>
                  <p className="text-xs font-medium text-foreground">{rec.label}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{rec.current}</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                    <span className="font-semibold text-primary">{rec.optimal}</span>
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-primary">{rec.impact}</span>
            </div>
          ))}
        </div>

        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
          <Zap className="h-3.5 w-3.5" />
          Apply All Optimizations
        </Button>
      </CardContent>
    </Card>
  )
}
