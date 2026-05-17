"use client"

import { Activity, Wifi, Shield, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { useAddy } from "@/components/providers/addy-provider"
import { formatProfitRatio } from "@/lib/addy"

const statusColors = {
  online: "bg-primary",
  processing: "bg-accent",
  idle: "bg-muted-foreground",
}

const statusTextColors = {
  online: "text-primary",
  processing: "text-accent",
  idle: "text-muted-foreground",
}

export function EngineStatus() {
  const { addy, activeCompany, store } = useAddy()
  const companyCount = store?.companies.length ?? 0
  const strategyCount = activeCompany?.strategyIds.length ?? 0

  const statusItems = [
    {
      label: `${addy.name} — ad manager`,
      status: "online" as const,
      detail: activeCompany
        ? `Managing ${activeCompany.name} (${strategyCount} strategies)`
        : "Add a company to get started",
      icon: Activity,
    },
    {
      label: "Profit target",
      status: activeCompany && activeCompany.currentProfitRatio >= activeCompany.targetProfitRatio ? "online" : "processing",
      detail: activeCompany
        ? `${formatProfitRatio(activeCompany.currentProfitRatio)} / ${formatProfitRatio(activeCompany.targetProfitRatio)} goal`
        : "—",
      icon: Shield,
    },
    {
      label: "Customer experience",
      status: activeCompany && activeCompany.cxScore >= 75 ? "online" : "processing",
      detail: activeCompany ? `${activeCompany.cxScore}% toward CX goal` : "—",
      icon: Heart,
    },
    {
      label: "Meta API",
      status: "online" as const,
      detail: `${companyCount} brand${companyCount === 1 ? "" : "s"} in portfolio`,
      icon: Wifi,
    },
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AddyAvatar size="sm" pulse />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {addy.name}&apos;s status
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-semibold uppercase text-primary">Online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {statusItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("h-1.5 w-1.5 rounded-full", statusColors[item.status])} />
                <span className={cn("text-[10px] font-semibold uppercase", statusTextColors[item.status])}>
                  {item.status}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
