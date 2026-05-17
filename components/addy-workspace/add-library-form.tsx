"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ADDY } from "@/lib/addy"

const TAG_OPTIONS = ["winning", "testing", "seasonal", "ugc", "retargeting"]

export function AddLibraryForm({
  companyId,
  onAdded,
}: {
  companyId: string
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [headline, setHeadline] = useState("")
  const [body, setBody] = useState("")
  const [cta, setCta] = useState("Shop Now")
  const [audience, setAudience] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [policyFlags, setPolicyFlags] = useState<string[]>([])

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  async function submit() {
    if (!name.trim() || !headline.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/addy-engine/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "library",
          companyId,
          name,
          headline,
          body,
          cta,
          targetAudience: audience,
          tags,
        }),
      })
      const data = await res.json()
      if (data.policyFlags?.length) setPolicyFlags(data.policyFlags)
      else {
        setPolicyFlags([])
        setName("")
        setHeadline("")
        setBody("")
        setOpen(false)
        onAdded()
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add ad to library
      </Button>
    )
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">New library ad — {ADDY.name} can remix this later</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Ad name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Winter Sale V1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CTA</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Headline</Label>
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Body copy</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Target audience</Label>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="US 25-45, shoppers" />
        </div>
        <div className="flex flex-wrap gap-3">
          {TAG_OPTIONS.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-xs capitalize">
              <Checkbox checked={tags.includes(t)} onCheckedChange={() => toggleTag(t)} />
              {t}
            </label>
          ))}
        </div>
        {policyFlags.length > 0 && (
          <p className="text-xs text-accent">
            Policy flags: {policyFlags.join("; ")} — saved but review before running live.
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to library"}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
