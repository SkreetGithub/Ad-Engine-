import { readFile } from "fs/promises"
import { join } from "path"

const KEY_FILES = [
  "lib/addy.ts",
  "lib/addy-engine/run-optimization.ts",
  "app/api/cron/optimize-ads/route.ts",
  "app/api/addy-engine/smart-chat/route.ts",
  "lib/addy-intelligence/context.ts",
  "lib/addy-ai/index.ts",
  "lib/addy-persistence/index.ts",
  "supabase/schema.sql",
  ".github/workflows/addy-autonomous.yml",
]

const MAX_CHARS_PER_FILE = 3500

export async function buildCodebaseContext(): Promise<string> {
  const parts: string[] = [
    "Repository: SkreetGithub/Ad-Engine- (Next.js Addy ad engine on Vercel + Supabase)",
  ]

  for (const rel of KEY_FILES) {
    try {
      const full = join(process.cwd(), rel)
      const raw = await readFile(full, "utf-8")
      const body = raw.length > MAX_CHARS_PER_FILE ? `${raw.slice(0, MAX_CHARS_PER_FILE)}\n…[truncated]` : raw
      parts.push(`\n### ${rel}\n\`\`\`\n${body}\n\`\`\``)
    } catch {
      parts.push(`\n### ${rel}\n(unavailable in this deployment)`)
    }
  }

  return parts.join("\n")
}

export function isTechnicalQuestion(message: string): boolean {
  return /\b(code|bug|optimize|improve|faster|api|route|typescript|sql|index|deploy|github|cursor|refactor|error|fix|cron|supabase|vercel)\b/i.test(
    message
  )
}
