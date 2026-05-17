"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Key,
  Plus,
  RefreshCw,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiKey {
  id: string
  name: string
  provider: string
  maskedKey: string
  status: "active" | "expired" | "low-balance"
  balance: number
  maxBalance: number
  costPerUse: string
  usageToday: number
  enabled: boolean
}

function envKeysToApiKeys(envKeys: { id: string; name: string; provider: string; maskedKey: string; status: string }[]): ApiKey[] {
  return envKeys.map((k) => ({
    id: k.id,
    name: k.name,
    provider: k.provider,
    maskedKey: k.maskedKey,
    status: k.status as ApiKey["status"],
    balance: 0,
    maxBalance: 0,
    costPerUse: "From .env.local",
    usageToday: 0,
    enabled: true,
  }))
}

const statusConfig = {
  active: { icon: CheckCircle, label: "Active", color: "text-primary", bg: "bg-primary/10" },
  expired: { icon: AlertCircle, label: "Expired", color: "text-destructive", bg: "bg-destructive/10" },
  "low-balance": { icon: AlertCircle, label: "Low Balance", color: "text-accent", bg: "bg-accent/10" },
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/keys")
      const data = await res.json()
      if (res.ok && data.keys) setKeys(envKeysToApiKeys(data.keys))
      else setKeys([])
    } catch {
      setKeys([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const toggleKey = (id: string) => {
    setKeys(prev =>
      prev.map(k => (k.id === id ? { ...k, enabled: !k.enabled } : k))
    )
  }

  const totalBalance = keys.reduce((s, k) => s + k.balance, 0)
  const totalUsage = keys.reduce((s, k) => s + k.usageToday, 0)

  return (
    <DashboardShell
      title="API Keys"
      subtitle="Keys are loaded from .env.local. Restart the dev server after editing."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchKeys} disabled={loading} className="border-border text-foreground">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add API Key
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Keys</p>
                <p className="font-mono text-xl font-bold text-foreground">{keys.filter(k => k.enabled).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Balance</p>
                <p className="font-mono text-xl font-bold text-accent">${totalBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <RefreshCw className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">API Calls Today</p>
                <p className="font-mono text-xl font-bold text-chart-2">{totalUsage}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Key Form */}
        {showAddForm && (
          <Card className="glow-green border-primary/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Add New API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Key Name</Label>
                  <Input placeholder="e.g. Content Generation" className="border-border bg-secondary text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Provider</Label>
                  <Input placeholder="e.g. OpenAI" className="border-border bg-secondary text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">API Key</Label>
                  <Input placeholder="sk-..." type="password" className="border-border bg-secondary font-mono text-foreground" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
                  Save Key
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="border-border text-foreground">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keys List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="border-border bg-card">
              <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                Loading keys from .env.local…
              </CardContent>
            </Card>
          ) : keys.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                No API keys found. Add OPENAI_API_KEY, REPLICATE_API_TOKEN, or META_ACCESS_TOKEN to .env.local and restart the dev server.
              </CardContent>
            </Card>
          ) : (
          keys.map((apiKey) => {
            const status = statusConfig[apiKey.status]
            const StatusIcon = status.icon
            const balancePct = apiKey.maxBalance > 0 ? (apiKey.balance / apiKey.maxBalance) * 100 : 100

            return (
              <Card key={apiKey.id} className={cn("border-border bg-card transition-all", !apiKey.enabled && "opacity-50")}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Switch checked={apiKey.enabled} onCheckedChange={() => toggleKey(apiKey.id)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{apiKey.name}</p>
                          <Badge variant="outline" className={cn("border-0 text-[10px]", status.bg, status.color)}>
                            <StatusIcon className="mr-1 h-2.5 w-2.5" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{apiKey.provider}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Masked Key */}
                      <div className="flex items-center gap-1.5">
                        <code className="rounded-md bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground">
                          {apiKey.maskedKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={() => navigator.clipboard.writeText(apiKey.maskedKey)}
                          title="Copy masked key"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Balance */}
                      {apiKey.maxBalance > 0 && (
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Balance</span>
                            <span className={cn("font-mono font-bold", balancePct < 20 ? "text-accent" : "text-primary")}>
                              ${apiKey.balance.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={balancePct} className="mt-1 h-1" />
                        </div>
                      )}

                      {/* Cost & Usage */}
                      <div className="text-right">
                        <p className="font-mono text-[10px] text-muted-foreground">{apiKey.costPerUse}</p>
                        <p className="font-mono text-xs text-foreground">{apiKey.usageToday} calls today</p>
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }) )}
        </div>

        {/* Cost Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Daily Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="grid gap-4 sm:grid-cols-4 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Content Gen</p>
                  <p className="font-mono text-lg font-bold text-foreground">$0.09</p>
                  <p className="text-[10px] text-muted-foreground">47 calls</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Video Render</p>
                  <p className="font-mono text-lg font-bold text-foreground">$0.18</p>
                  <p className="text-[10px] text-muted-foreground">12 renders</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Image Gen</p>
                  <p className="font-mono text-lg font-bold text-foreground">$0.04</p>
                  <p className="text-[10px] text-muted-foreground">8 images</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total / Day</p>
                  <p className="font-mono text-lg font-bold text-primary">$0.31</p>
                  <p className="text-[10px] text-primary">Under $1 target</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
