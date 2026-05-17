"use client"

import { Brain, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ADDY } from "@/lib/addy"
import type { ReviewCycleRecord } from "@/lib/addy-engine/types"

export function LearningHistoryPanel({ history }: { history: ReviewCycleRecord[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Brain className="mx-auto mb-2 h-6 w-6 text-primary" />
          {ADDY.name} will remember lessons after your first daily review.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          {ADDY.name}&apos;s learning history
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Gets smarter each review cycle — patterns saved per brand
        </p>
      </CardHeader>
      <CardContent className="max-h-64 space-y-3 overflow-y-auto">
        {history.slice(0, 8).map((cycle) => (
          <div
            key={cycle.id}
            className="rounded-lg border border-border bg-secondary/30 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">
                {new Date(cycle.createdAt).toLocaleString()}
              </span>
              <Badge variant="outline" className="font-mono text-[9px]">
                {cycle.portfolioRatio.toFixed(2)}:1
              </Badge>
            </div>
            {cycle.lessonsLearned.length > 0 && (
              <ul className="mt-2 space-y-1">
                {cycle.lessonsLearned.map((l, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground">
                    • {l}
                  </li>
                ))}
              </ul>
            )}
            {cycle.recommendations[0] && (
              <p className="mt-2 text-[11px] text-primary line-clamp-2">
                Top tip: {cycle.recommendations[0]}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
