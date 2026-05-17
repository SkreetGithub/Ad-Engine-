# Autonomous Debug AI — Self-Healing System

Scans runtime logs, infers root cause, generates patches, and logs failures to Supabase.

## Flow

1. **Scan** – Read `.data/debug/runtime.log` for lines containing Error, Exception, Unhandled, error, failed.
2. **Infer** – Map each line to a root cause: `META_API_BUDGET_FLAG`, `SUPABASE_ENV_MISSING`, `NETWORK_TIMEOUT`, `RATE_LIMIT`, or `UNKNOWN`.
3. **Fix** – Generate a patch snippet for that cause (e.g. `determineBudgetSharing`, env guard, timeout, rate limiter).
4. **Deploy** – Write patch to `.data/debug/patches/patch-{timestamp}-{id}.patch.js`.
5. **Log** – Insert into Supabase `debug_memory` (error, context, root_cause).

## Setup

1. **Supabase** – Run the `debug_memory` section of `supabase/schema.sql` (table + index).
2. **Cron** – Call `POST /api/debug/run` (or GET) every 30s–1m so the debug AI runs periodically.

## Writing to the log

From API routes or server code, append to the same log the debug AI scans:

```ts
import { runtimeLogger } from "@/lib/autonomous-debug"

await runtimeLogger.log("Error: is_adset_budget_sharing_enabled must be True or False")
```

Then the next debug cycle will detect it, infer `META_API_BUDGET_FLAG`, and deploy the budget-sharing patch.

## Paths

| Item        | Path |
|------------|------|
| Runtime log | `.data/debug/runtime.log` |
| Patches     | `.data/debug/patches/*.patch.js` |
| Supabase    | Table `debug_memory` |

## Root causes and patches

| Cause                  | Trigger (in log line)              | Patch content |
|------------------------|-------------------------------------|---------------|
| META_API_BUDGET_FLAG   | `is_adset_budget_sharing_enabled`   | `determineBudgetSharing` snippet |
| SUPABASE_ENV_MISSING   | `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Env guard throw |
| NETWORK_TIMEOUT        | `timeout`, `ETIMEDOUT`, `ECONNRESET` | Timeout constant + comment |
| RATE_LIMIT             | `429`, `rate limit`                | Rate limiter with backoff |
| UNKNOWN                | (other)                            | No patch |

Patches are **suggestions** only; apply or adapt them in your codebase as needed.
