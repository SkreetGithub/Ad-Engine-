import { ADDY_OWNER } from "@/lib/addy"

export type SocialPlatform = "facebook" | "instagram" | "tiktok"

export interface PostResult {
  ok: boolean
  platform: SocialPlatform
  postId?: string
  error?: string
}

export async function postToFacebook(message: string, link?: string): Promise<PostResult> {
  const pageId = process.env.META_PAGE_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!pageId || !token) {
    return { ok: false, platform: "facebook", error: "META_PAGE_ID and META_ACCESS_TOKEN required" }
  }

  const params = new URLSearchParams({ message: message.trim(), access_token: token })
  if (link?.trim()) params.set("link", link.trim())

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } }
  if (!res.ok) {
    return { ok: false, platform: "facebook", error: data.error?.message || "Facebook post failed" }
  }
  return { ok: true, platform: "facebook", postId: data.id }
}

/** Instagram uses the same Meta Graph Page feed when IG is linked to the Page */
export async function postToInstagram(message: string, link?: string): Promise<PostResult> {
  const igUserId = process.env.META_IG_USER_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!igUserId || !token) {
    return {
      ok: false,
      platform: "instagram",
      error: "META_IG_USER_ID and META_ACCESS_TOKEN required for Instagram",
    }
  }

  const caption = link?.trim() ? `${message.trim()}\n\n${link.trim()}` : message.trim()
  const res = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption,
      access_token: token,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } }
  if (!res.ok) {
    return { ok: false, platform: "instagram", error: data.error?.message || "Instagram post failed" }
  }
  return { ok: true, platform: "instagram", postId: data.id }
}

/** TikTok Marketing API — configure TIKTOK_ACCESS_TOKEN + TIKTOK_ADVERTISER_ID */
export async function postToTikTok(message: string): Promise<PostResult> {
  const token = process.env.TIKTOK_ACCESS_TOKEN
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID
  if (!token || !advertiserId) {
    return {
      ok: false,
      platform: "tiktok",
      error: `TikTok API not configured. ${ADDY_OWNER.name}, add TIKTOK_ACCESS_TOKEN and TIKTOK_ADVERTISER_ID in Vercel env.`,
    }
  }

  // Placeholder: TikTok organic post requires Content Posting API approval
  return {
    ok: false,
    platform: "tiktok",
    error: "TikTok posting stub ready — connect TikTok Content Posting API in developer portal.",
  }
}

export async function executeSocialPost(
  platform: SocialPlatform,
  message: string,
  link?: string
): Promise<PostResult> {
  switch (platform) {
    case "facebook":
      return postToFacebook(message, link)
    case "instagram":
      return postToInstagram(message, link)
    case "tiktok":
      return postToTikTok(message)
    default:
      return { ok: false, platform, error: "Unknown platform" }
  }
}
