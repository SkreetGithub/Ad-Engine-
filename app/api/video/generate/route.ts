import { NextRequest, NextResponse } from "next/server"

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
// Optional: set in .env.local from replicate.com (e.g. luma/ray or minimax/video-01 version hash)
const REPLICATE_VIDEO_VERSION = process.env.REPLICATE_VIDEO_VERSION

/**
 * Start a short video generation job (Replicate).
 * Returns prediction id and status URL; poll for completion and get output video URL.
 * Use the video URL later in a "Create video ad" flow (Phase 4 in ROADMAP).
 * Set REPLICATE_VIDEO_VERSION to a model version hash from replicate.com (e.g. text-to-video or image-to-video).
 */
export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN not set in .env.local" }, { status: 500 })
  }
  if (!REPLICATE_VIDEO_VERSION) {
    return NextResponse.json({
      error: "REPLICATE_VIDEO_VERSION not set. Add to .env.local from replicate.com (e.g. luma/ray or minimax/video-01). See ROADMAP.md Phase 4.",
    }, { status: 500 })
  }

  try {
    const { prompt } = (await request.json()) as { prompt?: string }
    const text = (prompt || "Short ad clip: professional logistics, truck, fast delivery").trim()

    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_VIDEO_VERSION,
        input: { prompt: text },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail || err.error || `Replicate API ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      id: data.id,
      status: data.status,
      urls: data.urls, // get, cancel - poll get for output
      message: "Video generation started. Poll GET urls.get with the id to get the video URL when status is 'succeeded'.",
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Video generation failed" },
      { status: 500 }
    )
  }
}
