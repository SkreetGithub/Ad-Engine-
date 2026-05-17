"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OptimizerInsights } from "@/components/optimizer/optimizer-insights"
import { ContentAnalyzer } from "@/components/optimizer/content-analyzer"
import { SpendOptimizer } from "@/components/optimizer/spend-optimizer"
import { PerformanceHeatmap } from "@/components/optimizer/performance-heatmap"

export default function OptimizerPage() {
  return (
    <DashboardShell
      title="AI Optimizer"
      subtitle="AI-powered analysis to maximize every dollar spent"
    >
      <div className="space-y-6">
        <OptimizerInsights />
        <div className="grid gap-6 lg:grid-cols-2">
          <ContentAnalyzer />
          <SpendOptimizer />
        </div>
        <PerformanceHeatmap />
      </div>
    </DashboardShell>
  )
}
