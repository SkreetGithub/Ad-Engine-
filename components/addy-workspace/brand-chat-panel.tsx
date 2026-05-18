"use client"

import { useRef, useState } from "react"
import { Loader2, Paperclip, Send, Sparkles, DollarSign, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { ADDY, ADDY_OWNER } from "@/lib/addy"
import { effectiveOpenAiBudget, openAiBudgetRemaining } from "@/lib/addy-ai/config"
import type { ChatMessage, ChatPendingAction, CompanyEngineView } from "@/lib/addy-engine/types"
import type { Company } from "@/lib/companies/types"
import { cn } from "@/lib/utils"

export function BrandChatPanel({
  company,
  view,
  onRefresh,
}: {
  company: Company
  view: CompanyEngineView
  onRefresh: () => void
}) {
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingAction, setPendingAction] = useState<ChatPendingAction | null>(null)
  const [autoBoost, setAutoBoost] = useState(true)
  const [boostBudget, setBoostBudget] = useState(5)
  const [budgetGate, setBudgetGate] = useState<{
    canApproveIncrement?: boolean
    atHardCap?: boolean
    lastMessage?: string
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const settings = view.settings
  const remaining = openAiBudgetRemaining(settings)
  const effective = effectiveOpenAiBudget(settings)
  const budgetPct = effective > 0 ? (settings.openaiSpentToday / effective) * 100 : 0

  async function sendChat(opts?: {
    approveBudget?: boolean
    confirmAction?: ChatPendingAction
    retryMessage?: string
  }) {
    const text = (opts?.retryMessage ?? chatInput).trim()
    if (!text && !pendingFile && !opts?.confirmAction) return

    setChatLoading(true)
    setBudgetGate(null)
    try {
      let res: Response
      if (pendingFile && !opts?.confirmAction) {
        const fd = new FormData()
        fd.append("companyId", company.id)
        fd.append("message", text || `Profit analysis for ${pendingFile.name}`)
        fd.append("file", pendingFile)
        if (opts?.approveBudget) fd.append("approveBudget", "true")
        fd.append("autoBoost", String(autoBoost))
        fd.append("boostBudget", String(boostBudget))
        res = await fetch("/api/addy-engine/smart-chat", { method: "POST", body: fd })
        setPendingFile(null)
      } else {
        res = await fetch("/api/addy-engine/smart-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: company.id,
            message: text || "Confirm action",
            approveBudget: opts?.approveBudget,
            confirmAction: opts?.confirmAction
              ? {
                  ...opts.confirmAction,
                  autoBoost: opts.confirmAction.autoBoost ?? autoBoost,
                  boostBudget: opts.confirmAction.boostBudget ?? boostBudget,
                }
              : undefined,
            autoBoost,
            boostBudget,
          }),
        })
      }

      const data = await res.json()
      if (data.budgetExceeded) {
        setBudgetGate({
          canApproveIncrement: data.canApproveIncrement,
          atHardCap: data.atHardCap,
          lastMessage: text,
        })
        setChatInput(text)
        return
      }
      if (data.pendingAction) setPendingAction(data.pendingAction)
      if (opts?.confirmAction) setPendingAction(null)
      setChatInput("")
      onRefresh()
    } finally {
      setChatLoading(false)
    }
  }

  async function approveBudgetIncrement() {
    await fetch("/api/addy-engine/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_increment" }),
    })
    onRefresh()
    if (budgetGate?.lastMessage) {
      await sendChat({ approveBudget: true, retryMessage: budgetGate.lastMessage })
      setBudgetGate(null)
    }
  }

  return (
    <Card className="flex h-[580px] flex-col border-primary/20">
      <CardHeader className="border-b border-border py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AddyAvatar size="sm" pulse />
            <div>
              <CardTitle className="text-sm">
                {ADDY.name} · {company.name} agent
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">
                Boss: {ADDY_OWNER.name} · {view.settings.aiMode.toUpperCase()} · Chat budget $
                {remaining.toFixed(2)} left
              </p>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-primary opacity-60" />
        </div>
        <Progress value={budgetPct} className="mt-2 h-1" />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        {budgetGate && (
          <div className="rounded-lg border border-accent/50 bg-accent/10 p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium text-accent">
              <AlertTriangle className="h-4 w-4" />
              Chat budget reached
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {budgetGate.atHardCap
                ? "Top up your OpenAI account at platform.openai.com, then raise the daily cap in Settings."
                : "Approve a $1 increment to finish this chat job, or wait until tomorrow."}
            </p>
            <div className="flex flex-wrap gap-2">
              {budgetGate.canApproveIncrement && (
                <Button size="sm" className="gap-1" onClick={approveBudgetIncrement}>
                  <DollarSign className="h-3.5 w-3.5" />
                  Approve +$1 for this job
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setBudgetGate(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {pendingAction && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
            <p className="mb-1 font-medium text-primary">Addy wants to publish</p>
            <p className="mb-2 text-xs text-muted-foreground">{pendingAction.message}</p>
            <p className="mb-2 text-[10px] uppercase text-muted-foreground">
              Platform: {pendingAction.type.replace("_", " ")}
            </p>
            <label className="mb-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={autoBoost}
                onChange={(e) => setAutoBoost(e.target.checked)}
              />
              Auto-boost after post (${boostBudget})
              <Input
                type="number"
                className="ml-2 h-7 w-16 text-xs"
                min={1}
                max={50}
                value={boostBudget}
                onChange={(e) => setBoostBudget(Number(e.target.value) || 5)}
              />
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  sendChat({
                    confirmAction: {
                      ...pendingAction,
                      autoBoost,
                      boostBudget,
                    },
                  })
                }
                disabled={chatLoading}
              >
                Approve &amp; post
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {view.chat.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Ask {ADDY.name} about {company.name}: cut losers, scale winners, upload a creative for
              profit feedback, or say &quot;post this to Facebook&quot; (you approve before it goes live).
            </p>
          )}
          {view.chat.map((m: ChatMessage) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.assetIds?.length ? (
                <p className="mt-1 text-[9px] opacity-70">{m.assetIds.length} attachment(s)</p>
              ) : null}
              {m.meta?.pendingAction && (
                <p className="mt-1 text-[9px] text-primary">Awaiting your post approval</p>
              )}
              {m.meta?.mode && (
                <p className="mt-1 text-[9px] opacity-70">
                  {m.meta.mode}
                  {m.meta.cost ? ` · $${m.meta.cost.toFixed(4)}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>

        {pendingFile && (
          <p className="text-xs text-primary">Attached: {pendingFile.name}</p>
        )}

        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,application/pdf"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach image or video"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Message ${company.name}'s agent…`}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void sendChat()}
          />
          <Button onClick={() => sendChat()} disabled={chatLoading}>
            {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
