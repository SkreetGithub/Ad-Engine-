"use client"

import { Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAddy } from "@/components/providers/addy-provider"
import { AddyAvatar } from "@/components/addy/addy-avatar"

export function CompanySelector() {
  const { store, activeCompany, setActiveCompanyId, loading } = useAddy()

  if (loading || !store?.companies.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AddyAvatar size="sm" />
        <span>Loading…</span>
      </div>
    )
  }

  return (
    <Select
      value={activeCompany?.id ?? ""}
      onValueChange={(id) => void setActiveCompanyId(id)}
    >
      <SelectTrigger className="h-9 w-[200px] gap-2 border-border bg-secondary/50 text-xs">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <SelectValue placeholder="Select company" />
      </SelectTrigger>
      <SelectContent>
        {store.companies.map((c) => (
          <SelectItem key={c.id} value={c.id} className="text-xs">
            {c.name}
            {c.status === "paused" ? " (paused)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
