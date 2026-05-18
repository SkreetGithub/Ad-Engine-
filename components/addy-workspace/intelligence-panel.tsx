"use client"

import { useEffect, useState } from "react"
import { Brain, TrendingUp, Zap, Target, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ADDY } from "@/lib/addy"

interface IntelMetrics {
  memoryEntries: number
  memoryRecallRate: number
  predictionCount: number
  avgPredictedRoi: number
  highConfidencePredictions: number
  autoBoostPosts: number
  abTestsCompleted: number
  competitorAlerts: number
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
    {
      icon: Brain,
      label: "Memory entries",
      value: String(data.memoryEntries ?? 0),
      sub: `${(data.memoryRecallRate ?? 0).toFixed(0)}% recall depth`,
    },
    {
      icon: TrendingUp,
      label: "Profit predictions",
      value: String(data.predictionCount ?? 0),
      sub: `Avg ${(data.avgPredictedRoi ?? 0).toFixed(2)}:1 ROI`,
    },
    {
      icon: Zap,
      label: "Auto-boosts",
      value: String(data.autoBoostPosts ?? 0),
      sub: "Posts boosted after approval",
    },
    {
      icon: Target,
      label: "A/B tests won",
      value: String(data.abTestsCompleted ?? 0),
      sub: `${data.highConfidencePredictions ?? 0} high-confidence preds`,
    },
    {
      icon: Shield,
      label: "Competitor alerts",
      value: String(data.competitorAlerts ?? 0),
      sub: "Industry scans stored",
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {ADDY.name}&apos;s intelligence layer — memory, predictions, boosts, and tests for this brand.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/80">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <m.icon className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-medium">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {data.abMessages?.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-xs uppercase text-primary">Recent A/B results</CardTitle>
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
