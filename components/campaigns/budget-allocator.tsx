"use client"

import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BudgetCategory {
  label: string
  allocated: number
  spent: number
  campaigns: number
  roi: number
}

const budgetData: BudgetCategory[] = [
  { label: "Video Reels", allocated: 25, spent: 13.5, campaigns: 2, roi: 4024 },
  { label: "Story Ads", allocated: 10, spent: 3.2, campaigns: 1, roi: 3063 },
  { label: "Static/Carousel", allocated: 15, spent: 12, campaigns: 2, roi: 3800 },
]

export function BudgetAllocator() {
  const totalAllocated = budgetData.reduce((s, b) => s + b.allocated, 0)
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0)
  const totalRevenue = 1472

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Budget Overview
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Total Budget</p>
              <p className="font-mono text-sm font-bold text-foreground">${totalAllocated.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Total Spent</p>
              <p className="font-mono text-sm font-bold text-accent">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Total Revenue</p>
              <p className="font-mono text-sm font-bold text-primary">${totalRevenue}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {budgetData.map((cat) => {
            const pct = Math.round((cat.spent / cat.allocated) * 100)
            const isHigh = pct > 80
            return (
              <div key={cat.label} className="rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                  {isHigh ? (
                    <AlertTriangle className="h-3 w-3 text-accent" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="font-mono text-xl font-bold text-foreground">
                    ${cat.spent.toFixed(2)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">/ ${cat.allocated}</span>
                </div>
                <Progress value={pct} className="mt-2 h-1" />
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{cat.campaigns} campaigns</span>
                  <span className="flex items-center gap-0.5 font-semibold text-primary">
                    <TrendingUp className="h-2.5 w-2.5" />
                    {cat.roi}% ROI
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
