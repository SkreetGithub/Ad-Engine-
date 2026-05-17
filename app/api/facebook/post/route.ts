import { NextRequest, NextResponse } from "next/server"

const META_PAGE_ID = process.env.META_PAGE_ID
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const graphUrl = "https://graph.facebook.com/v21.0"

export async function POST(request: NextRequest) {
  if (!META_PAGE_ID || !META_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Missing META_PAGE_ID or META_ACCESS_TOKEN in .env.local" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { message, link } = body as { message?: string; link?: string }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      )
    }

    const params = new URLSearchParams({
      message: message.trim(),
      access_token: META_ACCESS_TOKEN,
    })
    if (link?.trim()) params.set("link", link.trim())

    const res = await fetch(`${graphUrl}/${META_PAGE_ID}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Facebook API error", details: data },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, id: data.id, post_id: data.id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to post to Facebook" },
      { status: 500 }
    )
  }
}
