import { writeFile, mkdir } from "fs/promises"
import { DEBUG_CONFIG } from "./config"

export class PatchEngine {
  async deploy(patch: string): Promise<string> {
    await mkdir(DEBUG_CONFIG.patchDir, { recursive: true })
    const name = `patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.patch.js`
    const path = `${DEBUG_CONFIG.patchDir}/${name}`
    await writeFile(path, patch, "utf-8")
    return name
  }
}
