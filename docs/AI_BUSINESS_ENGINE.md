# Full Autonomous AI Business Engine

Reinforcement Learning brain + Neural Profit Prediction + Creative Evolution + Supabase memory. One-cycle API for cron or manual runs.

## What it does

- **Reinforcement Learning Brain** – Chooses actions: `scale` | `kill` | `mutate` | `duplicate` | `newCreative` | `newAudience` from state (CTR, ROAS, spend, style, audience).
- **Neural Profit Brain** – Predicts profit from `[ctr, roas, spend, pacing, r1, r2]` (linear model; no TensorFlow required).
- **Creative Evolution** – Generates and mutates creatives (hooks, styles, pacing, CTA).
- **Supabase Brain Memory** – Stores every decision (`brain_memory`), creative (`creative_memory`), and profit step (`profit_log`).

Loop: **Observe → Decide → Act → Measure → Store → Learn → Predict → Improve.**

## Setup

1. **Supabase** – Create a project at [supabase.com](https://supabase.com). Run the SQL in `supabase/schema.sql` in the SQL Editor (creates `brain_memory`, `creative_memory`, `profit_log`, optional `ai_swarm_state`).
2. **Env** – In `.env.local` add:
   ```bash
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Install** – `pnpm install` (adds `@supabase/supabase-js`).

## Run one cycle

- **Manual:** `POST /api/ai-engine/run` or `GET /api/ai-engine/run` (e.g. from your app or Postman).
- **Cron (every 6h):** Call the same URL on a schedule.

Without Supabase the engine still runs (simulation-only); with Supabase it persists memory and profit.

## Netlify deployment

- **Option A – Next on Netlify:** Deploy this Next.js app to Netlify. Add a [Scheduled Function](https://docs.netlify.com/functions/trigger-on-events/#schedule-trigger) that calls your site:
  ```js
  // netlify/functions/ai-engine-scheduled.js
  exports.handler = async () => {
    const url = process.env.URL || "https://your-site.netlify.app"
    const res = await fetch(`${url}/api/ai-engine/run`, { method: "POST" })
    const data = await res.json()
    return { statusCode: res.status, body: JSON.stringify(data) }
  }
  ```
  In Netlify: set the function to run on a schedule (e.g. `0 */6 * * *` for every 6 hours).

- **Option B – Vercel:** Use [Vercel Cron](https://vercel.com/docs/cron-jobs) to hit `POST /api/ai-engine/run` on the same schedule.

## Code layout

| Path | Purpose |
|------|--------|
| `lib/ai-business-engine/` | RL brain, neural brain, creative/targeting agents, BrainDB, ad factory, analytics, `runOneCycle()` |
| `lib/supabase.ts` | Supabase client |
| `app/api/ai-engine/run/route.ts` | HTTP trigger for one cycle |
| `supabase/schema.sql` | Table definitions |

## Optional: TensorFlow.js

The engine uses a **linear** predictor so it runs with no extra deps. To use a real neural net (e.g. `@tensorflow/tfjs`), replace or extend `NeuralProfitBrain` in `lib/ai-business-engine/neural-profit-brain.ts` and train on the same `dataset` shape.

## Optional: Live Meta ads

Right now the swarm uses **simulated** ads and analytics. To wire real Meta campaigns:

- Use `createCampaign`, `createAdSet`, `createCreative`, `createAd` from `@/lib/meta-ad-api` inside `ad-factory` or a new “live” ad factory.
- Feed real metrics from your analytics store or Meta Insights into `analyzeAd()` (or a separate “live” analytics function) and keep the same RL/neural loop.
