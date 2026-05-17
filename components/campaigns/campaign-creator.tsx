"use client"

import { useState, useEffect } from "react"
import { X, Upload, Sparkles, DollarSign, Loader2, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

interface CampaignCreatorProps {
  onClose: () => void
  onSuccess?: () => void
}

const MAX_BUDGET_KEY = "adengine_max_total_budget"

export function CampaignCreator({ onClose, onSuccess }: CampaignCreatorProps) {
  const [budget, setBudget] = useState([5])
  const [maxTotalBudget, setMaxTotalBudget] = useState("")
  const [name, setName] = useState("")
  const [copy, setCopy] = useState("")
  const [link, setLink] = useState("https://www.uniquepickups.com")
  const [loading, setLoading] = useState(false)
  const [copyLoading, setCopyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [strategy, setStrategy] = useState("")

  useEffect(() => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(MAX_BUDGET_KEY) : null
      setMaxTotalBudget(v ?? "")
    } catch {}
  }, [])

  const handleGenerateCopy = async () => {
    setCopyLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignName: name || undefined, strategy: strategy || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate copy")
        return
      }
      if (data.copy) setCopy(data.copy)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setCopyLoading(false)
    }
  }

  const handleLaunch = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch("/api/facebook/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Campaign from Ad Engine",
          dailyBudget: budget[0],
          ...(maxTotalBudget.trim() && Number(maxTotalBudget) >= 1 ? { totalBudget: Math.min(1000, Math.round(Number(maxTotalBudget))) } : {}),
          message: copy || "Check out our services.",
          link: link || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create campaign")
        return
      }
      setSuccess(data.message || (maxTotalBudget.trim() && Number(maxTotalBudget) >= 1 ? `Campaign created with $${Math.min(1000, Math.round(Number(maxTotalBudget)))} max total—Facebook will stop at that amount. Turn it on in Ads Manager when ready.` : "Campaign created. Turn it on in Ads Manager."))
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glow-green border-primary/20 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Launch New Campaign
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Campaign Name
              </Label>
              <Input
                placeholder="e.g. Summer Flash Sale Reel"
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Ad Type
              </Label>
              <Select>
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel-15">15s Video Reel</SelectItem>
                  <SelectItem value="reel-30">30s Video Reel</SelectItem>
                  <SelectItem value="story">Story Ad</SelectItem>
                  <SelectItem value="carousel">Carousel Post</SelectItem>
                  <SelectItem value="static">Static Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Strategy Theater
              </Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flash">Flash Sale Urgency</SelectItem>
                  <SelectItem value="social-proof">Social Proof / Testimonial</SelectItem>
                  <SelectItem value="product-demo">Product Demo Showcase</SelectItem>
                  <SelectItem value="behind-scenes">Behind the Scenes</SelectItem>
                  <SelectItem value="ugc">User-Generated Content Style</SelectItem>
                  <SelectItem value="trending">Trending Audio / Hook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Caption / Copy
              </Label>
              <Textarea
                placeholder="Write your ad copy or let AI generate it..."
                className="h-20 resize-none border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
              />
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:bg-primary/10 hover:text-primary" onClick={handleGenerateCopy} disabled={copyLoading}>
                {copyLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</> : <><Sparkles className="h-3 w-3" /> AI Generate Copy</>}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Destination URL
              </Label>
              <Input
                placeholder="https://www.uniquepickups.com"
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground font-mono text-xs"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Upload Content Asset (optional)
              </Label>
              <div className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary/30">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px]">Drop video or image (MP4, JPG, PNG)</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Max total budget ($) — Facebook stops at this (recommended)
              </Label>
              <Input
                type="number"
                min={1}
                max={1000}
                placeholder="e.g. 50 (optional)"
                value={maxTotalBudget}
                onChange={(e) => {
                  const val = e.target.value
                  setMaxTotalBudget(val)
                  try {
                    if (typeof window !== "undefined") {
                      if (val.trim() === "") localStorage.removeItem(MAX_BUDGET_KEY)
                      else if (Number(val) >= 1) localStorage.setItem(MAX_BUDGET_KEY, String(Math.min(1000, Math.round(Number(val)))))
                    }
                  } catch {}
                }}
                className="max-w-[140px] bg-secondary font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Set this so you never exceed your total. If left empty, daily budget below is used (no cap).
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Daily Budget {maxTotalBudget.trim() && Number(maxTotalBudget) >= 1 ? "(ignored when max total is set)" : ""}
                </Label>
                <span className="font-mono text-sm font-bold text-primary">${budget[0]}.00</span>
              </div>
              <Slider
                value={budget}
                onValueChange={setBudget}
                min={1}
                max={50}
                step={1}
                className="py-2"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>$1</span>
                <span>$50</span>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Projected ROI</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-mono text-lg font-bold text-foreground">{(budget[0] * 63).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Est. Revenue</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-primary">{Math.round(budget[0] * 240)}+</p>
                  <p className="text-[10px] text-muted-foreground">Impressions</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-accent">{Math.round(budget[0] * 0.84)}</p>
                  <p className="text-[10px] text-muted-foreground">Est. Orders</p>
                </div>
              </div>
            </div>

            {(error || success) && (
              <div className={success ? "rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary" : "rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"}>
                {success || error}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleLaunch}
                disabled={loading}
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Launch Campaign"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-border text-foreground hover:bg-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
