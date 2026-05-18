"use client"

import { X, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ADDY } from "@/lib/addy"
import type { ReviewCycleRecord } from "@/lib/addy-engine/types"
import { useState } from "react"
function ReportBody({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## "))
          return (
            <h3 key={i} className="mt-4 border-b border-border pb-1 text-base font-bold text-foreground">
              {line.replace("## ", "")}
            </h3>
          )
        if (line.startsWith("### "))
          return (
            <h4 key={i} className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary">
              {line.replace("### ", "")}
            </h4>
          )
        if (line.startsWith("**") && line.endsWith("**"))
          return (
            <p key={i} className="font-medium text-foreground">
              {line.replace(/\*\*/g, "")}
            </p>
          )
        if (/^\d+\./.test(line))
          return (
            <p key={i} className="rounded-md bg-primary/10 px-3 py-2 text-foreground">
              {line}
            </p>
          )
        if (line.startsWith("• "))
          return (
            <p key={i} className="ml-2 text-muted-foreground">
              {line}
            </p>
          )
        if (!line.trim()) return null
        return (
          <p key={i} className="text-muted-foreground">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      })}
    </div>
  )
}

export function AddyFeedbackWindow({
  report,
  open,
  onClose,
}: {
  report: ReviewCycleRecord | null | undefined
  open: boolean
  onClose: () => void
}) {
  const [showDebug, setShowDebug] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="flex max-h-[90vh] w-full max-w-3xl flex-col border-primary/30 shadow-2xl shadow-primary/10">
        <CardHeader className="flex shrink-0 flex-row items-start justify-between border-b border-border">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">{ADDY.name}&apos;s feedback for you</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Plain English — what to do today to make this brand&apos;s ads more profitable
            </p>
            {report && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  ROAS {report.portfolioRatio.toFixed(2)}:1
                </Badge>
                {report.metaSynced && (
                  <Badge className="bg-primary/20 text-[10px] text-primary">Facebook data</Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {new Date(report.createdAt).toLocaleString()}
                </Badge>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {!report ? (
            <p className="text-center text-sm text-muted-foreground">
              Run a daily review to see {ADDY.name}&apos;s full feedback here.
            </p>
          ) : (
            <>
              {report.recommendations.length > 0 && (
                <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-primary">
                    Do these first
                  </p>
                  <ol className="list-decimal space-y-2 pl-4 text-sm text-foreground">
                    {report.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ol>
                </div>
              )}
              <ReportBody text={report.dailyReport} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 gap-1 text-xs"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDebug ? "Hide" : "Show"} technical debug log
              </Button>
              {showDebug && (
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-secondary p-3 font-mono text-[10px] text-muted-foreground">
                  {report.debugLog.join("\n")}
                </pre>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
