import { NextRequest, NextResponse } from "next/server"
import { saveBrandingFile } from "@/lib/addy-engine/store"

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const companyId = form.get("companyId") as string
    const file = form.get("file") as File | null
    if (!companyId || !file) {
      return NextResponse.json({ error: "companyId and file required" }, { status: 400 })
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size 8MB" }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await saveBrandingFile(companyId, file.name, file.type || "application/octet-stream", buffer)
    return NextResponse.json({ asset }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    )
  }
}
