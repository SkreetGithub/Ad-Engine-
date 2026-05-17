"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { ADDY } from "@/lib/addy"
import { openAiBudgetRemaining } from "@/lib/addy-ai/config"
import type { AddySettings, AiMode } from "@/lib/addy-engine/types"

export function AddyAiSettings() {
  const [settings, setSettings] = useState<AddySettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/addy-engine/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
  }, [])

  async function save(patch: Partial<AddySettings>) {
    setSaving(true)
    const res = await fetch("/api/addy-engine/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    setSettings(data.settings)
    setSaving(false)
  }

  if (!settings) return null

  const remaining = openAiBudgetRemaining(settings)
  const budgetPct =
    settings.openaiDailyBudget > 0
      ? (settings.openaiSpentToday / settings.openaiDailyBudget) * 100
      : 0

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AddyAvatar size="md" />
          <div>
            <CardTitle className="text-sm">{ADDY.name} AI backend</CardTitle>
            <p className="text-xs text-muted-foreground">
              Mock (free) · Ollama (local) · OpenAI (budget-limited)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI mode</Label>
          <Select
            value={settings.aiMode}
            onValueChange={(v) => save({ aiMode: v as AiMode })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mock">Mock — free, rule-based</SelectItem>
              <SelectItem value="ollama">Ollama — local LLM</SelectItem>
              <SelectItem value="openai">OpenAI — best quality (~$0.002/call)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label>OpenAI daily budget</Label>
            <span className="font-mono text-muted-foreground">
              ${settings.openaiSpentToday.toFixed(3)} / ${settings.openaiDailyBudget.toFixed(2)}
            </span>
          </div>
          <Progress value={budgetPct} className="h-2" />
          <p className="text-[10px] text-muted-foreground">
            Remaining today: ${remaining.toFixed(3)} — switches to mock message when exceeded
          </p>
          <Input
            type="number"
            step="0.5"
            min={0}
            defaultValue={settings.openaiDailyBudget}
            onBlur={(e) => save({ openaiDailyBudget: parseFloat(e.target.value) || 2 })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ollama URL</Label>
            <Input
              defaultValue={settings.ollamaUrl}
              onBlur={(e) => save({ ollamaUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Ollama model</Label>
            <Input
              defaultValue={settings.ollamaModel}
              onBlur={(e) => save({ ollamaModel: e.target.value })}
            />
          </div>
        </div>

        <Button size="sm" disabled={saving} onClick={() => save({})}>
          {saving ? "Saving…" : "Refresh settings"}
        </Button>
      </CardContent>
    </Card>
  )
}
