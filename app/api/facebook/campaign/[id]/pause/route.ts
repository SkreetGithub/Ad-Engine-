import { NextRequest, NextResponse } from "next/server"

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const graphUrl = "https://graph.facebook.com/v21.0"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!META_ACCESS_TOKEN || !id) {
    return NextResponse.json(
      { error: "Missing META_ACCESS_TOKEN or campaign id" },
      { status: 500 }
    )
  }

  try {
    const body = new URLSearchParams({
      access_token: META_ACCESS_TOKEN,
      status: "PAUSED",
    })
    const res = await fetch(`${graphUrl}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message, details: data }, { status: 400 })
    }
    return NextResponse.json({ success: true, campaign_id: id, status: "PAUSED" })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to pause campaign" },
      { status: 500 }
    )
  }
}
