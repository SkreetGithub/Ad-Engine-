import { getSupabase, hasSupabase } from "@/lib/supabase"

const LOCK_TTL_MS = 8 * 60 * 1000

export async function acquireCronLock(
  jobName: string,
  lockedBy: string
): Promise<{ acquired: boolean; reason?: string }> {
  if (!hasSupabase()) return { acquired: true }

  const sb = getSupabase()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS)

  const { data: existing } = await sb
    .from("addy_cron_locks")
    .select("job_name, expires_at")
    .eq("job_name", jobName)
    .maybeSingle()

  if (existing?.expires_at && new Date(existing.expires_at as string) > now) {
    return { acquired: false, reason: "Job already running" }
  }

  const { error } = await sb.from("addy_cron_locks").upsert(
    {
      job_name: jobName,
      locked_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      locked_by: lockedBy,
    },
    { onConflict: "job_name" }
  )

  if (error) {
    console.error("Cron lock upsert failed:", error.message)
    return { acquired: true }
  }

  return { acquired: true }
}

export async function releaseCronLock(jobName: string): Promise<void> {
  if (!hasSupabase()) return
  await getSupabase().from("addy_cron_locks").delete().eq("job_name", jobName)
}
