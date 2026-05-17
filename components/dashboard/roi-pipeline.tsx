"use client"

import { ArrowRight, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const pipelineSteps = [
  { label: "Ad Spend", value: "$5.00", sublabel: "Per Campaign", color: "text-accent" },
  { label: "Impressions", value: "1,200", sublabel: "Avg Reach", color: "text-chart-2" },
  { label: "Clicks", value: "84", sublabel: "7% CTR", color: "text-chart-2" },
  { label: "Orders", value: "4.2", sublabel: "Avg Conv", color: "text-primary" },
  { label: "Revenue", value: "$315", sublabel: "Avg Return", color: "text-primary" },
]

export function RoiPipeline() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Profit Pipeline
          </CardTitle>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary">
            63x ROI
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary px-4 py-3 text-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {step.label}
                </span>
                <span className={`font-mono text-lg font-bold ${step.color}`}>{step.value}</span>
                <span className="text-[10px] text-muted-foreground">{step.sublabel}</span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
