/** Basic Meta/Facebook ad policy keyword blocklist — flagged ads need manual approval */
const BLOCKED_PATTERNS = [
  /\bguaranteed?\s+(cure|income|results?)\b/i,
  /\bget rich\b/i,
  /\b100%\s+free\b/i,
  /\bno risk\b/i,
  /\bclick here now\b/i,
  /\bweight loss miracle\b/i,
  /\bbefore\s+and\s+after\b.*\bguarantee/i,
  /\bpersonal\s+attributes\b/i,
  /\b(race|religion|ethnicity)\s+targeting\b/i,
  /\bfake\s+news\b/i,
  /\b_counterfeit\b/i,
]

export function scanAdCopy(text: string): string[] {
  const flags: string[] = []
  const combined = text
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(combined)) {
      flags.push(`Policy: matched pattern ${pattern.source.slice(0, 40)}`)
    }
  }
  if (/\b(you|your)\s+(are|were)\s+(fat|ugly|stupid)/i.test(combined)) {
    flags.push("Policy: negative personal attributes")
  }
  if (combined.length > 0 && combined.match(/!!!|FREE!!!|ACT NOW!!!/g)) {
    flags.push("Policy: excessive urgency / spam-like copy")
  }
  return flags
}

export function scanAdFields(fields: {
  headline?: string
  body?: string
  cta?: string
}): string[] {
  const text = [fields.headline, fields.body, fields.cta].filter(Boolean).join(" ")
  return scanAdCopy(text)
}
