"use client"

import { useEffect, useState } from "react"
import { Brain, TrendingUp, Zap, Target, Sparkles, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ADDY } from "@/lib/addy"

interface IntelMetrics {
  memoryEntries: number
  predictionCount: number
  avgPredictedRoi: number
  highConfidencePredictions: number
  autoBoostPosts: number
  abTestsCompleted: number
  superLearningSessions: number
  dailyAudit?: {
    auditDate: string
    decisionBrief: string
    benchmarks?: { portfolioRoas?: number; budgetUsedPct?: number }
  } | null
  auditHistory?: { audit_date: string; portfolio_roas: number; spend: number; profit: number }[]
  abMessages: string[]
}

export function IntelligencePanel({ companyId }: { companyId: string }) {
  const [data, setData] = useState<IntelMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/addy-engine/intelligence?companyId=${companyId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading {ADDY.name}&apos;s brain…</p>
  }

  if (!data) return null

  const metrics = [
    { icon: Brain, label: "Memory entries", value: String(data.memoryEntries ?? 0), sub: "Wins/losses for recall" },
    { icon: Sparkles, label: "Super Brain", value: String(data.superLearningSessions ?? 0), sub: "Cursor + codebase" },
    { icon: TrendingUp, label: "Predictions", value: String(data.predictionCount ?? 0), sub: `Avg ${(data.avgPredictedRoi ?? 0).toFixed(2)}:1` },
    { icon: FileText, label: "Daily audits", value: String(data.auditHistory?.length ?? 0), sub: "Decision benchmarks" },
    { icon: Zap, label: "Auto-boosts", value: String(data.autoBoostPosts ?? 0), sub: "Approved posts" },
    { icon: Target, label: "A/B wins", value: String(data.abTestsCompleted ?? 0), sub: `${data.highConfidencePredictions ?? 0} confident preds` },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {ADDY.name} learns daily — memory, Super Brain, audits, and profit predictions feed every chat and review.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/80">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <m.icon className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-medium">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.dailyAudit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-primary">
              Today&apos;s decision brief ({data.dailyAudit.auditDate})
            </CardTitle>
            {data.dailyAudit.benchmarks && (
              <p className="text-xs text-muted-foreground">
                ROAS {(data.dailyAudit.benchmarks.portfolioRoas ?? 0).toFixed(2)}:1 · Budget{" "}
                {(data.dailyAudit.benchmarks.budgetUsedPct ?? 0).toFixed(0)}% used
              </p>
            )}
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {data.dailyAudit.decisionBrief}
          </CardContent>
        </Card>
      )}

      {data.abMessages?.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs uppercase">A/B test results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.abMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
