"use client"

import { Activity, Wifi, Shield, Cpu } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusItem {
  label: string
  status: "online" | "processing" | "idle"
  detail: string
  icon: React.ElementType
}

const statusItems: StatusItem[] = [
  { label: "Ad Engine", status: "online", detail: "Optimizing 4 campaigns", icon: Cpu },
  { label: "Content Pipeline", status: "processing", detail: "1 asset rendering", icon: Activity },
  { label: "API Connection", status: "online", detail: "All APIs connected", icon: Wifi },
  { label: "Budget Guard", status: "online", detail: "Under daily limit", icon: Shield },
]

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
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Engine Status
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-semibold uppercase text-primary">System Online</span>
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
