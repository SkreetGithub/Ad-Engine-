# Ad Engine – Roadmap: Full Automation & Best Bang for Your Buck

**→ Final vision:** See **[AUTONOMOUS_GROWTH_AI.md](./AUTONOMOUS_GROWTH_AI.md)** for the Full Autonomous Business Growth AI (final form): self-learning system, architecture (Dashboard → Automation → AI Engine → Meta → Buyers → Analytics → loop), and phased path from here to full autonomy.

You’re in the **build phase**: get the system fully automated and autonomous before worrying about domain/Netlify. This roadmap gets you to “AI creates, tests, and optimizes ads with minimal manual work” and keeps spend efficient.

---

## North star

- **Organic first** → post to your Page, see what gets engagement → **boost the winners** (turn them into paid ads).
- **Test many, keep few** → create different ad types and copy, run tests, **pause losers** and **scale winners** automatically or with one click.
- **Video when it pays off** → generate or upload video, use it in ads when the system or you decide it’s worth the cost.
- **Fully automated** → schedules and rules handle: post organic, create tests, pause/start, and (later) boost top posts.
- **Best bang for your bucket** → cap daily spend, prefer cheap tests (e.g. static/organic), only boost or scale what’s working.

---

## Phase 1 – What you have now (foundation)

- [x] Create campaigns from the app (name, copy, budget, link).
- [x] AI Generate Copy (OpenAI).
- [x] Testing automation: **Run rotation** (pause one active, create new with AI copy).
- [x] Live campaign list from Meta with **Pause / Activate**.
- [x] Post to Facebook Page (organic) via `POST /api/facebook/post`.

**Gap:** Rotation doesn’t yet “post organic first” or “boost” those posts; no video; no automatic “pause losers / scale winners” by performance.

---

## Phase 2 – Organic first, then boost (best bang for bucket)

**Idea:** Post organically to your Page → see what gets likes/comments/shares → turn the best into paid ads (boost). You only spend on content that already proved it works.

1. **Organic post from the app**  
   - Already have: `POST /api/facebook/post` (message + link).  
   - Add (optional): schedule or “suggest next organic post” using AI (same copy API).

2. **Boost an existing post**  
   - New: “Boost this post” in the app.  
   - Input: Post ID from your Page (from Meta or from our post API response).  
   - Backend: create a campaign/ad set/ad that uses that **existing post** as the creative (no new creative cost; Meta reuses the organic post).

3. **Flow in the app**  
   - “Create organic post” → copy the post ID (or show it if we store it).  
   - “Boost post” → paste post ID (or pick from recent posts) → set budget → create ad.  
   - You only pay to boost posts that already got organic feedback.

**Result:** You try ideas for free (organic), then put money only behind winners = best bang for bucket.

---

## Phase 3 – Smarter testing (different ad types, pause losers)

1. **Different ad types in rotation**  
   - Rotation currently creates one “link” ad type.  
   - Extend: rotate by **format** (e.g. link, image, video) and **strategy** (Flash Sale, Social Proof, etc.) so tests are spread across types.

2. **Pause by rule (e.g. budget or time)**  
   - Optional: “Pause campaigns that have spent $X” or “Pause after N days” so tests don’t run forever.  
   - Rotation already “pauses one”; add a rule like “pause if spent > $10” for true autonomy.

3. **List and sort by performance (later)**  
   - Meta API can return spend, impressions, clicks for campaigns.  
   - Show “cost per result” or “ROAS” in the app and **auto-pause** (or flag) the worst, **suggest boosting** the best (e.g. best organic post or best-performing ad).

**Result:** System tries different types of ads and automatically stops underperformers = better testing, less waste.

---

## Phase 4 – Video (when it’s worth it)

1. **Generate video with Replicate**  
   - You have `REPLICATE_API_TOKEN`.  
   - Use a model (e.g. image-to-video or text-to-video) to create short clips.  
   - Output: video URL.

2. **Use video in an ad**  
   - Meta accepts video URL for video ads.  
   - New flow: “Create video ad” → generate video (Replicate) → create campaign with that video as creative.  
   - Optional: only do this for “scale” phase (e.g. after an idea already won with static/organic) so you’re not burning budget on unproven video.

**Result:** Video is in the system when you’re ready; you can keep it manual (“create video ad” button) or later automate “if static ad wins, create video version and test.”

---

## Phase 5 – Full autonomy (schedules + rules)

1. **Scheduled runs (no domain required at first)**  
   - Run automation from your machine or a free scheduler:  
     - **Local:** cron or Task Scheduler: `curl -X POST http://localhost:3550/api/automation/rotate` (when app is running).  
     - **Later on Netlify:** Netlify doesn’t have built-in cron; use [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/) (if available on your plan) or an external cron (e.g. cron-job.org) that calls `POST https://your-app.netlify.app/api/automation/rotate` once the app is deployed.

2. **Rules engine (later)**  
   - “Every Monday: post one organic, create one test campaign.”  
   - “If campaign spent $5 and CPC > $2: pause it.”  
   - “If organic post has > X reactions: suggest boost.”  
   - Start with simple rules in code; later a small “rules” config or UI.

**Result:** The system runs on a schedule and follows rules so you don’t have to click “Run rotation” every time.

---

## Phase 6 – Domain + Netlify (when you’re ready)

- Connect your domain to Netlify.  
- Set env vars in Netlify (same as `.env.local`).  
- Use scheduled functions or external cron to hit `/api/automation/rotate` (and future endpoints).  
- No change to the automation logic; only where the app is hosted and how the scheduler calls it.

---

## Priority order for “best bang for bucket” + full automation

1. **Organic → boost** (Phase 2) – so you only spend on content that already got feedback.  
2. **Smarter rotation** (Phase 3) – different ad types + pause-by-spend or time so tests don’t burn budget.  
3. **Scheduled runs** (Phase 5) – so rotation and posts run without you (local cron now; Netlify/external cron later).  
4. **Video** (Phase 4) – once you’re happy with static/organic tests and want to scale with video.

---

## Summary

- You’re **not** in the “domain + go live” phase yet; you’re in the **“make the system fully automated and autonomous”** phase.  
- **Best bang for bucket:** organic first → boost winners; test many formats → pause losers; add video when it’s worth the cost.  
- Next concrete steps: add **“Boost existing post”** and (optional) **“Create video ad”** hook; then add **pause-by-spend** and **scheduled rotation** so the system runs without you.

---

## What’s in the app now (for this roadmap)

- **Organic → Boost**
  - **Post organic:** `POST /api/facebook/post` with `{ "message", "link" }` → response includes `post_id`.
  - **Boost that post:** In **Campaigns** → **Testing automation** → **Organic → Boost**: paste the post ID, set $/day, click **Create boost campaign**. Or call `POST /api/facebook/boost` with `{ "postId": "<from above>", "dailyBudget": 5 }`. Campaign is created in PAUSED state; turn it on in Ads Manager. Best bang: only spend on posts that already got organic feedback.
- **Video (Phase 4 hook)**
  - `POST /api/video/generate` with `{ "prompt": "..." }` starts a Replicate video job. Add `REPLICATE_VIDEO_VERSION` to `.env.local` (model version hash from replicate.com). Poll the returned `urls.get` for the video URL when done; use that URL later in a “Create video ad” flow when you add it.
- **Netlify**
  - When you’re ready to host: deploy to Netlify, set env vars there. To run rotation on a schedule without built-in cron, use an external cron (e.g. cron-job.org) to call `POST https://your-app.netlify.app/api/automation/rotate` daily or weekly.
