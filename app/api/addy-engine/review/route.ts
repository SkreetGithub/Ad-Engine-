import { NextResponse } from "next/server"
import { getCompany } from "@/lib/companies-store"
import { buildPlainEnglishDailyReport } from "@/lib/addy-engine/daily-report"
import { persistDailyAudit } from "@/lib/addy-intelligence/daily-audit"
import { boostMemoryImpact } from "@/lib/addy-intelligence/memory"
import { runDailyReview, applyQueueToAds } from "@/lib/addy-engine/daily-review"
import { syncMetaForCompany } from "@/lib/addy-engine/meta-sync"
import {
  addQueueItems,
  addRunningAd,
  appendLearningHistory,
  ensureEngineSeeded,
  getCompanyView,
  newId,
  readEngine,
  writeEngine,
} from "@/lib/addy-engine/store"
import type { ReviewCycleRecord, RunningAd } from "@/lib/addy-engine/types"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { companyId: string; syncMeta?: boolean }
    let company = await getCompany(body.companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const engine = await ensureEngineSeeded()
    let running = engine.runningAds.filter((a) => a.companyId === company!.id)
    const library = engine.libraryAds.filter((a) => a.companyId === company!.id)

    let meta = null
    if (body.syncMeta !== false) {
      meta = await syncMetaForCompany(company.id, running)
      company = (await getCompany(company.id))!
      const engineRefreshed = await ensureEngineSeeded()
      running = engineRefreshed.runningAds.filter((a) => a.companyId === company.id)
    }

    const { items, debugLog, executed } = runDailyReview(company, running, library)
    await addQueueItems(items)

    const queueSummary = {
      cuts: items.filter((i) => i.action === "cut").length,
      keeps: items.filter((i) => i.action === "keep").length,
      pauses: items.filter((i) => i.action === "pause").length,
      newAds: items.filter((i) => i.action === "new_ad").length,
    }

    const { report, recommendations, lessonsLearned } = await buildPlainEnglishDailyReport({
      company,
      runningAds: running,
      library,
      meta,
      queueSummary,
    })

    const spend = meta?.ok ? meta.totalSpend : company.currentAdSpend
    const profit = meta?.ok ? meta.totalProfit : company.currentProfit
    const roas = meta?.ok ? meta.portfolioRatio : company.currentProfitRatio

    const cycle: ReviewCycleRecord = {
      id: newId("cycle"),
      companyId: company.id,
      createdAt: new Date().toISOString(),
      metaSynced: meta?.ok ?? false,
      dailyReport: report,
      recommendations,
      lessonsLearned,
      portfolioRatio: roas,
      spend,
      profit,
      queueCuts: queueSummary.cuts,
      queueKeeps: queueSummary.keeps,
      queuePauses: queueSummary.pauses,
      queueNewAds: queueSummary.newAds,
      debugLog,
    }
    await appendLearningHistory(cycle)
    await persistDailyAudit(company, cycle)
    for (const lesson of cycle.lessonsLearned.slice(0, 3)) {
      await boostMemoryImpact(company.id, lesson, cycle.profit)
    }

    let engineAfter = await readEngine()

    if (company.autonomousMode) {
      for (const item of items) {
        if (item.status !== "executed") continue
        if (item.action === "cut" || item.action === "pause") {
          engineAfter.runningAds = applyQueueToAds(item, engineAfter.runningAds)
        }
        if (item.action === "new_ad" && item.payload) {
          const p = item.payload as { headline?: string; body?: string; basedOn?: string }
          const newAd: Omit<RunningAd, "id" | "createdAt" | "updatedAt"> = {
            companyId: company.id,
            name: item.adName || "Addy variant",
            headline: String(p.headline || "New offer"),
            body: String(p.body || ""),
            cta: "Shop Now",
            targetAudience: "Broad — Addy generated",
            libraryAdId: p.basedOn as string | undefined,
            status: "draft",
            spendToday: 0,
            profitToday: 0,
            profitRatio: 0,
            ctr: 0,
            conversions: 0,
            underperformDays: 0,
          }
          await addRunningAd(newAd)
        }
      }
      engineAfter = await readEngine()
      await writeEngine(engineAfter)
    }

    const view = await getCompanyView(company.id)
    return NextResponse.json({
      ok: true,
      itemsAdded: items.length,
      debugLog,
      executed,
      dailyReport: report,
      recommendations,
      lessonsLearned,
      cycle,
      meta,
      view,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Review failed" },
      { status: 500 }
    )
  }
}
