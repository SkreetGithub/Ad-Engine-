"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutGrid,
  Megaphone,
  Library,
  MessageCircle,
  ListChecks,
  Upload,
  Play,
  Scissors,
  Check,
  X,
  Loader2,
  Zap,
  AlertTriangle,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { ProfitBadge } from "@/components/addy-workspace/profit-badge"
import { useCompanyEngine } from "@/hooks/use-company-engine"
import { useAddy } from "@/components/providers/addy-provider"
import { ADDY, formatProfitRatio, profitRatioProgress, cxGoalLabel } from "@/lib/addy"
import { openAiBudgetRemaining } from "@/lib/addy-ai/config"
import { cn } from "@/lib/utils"
import type { ReviewCycleRecord, ReviewQueueItem } from "@/lib/addy-engine/types"
import { BrandChatPanel } from "@/components/addy-workspace/brand-chat-panel"
import { DailyReportPanel } from "@/components/addy-workspace/daily-report-panel"
import { AddyFeedbackWindow } from "@/components/addy-workspace/addy-feedback-window"
import { LearningHistoryPanel } from "@/components/addy-workspace/learning-history-panel"
import { AddLibraryForm } from "@/components/addy-workspace/add-library-form"
import { ADDY_MISSION } from "@/lib/addy"

export function CompanyWorkspace({ companyId }: { companyId: string }) {
  const { updateCompany } = useAddy()
  const { company, view, loading, error, refresh } = useCompanyEngine(companyId)
  const [tab, setTab] = useState("overview")
  const [reviewLoading, setReviewLoading] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [strategyDraft, setStrategyDraft] = useState("")
  const [syncLoading, setSyncLoading] = useState(false)
  const [latestReport, setLatestReport] = useState<ReviewCycleRecord | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  if (loading && !company) {
    return (
      <DashboardShell title="Loading…" subtitle={ADDY.name}>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading workspace…
        </div>
      </DashboardShell>
    )
  }

  if (error || !company || !view) {
    return (
      <DashboardShell title="Error" subtitle={ADDY.name}>
        <p className="text-destructive">{error || "Company not found"}</p>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          On production, Addy needs Supabase: set{" "}
          <code className="text-xs">SUPABASE_URL</code> and{" "}
          <code className="text-xs">SUPABASE_ANON_KEY</code> in Vercel, then run{" "}
          <code className="text-xs">supabase/schema.sql</code> in your Supabase SQL editor.
        </p>
        <Button asChild className="mt-4">
          <Link href="/companies">Back to companies</Link>
        </Button>
      </DashboardShell>
    )
  }

  const ratio =
    company.currentProfitRatio > 0
      ? company.currentProfitRatio
      : company.currentAdSpend > 0
        ? (company.currentProfit + company.currentAdSpend) / company.currentAdSpend
        : 0
  const displayReport = latestReport ?? view.latestReport ?? null
  const profitPct = profitRatioProgress(ratio, company.targetProfitRatio)
  const activeAds = view.runningAds.filter((a) => a.status === "active")
  const pendingQueue = view.queue.filter((q) => q.status === "pending")
  const budgetRemaining = openAiBudgetRemaining(view.settings)
  const budgetPct =
    view.settings.openaiDailyBudget > 0
      ? (view.settings.openaiSpentToday / view.settings.openaiDailyBudget) * 100
      : 0

  async function saveStrategy() {
    await updateCompany(company.id, { adStrategyPlan: strategyDraft || company.adStrategyPlan })
    refresh()
  }

  async function toggleAutonomous(checked: boolean) {
    await updateCompany(company.id, { autonomousMode: checked })
    refresh()
  }

  async function syncMeta() {
    setSyncLoading(true)
    try {
      const res = await fetch("/api/addy-engine/meta-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      })
      const data = await res.json()
      if (data.error) alert(data.error)
      refresh()
    } finally {
      setSyncLoading(false)
    }
  }

  async function runReview() {
    setReviewLoading(true)
    setDebugLog([])
    try {
      const res = await fetch("/api/addy-engine/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, syncMeta: true }),
      })
      const data = await res.json()
      if (data.debugLog) setDebugLog(data.debugLog)
      if (data.cycle) setLatestReport(data.cycle)
      refresh()
      setTab("overview")
    } finally {
      setReviewLoading(false)
    }
  }

  async function queueAction(itemId: string, status: "approved" | "rejected") {
    await fetch("/api/addy-engine/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status }),
    })
    refresh()
  }

  async function cutAd(adId: string) {
    if (!confirm("Cut this ad?")) return
    await fetch(`/api/addy-engine/ads/${adId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cut" }),
    })
    refresh()
  }

  async function uploadAsset(file: File) {
    const fd = new FormData()
    fd.append("companyId", company.id)
    fd.append("file", file)
    await fetch("/api/addy-engine/assets", { method: "POST", body: fd })
    refresh()
  }

  return (
    <>
    <AddyFeedbackWindow
      report={displayReport}
      open={feedbackOpen}
      onClose={() => setFeedbackOpen(false)}
    />
    <DashboardShell
      title={company.name}
      subtitle={`${ADDY.name} · Ad Strategy Manager`}
      actions={
        <div className="flex items-center gap-2">
          <ProfitBadge ratio={ratio} target={company.targetProfitRatio} />
          <Badge variant="outline" className="text-[10px]">
            {view.settings.aiMode.toUpperCase()} mode
          </Badge>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={runReview}
            disabled={reviewLoading}
          >
            {reviewLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run daily review
          </Button>
        </div>
      }
    >
      {company.autonomousMode && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent">
          <Zap className="h-4 w-4 shrink-0" />
          Autonomous mode ON — Addy can auto-cut losing ads without approval.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-secondary/80 p-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-1.5 text-xs">
            <Megaphone className="h-3.5 w-3.5" /> Ads running
            <Badge className="ml-1 h-4 px-1 text-[9px]">{activeAds.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs">
            <Library className="h-3.5 w-3.5" /> Ad library
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" /> Branding
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 text-xs">
            <MessageCircle className="h-3.5 w-3.5" /> Chat with {ADDY.name}
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-1.5 text-xs">
            <ListChecks className="h-3.5 w-3.5" /> Review queue
            {pendingQueue.length > 0 && (
              <Badge className="ml-1 h-4 bg-primary px-1 text-[9px]">{pendingQueue.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DailyReportPanel
            report={displayReport}
            onSyncMeta={syncMeta}
            onRunReview={runReview}
            onOpenFeedback={() => setFeedbackOpen(true)}
            syncing={syncLoading}
            reviewing={reviewLoading}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <LearningHistoryPanel history={view.learningHistory ?? []} />
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  {ADDY.name}&apos;s mission
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {ADDY_MISSION}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card lg:col-span-2">
              <CardContent className="flex gap-4 p-5">
                <AddyAvatar size="lg" pulse />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase text-primary">{ADDY.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ADDY.shortBio}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Profit ratio</p>
                      <p className="font-mono text-xl font-bold">
                        {formatProfitRatio(ratio)}{" "}
                        <span className="text-sm text-muted-foreground">
                          / {formatProfitRatio(company.targetProfitRatio)} goal
                        </span>
                      </p>
                      <Progress value={profitPct} className="mt-2 h-2" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Customer experience</p>
                      <p className="text-sm font-medium">{cxGoalLabel(company.customerExperienceGoal)}</p>
                      <Progress value={company.cxScore} className="mt-2 h-2" />
                      <p className="mt-1 font-mono text-xs text-chart-2">{company.cxScore}% score</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">Budget today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs">
                    <span>Ad spend</span>
                    <span className="font-mono font-bold">
                      ${company.currentAdSpend.toFixed(2)} / ${company.dailyAdBudget}
                    </span>
                  </div>
                  <Progress
                    value={(company.currentAdSpend / company.dailyAdBudget) * 100}
                    className="mt-1 h-2"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Profit today</p>
                  <p className="font-mono text-lg font-bold text-primary">
                    ${company.currentProfit.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <Label htmlFor="auto" className="text-xs">
                    Autonomous mode
                  </Label>
                  <Switch
                    id="auto"
                    checked={company.autonomousMode}
                    onCheckedChange={toggleAutonomous}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ad strategy plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                defaultValue={company.adStrategyPlan}
                onChange={(e) => setStrategyDraft(e.target.value)}
                rows={5}
                placeholder="Step-by-step plan Addy follows for this brand…"
                className="font-mono text-sm"
              />
              <Button size="sm" onClick={saveStrategy}>
                Save strategy for {ADDY.name}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Running ads · cut threshold {company.autoCutThreshold}:1</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Ratio</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.runningAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">${ad.spendToday.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs">${ad.profitToday.toFixed(2)}</TableCell>
                      <TableCell>
                        <ProfitBadge ratio={ad.profitRatio} target={company.autoCutThreshold} />
                      </TableCell>
                      <TableCell>
                        {ad.status === "active" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 gap-1 text-[10px]"
                            onClick={() => cutAd(ad.id)}
                          >
                            <Scissors className="h-3 w-3" /> Cut
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <AddLibraryForm companyId={company.id} onAdded={refresh} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.libraryAds.map((ad) => (
              <Card key={ad.id} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{ad.name}</CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {ad.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[9px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{ad.headline}</p>
                  <p className="mt-1 line-clamp-2">{ad.body}</p>
                  <p className="mt-2 font-mono text-primary">ROI {ad.historicalRoi}:1 hist.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card className="border-dashed border-primary/30">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Upload images, video, PDF, or text for {ADDY.name} to reference
              </p>
              <Input
                type="file"
                accept="image/*,video/*,application/pdf,text/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void uploadAsset(f)
                }}
              />
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {view.assets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="p-3">
                  {asset.type === "image" ? (
                    <img
                      src={`/api/addy-engine/assets/${asset.id}`}
                      alt={asset.name}
                      className="aspect-video w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-md bg-secondary text-xs">
                      {asset.type.toUpperCase()}
                    </div>
                  )}
                  <p className="mt-2 truncate text-xs font-medium">{asset.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <BrandChatPanel company={company} view={view} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          {debugLog.length > 0 && (
            <Card className="border-chart-2/30 bg-chart-2/5">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-xs uppercase">
                  Debug — why Addy decided
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 font-mono text-[11px] text-muted-foreground">
                {debugLog.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </CardContent>
            </Card>
          )}
          <QueueTable items={view.queue} onAction={queueAction} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
    </>
  )
}

function QueueTable({
  items,
  onAction,
}: {
  items: ReviewQueueItem[]
  onAction: (id: string, status: "approved" | "rejected") => void
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No queue items. Run daily review to populate.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Ad</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge className="text-[10px] capitalize">{item.action.replace("_", " ")}</Badge>
                  {item.policyFlags.length > 0 && (
                    <AlertTriangle className="ml-1 inline h-3 w-3 text-accent" />
                  )}
                </TableCell>
                <TableCell className="text-xs">{item.adName || "—"}</TableCell>
                <TableCell className="max-w-xs text-xs text-muted-foreground">{item.reason}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => onAction(item.id, "approved")}
                      >
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => onAction(item.id, "rejected")}
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <div className="border-t border-border p-3">
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium">Show debug reasons</summary>
          <ul className="mt-2 space-y-2">
            {items.map((i) => (
              <li key={i.id} className="font-mono text-[10px]">
                <strong>{i.adName || i.action}:</strong> {i.debugReason}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </Card>
  )
}
