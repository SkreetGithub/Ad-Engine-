import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getSupabase, hasSupabase } from "@/lib/supabase"
import type { CompaniesStore, Company } from "@/lib/companies/types"
import { migrateCompany, type CompanyInput } from "@/lib/companies/types"
import type { AddyEngineStore, AddySettings, ReviewCycleRecord } from "@/lib/addy-engine/types"
import { defaultAddySettings } from "@/lib/addy-ai/config"

const DATA_DIR = join(process.cwd(), ".data")
const COMPANIES_FILE = join(DATA_DIR, "companies.json")
const ENGINE_FILE = join(DATA_DIR, "addy-engine.json")

export function persistenceMode(): "supabase" | "file" {
  return hasSupabase() ? "supabase" : "file"
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

function emptyEngine(): AddyEngineStore {
  return {
    settings: defaultAddySettings(),
    runningAds: [],
    libraryAds: [],
    queue: [],
    chats: {},
    assets: [],
    learningHistory: [],
  }
}

async function readFileCompanies(): Promise<CompaniesStore> {
  try {
    const raw = await readFile(COMPANIES_FILE, "utf-8")
    const data = JSON.parse(raw) as CompaniesStore
    if (!data?.companies?.length) {
      const c = defaultCompany()
      return { activeCompanyId: c.id, companies: [c] }
    }
    data.companies = data.companies.map((c) => migrateCompany(c))
    if (!data.activeCompanyId) data.activeCompanyId = data.companies[0]?.id ?? null
    return data
  } catch {
    const c = defaultCompany()
    return { activeCompanyId: c.id, companies: [c] }
  }
}

async function writeFileCompanies(store: CompaniesStore): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(COMPANIES_FILE, JSON.stringify(store, null, 2), "utf-8")
  } catch {
    // Vercel serverless FS may be read-only — ignore
  }
}

async function readSupabaseCompanies(): Promise<CompaniesStore> {
  const sb = getSupabase()
  const { data: rows, error } = await sb.from("addy_companies").select("id, payload")
  if (error) throw new Error(error.message)

  if (!rows?.length) {
    const c = defaultCompany()
    await saveSupabaseCompanies({ activeCompanyId: c.id, companies: [c] })
    return { activeCompanyId: c.id, companies: [c] }
  }

  const { data: state } = await sb.from("addy_app_state").select("active_company_id").eq("id", "global").single()

  const companies = rows.map((r) => migrateCompany(r.payload as Company))
  return {
    activeCompanyId: state?.active_company_id ?? companies[0]?.id ?? null,
    companies,
  }
}

async function saveSupabaseCompanies(store: CompaniesStore): Promise<void> {
  const sb = getSupabase()
  const now = new Date().toISOString()

  for (const c of store.companies) {
    const { error } = await sb.from("addy_companies").upsert(
      {
        id: c.id,
        payload: c,
        updated_at: now,
      },
      { onConflict: "id" }
    )
    if (error) throw new Error(error.message)
  }

  await sb.from("addy_app_state").upsert(
    {
      id: "global",
      active_company_id: store.activeCompanyId,
      updated_at: now,
    },
    { onConflict: "id" }
  )
}

export async function loadCompaniesStore(): Promise<CompaniesStore> {
  if (hasSupabase()) {
    try {
      return await readSupabaseCompanies()
    } catch (e) {
      console.error("Supabase companies load failed, falling back to file:", e)
    }
  }
  const store = await readFileCompanies()
  if (store.companies.length === 0) {
    const c = defaultCompany()
    store.companies = [c]
    store.activeCompanyId = c.id
  }
  await writeFileCompanies(store)
  return store
}

export async function saveCompaniesStore(store: CompaniesStore): Promise<void> {
  if (hasSupabase()) {
    try {
      await saveSupabaseCompanies(store)
    } catch (e) {
      console.error("Supabase companies save failed:", e)
    }
  }
  await writeFileCompanies(store)
}

async function readFileEngine(): Promise<AddyEngineStore> {
  try {
    const raw = await readFile(ENGINE_FILE, "utf-8")
    const data = JSON.parse(raw) as AddyEngineStore
    if (!data.settings) data.settings = defaultAddySettings()
    data.learningHistory = data.learningHistory ?? []
    return data
  } catch {
    return emptyEngine()
  }
}

async function writeFileEngine(store: AddyEngineStore): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(ENGINE_FILE, JSON.stringify(store, null, 2), "utf-8")
  } catch {
    // ignore on read-only FS
  }
}

async function readSupabaseEngine(): Promise<AddyEngineStore> {
  const sb = getSupabase()
  const { data, error } = await sb.from("addy_app_state").select("settings, engine").eq("id", "global").single()

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message)
  }

  if (!data?.engine || Object.keys(data.engine as object).length === 0) {
    return emptyEngine()
  }

  const engine = data.engine as AddyEngineStore
  engine.settings = { ...defaultAddySettings(), ...(data.settings as AddySettings), ...engine.settings }
  engine.learningHistory = engine.learningHistory ?? []
  return engine
}

async function saveSupabaseEngine(store: AddyEngineStore): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from("addy_app_state").upsert(
    {
      id: "global",
      settings: store.settings,
      engine: store,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
  if (error) throw new Error(error.message)
}

export async function loadEngineStore(): Promise<AddyEngineStore> {
  if (hasSupabase()) {
    try {
      return await readSupabaseEngine()
    } catch (e) {
      console.error("Supabase engine load failed, falling back to file:", e)
    }
  }
  return readFileEngine()
}

export async function saveEngineStore(store: AddyEngineStore): Promise<void> {
  if (hasSupabase()) {
    try {
      await saveSupabaseEngine(store)
    } catch (e) {
      console.error("Supabase engine save failed:", e)
    }
  }
  await writeFileEngine(store)
}

export async function persistReviewCycle(cycle: ReviewCycleRecord): Promise<void> {
  if (hasSupabase()) {
    try {
      const sb = getSupabase()
      await sb.from("addy_review_cycles").insert({
        id: cycle.id,
        company_id: cycle.companyId,
        payload: cycle,
        created_at: cycle.createdAt,
      })
      for (const lesson of cycle.lessonsLearned) {
        await sb.from("addy_lessons").insert({
          company_id: cycle.companyId,
          lesson,
          source_cycle_id: cycle.id,
        })
      }
    } catch (e) {
      console.error("Supabase review cycle save failed:", e)
    }
  }
}

export async function loadReviewCycles(companyId: string, limit = 20): Promise<ReviewCycleRecord[]> {
  if (hasSupabase()) {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from("addy_review_cycles")
        .select("payload")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      return (data ?? []).map((r) => r.payload as ReviewCycleRecord)
    } catch (e) {
      console.error("Supabase review cycles load failed:", e)
    }
  }
  const engine = await loadEngineStore()
  return (engine.learningHistory ?? []).filter((h) => h.companyId === companyId).slice(0, limit)
}

export async function loadCumulativeLessons(companyId: string, limit = 30): Promise<string[]> {
  if (hasSupabase()) {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from("addy_lessons")
        .select("lesson")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      return (data ?? []).map((r) => r.lesson)
    } catch (e) {
      console.error("Supabase lessons load failed:", e)
    }
  }
  const cycles = await loadReviewCycles(companyId, 10)
  return cycles.flatMap((c) => c.lessonsLearned)
}

export async function logCronRun(summary: {
  status: string
  companiesProcessed: number
  summary: string
  details: unknown[]
}): Promise<void> {
  if (!hasSupabase()) return
  try {
    await getSupabase().from("addy_cron_runs").insert({
      status: summary.status,
      companies_processed: summary.companiesProcessed,
      summary: summary.summary,
      details: summary.details,
    })
  } catch (e) {
    console.error("Cron log failed:", e)
  }
}

export { defaultCompany }
