import type { Company } from "@/lib/companies/types"
import type { LibraryAd, ReviewQueueItem, RunningAd } from "@/lib/addy-engine/types"
import { scanAdFields } from "@/lib/addy-engine/policy"

function newQueueId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export interface DailyReviewResult {
  items: ReviewQueueItem[]
  debugLog: string[]
  executed: string[]
}

export function runDailyReview(
  company: Company,
  runningAds: RunningAd[],
  library: LibraryAd[]
): DailyReviewResult {
  const items: ReviewQueueItem[] = []
  const debugLog: string[] = []
  const executed: string[] = []
  const now = new Date().toISOString()
  const threshold = company.autoCutThreshold
  const target = company.targetProfitRatio

  const active = runningAds.filter((a) => a.companyId === company.id && a.status === "active")
  const companySpend = company.currentAdSpend || active.reduce((s, a) => s + a.spendToday, 0)
  const companyProfit = company.currentProfit || active.reduce((s, a) => s + a.profitToday, 0)
  const portfolioRatio = companySpend > 0 ? companyProfit / companySpend : 0

  debugLog.push(
    `Addy daily review for ${company.name}: ${active.length} active ads, portfolio ratio ${portfolioRatio.toFixed(2)}:1 (target ${target}:1)`
  )

  for (const ad of active) {
    const policyFlags = scanAdFields({ headline: ad.headline, body: ad.body, cta: ad.cta })
    const debugReason = [
      `Ad "${ad.name}": profit ratio ${ad.profitRatio.toFixed(2)}:1 vs cut threshold ${threshold}:1`,
      `Spend today $${ad.spendToday}, profit $${ad.profitToday}`,
      `Underperform streak: ${ad.underperformDays} day(s)`,
      policyFlags.length ? `Policy flags: ${policyFlags.join("; ")}` : "Policy: clean",
    ].join(" | ")

    if (policyFlags.length > 0) {
      items.push({
        id: newQueueId(),
        companyId: company.id,
        action: "pause",
        adId: ad.id,
        adName: ad.name,
        reason: `Policy review required for "${ad.name}"`,
        debugReason,
        status: "pending",
        policyFlags,
        createdAt: now,
      })
      debugLog.push(`FLAG pause: ${ad.name} — policy`)
      continue
    }

    if (ad.profitRatio >= target) {
      items.push({
        id: newQueueId(),
        companyId: company.id,
        action: "keep",
        adId: ad.id,
        adName: ad.name,
        reason: `Keep "${ad.name}" — above target ${target}:1`,
        debugReason,
        status: company.autonomousMode ? "executed" : "pending",
        policyFlags: [],
        createdAt: now,
      })
      if (company.autonomousMode) executed.push(`Kept ${ad.name}`)
      debugLog.push(`KEEP: ${ad.name}`)
    } else if (ad.profitRatio < threshold || ad.underperformDays >= 2) {
      items.push({
        id: newQueueId(),
        companyId: company.id,
        action: "cut",
        adId: ad.id,
        adName: ad.name,
        reason: `Cut "${ad.name}" — ratio ${ad.profitRatio.toFixed(2)}:1 below ${threshold}:1`,
        debugReason,
        status: company.autonomousMode ? "executed" : "pending",
        policyFlags: [],
        createdAt: now,
      })
      debugLog.push(`CUT: ${ad.name}`)
      if (company.autonomousMode) executed.push(`Auto-cut ${ad.name}`)
    } else {
      items.push({
        id: newQueueId(),
        companyId: company.id,
        action: "pause",
        adId: ad.id,
        adName: ad.name,
        reason: `Pause "${ad.name}" for your review — ambiguous performance`,
        debugReason,
        status: "pending",
        policyFlags: [],
        createdAt: now,
      })
      debugLog.push(`PAUSE review: ${ad.name}`)
    }
  }

  const activeAfterCuts = active.length - items.filter((i) => i.action === "cut").length
  if (activeAfterCuts < company.minRunningAds) {
    const winner = library.find(
      (l) => l.companyId === company.id && l.tags.includes("winning")
    )
    const payload = winner
      ? { basedOn: winner.id, headline: winner.headline, body: winner.body }
      : { headline: "New offer — shop today", body: company.customerExperienceNotes }

    items.push({
      id: newQueueId(),
      companyId: company.id,
      action: "new_ad",
      adName: winner ? `${winner.name} — Addy variant` : "Addy suggested ad",
      reason: `Only ${activeAfterCuts} ads would run — need ${company.minRunningAds}. New ad from library.`,
      debugReason: winner
        ? `Remix winning library ad ${winner.id} to maintain min ${company.minRunningAds} running`
        : `No winner in library — generic draft to fill min ads`,
      status: "pending",
      policyFlags: scanAdFields({
        headline: String(payload.headline || ""),
        body: String(payload.body || ""),
      }),
      payload,
      createdAt: now,
    })
    debugLog.push("SUGGEST new_ad to meet min running count")
  }

  if (companySpend > company.dailyAdBudget * 0.95) {
    items.push({
      id: newQueueId(),
      companyId: company.id,
      action: "budget_change",
      reason: `Daily spend $${companySpend.toFixed(2)} near cap $${company.dailyAdBudget}`,
      debugReason: `Spend at ${((companySpend / company.dailyAdBudget) * 100).toFixed(0)}% of daily budget`,
      status: "pending",
      policyFlags: [],
      createdAt: now,
    })
  }

  return { items, debugLog, executed }
}

export function applyQueueToAds(
  item: ReviewQueueItem,
  ads: RunningAd[]
): RunningAd[] {
  if (!item.adId) return ads
  return ads.map((ad) => {
    if (ad.id !== item.adId) return ad
    if (item.action === "cut") return { ...ad, status: "cut" as const, updatedAt: new Date().toISOString() }
    if (item.action === "pause") return { ...ad, status: "paused" as const, updatedAt: new Date().toISOString() }
    if (item.action === "keep") return { ...ad, updatedAt: new Date().toISOString() }
    return ad
  })
}
