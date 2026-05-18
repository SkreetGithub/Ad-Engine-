import type { Company } from "@/lib/companies/types"
import type { LibraryAd, RunningAd } from "@/lib/addy-engine/types"
import type { MetaCampaignInsight, MetaSyncResult } from "@/lib/addy-engine/meta-sync"
import { cxGoalLabel } from "@/lib/addy"
import { ADDY_MISSION } from "@/lib/addy"
import { loadCumulativeLessons } from "@/lib/addy-persistence"

export interface DailyReportInput {
  company: Company
  runningAds: RunningAd[]
  library: LibraryAd[]
  meta?: MetaSyncResult | null
  queueSummary?: { cuts: number; keeps: number; pauses: number; newAds: number }
  /** Consolidated signals from memory, audits, Super Brain, A/B, Meta, etc. */
  feedbackNarrative?: string
}

export async function buildPlainEnglishDailyReport(input: DailyReportInput): Promise<{
  report: string
  recommendations: string[]
  lessonsLearned: string[]
}> {
  const { company, runningAds, library, meta, queueSummary, feedbackNarrative } = input
  const active = runningAds.filter((a) => a.status === "active")
  const spend = meta?.ok ? meta.totalSpend : company.currentAdSpend
  const profit = meta?.ok ? meta.totalProfit : company.currentProfit
  const roas =
    meta?.ok && meta.portfolioRatio > 0
      ? meta.portfolioRatio
      : spend > 0
        ? (profit + spend) / spend
        : company.currentProfitRatio

  const target = company.targetProfitRatio
  const gap = target - roas
  const recommendations: string[] = []
  const lessonsLearned: string[] = []

  const pastLessons = await loadCumulativeLessons(company.id, 15)
  if (pastLessons.length) {
    lessonsLearned.push(
      `Addy remembers from past reviews: ${pastLessons.slice(0, 5).join(" · ")}`
    )
  }

  if (feedbackNarrative?.trim()) {
    lessonsLearned.push(
      "Cron pulled all learning signals (memory, audits, Super Brain, A/B, competitive, social) before this review."
    )
    recommendations.push(
      `Stay within $${company.dailyAdBudget}/day — prioritize cuts on losers using consolidated feedback below.`
    )
  }

  const losers = active.filter((a) => a.profitRatio < company.autoCutThreshold)
  const winners = active.filter((a) => a.profitRatio >= target)
  const middling = active.filter(
    (a) => a.profitRatio >= company.autoCutThreshold && a.profitRatio < target
  )

  if (losers.length) {
    recommendations.push(
      `Pause or cut ${losers.length} ad(s) today: ${losers.map((a) => a.name).join(", ")}. They are below your ${company.autoCutThreshold}:1 floor and are burning budget without enough return.`
    )
    lessonsLearned.push(
      `Underperformers (${losers.map((a) => a.name).join(", ")}) hurt portfolio ROAS — Addy will flag similar patterns faster next review.`
    )
  }

  if (winners.length) {
    recommendations.push(
      `Scale budget slightly on winners: ${winners.map((a) => a.name).join(", ")}. They already beat your ${target}:1 target — shift $5–10 from weak ads if budget allows.`
    )
  }

  if (spend > company.dailyAdBudget * 0.9) {
    recommendations.push(
      `You are at ${((spend / company.dailyAdBudget) * 100).toFixed(0)}% of your $${company.dailyAdBudget} daily cap. Slow new tests until tomorrow or raise the cap in company settings.`
    )
  }

  if (gap > 0.3) {
    recommendations.push(
      `Profit gap: you need about ${(gap * 100).toFixed(0)}% more return per dollar to hit ${target}:1. Focus on cutting losers first, then remix a winning library ad.`
    )
  } else if (roas >= target) {
    recommendations.push(
      `You are at or above target ROAS. Test one new creative from the library while keeping ${company.minRunningAds}+ proven ads live.`
    )
  }

  const libWinner = library.find((l) => l.tags.includes("winning"))
  if (libWinner && losers.length) {
    recommendations.push(
      `Remix library winner "${libWinner.name}" to replace weak creative — same hook style, fresh CTA aligned with ${cxGoalLabel(company.customerExperienceGoal)}.`
    )
  }

  if (meta?.ok && meta.campaigns.length) {
    const best = [...meta.campaigns].sort((a, b) => b.profitRatio - a.profitRatio)[0]
    const worst = [...meta.campaigns].sort((a, b) => a.profitRatio - b.profitRatio)[0]
    if (best) {
      recommendations.push(
        `From live Facebook data today, "${best.campaign_name}" is your top campaign ($${best.spend.toFixed(2)} spend, ${best.profitRatio.toFixed(2)}:1 ROAS). Mirror its message in other ads.`
      )
    }
    if (worst && worst.spend > 5) {
      recommendations.push(
        `"${worst.campaign_name}" spent $${worst.spend.toFixed(2)} with weak return (${worst.profitRatio.toFixed(2)}:1). Review creative and audience in Ads Manager or cut via Addy's queue.`
      )
    }
    lessonsLearned.push(
      `Meta sync: ${meta.campaigns.length} campaigns tracked; ${meta.adsUpdated} ad(s) matched to live performance.`
    )
  } else if (!meta?.ok) {
    recommendations.push(
      `Connect Meta API keys and click "Sync Facebook data" so Addy can use real spend and purchase value instead of estimates.`
    )
  }

  recommendations.push(
    `Keep customer experience front and center: ${company.customerExperienceNotes || cxGoalLabel(company.customerExperienceGoal)} — every ad should feel on-brand, not just clickable.`
  )

  const metaBlock = meta?.ok
    ? `\n**Facebook data (today):** $${spend.toFixed(2)} spent, ~$${profit.toFixed(2)} net profit after spend, portfolio ROAS **${roas.toFixed(2)}:1** across ${meta.campaigns.length} campaign(s).`
    : `\n**Note:** Today's numbers use your saved company totals. Sync Meta for live Facebook performance.`

  const queueBlock = queueSummary
    ? `\n**This review:** ${queueSummary.keeps} keep · ${queueSummary.cuts} cut · ${queueSummary.pauses} pause · ${queueSummary.newAds} new ad suggestion(s).`
    : ""

  const report = `## ${company.name} — Daily report from Addy

**Mission:** ${ADDY_MISSION}

**Bottom line:** You are at **${roas.toFixed(2)}:1** return vs your **${target}:1** goal${gap > 0 ? ` — about **${gap.toFixed(2)}** short` : " — on track"}.
${metaBlock}
${queueBlock}

### What's working
${winners.length ? winners.map((a) => `• **${a.name}** — ${a.profitRatio.toFixed(2)}:1 ($${a.profitToday.toFixed(2)} profit on $${a.spendToday.toFixed(2)} spend)`).join("\n") : "• No ads clearly above target yet — prioritize cutting waste."}

### Needs attention
${losers.length ? losers.map((a) => `• **${a.name}** — only ${a.profitRatio.toFixed(2)}:1 (${a.underperformDays} day(s) under threshold)`).join("\n") : middling.length ? middling.map((a) => `• **${a.name}** — ${a.profitRatio.toFixed(2)}:1 (close but not at target)`).join("\n") : "• No critical cuts flagged — stay disciplined on budget."}

### Strategy reminder
${company.adStrategyPlan ? company.adStrategyPlan.split("\n").map((l) => `• ${l}`).join("\n") : "• Add a written ad strategy plan so Addy aligns every recommendation."}

### Addy's top actions for you today
${recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`

  const selfImproveBlock =
    pastLessons.length > 0
      ? `\n### What Addy has learned about ${company.name}\n${pastLessons.slice(0, 8).map((l) => `• ${l}`).join("\n")}\n`
      : ""

  const feedbackBlock = feedbackNarrative?.trim()
    ? `\n### Consolidated feedback (all sources)\n${feedbackNarrative.slice(0, 2500)}\n`
    : ""

  return {
    report: report + selfImproveBlock + feedbackBlock,
    recommendations,
    lessonsLearned,
  }
}
