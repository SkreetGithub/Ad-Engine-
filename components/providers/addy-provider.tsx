"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { CompaniesStore, Company, CompanyInput } from "@/lib/companies/types"
import { ADDY } from "@/lib/addy"

interface AddyContextValue {
  addy: typeof ADDY
  store: CompaniesStore | null
  activeCompany: Company | null
  loading: boolean
  refresh: () => Promise<void>
  setActiveCompanyId: (id: string) => Promise<void>
  createCompany: (input: CompanyInput) => Promise<Company | null>
  updateCompany: (id: string, patch: Partial<CompanyInput>) => Promise<Company | null>
  removeCompany: (id: string) => Promise<boolean>
}

const AddyContext = createContext<AddyContextValue | null>(null)

export function AddyProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<CompaniesStore | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/companies", { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as CompaniesStore
        setStore(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const activeCompany = useMemo(() => {
    if (!store?.companies.length) return null
    const id = store.activeCompanyId ?? store.companies[0]?.id
    return store.companies.find((c) => c.id === id) ?? store.companies[0] ?? null
  }, [store])

  const setActiveCompanyId = useCallback(
    async (id: string) => {
      const res = await fetch("/api/companies/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: id }),
      })
      if (res.ok) {
        const data = (await res.json()) as CompaniesStore
        setStore(data)
      }
    },
    []
  )

  const createCompanyFn = useCallback(async (input: CompanyInput) => {
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, setActive: true }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { company: Company; store: CompaniesStore }
    setStore(data.store)
    return data.company
  }, [])

  const updateCompanyFn = useCallback(
    async (id: string, patch: Partial<CompanyInput>) => {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { company: Company; store: CompaniesStore }
      setStore(data.store)
      return data.company
    },
    []
  )

  const removeCompany = useCallback(async (id: string) => {
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" })
    if (!res.ok) return false
    const data = (await res.json()) as { store: CompaniesStore }
    setStore(data.store)
    return true
  }, [])

  const value = useMemo(
    () => ({
      addy: ADDY,
      store,
      activeCompany,
      loading,
      refresh,
      setActiveCompanyId,
      createCompany: createCompanyFn,
      updateCompany: updateCompanyFn,
      removeCompany,
    }),
    [
      store,
      activeCompany,
      loading,
      refresh,
      setActiveCompanyId,
      createCompanyFn,
      updateCompanyFn,
      removeCompany,
    ]
  )

  return <AddyContext.Provider value={value}>{children}</AddyContext.Provider>
}

export function useAddy() {
  const ctx = useContext(AddyContext)
  if (!ctx) throw new Error("useAddy must be used within AddyProvider")
  return ctx
}
