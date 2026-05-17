"use client"

import { useState, useEffect } from "react"
import { Rocket, Loader2, ChevronDown, Shield, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatMetaError } from "@/lib/format-meta-error"

const GOALS = [
  { id: "traffic", label: "Send people to my website" },
  { id: "leads", label: "Get leads / signups" },
  { id: "app", label: "Get app downloads or app traffic" },
]

interface QuickLaunchProps {
  onLaunch?: () => void
}

const MAX_BUDGET_KEY = "adengine_max_total_budget"

export function QuickLaunch({ onLaunch }: QuickLaunchProps) {
  const [goal, setGoal] = useState("traffic")
  const [maxTotalBudget, setMaxTotalBudget] = useState<string>("")
  const [dailyBudget, setDailyBudget] = useState(8)
  const [url, setUrl] = useState("https://www.uniquepickups.com")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [openAdvanced, setOpenAdvanced] = useState(false)
  const [runAiOptimization, setRunAiOptimization] = useState(false)

  useEffect(() => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(MAX_BUDGET_KEY) : null
      setMaxTotalBudget(v ?? "")
    } catch {
      setMaxTotalBudget("")
    }
  }, [])

  const handleMaxTotalChange = (val: string) => {
    setMaxTotalBudget(val)
    const num = val.trim() === "" ? "" : String(Math.min(1000, Math.max(1, Math.round(Number(val)) || 0)))
    try {
      if (typeof window !== "undefined") {
        if (num === "") localStorage.removeItem(MAX_BUDGET_KEY)
        else localStorage.setItem(MAX_BUDGET_KEY, num)
      }
    } catch {}
  }

  const handleLaunch = async () => {
    setMessage(null)
    const cap = maxTotalBudget.trim() !== "" && Number(maxTotalBudget) >= 1 ? Math.min(1000, Math.round(Number(maxTotalBudget))) : 0
    if (cap < 1) {
      setMessage({
        type: "error",
        text: "Set a Max total budget first. This ensures Facebook never charges past your limit and protects your card and account.",
      })
      return
    }
    setLoading(true)
    try {
      let autoStart = false
      try {
        if (typeof window !== "undefined") autoStart = localStorage.getItem("adengine_auto_start_new") === "true"
      } catch {}
      const maxBudget = Math.min(1000, Math.round(Number(maxTotalBudget)) || cap)

      if (runAiOptimization) {
        const optRes = await fetch("/api/automation/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ maxTotalBudget: maxBudget, autoStart }),
        })
        const optData = await optRes.json()
        if (!optRes.ok) {
          setMessage({ type: "error", text: formatMetaError(optData.error || "AI optimization failed") })
          return
        }
        if (optData.error) {
          setMessage({ type: "error", text: formatMetaError(optData.error) })
          return
        }
      }

      const payload: { goal: string; budget?: number; totalBudgetCap?: number; url: string; autoStart?: boolean } = {
        goal,
        url: url || "https://www.uniquepickups.com",
        totalBudgetCap: cap,
        autoStart,
      }
      const res = await fetch("/api/campaigns/quick-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: formatMetaError(data.error || "Something went wrong") })
        return
      }
      setMessage({
        type: "success",
        text: runAiOptimization
          ? "AI optimization ran (sync, pause underperformers, new test). Your campaign was created. " + (data.message || "")
          : (data.message || "Campaign created. Turn it on in Ads Manager when you're ready."),
      })
      onLaunch?.()
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("campaigns-refresh"))
    } catch (e) {
      setMessage({ type: "error", text: formatMetaError(e instanceof Error ? e.message : "Launch failed") })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Rocket className="h-5 w-5 text-primary" />
          Quick Launch — AI does the rest
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pick your goal and budget. We’ll write the ad, create the campaign, and keep it paused until you turn it on. Set a max total budget so Facebook never charges past your limit — protects your card and avoids account issues or declines.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Max total budget ($) — Facebook will never spend more than this
          </Label>
          <Input
            type="number"
            min={1}
            max={1000}
            placeholder="e.g. 50 (recommended)"
            value={maxTotalBudget}
            onChange={(e) => handleMaxTotalChange(e.target.value)}
            className="max-w-[140px] bg-secondary font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Facebook stops when this is spent. Your card won't be charged past this amount; avoids declines and account deactivation.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Run AI optimization when launching</p>
              <p className="text-[10px] text-muted-foreground">Sync analytics, pause underperformers, create new test ad — then create your campaign</p>
            </div>
          </div>
          <Switch checked={runAiOptimization} onCheckedChange={setRunAiOptimization} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">What do you want?</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Daily budget ($) — used only if no max total above</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Math.max(1, Math.min(50, Number(e.target.value) || 8)))}
              className="bg-secondary font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Where should people go?</Label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-secondary font-mono text-xs"
            />
          </div>
        </div>
        {message && (
          <div
            className={`rounded-lg border p-3 text-sm ${message.type === "success" ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
          >
            {message.text}
          </div>
        )}
        <Button
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
          size="lg"
          onClick={handleLaunch}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating campaign…
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5" />
              Launch campaign
            </>
          )}
        </Button>
        <Collapsible open={openAdvanced} onOpenChange={setOpenAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ChevronDown className={`h-4 w-4 transition-transform ${openAdvanced ? "rotate-180" : ""}`} />
              More control (name, custom copy, strategy)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="mt-2 text-xs text-muted-foreground">
              Use “New Campaign” above for custom campaign name, AI-generated or manual copy, and strategy. Quick Launch is for one-click, AI-handles-everything.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
