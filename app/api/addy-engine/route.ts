import { NextResponse } from "next/server"
import { getCompany } from "@/lib/companies-store"
import { ensureEngineSeeded, getCompanyView, getEngineFull } from "@/lib/addy-engine/store"
import { persistenceMode } from "@/lib/addy-persistence"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")
  const persistence = persistenceMode()

  try {
    await ensureEngineSeeded()

    if (companyId) {
      const company = await getCompany(companyId)
      if (!company) {
        return NextResponse.json(
          {
            error: "Company not found",
            hint: companyId === "co_default" ? "Seed failed — check Supabase env on Vercel." : undefined,
          },
          { status: 404 }
        )
      }
      const view = await getCompanyView(companyId)
      if (!view) {
        return NextResponse.json({ error: "Could not build workspace view" }, { status: 500 })
      }
      return NextResponse.json({ company, view, persistence })
    }
    const engine = await getEngineFull()
    return NextResponse.json({ engine, persistence })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load engine"
    return NextResponse.json(
      {
        error: message,
        persistence,
        hint:
          persistence === "file"
            ? "On Vercel, set SUPABASE_URL and SUPABASE_ANON_KEY, then run supabase/schema.sql."
            : "Check Supabase tables and RLS policies allow anon read/write.",
      },
      { status: 500 }
    )
  }
}
