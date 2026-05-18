import { NextResponse } from "next/server"
import { listCompanies } from "@/lib/companies-store"
import { ensureEngineSeeded } from "@/lib/addy-engine/store"
import { syncMetaForCompany } from "@/lib/addy-engine/meta-sync"
import { runAddyOptimization } from "@/lib/addy-engine/run-optimization"
import { acquireCronLock, releaseCronLock } from "@/lib/addy-persistence/cron-lock"
import { getCronSource, verifyCronAuth } from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Full Addy cycle for Supabase pg_cron / manual trigger:
 * 1) Meta metrics sync per active brand
 * 2) Feedback gather + daily review + audit + competitive intel (via runAddyOptimization)
 */
export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const source = getCronSource(request)
  const jobName = "addy-full-cycle"
  const lock = await acquireCronLock(jobName, source)

  if (!lock.acquired) {
    return NextResponse.json(
      { ok: false, message: lock.reason || "Cycle already running", source },
      { status: 409 }
    )
  }

  const metaResults: { companyId: string; ok: boolean; error?: string }[] = []

  try {
    if (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) {
      const store = await listCompanies()
      const engine = await ensureEngineSeeded()

      for (const company of store.companies) {
        if (company.status !== "active") continue
        const running = engine.runningAds.filter((a) => a.companyId === company.id)
        try {
          const meta = await syncMetaForCompany(company.id, running)
          metaResults.push({ companyId: company.id, ok: meta?.ok ?? false })
        } catch (e) {
          metaResults.push({
            companyId: company.id,
            ok: false,
            error: e instanceof Error ? e.message : "sync failed",
          })
        }
      }
    }

    const optimization = await runAddyOptimization({
      source: `${source}:addy-cycle`,
      lightweight: request.headers.get("x-github-runner") === "true",
    })

    return NextResponse.json({
      ok: optimization.ok,
      source,
      metaSynced: metaResults.filter((r) => r.ok).length,
      metaResults,
      optimization,
      timestamp: new Date().toISOString(),
    })
  } finally {
    await releaseCronLock(jobName)
  }
}
