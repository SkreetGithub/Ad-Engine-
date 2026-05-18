"use client"

import { useCallback, useEffect, useState } from "react"
import type { Company } from "@/lib/companies/types"
import type { CompanyEngineView } from "@/lib/addy-engine/types"

export function useCompanyEngine(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null)
  const [view, setView] = useState<CompanyEngineView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/addy-engine?companyId=${companyId}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        const hint = data.hint ? ` ${data.hint}` : ""
        throw new Error((data.error || "Failed to load") + hint)
      }
      setCompany(data.company)
      setView(data.view)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { company, view, loading, error, refresh, setView }
}
