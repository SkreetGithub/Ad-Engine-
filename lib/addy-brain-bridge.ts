import { BrainDB } from "@/lib/ai-business-engine/brain-db"
import type { ReviewCycleRecord } from "@/lib/addy-engine/types"
import type { Company } from "@/lib/companies/types"
import { hasSupabase } from "@/lib/supabase"

/** Mirror Addy daily reviews into brain_memory / profit_log / creative_memory for the RL engine */
export async function syncReviewToBrain(
  company: Company,
  cycle: ReviewCycleRecord
): Promise<void> {
  if (!hasSupabase()) return

  try {
    const roas = cycle.portfolioRatio
    const spend = cycle.spend
    const profit = cycle.profit

    await BrainDB.storeMemory({
      state: {
        ctr: 0,
        roas,
        spend,
        style: company.industry,
        audience: company.customerExperienceGoal,
      },
      action: `addy_review:cuts=${cycle.queueCuts},keeps=${cycle.queueKeeps},pauses=${cycle.queuePauses}`,
      reward: roas,
    })

    if (profit > 0) {
      await BrainDB.storeProfit(profit)
    }

    for (const lesson of cycle.lessonsLearned.slice(0, 5)) {
      await BrainDB.storeCreative({
        hook: lesson.slice(0, 200),
        style: company.industry,
        pacing: 1,
        cta: company.name,
      })
    }
  } catch (e) {
    console.error("Addy → brain sync failed:", e)
  }
}
