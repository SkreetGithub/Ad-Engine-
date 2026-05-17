"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, TrendingUp, Star, Target, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AD_STRATEGIES } from "@/lib/strategies-catalog"
import { useAddy } from "@/components/providers/addy-provider"
import { ADDY } from "@/lib/addy"
import Link from "next/link"

export default function StrategiesPage() {
  const { activeCompany } = useAddy()
  const assigned = new Set(activeCompany?.strategyIds ?? [])

  const assignedList = AD_STRATEGIES.filter((s) => assigned.has(s.id))
  const top = [...AD_STRATEGIES].sort((a, b) => b.avgRoi - a.avgRoi)[0]
  const avgSuccess =
    AD_STRATEGIES.reduce((sum, s) => sum + s.successRate, 0) / AD_STRATEGIES.length

  return (
    <DashboardShell
      title="Ad Strategies"
      subtitle={
        activeCompany
          ? `${ADDY.name} uses these playbooks for ${activeCompany.name}`
          : "Assign strategies per company on the Companies page"
      }
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Top strategy
                </p>
                <p className="text-sm font-bold text-foreground">{top.name}</p>
                <p className="font-mono text-xs text-primary">{top.avgRoi}% avg ROI</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  For {activeCompany?.name ?? "your brand"}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {assignedList.length} assigned
                </p>
                <p className="font-mono text-xs text-accent">
                  {Math.round(avgSuccess)}% catalog avg success
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {ADDY.name}&apos;s focus
                </p>
                <p className="text-sm font-bold text-foreground">Profit + CX</p>
                <p className="font-mono text-xs text-chart-2">Per company goals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {AD_STRATEGIES.map((strategy) => {
            const Icon = strategy.icon
            const isAssigned = assigned.has(strategy.id)
            return (
              <Card
                key={strategy.id}
                className={cn(
                  "border-border bg-card transition-all hover:border-primary/20",
                  isAssigned && "border-primary/30 ring-1 ring-primary/10"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          strategy.bgColor
                        )}
                      >
                        <Icon className={cn("h-4.5 w-4.5", strategy.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">
                          {strategy.name}
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground">{strategy.bestFor}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className="border-0 bg-primary/10 font-mono text-[10px] text-primary"
                      >
                        {strategy.avgRoi}% ROI
                      </Badge>
                      {isAssigned && (
                        <Badge className="gap-0.5 bg-primary/20 text-[10px] text-primary">
                          <Check className="h-3 w-3" />
                          {activeCompany?.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {strategy.description}
                  </p>
                  <div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Success rate</span>
                      <span className="font-mono font-bold text-primary">
                        {strategy.successRate}%
                      </span>
                    </div>
                    <Progress value={strategy.successRate} className="mt-1 h-1" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ADDY.name}&apos;s tips
                    </p>
                    {strategy.tips.slice(0, 3).map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"
                      >
                        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs text-primary hover:bg-primary/10"
                    asChild
                  >
                    <Link href="/companies">
                      {isAssigned ? "Edit in Companies" : "Assign to a company"}{" "}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
