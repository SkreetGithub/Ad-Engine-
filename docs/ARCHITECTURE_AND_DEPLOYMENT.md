# Autonomous AI Business Engine – Architecture & Deployment

## 1. System components

| Component | Location | Role |
|-----------|----------|------|
| **Reinforcement learning brain** | `lib/ai-business-engine/reinforcement-brain.ts` | Q-learning: decides action (scale / kill / mutate / duplicate / newCreative / newAudience) from state (CTR, ROAS, spend, style, audience). |
| **Neural profit prediction** | `lib/ai-business-engine/neural-profit-brain.ts` | Predicts profit from [ctr, roas, spend, pacing, r1, r2]. Linear model; trains on reward history. |
| **Creative AI engine** | `lib/ai-business-engine/creative-agent.ts` | Generates and mutates creatives (hooks, styles, pacing, CTA). |
| **Targeting AI engine** | `lib/ai-business-engine/targeting-agent.ts` | Picks audience (broad, lookalike, retarget, engaged, high-intent). |
| **Analytics engine** | `lib/ai-business-engine/analytics.ts` (simulated); `lib/analytics-store.ts` + optimize route (real Meta) | Per-ad metrics; sync from Meta Insights in optimize flow. |
| **Scaling engine** | `lib/ai-business-engine/run-cycle.ts` (scale action); `app/api/automation/optimize/route.ts` | RL “scale” multiplies budget; optimize pauses worst, creates new test. |
| **Autonomous orchestration loop** | `lib/ai-business-engine/run-cycle.ts` → `runOneCycle()` | Observe → Decide → Act → Measure → Store → Learn → Predict. Triggered by `POST /api/ai-engine/run`. |
| **Supabase database layer** | `lib/supabase.ts`, `lib/ai-business-engine/brain-db.ts` | brain_memory, creative_memory, profit_log, ai_swarm_state. Load/save swarm state; store memory and profit. |
| **Meta (Facebook + Instagram) Ads API** | `lib/meta-ad-api.ts` | Campaign, ad set, creative, ad creation. Budget-sharing compliance, retry, form body order. |
| **Netlify / Vercel** | `netlify/functions/ai-engine-scheduled.js`, cron | Scheduled trigger for `/api/ai-engine/run`. |

---

## 2. Meta Ads API compliance: `is_adset_budget_sharing_enabled`

- **Rule:** If you are **not** using campaign budget (CBO), you **must** send `is_adset_budget_sharing_enabled` as **True** or **False**.
- **Rule:** If you **are** using campaign budget, **omit** the field (Meta handles it).

**Implementation (single place):** `lib/meta-ad-api.ts`

- `determineBudgetSharing({ useCampaignBudget, isScaling }): "True" | "False" | null`
  - `useCampaignBudget === true` → **null** (caller omits field when building ad set body).
  - `useCampaignBudget === false` → **isScaling ? "True" : "False"** (micro-test → False, scaling → True).
- `buildAdSetFormBody(..., budgetSharing)`: when `budgetSharing !== null`, the field is set **first** in the form body (Meta requirement).
- `createAdSet(opts)`:
  - Accepts `useCampaignBudget?: boolean`, `isScaling?: boolean`.
  - When CBO: no ad set budget params, `budgetSharing = null`.
  - When ad set budget: `budgetSharing = determineBudgetSharing(...)` and sent first in body.

**Call sites:** All ad set creation goes through `createAdSet()` (quick-launch, campaign, rotate, boost). Default is micro-test (`isScaling` false) so `"False"` is sent when not using CBO.

---

## 3. Data persistence (Supabase)

- **brain_memory:** state, action, reward (RL history).
- **creative_memory:** hook, style, pacing, cta (creative evolution).
- **profit_log:** profit per step (ROI + neural training data).
- **ai_swarm_state:** persisted ads + dataset; loaded at start of cycle, saved after cycle.

**Wiring:**

- `BrainDB.storeMemory`, `storeCreative`, `storeProfit` called during `runOneCycle` when `persistToSupabase` is true.
- `BrainDB.loadSwarmState()` at start of cycle (if no in-memory ads).
- `BrainDB.saveSwarmState(ads, dataset)` after each cycle.
- Neural model is (re)trained on in-memory `memoryDataset` (and any loaded state) each cycle.

---

## 4. API keys and environment

All secrets via environment variables (no hardcoded keys):

- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (see `.env.example`).
- **Meta:** `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`.
- **OpenAI:** `OPENAI_API_KEY` (copy generation in quick-launch, rotate).
- **Replicate:** `REPLICATE_API_TOKEN`, `REPLICATE_VIDEO_VERSION` (optional).

Load only from `process.env` (e.g. in `getMetaConfig()`, `getSupabase()`).

---

## 5. Ad creation pipeline (validation)

End-to-end: **Campaign → Ad Set → Creative → Ad → Tracking → Learning → Scaling**

1. **Campaign:** `createCampaign()` (name, objective, status).
2. **Ad set:** `createAdSet()` with correct `is_adset_budget_sharing_enabled` (or omit when CBO).
3. **Creative:** `createCreative()` or `createCreativeFromPost()`.
4. **Ad:** `createAd()` (adset_id, creative_id, status).
5. **Tracking:** Meta Insights; sync via `POST /api/analytics/sync` or optimize route.
6. **Learning:** RL brain learns (state, action, reward); neural brain trains on dataset; BrainDB stores memory and profit.
7. **Scaling:** RL action “scale” or optimize route (pause worst, create new test via rotate).

---

## 6. Production safety (meta-ad-api)

- **Retry:** `fetchWithRetry()` for Meta POSTs (3 attempts, backoff; 429 uses Retry-After when present).
- **Rate limits:** Handled by retry and optional future rate-limit queue.
- **Error handling:** `formatMetaErrorResponse()` for user-facing Meta errors; token-expired message for auth.
- **Compliance:** Single place for budget-sharing logic; ad set body order enforced in `buildAdSetFormBody`.

---

## 7. Deployment readiness checklist

- [ ] **Supabase:** Project created; `supabase/schema.sql` run (brain_memory, creative_memory, profit_log, ai_swarm_state).
- [ ] **Env:** All required keys set in production env (Supabase, Meta, OpenAI if used); no secrets in repo.
- [ ] **Meta:** Token with ads_management; ad account and Page ID correct; budget-sharing behavior tested (micro-test and, if used, scaling).
- [ ] **AI engine:** `POST /api/ai-engine/run` returns 200 and persists to Supabase when keys are set.
- [ ] **Cron:** Scheduled job hits `POST /api/ai-engine/run` (e.g. every 6h) — Netlify Scheduled Function or Vercel Cron.
- [ ] **Monitoring:** Log or monitor `/api/ai-engine/run` and Meta 4xx/5xx responses; alert on repeated failures.
- [ ] **Budget caps:** Max total budget and lifetime caps used in quick-launch/rotate/optimize to avoid over-spend.

---

## 8. Final orchestration logic (one cycle)

1. **Load state:** If no in-memory ads and `persistToSupabase`, load from `ai_swarm_state`.
2. **Pre-train:** If loaded dataset exists, train neural brain on it.
3. **Default swarm:** If still no ads, create initial swarm (config.testAds).
4. **Loop:** For each active ad: analyze → predict profit → RL decide → apply action (kill/scale/mutate) → learn → store memory/profit/creative.
5. **Train:** Train neural brain on current dataset.
6. **Persist:** Save ads + dataset to `ai_swarm_state`.
7. **Response:** Return cycleId, adsProcessed, actions, neuralTrained.

All decision loops feed the RL brain; neural predictions and stored history drive learning and future decisions.
