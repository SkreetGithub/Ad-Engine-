import { getSupabase, hasSupabase } from "@/lib/supabase"

export async function createAbTest(
  companyId: string,
  testName: string,
  variantA: string,
  variantB: string,
  budgetPerVariant = 15
): Promise<string | null> {
  if (!hasSupabase()) return null
  const { data, error } = await getSupabase()
    .from("addy_ab_tests")
    .insert({
      company_id: companyId,
      test_name: testName,
      variant_a_creative: variantA,
      variant_b_creative: variantB,
      budget_per_variant: budgetPerVariant,
      status: "running",
    })
    .select("id")
    .single()

  if (error) return null
  return data.id as string
}

export async function evaluateRunningAbTests(companyId: string): Promise<string[]> {
  const messages: string[] = []
  if (!hasSupabase()) return messages

  const sb = getSupabase()
  const { data: tests } = await sb
    .from("addy_ab_tests")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "running")

  for (const test of tests ?? []) {
    const spendA = (test.spend_a as number) ?? 0
    const spendB = (test.spend_b as number) ?? 0
    const budget = (test.budget_per_variant as number) ?? 15
    const roiA = (test.roi_a as number) ?? 0
    const roiB = (test.roi_b as number) ?? 0

    if (spendA + spendB >= budget * 2 || (spendA >= budget && spendB >= budget)) {
      const winner = roiA >= roiB ? "A" : "B"
      const winnerRoi = Math.max(roiA, roiB)
      const loserRoi = Math.min(roiA, roiB)

      await sb
        .from("addy_ab_tests")
        .update({
          status: "completed",
          winner,
          ended_at: new Date().toISOString(),
        })
        .eq("id", test.id)

      messages.push(
        `A/B test "${test.test_name}" complete: Variant ${winner} won (${winnerRoi.toFixed(2)}:1 vs ${loserRoi.toFixed(2)}:1). Addy will favor this creative.`
      )
    }
  }

  return messages
}
