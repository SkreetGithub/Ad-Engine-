import type { Company } from "@/lib/companies/types"
import { getSupabase, hasSupabase } from "@/lib/supabase"

const DEFAULT_COMPETITORS: Record<string, string[]> = {
  General: ["industry leader", "top competitor"],
}

export async function fetchCompetitiveIntel(company: Company): Promise<string[]> {
  const notes: string[] = []
  const competitors =
    (company.notes?.match(/competitors?:\s*([^\n]+)/i)?.[1]?.split(",").map((s) => s.trim()) ??
      DEFAULT_COMPETITORS[company.industry]) ||
    DEFAULT_COMPETITORS.General

  const serpKey = process.env.SERPAPI_KEY
  if (serpKey) {
    for (const comp of competitors.slice(0, 3)) {
      try {
        const q = encodeURIComponent(`${comp} ${company.industry} facebook ad`)
        const res = await fetch(
          `https://serpapi.com/search.json?q=${q}&api_key=${serpKey}&num=3`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) continue
        const data = (await res.json()) as {
          organic_results?: { title?: string; snippet?: string }[]
        }
        const snippet = data.organic_results?.[0]?.snippet
        if (snippet) {
          notes.push(`${comp}: ${snippet.slice(0, 200)}`)
          if (hasSupabase()) {
            await getSupabase().from("addy_competitive_intel").insert({
              company_id: company.id,
              competitor_name: comp,
              ad_copy: snippet.slice(0, 500),
              estimated_ctr: 0.02,
              addy_notes: `SerpAPI scan for ${company.name}`,
            })
          }
        }
      } catch {
        // skip failed competitor fetch
      }
    }
  } else if (hasSupabase()) {
    const { data } = await getSupabase()
      .from("addy_competitive_intel")
      .select("competitor_name, ad_copy, addy_notes")
      .eq("company_id", company.id)
      .order("detected_at", { ascending: false })
      .limit(5)

    for (const row of data ?? []) {
      notes.push(`${row.competitor_name}: ${row.addy_notes || row.ad_copy || "tracked"}`)
    }
  }

  return notes
}
