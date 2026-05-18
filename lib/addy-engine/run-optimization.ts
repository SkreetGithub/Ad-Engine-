import { listCompanies } from "@/lib/companies-store"
import { buildPlainEnglishDailyReport } from "@/lib/addy-engine/daily-report"
import { runDailyReview, applyQueueToAds } from "@/lib/addy-engine/daily-review"
import { syncMetaForCompany } from "@/lib/addy-engine/meta-sync"
import {
  addQueueItems,
  appendLearningHistory,
  ensureEngineSeeded,
  newId,
  readEngine,
  writeEngine,
} from "@/lib/addy-engine/store"
import type { ReviewCycleRecord } from "@/lib/addy-engine/types"
import { logCronRun } from "@/lib/addy-persistence"
import { acquireCronLock, releaseCronLock } from "@/lib/addy-persistence/cron-lock"
import { hasSupabase } from "@/lib/supabase"
import { fetchCompetitiveIntel } from "@/lib/addy-intelligence/competitive"
import { evaluateRunningAbTests } from "@/lib/addy-intelligence/ab-tests"
import { persistDailyAudit } from "@/lib/addy-intelligence/daily-audit"
import {
  gatherCompanyFeedback,
  persistFeedbackSnapshot,
} from "@/lib/addy-intelligence/feedback-gather"
import { boostMemoryImpact } from "@/lib/addy-intelligence/memory"

export interface OptimizationResult {
  ok: boolean
  summary: string
  processed: number
  details: { companyId: string; name: string; ok: boolean; error?: string }[]
  source: string
  locked?: boolean
}

export async function runAddyOptimization(opts: {
  source: string
  lightweight?: boolean
}): Promise<OptimizationResult> {
  const jobName = "daily-optimization"
  const lock = await acquireCronLock(jobName, opts.source)

  if (!lock.acquired) {
    return {
      ok: false,
      summary: lock.reason || "Already running",
      processed: 0,
      details: [],
      source: opts.source,
      locked: true,
    }
  }

  const details: OptimizationResult["details"] = []
  let processed = 0

  try {
    const store = await listCompanies()
    const engine = await ensureEngineSeeded()

    for (const company of store.companies) {
      if (company.status !== "active") continue
      try {
        const running = engine.runningAds.filter((a) => a.companyId === company.id)
        const library = engine.libraryAds.filter((a) => a.companyId === company.id)

        let meta = null
        if (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) {
          meta = await syncMetaForCompany(company.id, running)
        }

        const feedback = await gatherCompanyFeedback(company)
        await persistFeedbackSnapshot(company, feedback)

        const { items, debugLog } = runDailyReview(company, running, library)
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
          feedbackNarrative: feedback.narrative,
        })

        const cycle: ReviewCycleRecord = {
          id: newId("cycle"),
          companyId: company.id,
          createdAt: new Date().toISOString(),
          metaSynced: meta?.ok ?? false,
          dailyReport: report,
          recommendations,
          lessonsLearned,
          portfolioRatio: meta?.ok ? meta.portfolioRatio : company.currentProfitRatio,
          spend: meta?.ok ? meta.totalSpend : company.currentAdSpend,
          profit: meta?.ok ? meta.totalProfit : company.currentProfit,
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
        await fetchCompetitiveIntel(company)
        await evaluateRunningAbTests(company.id)

        if (company.autonomousMode) {
          let eng = await readEngine()
          for (const item of items) {
            if (item.status === "executed" && (item.action === "cut" || item.action === "pause")) {
              eng.runningAds = applyQueueToAds(item, eng.runningAds)
            }
          }
          await writeEngine(eng)
        }

        details.push({ companyId: company.id, name: company.name, ok: true })
        processed++
      } catch (e) {
        details.push({
          companyId: company.id,
          name: company.name,
          ok: false,
          error: e instanceof Error ? e.message : "failed",
        })
      }
    }

    const summary = `Addy optimization (${opts.source}): ${processed} brands. Storage: ${hasSupabase() ? "Supabase" : "file"}.`
    await logCronRun({
      status: "ok",
      companiesProcessed: processed,
      summary,
      details: { source: opts.source, items: details },
    })

    return { ok: true, summary, processed, details, source: opts.source }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Optimization failed"
    await logCronRun({
      status: "error",
      companiesProcessed: processed,
      summary: msg,
      details: { source: opts.source, items: details },
    })
    return { ok: false, summary: msg, processed, details, source: opts.source }
  } finally {
    await releaseCronLock(jobName)
  }
}
