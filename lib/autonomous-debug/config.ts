import { join } from "path"

const DATA_DIR = join(process.cwd(), ".data", "debug")

export const DEBUG_CONFIG = {
  logPath: join(DATA_DIR, "runtime.log"),
  patchDir: join(DATA_DIR, "patches"),
  retryLimit: 3,
  scanIntervalMs: 1000 * 30,
} as const
