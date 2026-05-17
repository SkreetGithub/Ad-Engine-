"use client"

import { useState } from "react"
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Target,
  Heart,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAddy } from "@/components/providers/addy-provider"
import { ADDY, formatProfitRatio, profitRatioProgress, cxGoalLabel } from "@/lib/addy"
import { AD_STRATEGIES, CX_GOAL_OPTIONS } from "@/lib/strategies-catalog"
import type { Company, CompanyInput } from "@/lib/companies/types"
import type { CustomerExperienceGoal } from "@/lib/strategies-catalog"
import { cn } from "@/lib/utils"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import Link from "next/link"

const emptyForm = (): CompanyInput => ({
  name: "",
  industry: "",
  website: "",
  notes: "",
  targetProfitRatio: 3.5,
  customerExperienceGoal: "fast-friendly",
  customerExperienceNotes: "",
  strategyIds: [],
  status: "active",
  adStrategyPlan: "",
  dailyAdBudget: 50,
  currentProfit: 0,
  currentAdSpend: 0,
  autoCutThreshold: 1.5,
  autonomousMode: false,
  minRunningAds: 3,
})

export function CompanyManager() {
  const { store, activeCompany, createCompany, updateCompany, removeCompany, setActiveCompanyId } =
    useAddy()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState<CompanyInput>(emptyForm())
  const [saving, setSaving] = useState(false)

  const companies = store?.companies ?? []

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(company: Company) {
    setEditing(company)
    setForm({
      name: company.name,
      industry: company.industry,
      website: company.website,
      notes: company.notes,
      targetProfitRatio: company.targetProfitRatio,
      customerExperienceGoal: company.customerExperienceGoal,
      customerExperienceNotes: company.customerExperienceNotes,
      strategyIds: [...company.strategyIds],
      status: company.status,
      adStrategyPlan: company.adStrategyPlan,
      dailyAdBudget: company.dailyAdBudget,
      currentProfit: company.currentProfit,
      currentAdSpend: company.currentAdSpend,
      autoCutThreshold: company.autoCutThreshold,
      autonomousMode: company.autonomousMode,
      minRunningAds: company.minRunningAds,
    })
    setOpen(true)
  }

  function toggleStrategy(id: string) {
    setForm((prev) => {
      const ids = prev.strategyIds.includes(id)
        ? prev.strategyIds.filter((s) => s !== id)
        : [...prev.strategyIds, id]
      return { ...prev, strategyIds: ids }
    })
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateCompany(editing.id, form)
      } else {
        await createCompany(form)
      }
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (companies.length <= 1) return
    if (!confirm("Remove this company from Addy's list?")) return
    await removeCompany(id)
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <AddyAvatar size="lg" pulse />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {ADDY.role}
              </p>
              <h2 className="text-lg font-bold text-foreground">
                Hi, I&apos;m {ADDY.name}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{ADDY.shortBio}</p>
            </div>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add company
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit company" : "New company for Addy"}
                </DialogTitle>
              </DialogHeader>
              <CompanyForm
                form={form}
                setForm={setForm}
                toggleStrategy={toggleStrategy}
                onSave={handleSave}
                saving={saving}
                isEdit={!!editing}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {companies.map((company) => {
          const isActive = activeCompany?.id === company.id
          const profitPct = profitRatioProgress(
            company.currentProfitRatio,
            company.targetProfitRatio
          )
          return (
            <Card
              key={company.id}
              className={cn(
                "border-border bg-card transition-all",
                isActive && "border-primary/40 ring-1 ring-primary/20"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{company.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">{company.industry}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isActive && (
                      <Badge className="bg-primary/10 text-[10px] text-primary">Active</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        company.status === "paused" && "text-muted-foreground"
                      )}
                    >
                      {company.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-3 w-3" /> Profit ratio
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {formatProfitRatio(company.currentProfitRatio)} /{" "}
                        {formatProfitRatio(company.targetProfitRatio)} goal
                      </span>
                    </div>
                    <Progress value={profitPct} className="h-1.5" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-3 w-3" /> Customer experience
                      </span>
                      <span className="font-mono font-bold text-chart-2">
                        {company.cxScore}%
                      </span>
                    </div>
                    <Progress value={company.cxScore} className="h-1.5" />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {cxGoalLabel(company.customerExperienceGoal)}
                    </p>
                  </div>
                </div>

                {company.customerExperienceNotes && (
                  <p className="text-xs italic text-muted-foreground">
                    &ldquo;{company.customerExperienceNotes}&rdquo;
                  </p>
                )}

                <div>
                  <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    Addy&apos;s strategies for this brand
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.strategyIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No strategies assigned</span>
                    ) : (
                      company.strategyIds.map((sid) => {
                        const s = AD_STRATEGIES.find((x) => x.id === sid)
                        return (
                          <Badge
                            key={sid}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {s?.name ?? sid}
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" className="text-xs" asChild>
                    <Link href={`/companies/${company.id}`}>Open workspace</Link>
                  </Button>
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => void setActiveCompanyId(company.id)}
                    >
                      Set active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs"
                    onClick={() => openEdit(company)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  {companies.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(company.id)}
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}

function CompanyForm({
  form,
  setForm,
  toggleStrategy,
  onSave,
  saving,
  isEdit,
}: {
  form: CompanyInput
  setForm: React.Dispatch<React.SetStateAction<CompanyInput>>
  toggleStrategy: (id: string) => void
  onSave: () => void
  saving: boolean
  isEdit: boolean
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">Company name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Acme Pickups"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={form.industry}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
            placeholder="E-commerce"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dailyAdBudget">Daily ad budget ($)</Label>
          <Input
            id="dailyAdBudget"
            type="number"
            min={1}
            value={form.dailyAdBudget}
            onChange={(e) =>
              setForm((f) => ({ ...f, dailyAdBudget: parseFloat(e.target.value) || 50 }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="autoCutThreshold">Auto-cut below ratio</Label>
          <Input
            id="autoCutThreshold"
            type="number"
            step="0.1"
            min={0.5}
            value={form.autoCutThreshold}
            onChange={(e) =>
              setForm((f) => ({ ...f, autoCutThreshold: parseFloat(e.target.value) || 1.5 }))
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="targetProfitRatio">Target profit ratio (ROAS)</Label>
        <Input
          id="targetProfitRatio"
          type="number"
          step="0.1"
          min={1}
          value={form.targetProfitRatio}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              targetProfitRatio: parseFloat(e.target.value) || 3,
            }))
          }
        />
        <p className="text-[10px] text-muted-foreground">
          e.g. 3.5 means $3.50 return per $1 ad spend. Addy optimizes toward this per company.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Customer experience goal</Label>
        <Select
          value={form.customerExperienceGoal}
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              customerExperienceGoal: v as CustomerExperienceGoal,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CX_GOAL_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cxNotes">How customers should feel (notes for Addy)</Label>
        <Textarea
          id="cxNotes"
          value={form.customerExperienceNotes}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerExperienceNotes: e.target.value }))
          }
          placeholder="Warm, fast replies, never pushy..."
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Ad strategies for this company</Label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {AD_STRATEGIES.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-secondary/50"
            >
              <Checkbox
                checked={form.strategyIds.includes(s.id)}
                onCheckedChange={() => toggleStrategy(s.id)}
              />
              <span className="text-xs">
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="block text-[10px] text-muted-foreground">{s.bestFor}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, status: v as "active" | "paused" }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active — Addy manages ads</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
        />
      </div>
      <Button className="w-full" onClick={onSave} disabled={saving || !form.name.trim()}>
        {saving ? "Saving…" : isEdit ? "Save company" : "Add company"}
      </Button>
    </div>
  )
}
