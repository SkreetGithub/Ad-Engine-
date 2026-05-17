import type { Company } from "@/lib/companies/types"
import type { LibraryAd, RunningAd } from "@/lib/addy-engine/types"

export function getMockResponse(
  message: string,
  company: Company,
  adsRunning: RunningAd[],
  library: LibraryAd[]
): string {
  const msg = message.toLowerCase()
  const active = adsRunning.filter((a) => a.status === "active")
  const threshold = company.autoCutThreshold

  if (msg.includes("run") && (msg.includes("review") || msg.includes("cron") || msg.includes("daily"))) {
    return `📋 I can run your daily review now. Go to the **Review Queue** tab and click **Run daily review**, or I’ll analyze ${active.length} active ads against your ${threshold}:1 cut threshold.`
  }

  if (msg.includes("cut") || msg.includes("losing") || msg.includes("underperform")) {
    const bad = active.filter((a) => a.profitRatio < threshold)
    if (bad.length) {
      return `📉 Found ${bad.length} ad(s) below your ${threshold}:1 threshold: **${bad.map((a) => a.name).join(", ")}**. I recommend queuing them for cut. Open Review Queue to approve, or enable autonomous mode for auto-cut.`
    }
    return `✅ All ${active.length} active ads are at or above ${threshold}:1. No cuts needed right now.`
  }

  if (msg.includes("create") && msg.includes("ad")) {
    const winner = library.find((a) => a.tags.includes("winning"))
    if (winner) {
      return `🎨 Based on winning ad **"${winner.name}"**, I suggest a variant: keep hook "${winner.headline.slice(0, 40)}…" but refresh CTA to time-bound urgency. I can add this to your queue — check Review Queue after running daily review.`
    }
    return `📝 Upload a template to your **Ad Library** or tell me the offer + audience. I’ll draft copy that matches your CX goal: ${company.customerExperienceNotes || company.customerExperienceGoal}.`
  }

  if (msg.includes("profit") || msg.includes("roi") || msg.includes("ratio")) {
    const spend = company.currentAdSpend || 1
    const ratio = company.currentProfit / spend
    const target = company.targetProfitRatio
    const gap = target - ratio
    if (ratio >= target) {
      return `💰 **${company.name}** profit ratio is **${ratio.toFixed(2)}:1** (target ${target}:1). You’re on track! Consider scaling budget slightly on top performers.`
    }
    return `💰 Current ratio **${ratio.toFixed(2)}:1** vs target **${target}:1**. Improve ~${(gap * 100).toFixed(0)}% by cutting ads under ${threshold}:1 and remixing library winners. Daily budget: $${company.dailyAdBudget}.`
  }

  if (msg.includes("spend") || msg.includes("budget")) {
    const used = company.currentAdSpend
    const cap = company.dailyAdBudget
    return `📊 Today: **$${used.toFixed(2)}** spent of **$${cap}** daily cap (${((used / cap) * 100).toFixed(0)}%). ${used > cap * 0.9 ? "⚠️ Near cap — pause low ROI ads." : "Room to test new creatives from library."}`
  }

  if (msg.includes("experience") || msg.includes("cx") || msg.includes("customer")) {
    return `💜 CX goal: **${company.customerExperienceGoal}**. Score: **${company.cxScore}%**. ${company.customerExperienceNotes ? `Note: ${company.customerExperienceNotes}` : "Add notes in company settings so I align ad tone."}`
  }

  if (msg.includes("library")) {
    return `📚 **${library.length}** saved ad(s). ${library.filter((a) => a.tags.includes("winning")).length} tagged winning. Ask me to "create ad from library" to remix.`
  }

  return `👋 **Addy here** for **${company.name}**. You have **${active.length}** ads running (min ${company.minRunningAds}). Ask me to: cut losers · analyze profit · create from library · run daily review · check spend vs $${company.dailyAdBudget} budget.`
}
