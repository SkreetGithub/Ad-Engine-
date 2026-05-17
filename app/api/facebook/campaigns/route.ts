import { NextResponse } from "next/server"

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID
const graphUrl = "https://graph.facebook.com/v21.0"

export async function GET() {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    return NextResponse.json(
      { error: "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID in .env.local" },
      { status: 500 }
    )
  }

  try {
    const params = new URLSearchParams({
      access_token: META_ACCESS_TOKEN,
      fields: "id,name,status,effective_status,daily_budget,created_time",
    })
    const res = await fetch(
      `${graphUrl}/${META_AD_ACCOUNT_ID}/campaigns?${params.toString()}`
    )
    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message, details: data }, { status: 400 })
    }
    const campaigns = (data.data || []).map((c: { id: string; name: string; status: string; effective_status?: string[]; daily_budget?: string; created_time?: string }) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      effective_status: c.effective_status?.[0] ?? c.status,
      daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : 0,
      created_time: c.created_time,
    }))
    return NextResponse.json({ campaigns })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list campaigns" },
      { status: 500 }
    )
  }
}
