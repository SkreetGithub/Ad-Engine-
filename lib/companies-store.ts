import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import type { CompaniesStore, Company, CompanyInput } from "@/lib/companies/types"
import { migrateCompany } from "@/lib/companies/types"

const DATA_DIR = join(process.cwd(), ".data")
const FILE_PATH = join(DATA_DIR, "companies.json")

function newId(): string {
  return `co_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function defaultCompany(): Company {
  const now = new Date().toISOString()
  return migrateCompany({
    id: "co_default",
    name: "My Business",
    industry: "General",
    website: "",
    notes: "Default company — open workspace for Addy to manage ads.",
    targetProfitRatio: 3.5,
    customerExperienceGoal: "fast-friendly",
    customerExperienceNotes: "Friendly support, fast shipping, honest messaging.",
    strategyIds: ["ugc", "social-proof"],
    status: "active",
    currentProfitRatio: 2.8,
    cxScore: 72,
    adStrategyPlan:
      "1) Lead with UGC social proof\n2) Retarget cart abandoners\n3) Cap test spend at $15/day per creative",
    dailyAdBudget: 50,
    currentProfit: 100,
    currentAdSpend: 38.5,
    autoCutThreshold: 1.5,
    autonomousMode: false,
    minRunningAds: 3,
    createdAt: now,
    updatedAt: now,
  })
}

const emptyStore = (): CompaniesStore => ({
  activeCompanyId: null,
  companies: [],
})

export async function readCompaniesStore(): Promise<CompaniesStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as CompaniesStore
    if (!data || !Array.isArray(data.companies)) return seedIfEmpty(emptyStore())
    if (data.companies.length === 0) return seedIfEmpty(data)
    if (!data.activeCompanyId && data.companies[0]) {
      data.activeCompanyId = data.companies[0].id
    }
    data.companies = data.companies.map((c) => migrateCompany(c))
    return data
  } catch {
    return seedIfEmpty(emptyStore())
  }
}

function seedIfEmpty(store: CompaniesStore): CompaniesStore {
  if (store.companies.length > 0) return store
  const company = defaultCompany()
  return {
    activeCompanyId: company.id,
    companies: [company],
  }
}

export async function writeCompaniesStore(store: CompaniesStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeStoreToDisk(store)
}

async function writeStoreToDisk(store: CompaniesStore): Promise<void> {
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function listCompanies(): Promise<CompaniesStore> {
  const store = await readCompaniesStore()
  if (store.companies.length === 0) {
    const seeded = seedIfEmpty(store)
    await writeCompaniesStore(seeded)
    return seeded
  }
  return store
}

export async function getCompany(id: string): Promise<Company | null> {
  const store = await listCompanies()
  return store.companies.find((c) => c.id === id) ?? null
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const store = await listCompanies()
  const now = new Date().toISOString()
  const company = migrateCompany({
    id: newId(),
    name: input.name.trim(),
    industry: input.industry?.trim() || "General",
    website: input.website?.trim() || "",
    notes: input.notes?.trim() || "",
    targetProfitRatio: Math.max(1, Number(input.targetProfitRatio) || 3),
    customerExperienceGoal: input.customerExperienceGoal || "fast-friendly",
    customerExperienceNotes: input.customerExperienceNotes?.trim() || "",
    strategyIds: Array.isArray(input.strategyIds) ? input.strategyIds : [],
    status: input.status || "active",
    currentProfitRatio: input.currentProfitRatio ?? 0,
    cxScore: input.cxScore ?? 0,
    adStrategyPlan: input.adStrategyPlan ?? "",
    dailyAdBudget: input.dailyAdBudget ?? 50,
    currentProfit: input.currentProfit ?? 0,
    currentAdSpend: input.currentAdSpend ?? 0,
    autoCutThreshold: input.autoCutThreshold ?? 1.5,
    autonomousMode: input.autonomousMode ?? false,
    minRunningAds: input.minRunningAds ?? 3,
    createdAt: now,
    updatedAt: now,
  })
  store.companies.push(company)
  if (!store.activeCompanyId) store.activeCompanyId = company.id
  await writeCompaniesStore(store)
  return company
}

export async function updateCompany(
  id: string,
  patch: Partial<CompanyInput> & { currentProfitRatio?: number; cxScore?: number }
): Promise<Company | null> {
  const store = await listCompanies()
  const idx = store.companies.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const prev = store.companies[idx]
  const updated: Company = migrateCompany({
    ...prev,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() : prev.name,
    industry: patch.industry !== undefined ? patch.industry.trim() : prev.industry,
    website: patch.website !== undefined ? patch.website.trim() : prev.website,
    notes: patch.notes !== undefined ? patch.notes.trim() : prev.notes,
    customerExperienceNotes:
      patch.customerExperienceNotes !== undefined
        ? patch.customerExperienceNotes.trim()
        : prev.customerExperienceNotes,
    strategyIds: patch.strategyIds !== undefined ? patch.strategyIds : prev.strategyIds,
    targetProfitRatio:
      patch.targetProfitRatio !== undefined
        ? Math.max(1, Number(patch.targetProfitRatio) || prev.targetProfitRatio)
        : prev.targetProfitRatio,
    updatedAt: new Date().toISOString(),
  })
  store.companies[idx] = updated
  await writeCompaniesStore(store)
  return updated
}

export async function deleteCompany(id: string): Promise<boolean> {
  const store = await listCompanies()
  const before = store.companies.length
  store.companies = store.companies.filter((c) => c.id !== id)
  if (store.companies.length === before) return false
  if (store.activeCompanyId === id) {
    store.activeCompanyId = store.companies[0]?.id ?? null
  }
  await writeCompaniesStore(store)
  return true
}

export async function setActiveCompany(id: string): Promise<CompaniesStore> {
  const store = await listCompanies()
  if (!store.companies.some((c) => c.id === id)) {
    throw new Error("Company not found")
  }
  store.activeCompanyId = id
  await writeCompaniesStore(store)
  return store
}
