"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RoiPipeline } from "@/components/dashboard/roi-pipeline"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ActiveCampaigns } from "@/components/dashboard/active-campaigns"
import { AiSuggestions } from "@/components/dashboard/ai-suggestions"
import { EngineStatus } from "@/components/dashboard/engine-status"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Command Center"
      subtitle="Autonomous Ad Engine - Minimum Spend, Maximum Profit"
      actions={
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">
            Engine v2.4
          </Badge>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-semibold text-primary">LIVE</span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <KpiCards />
        <RoiPipeline />
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <ActiveCampaigns />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <AiSuggestions />
          <EngineStatus />
        </div>
      </div>
    </DashboardShell>
  )
}
