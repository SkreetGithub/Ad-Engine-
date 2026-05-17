"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Play, Pause, Loader2, Megaphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatMetaError } from "@/lib/format-meta-error"

interface MetaCampaign {
  id: string
  name: string
  status: string
  effective_status: string
  daily_budget: number
  created_time?: string
}

export function AutomationPanel() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [boostPostId, setBoostPostId] = useState("")
  const [boostBudget, setBoostBudget] = useState(5)
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostMessage, setBoostMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/facebook/campaigns")
      const data = await res.json()
      if (res.ok && data.campaigns) setCampaigns(data.campaigns)
      else setCampaigns([])
    } catch {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    const onRefresh = () => fetchCampaigns()
    window.addEventListener("campaigns-refresh", onRefresh)
    return () => window.removeEventListener("campaigns-refresh", onRefresh)
  }, [])

  const handlePause = async (id: string) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/facebook/campaign/${id}/pause`, { method: "POST" })
      if (res.ok) await fetchCampaigns()
    } finally {
      setActioningId(null)
    }
  }

  const handleActivate = async (id: string) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/facebook/campaign/${id}/activate`, { method: "POST" })
      if (res.ok) await fetchCampaigns()
    } finally {
      setActioningId(null)
    }
  }

  const isActive = (c: MetaCampaign) =>
    (c.effective_status || c.status || "").toUpperCase() === "ACTIVE"

  const handleBoost = async () => {
    const id = boostPostId.trim()
    if (!id) {
      setBoostMessage({ type: "error", text: "Paste the post ID (from posting to your Page)." })
      return
    }
    setBoostMessage(null)
    setBoostLoading(true)
    try {
      const res = await fetch("/api/facebook/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id, dailyBudget: boostBudget }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBoostMessage({ type: "success", text: data.message || "Boost campaign created (PAUSED). Turn it on in Ads Manager." })
        setBoostPostId("")
        fetchCampaigns()
      } else {
        setBoostMessage({ type: "error", text: formatMetaError(data.error || "Boost failed.") })
      }
    } catch (e) {
      setBoostMessage({ type: "error", text: formatMetaError(e instanceof Error ? e.message : "Boost failed.") })
    } finally {
      setBoostLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Campaigns from Meta
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            disabled={loading}
            className="border-border text-foreground"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pause or activate campaigns below. Use <strong>Launch campaign</strong> above with “Run AI optimization” on to sync, optimize, and create your campaign in one go.
        </p>
        <details className="mt-3 rounded-lg border border-border bg-secondary/30">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5" /> Boost an organic post (paste post ID)
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px] space-y-1">
                <Label className="text-[10px] text-muted-foreground">Post ID</Label>
                <Input
                  placeholder="e.g. 61588496181643_123456789"
                  className="font-mono text-xs border-border bg-secondary"
                  value={boostPostId}
                  onChange={(e) => setBoostPostId(e.target.value)}
                />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-[10px] text-muted-foreground">$/day</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  className="font-mono text-xs border-border bg-secondary"
                  value={boostBudget}
                  onChange={(e) => setBoostBudget(Number(e.target.value) || 5)}
                />
              </div>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleBoost} disabled={boostLoading}>
                {boostLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create boost"}
              </Button>
            </div>
            {boostMessage && (
              <p className={cn("text-[10px]", boostMessage.type === "success" ? "text-primary" : "text-destructive")}>
                {boostMessage.text}
              </p>
            )}
          </div>
        </details>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Campaigns from Meta (live)
          </p>
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : campaigns.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No campaigns found. Use Launch campaign above to create one.</p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-medium text-foreground">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-0 text-[10px]",
                          isActive(c) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {c.effective_status || c.status || "—"}
                      </Badge>
                      {c.daily_budget > 0 && (
                        <span className="text-[10px] text-muted-foreground">${c.daily_budget}/day</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isActive(c) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-border text-muted-foreground"
                        onClick={() => handlePause(c.id)}
                        disabled={actioningId === c.id}
                      >
                        {actioningId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-primary/30 text-primary"
                        onClick={() => handleActivate(c.id)}
                        disabled={actioningId === c.id}
                      >
                        {actioningId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
