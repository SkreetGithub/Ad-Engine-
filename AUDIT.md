# Ad Engine — What’s Hooked Up & What to Tweak

Use this as a checklist so the AI does the heavy lifting, you stay on budget, and the engine works for any campaign type (Unique Pickups, app installs, leads, etc.).

---

## Simple flow (beginner-friendly)

- **Quick Launch** (top of Campaigns): Choose goal (website / leads / app), daily budget (e.g. $8), and URL. Click **Launch campaign**. AI writes the ad and creates the campaign in **PAUSED** state. You turn it on in Ads Manager when ready — no spend until you approve.
- **New campaign (advanced)**: For custom name, strategy, and copy. Optional.
- **Run rotation**: Pause one campaign and create a new one with AI copy (for testing). New campaigns stay paused.
- **Boost**: Paste a post ID to turn an organic post into a paid ad (best bang for bucket).

---

## What’s already wired

| Piece | Status | Notes |
|-------|--------|--------|
| **Quick Launch** | ✅ | Goal + budget + URL → AI copy → Meta campaign (PAUSED). |
| **Create campaign (advanced)** | ✅ | Name, copy, budget, URL → Meta. AI Generate Copy button. |
| **Run rotation** | ✅ | Pause one active, create new with AI copy. |
| **Pause / Activate** | ✅ | Per campaign from live list. |
| **Boost post** | ✅ | Post ID + $/day → boost campaign (PAUSED). |
| **Organic post** | ✅ | `POST /api/facebook/post` (message + link). |
| **Analytics sync** | ✅ | Sync from Meta → last 7 days by campaign. |
| **API Keys page** | ✅ | Reads from `.env.local` (OpenAI, Replicate, Meta). |

---

## What to hook up or tweak

### 1. Stay on budget ($8 total, max profit)

- **Today:** Quick Launch uses “daily budget” (e.g. $8/day). So $8 = one day at $8, not “$8 total over time.”
- **To get “$8 total”:** Either:
  - Set daily budget to $8 and run for 1 day, then pause; or
  - Set daily budget to $1–2 and pause after a few days when you’ve spent ~$8.
- **Phase C (AI engine):** Add a rule like “pause when total spend &gt; $8” so the system auto-stops. That needs analytics data (Phase B is in place) and a small automation step.

### 2. Videos

- **Replicate:** `REPLICATE_VIDEO_VERSION` in `.env.local` (model version from replicate.com). Then `POST /api/video/generate` with `{ "prompt": "..." }` starts a video job; you get a URL when it’s done.
- **In the UI:** No “create video ad” button yet. You can add a flow: “Create video” → generate with Replicate → use that URL in a new campaign (Meta accepts video URL for video ads). For now, Quick Launch and advanced creator use **link + text** only (no video).

### 3. Hybrid: different goals (traffic, leads, app)

- **Quick Launch:** Goals change the **AI copy** and **campaign name** only. All campaigns are **traffic** (OUTCOME_TRAFFIC) to your URL. So “Leads” and “App” still send people to the URL you enter (e.g. signup page or app download page).
- **True “Leads” (Meta lead form):** Would need a Meta Lead Ad form and OUTCOME_LEADS. Not in the app yet. For now, send traffic to a landing page that captures leads.
- **True “App installs”:** Would need app ID in Meta and OUTCOME_ENGAGEMENT / app install objective. Not in the app yet. For now, send traffic to the app’s download or web page.

So the engine is **hybrid** for **traffic to any URL** (website, signup page, app page). To add native leads or app installs later, you’d add objective + params in the campaign API.

### 4. Maximize clicks/leads for Unique Pickups

- Use **Quick Launch** with goal “Send people to my website” or “Get leads / signups”, URL = `https://www.uniquepickups.com` (or a signup/booking page).
- Set daily budget to what you’re OK with (e.g. $8). Launch → turn on in Ads Manager.
- Use **Run rotation** to test different AI-generated copy; pause losers, keep winners.
- Use **Organic → Boost** for posts that already get engagement (best bang for bucket).

### 5. Other businesses (different URLs)

- Same flow: **Quick Launch** → pick goal (traffic/leads/app), set **Where should people go?** to that business’s URL (e.g. app store or their website). AI will write generic “visit / sign up / get the app” style copy; you can add “Advanced” later to prefill a business name for even better copy.

### 6. Token and keys

- **Meta:** Token expires. For “set and forget,” use a **System User** token (Business Settings → System Users) and put it in `META_ACCESS_TOKEN`.
- **OpenAI:** Used for all AI copy (Quick Launch + advanced + rotation). Keep `OPENAI_API_KEY` in `.env.local`.
- **Replicate:** Only needed for video. Set `REPLICATE_VIDEO_VERSION` when you’re ready to generate videos.

### 7. Analytics and Phase C

- **Phase B:** Analytics page + sync from Meta work. Sync regularly so you have spend/impressions/clicks.
- **Phase C:** Next step is the AI Decision Engine: read analytics, auto-pause bad performers, auto-scale good ones, maybe “pause when total spend &gt; $8.” That will make the engine truly “stay on budget” and “not waste money.”

### 8. Netlify / production

- Env vars: set `OPENAI_API_KEY`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID` (and optionally `REPLICATE_API_TOKEN`, `REPLICATE_VIDEO_VERSION`) in Netlify.
- Analytics store: `.data/analytics.json` doesn’t persist on serverless. For production, switch to a DB (e.g. Supabase) or accept “sync on each visit” and no history.

---

## Summary

- **One-click launch:** Use **Quick Launch** (goal + budget + URL) → **Launch campaign**. AI writes the ad; campaign is created PAUSED so you don’t spend until you turn it on.
- **Stay on budget:** Use a daily budget you’re comfortable with (e.g. $8/day for one day, or $1–2/day and pause after a few days). Phase C will add “pause when spend &gt; X.”
- **Max clicks/leads for Unique Pickups:** Same Quick Launch; use Run rotation to test copy; use Boost for organic winners.
- **Hybrid:** Works for any URL (website, signup page, app page). True Meta “Leads” and “App installs” can be added later by extending the campaign API.

If you tell me your next priority (e.g. “$8 total cap,” “video in Quick Launch,” or “Phase C auto-pause”), we can wire that next.
