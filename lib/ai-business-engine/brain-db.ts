import { getSupabase } from "@/lib/supabase"
import type { BrainMemoryRow, CreativeMemoryRow } from "./types"

export const BrainDB = {
  async storeMemory(memory: BrainMemoryRow): Promise<void> {
    await getSupabase().from("brain_memory").insert([
      { state: memory.state, action: memory.action, reward: memory.reward },
    ])
  },

  async fetchMemory(): Promise<{ state: unknown; action: string; reward: number }[]> {
    const { data } = await getSupabase().from("brain_memory").select("state, action, reward").order("created_at", { ascending: false }).limit(500)
    return (data ?? []) as { state: unknown; action: string; reward: number }[]
  },

  async storeCreative(creative: CreativeMemoryRow): Promise<void> {
    await getSupabase().from("creative_memory").insert([
      { hook: creative.hook, style: creative.style, pacing: creative.pacing, cta: creative.cta },
    ])
  },

  async fetchCreatives(): Promise<CreativeMemoryRow[]> {
    const { data } = await getSupabase().from("creative_memory").select("hook, style, pacing, cta").order("created_at", { ascending: false }).limit(200)
    return (data ?? []) as CreativeMemoryRow[]
  },

  async storeProfit(profit: number): Promise<void> {
    await getSupabase().from("profit_log").insert([{ profit }])
  },

  async fetchProfitLog(limit = 500): Promise<{ profit: number }[]> {
    const { data } = await getSupabase().from("profit_log").select("profit").order("created_at", { ascending: false }).limit(limit)
    return (data ?? []) as { profit: number }[]
  },

  async loadSwarmState(id = "default"): Promise<{ ads: unknown[]; dataset: { input: number[]; reward: number }[] } | null> {
    const { data } = await getSupabase().from("ai_swarm_state").select("ads, dataset").eq("id", id).single()
    if (!data?.ads) return null
    return { ads: data.ads as unknown[], dataset: (data.dataset ?? []) as { input: number[]; reward: number }[] }
  },

  async saveSwarmState(ads: unknown[], dataset: { input: number[]; reward: number }[], id = "default"): Promise<void> {
    await getSupabase().from("ai_swarm_state").upsert({ id, ads, dataset, updated_at: new Date().toISOString() }, { onConflict: "id" })
  },
}
