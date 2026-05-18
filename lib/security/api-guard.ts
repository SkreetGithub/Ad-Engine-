const COMPANY_ID_RE = /^co_[a-z0-9_]{4,64}$/
const MAX_MESSAGE_LEN = 8000
const MAX_JSON_BODY = 100_000

const rateMap = new Map<string, { count: number; resetAt: number }>()

export function assertValidCompanyId(id: unknown): string {
  if (typeof id !== "string" || !COMPANY_ID_RE.test(id)) {
    throw new Error("Invalid company id")
  }
  return id
}

export function sanitizeChatMessage(raw: unknown): string {
  if (typeof raw !== "string") throw new Error("Message must be text")
  let msg = raw.trim().slice(0, MAX_MESSAGE_LEN)
  msg = msg.replace(/```addy_action[\s\S]*?```/gi, "")
  msg = msg.replace(/<script[\s\S]*?<\/script>/gi, "")
  return msg
}

export function checkRateLimit(
  request: Request,
  opts: { max: number; windowMs: number; key?: string }
): { ok: true } | { ok: false; retryAfterSec: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  const key = opts.key ? `${ip}:${opts.key}` : ip
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true }
  }

  if (entry.count >= opts.max) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { ok: true }
}

export function assertBodySize(contentLength: string | null, max = MAX_JSON_BODY): void {
  const len = contentLength ? parseInt(contentLength, 10) : 0
  if (len > max) throw new Error("Request body too large")
}

export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  return request.headers.get("authorization") === `Bearer ${secret}`
}

/** Optional: set ADDY_API_SECRET on Vercel and send x-addy-secret from trusted clients */
export function verifyAddyApiSecret(request: Request): boolean {
  const secret = process.env.ADDY_API_SECRET
  if (!secret) return true
  return request.headers.get("x-addy-secret") === secret
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export function assertUploadSize(bytes: number): void {
  if (bytes > MAX_UPLOAD_BYTES) {
    throw new Error("File too large (max 5MB)")
  }
}
