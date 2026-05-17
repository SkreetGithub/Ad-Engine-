import { NextRequest, NextResponse } from "next/server"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set in .env.local" }, { status: 500 })
  }

  try {
    const { campaignName, strategy } = (await request.json()) as { campaignName?: string; strategy?: string }
    const prompt = `Write short, punchy ad copy for a Facebook/Instagram ad. 
${campaignName ? `Campaign theme: ${campaignName}.` : ""}
${strategy ? `Tone/strategy: ${strategy}.` : ""}
Return only the ad copy (1-3 sentences), no quotes or labels. Keep it under 125 characters if possible for best performance.`

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      }),
    })

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message || "OpenAI error" }, { status: 400 })
    }
    const copy = data.choices?.[0]?.message?.content?.trim() || ""
    return NextResponse.json({ copy })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate copy" },
      { status: 500 }
    )
  }
}
