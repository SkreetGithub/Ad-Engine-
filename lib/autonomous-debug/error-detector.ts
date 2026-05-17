import { readFile, access } from "fs/promises"
import { DEBUG_CONFIG } from "./config"

export class ErrorDetector {
  async scanLogs(): Promise<string[]> {
    try {
      await access(DEBUG_CONFIG.logPath)
    } catch {
      return []
    }
    const content = await readFile(DEBUG_CONFIG.logPath, "utf-8")
    const lines = content.split("\n")
    return lines.filter(
      (line) =>
        line.includes("Error") ||
        line.includes("Exception") ||
        line.includes("Unhandled") ||
        line.includes("error") ||
        line.includes("failed")
    )
  }
}
