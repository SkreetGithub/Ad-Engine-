/**
 * Meta Ads API – Autonomous AI Ad Brain Engine (Production Grade)
 * ---------------------------------------------------------------
 * - Fully compliant Meta API implementation
 * - Guaranteed fix for is_adset_budget_sharing_enabled
 * - Autonomous Debug + Self-Healing retry
 * - Built for AI Swarm business automation
 */

const META_GRAPH_URL = "https://graph.facebook.com/v21.0"

// ================================
// CONFIG
// ================================

/** Normalize ad account ID: Meta requires act_<id> for ad account API calls. */
function normalizeAdAccountId(value: string): string {
  const trimmed = (value || "").trim()
  if (!trimmed) return trimmed
  return /^act_/i.test(trimmed) ? trimmed : `act_${trimmed}`
}

export function getMetaConfig() {
  const accessToken = process.env.META_ACCESS_TOKEN
  const rawAdAccountId = process.env.META_AD_ACCOUNT_ID
  const pageId = process.env.META_PAGE_ID

  if (!accessToken || !rawAdAccountId || !pageId) {
    throw new Error(`
❌ META API CONFIG ERROR

Missing environment variables:

META_ACCESS_TOKEN
META_AD_ACCOUNT_ID
META_PAGE_ID

Add them to your .env.local file.
`)
  }

  const adAccountId = normalizeAdAccountId(rawAdAccountId)
  return { accessToken, adAccountId, pageId }
}

/** Resolve page ID for Marketing API: use token's page list so Meta accepts it (avoids "global id not allowed"). */
let cachedResolvedPageId: string | null = null

export async function getResolvedPageId(configuredPageId?: string): Promise<string> {
  if (cachedResolvedPageId) return cachedResolvedPageId
  const { accessToken, pageId: envPageId } = getMetaConfig()
  const want = (configuredPageId || envPageId).trim()
  const url = `${META_GRAPH_URL}/me/accounts?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      // Token may be system user / no "me" – fall back to env
      cachedResolvedPageId = want
      return want
    }
    const pages = data.data
    if (Array.isArray(pages) && pages.length > 0) {
      const match = pages.find((p: { id?: string }) => String(p.id) === want)
      const pageId = match ? String(match.id) : String(pages[0].id)
      cachedResolvedPageId = pageId
      return pageId
    }
  } catch {
    // ignore
  }
  cachedResolvedPageId = want
  return want
}

// ================================
// AUTONOMOUS DEBUG ENGINE
// ================================

export function autoFixMetaParams(
  params: Record<string, any>,
  options: {
    useCampaignBudget: boolean
    isScaling: boolean
  }
) {
  if (!options.useCampaignBudget) {
    params.is_adset_budget_sharing_enabled = options.isScaling ? "True" : "False"
  }

  return params
}

// ================================
// RETRY + RATE LIMIT AI
// ================================

const MAX_RETRIES = 5
const BASE_DELAY = 1200

async function fetchWithSelfHealing(
  url: string,
  init: RequestInit,
  attempt = 1
): Promise<Response> {
  const res = await fetch(url, init)

  if (res.ok) return res

  const error = await res.clone().json().catch(() => ({}))
  const status = res.status

  const isRetryable = status === 429 || status >= 500

  if (isRetryable && attempt <= MAX_RETRIES) {
    const delay = BASE_DELAY * attempt
    console.warn(`⚠️ Meta API retry ${attempt}/${MAX_RETRIES} – waiting ${delay}ms`)
    await new Promise(r => setTimeout(r, delay))
    return fetchWithSelfHealing(url, init, attempt + 1)
  }

  const errMsg = typeof error?.error?.message === "string" ? error.error.message : JSON.stringify(error)
  if (/\(#100\)|global id.*not allowed/i.test(errMsg)) {
    const hint =
      "Ensure META_AD_ACCOUNT_ID is your ad account (act_XXX from Ads Manager), not your Page ID. " +
      "If the rejected ID is your Page ID, use a User access token with pages_manage_ads and a Page linked to that ad account."
    throw new Error(`Meta API error: ${errMsg}. ${hint}`)
  }
  throw new Error(`Meta API failure: ${JSON.stringify(error)}`)
}

// ================================
// FORM BODY BUILDERS
// ================================

function encode(v: any): string {
  if (typeof v === "object") return JSON.stringify(v)
  if (typeof v === "boolean") return v ? "true" : "false"
  return String(v)
}

/**
 * CRITICAL FUNCTION:
 * is_adset_budget_sharing_enabled MUST be FIRST if present.
 */
export function buildAdSetFormBody(
  accessToken: string,
  params: Record<string, any>
): string {
  const parts: string[] = []

  if ("is_adset_budget_sharing_enabled" in params) {
    parts.push(`is_adset_budget_sharing_enabled=${params.is_adset_budget_sharing_enabled}`)
    delete params.is_adset_budget_sharing_enabled
  }

  parts.push(`access_token=${encodeURIComponent(accessToken)}`)

  for (const [k, v] of Object.entries(params)) {
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(encode(v))}`)
  }

  return parts.join("&")
}

export function buildFormBody(
  accessToken: string,
  params: Record<string, any>
): string {
  const body = new URLSearchParams({ access_token: accessToken })

  for (const [k, v] of Object.entries(params)) {
    body.set(k, encode(v))
  }

  return body.toString()
}

// ================================
// META POST ENGINE
// ================================

async function metaPost(
  path: string,
  params: Record<string, any>
) {
  const { accessToken } = getMetaConfig()

  const url = `${META_GRAPH_URL}${path}`
  const body = buildFormBody(accessToken, params)

  const res = await fetchWithSelfHealing(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  return res.json()
}

async function metaPostAdSet(
  params: Record<string, any>
) {
  const { accessToken, adAccountId } = getMetaConfig()

  const body = buildAdSetFormBody(accessToken, params)

  const res = await fetchWithSelfHealing(
    `${META_GRAPH_URL}/${adAccountId}/adsets`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  )

  return res.json()
}

// ================================
// META AI HIGH-LEVEL FUNCTIONS
// ================================

export async function createCampaign(opts: {
  name: string
  objective: string
  status?: string
}) {
  // Required when budget is set at ad set level (v24+): must specify True or False
  return metaPost(
    `/${getMetaConfig().adAccountId}/campaigns`,
    {
      name: opts.name,
      objective: opts.objective,
      status: opts.status || "PAUSED",
      special_ad_categories: [],
      is_adset_budget_sharing_enabled: "False",
    }
  )
}

// ----------------------------------

const DEFAULT_TARGETING = {
  geo_locations: { countries: ["US"] },
  age_min: 18,
}

// ----------------------------------

export async function createAdSet(opts: {
  name: string
  campaignId: string
  dailyBudgetCents?: number
  lifetimeBudgetCents?: number
  startTime?: string
  endTime?: string
  status?: string
  useCampaignBudget?: boolean
  isScaling?: boolean
  pageId?: string
}) {
  const useCBO = opts.useCampaignBudget === true
  const pageId = await getResolvedPageId(opts.pageId)

  let params: Record<string, any> = {
    name: opts.name,
    campaign_id: opts.campaignId,
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    status: opts.status || "PAUSED",
    targeting: DEFAULT_TARGETING,
    promoted_object: {
      page_id: pageId,
    },
  }

  if (!useCBO) {
    if (opts.lifetimeBudgetCents && opts.startTime && opts.endTime) {
      // Meta requires lifetime_budget > $30 (3000 cents) or ads may not deliver
      params.lifetime_budget = Math.max(3001, opts.lifetimeBudgetCents)
      params.start_time = opts.startTime
      params.end_time = opts.endTime
    } else if (opts.dailyBudgetCents) {
      params.daily_budget = Math.max(1000, opts.dailyBudgetCents)
    }
  }

  // 🔥 AUTONOMOUS PARAM FIX ENGINE
  params = autoFixMetaParams(params, {
    useCampaignBudget: useCBO,
    isScaling: opts.isScaling === true,
  })

  return metaPostAdSet(params)
}

// ----------------------------------

export async function createCreative(opts: {
  name: string
  objectStorySpec: object
}) {
  return metaPost(
    `/${getMetaConfig().adAccountId}/adcreatives`,
    {
      name: opts.name,
      object_story_spec: opts.objectStorySpec,
    }
  )
}

/** Boost an existing Page post (object_story_id = post id from Graph API). */
export async function createCreativeFromPost(opts: {
  name: string
  objectStoryId: string
}) {
  return metaPost(
    `/${getMetaConfig().adAccountId}/adcreatives`,
    {
      name: opts.name,
      object_story_id: opts.objectStoryId,
    }
  )
}

// ----------------------------------

export async function createAd(opts: {
  name: string
  adsetId: string
  creativeId: string
  status?: string
}) {
  return metaPost(
    `/${getMetaConfig().adAccountId}/ads`,
    {
      name: opts.name,
      adset_id: opts.adsetId,
      creative: { creative_id: opts.creativeId },
      status: opts.status || "PAUSED",
    }
  )
}

// ================================
// AUTONOMOUS ERROR AI
// ================================

export function formatMetaError(meta: any): string {
  if (!meta) return "Unknown Meta API error"

  const msg =
    meta?.error_user_msg ||
    meta?.message ||
    JSON.stringify(meta)

  if (/token|session|access/i.test(msg)) {
    return "Meta access token expired. Generate a new token and update .env.local"
  }

  if (/is_adset_budget_sharing_enabled/i.test(msg)) {
    return "Budget sharing flag error — autonomous fix engine should prevent this."
  }

  if (/development mode|must be in public|created by an app that is in development/i.test(msg)) {
    return (
      "Your Meta/Facebook app is in Development mode. To create live ads, switch it to Live: " +
      "Meta for Developers → Your App → App Mode → switch to Live. " +
      "See https://developers.facebook.com/docs/development/build-and-test/app-modes"
    )
  }

  return msg
}

/** User-facing error from a Meta API response object (`{ error: ... }` or raw error). */
export function formatMetaErrorResponse(meta: unknown): string {
  if (!meta || typeof meta !== "object") return formatMetaError(meta)
  const err = meta as { error?: unknown }
  return formatMetaError(err.error ?? meta)
}

// ================================
// EXPORTS
// ================================

export { META_GRAPH_URL }
