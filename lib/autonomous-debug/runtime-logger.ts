import { appendFile, mkdir } from "fs/promises"
import { dirname } from "path"
import { DEBUG_CONFIG } from "./config"

/**
 * Append a line to the runtime log so the Autonomous Debug AI can scan it.
 * Use in API routes or server code: runtimeLogger.log("Error: ...")
 */
export const runtimeLogger = {
  async log(message: string): Promise<void> {
    try {
      await mkdir(dirname(DEBUG_CONFIG.logPath), { recursive: true })
      const line = `[${new Date().toISOString()}] ${message}\n`
      await appendFile(DEBUG_CONFIG.logPath, line, "utf-8")
    } catch {
      // ignore
    }
  },
}
