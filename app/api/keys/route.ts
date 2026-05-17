import { NextResponse } from "next/server"

function maskKey(value: string): string {
  if (!value || value.length < 8) return "•••"
  return value.slice(0, 3) + "..." + value.slice(-4)
}

export async function GET() {
  const keys = [
    {
      id: "openai",
      name: "Content Generation",
      provider: "OpenAI",
      envKey: "OPENAI_API_KEY",
      configured: !!process.env.OPENAI_API_KEY,
      maskedKey: process.env.OPENAI_API_KEY ? maskKey(process.env.OPENAI_API_KEY) : "Not set",
      status: process.env.OPENAI_API_KEY ? "active" : "expired",
    },
    {
      id: "replicate",
      name: "Video Rendering",
      provider: "Replicate",
      envKey: "REPLICATE_API_TOKEN",
      configured: !!process.env.REPLICATE_API_TOKEN,
      maskedKey: process.env.REPLICATE_API_TOKEN ? maskKey(process.env.REPLICATE_API_TOKEN) : "Not set",
      status: process.env.REPLICATE_API_TOKEN ? "active" : "expired",
    },
    {
      id: "meta",
      name: "Meta (Ads & Page)",
      provider: "Meta",
      envKey: "META_ACCESS_TOKEN",
      configured: !!process.env.META_ACCESS_TOKEN,
      maskedKey: process.env.META_ACCESS_TOKEN ? maskKey(process.env.META_ACCESS_TOKEN) : "Not set",
      status: process.env.META_ACCESS_TOKEN ? "active" : "expired",
    },
  ]
  return NextResponse.json({ keys })
}
