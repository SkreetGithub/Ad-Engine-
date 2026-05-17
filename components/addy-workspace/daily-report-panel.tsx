"use client"

import { FileText, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ADDY } from "@/lib/addy"
import type { ReviewCycleRecord } from "@/lib/addy-engine/types"
import { cn } from "@/lib/utils"

function renderMarkdownLite(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="mt-4 text-sm font-bold text-foreground">
          {line.replace("## ", "")}
        </h3>
      )
    }
    if (line.startsWith("### ")) {
      return (
        <h4 key={i} className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary">
          {line.replace("### ", "")}
        </h4>
      )
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="mt-2 text-sm font-medium text-foreground">
          {line.replace(/\*\*/g, "")}
        </p>
      )
    }
    if (/^\d+\./.test(line)) {
      return (
        <p key={i} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {line}
        </p>
      )
    }
    if (line.startsWith("• ")) {
      return (
        <p key={i} className="ml-2 text-sm text-muted-foreground">
          {line}
        </p>
      )
    }
    if (!line.trim()) return <br key={i} />
    return (
      <p key={i} className="text-sm leading-relaxed text-muted-foreground">
        {line.replace(/\*\*/g, "")}
      </p>
    )
  })
}

export function DailyReportPanel({
  report,
  onSyncMeta,
  onRunReview,
  syncing,
  reviewing,
}: {
  report: ReviewCycleRecord | null | undefined
  onSyncMeta: () => void
  onRunReview: () => void
  syncing: boolean
  reviewing: boolean
}) {
  return (
    <Card className="border-primary/25 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <CardTitle className="text-sm">{ADDY.name}&apos;s daily report</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Plain English feedback from Facebook data + your goals
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={onSyncMeta} disabled={syncing}>
            <RefreshCw className={cn("mr-1 h-3 w-3", syncing && "animate-spin")} />
            Sync Facebook
          </Button>
          <Button size="sm" className="text-xs" onClick={onRunReview} disabled={reviewing}>
            {reviewing ? "Reviewing…" : "Run daily review"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[420px] overflow-y-auto">
        {report ? (
          <div className="prose-sm">{renderMarkdownLite(report.dailyReport)}</div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Run a daily review to get {ADDY.name}&apos;s detailed report on how to improve ads for this brand.
          </p>
        )}
        {report?.metaSynced && (
          <p className="mt-3 text-[10px] text-primary">✓ Includes live Meta/Facebook insights</p>
        )}
      </CardContent>
    </Card>
  )
}
