import { NextResponse } from "next/server"
import { persistenceMode } from "@/lib/addy-persistence"
import { hasSupabase, getSupabase } from "@/lib/supabase"
import { verifyCursorApiKey } from "@/lib/addy-super-brain/cursor-client"

export const dynamic = "force-dynamic"

const REQUIRED_ENV = [
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
] as const

const RECOMMENDED_ENV = [
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "META_ACCESS_TOKEN",
  "META_AD_ACCOUNT_ID",
  "META_PAGE_ID",
] as const

export async function GET() {
  const env = {
    required: REQUIRED_ENV.map((k) => ({ key: k, set: !!process.env[k] })),
    recommended: RECOMMENDED_ENV.map((k) => ({ key: k, set: !!process.env[k] })),
    optional: {
      CURSOR_API_KEY: !!process.env.CURSOR_API_KEY,
      CURSOR_GITHUB_REPO_URL: !!process.env.CURSOR_GITHUB_REPO_URL,
    },
  }

  const missingRequired = env.required.filter((e) => !e.set).map((e) => e.key)
  const missingRecommended = env.recommended.filter((e) => !e.set).map((e) => e.key)

  let supabaseTables: Record<string, boolean> = {}
  if (hasSupabase()) {
    const sb = getSupabase()
    const tables = [
      "addy_companies",
      "addy_review_cycles",
      "addy_memory_entries",
      "addy_super_learning",
      "addy_daily_audit",
      "addy_cron_runs",
    ]
    for (const table of tables) {
      const { error } = await sb.from(table).select("id", { count: "exact", head: true }).limit(1)
      supabaseTables[table] = !error
    }
  }

  let cursorKeyValid = false
  if (process.env.CURSOR_API_KEY) {
    cursorKeyValid = await verifyCursorApiKey()
  }

  const ok =
    missingRequired.length === 0 &&
    persistenceMode() === "supabase" &&
    Object.values(supabaseTables).every(Boolean)

  return NextResponse.json({
    ok,
    persistence: persistenceMode(),
    env,
    missingRequired,
    missingRecommended,
    supabaseTables,
    cursorKeyValid,
    message: ok
      ? "Addy is wired for production learning and daily audits."
      : "Fix missing env vars or run supabase/schema.sql in the Supabase SQL Editor.",
  })
}
