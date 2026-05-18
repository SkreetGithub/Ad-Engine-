import { readFile } from "fs/promises"
import { join } from "path"
import type { BrandingAsset } from "@/lib/addy-engine/types"

export async function assetToVisionPart(
  asset: BrandingAsset
): Promise<{ type: "image_url"; image_url: { url: string } } | null> {
  if (!asset.mimeType.startsWith("image/")) return null

  if (asset.storagePath.startsWith("data:")) {
    return { type: "image_url", image_url: { url: asset.storagePath } }
  }

  try {
    const full = join(process.cwd(), ".data", asset.storagePath)
    const buf = await readFile(full)
    const b64 = buf.toString("base64")
    return {
      type: "image_url",
      image_url: { url: `data:${asset.mimeType};base64,${b64}` },
    }
  } catch {
    return null
  }
}
