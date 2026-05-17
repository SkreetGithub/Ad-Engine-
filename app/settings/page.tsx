"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Bell,
  Zap,
  Save,
  AlertCircle,
} from "lucide-react"
import { AddyAiSettings } from "@/components/addy-workspace/addy-ai-settings"

const MAX_TOTAL_BUDGET_KEY = "adengine_max_total_budget"
const AUTO_START_NEW_KEY = "adengine_auto_start_new"

export default function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useState([25])
  const [maxTotalBudget, setMaxTotalBudget] = useState<string>("")
  const [maxTotalSaved, setMaxTotalSaved] = useState(false)
  const [autoStartNew, setAutoStartNew] = useState(false)
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [autoPause, setAutoPause] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [weekendBoost, setWeekendBoost] = useState(true)

  useEffect(() => {
    try {
      const v = localStorage.getItem(MAX_TOTAL_BUDGET_KEY)
      setMaxTotalBudget(v ?? "")
      const a = localStorage.getItem(AUTO_START_NEW_KEY)
      setAutoStartNew(a === "true")
    } catch {
      setMaxTotalBudget("")
    }
  }, [])

  const handleSaveMaxTotal = () => {
    const num = maxTotalBudget.trim() === "" ? "" : Math.min(1000, Math.max(1, Math.round(Number(maxTotalBudget)) || 0))
    if (num !== "") {
      try {
        localStorage.setItem(MAX_TOTAL_BUDGET_KEY, String(num))
        setMaxTotalBudget(String(num))
        setMaxTotalSaved(true)
        setTimeout(() => setMaxTotalSaved(false), 2000)
      } catch {}
    } else {
      try {
        localStorage.removeItem(MAX_TOTAL_BUDGET_KEY)
        setMaxTotalSaved(true)
        setTimeout(() => setMaxTotalSaved(false), 2000)
      } catch {}
    }
  }

  return (
    <DashboardShell
      title="Settings"
      subtitle="Configure Addy, budget guardrails, and defaults per company"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <AddyAiSettings />
        {/* Budget Guardrails */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Budget Guardrails
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <Label className="text-xs font-semibold uppercase tracking-wider">Max total budget (priority)</Label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Facebook stops when this is spent — your card won&apos;t be charged past this. Prevents declines and account issues. This value is used in Campaigns → Quick Launch so you never exceed your total budget.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  placeholder="e.g. 50"
                  value={maxTotalBudget}
                  onChange={(e) => setMaxTotalBudget(e.target.value)}
                  className="max-w-[120px] font-mono"
                />
                <span className="flex items-center text-sm text-muted-foreground">$ total per campaign</span>
                <Button type="button" variant="secondary" size="sm" onClick={handleSaveMaxTotal}>
                  {maxTotalSaved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-start new campaigns</p>
                <p className="text-[10px] text-muted-foreground">Create new test campaigns as ACTIVE so they run immediately. No need to turn them on in Ads Manager.</p>
              </div>
              <Switch
                checked={autoStartNew}
                onCheckedChange={(v) => {
                  setAutoStartNew(v)
                  try { localStorage.setItem(AUTO_START_NEW_KEY, v ? "true" : "false") } catch {}
                }}
              />
            </div>

            <Separator className="bg-border" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Daily Spend Limit</Label>
                <span className="font-mono text-sm font-bold text-primary">${dailyLimit[0]}.00</span>
              </div>
              <Slider value={dailyLimit} onValueChange={setDailyLimit} min={5} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground">
                The engine will never exceed this daily limit across all campaigns.
              </p>
            </div>

            <Separator className="bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-pause on budget hit</p>
                <p className="text-[10px] text-muted-foreground">Automatically pause campaigns when daily limit is reached</p>
              </div>
              <Switch checked={autoPause} onCheckedChange={setAutoPause} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Campaign Minimum ROI Target</Label>
              <Select defaultValue="3000">
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1,000% (10x return)</SelectItem>
                  <SelectItem value="2000">2,000% (20x return)</SelectItem>
                  <SelectItem value="3000">3,000% (30x return)</SelectItem>
                  <SelectItem value="5000">5,000% (50x return)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Campaigns below this ROI will be flagged for review or auto-paused.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Engine Settings */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
                AI Engine Configuration
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-optimize campaigns</p>
                <p className="text-[10px] text-muted-foreground">Let AI automatically adjust budgets and targeting</p>
              </div>
              <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
            </div>

            <Separator className="bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Weekend boost mode</p>
                <p className="text-[10px] text-muted-foreground">Automatically increase spend on high-performing weekends</p>
              </div>
              <Switch checked={weekendBoost} onCheckedChange={setWeekendBoost} />
            </div>

            <Separator className="bg-border" />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Optimization Frequency</Label>
              <Select defaultValue="4h">
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Every hour</SelectItem>
                  <SelectItem value="4h">Every 4 hours</SelectItem>
                  <SelectItem value="12h">Every 12 hours</SelectItem>
                  <SelectItem value="24h">Once daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Content Generation Style</Label>
              <Select defaultValue="ugc">
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional / Polished</SelectItem>
                  <SelectItem value="ugc">UGC / Authentic</SelectItem>
                  <SelectItem value="trendy">Trendy / Viral</SelectItem>
                  <SelectItem value="minimal">Minimal / Clean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Notifications
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Campaign alerts</p>
                <p className="text-[10px] text-muted-foreground">Get notified when campaigns hit milestones or need attention</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <Separator className="bg-border" />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Alert Email</Label>
              <Input
                placeholder="your@email.com"
                className="border-border bg-secondary text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Revenue Alert Threshold</Label>
              <Select defaultValue="100">
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">$50+ revenue</SelectItem>
                  <SelectItem value="100">$100+ revenue</SelectItem>
                  <SelectItem value="250">$250+ revenue</SelectItem>
                  <SelectItem value="500">$500+ revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </DashboardShell>
  )
}
