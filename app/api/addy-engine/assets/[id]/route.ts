import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { ensureEngineSeeded } from "@/lib/addy-engine/store"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params
  const engine = await ensureEngineSeeded()
  const asset = engine.assets.find((a) => a.id === id)
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  try {
    const path = join(process.cwd(), ".data", asset.storagePath)
    const buf = await readFile(path)
    return new NextResponse(buf, {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": `inline; filename="${asset.name}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 })
  }
}
