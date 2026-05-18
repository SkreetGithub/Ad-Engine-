import { NextResponse } from "next/server"
import { listCompanies } from "@/lib/companies-store"
import { ensureEngineSeeded } from "@/lib/addy-engine/store"
import { syncMetaForCompany } from "@/lib/addy-engine/meta-sync"
import { getCronSource, verifyCronAuth } from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.META_ACCESS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
    return NextResponse.json({ ok: true, synced: 0, message: "Meta not configured" })
  }

  const source = getCronSource(request)
  const store = await listCompanies()
  const engine = await ensureEngineSeeded()
  const results: { companyId: string; ok: boolean; error?: string }[] = []

  for (const company of store.companies) {
    if (company.status !== "active") continue
    const running = engine.runningAds.filter((a) => a.companyId === company.id)
    try {
      const meta = await syncMetaForCompany(company.id, running)
      results.push({ companyId: company.id, ok: meta?.ok ?? false })
    } catch (e) {
      results.push({
        companyId: company.id,
        ok: false,
        error: e instanceof Error ? e.message : "sync failed",
      })
    }
  }

  return NextResponse.json({
    ok: true,
    source,
    synced: results.filter((r) => r.ok).length,
    results,
  })
}
