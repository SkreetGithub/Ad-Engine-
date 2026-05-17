# Ad Engine – Setup & Next Steps

## ✅ Done (you have these)

- **API keys** in `.env.local`: OpenAI, Replicate, Meta (ads + Page)
- **Ad account ID** and **Page ID** set for Meta
- **API Keys page** reads from `.env.local` and shows masked keys
- **Facebook post API**: `POST /api/facebook/post` – post to your Page (body: `{ "message": "...", "link": "..." }`)
- **Campaign creation**: Campaigns → **New Campaign** → fill name, copy, budget, URL → **Launch Campaign** creates a real Meta traffic campaign (created in **PAUSED** state; turn it on in Ads Manager)
- **Testing automation**: Campaigns → **Testing automation** panel → **Run rotation** pauses one active campaign and creates a new one with AI-generated copy (for testing different creatives). Live list shows campaigns from Meta with **Pause** / **Activate** buttons.
- **Phase B — Analytics**: **Analytics** page (sidebar) shows campaign performance (spend, impressions, clicks) for the last 7 days. Click **Sync from Meta** to pull data from the Meta Insights API into the local store (`.data/analytics.json`). This data will feed the AI Decision Engine in Phase C.

---

## Next steps to keep the site fully operational

### 1. Run the site and test

- Start: `npm run dev` (or your usual command); open http://localhost:3550
- **API Keys**: Open **API Keys** and confirm OpenAI, Replicate, Meta show as configured
- **Campaign**: Go to **Campaigns** → **New Campaign** → enter name, copy, daily budget, destination URL → **Launch Campaign**. Check [Ads Manager](https://business.facebook.com/adsmanager) for the new campaign (it will be **Paused**; switch it to **Active** when ready)
- **Facebook post** (optional): Call `POST /api/facebook/post` with `{ "message": "Your text", "link": "https://www.uniquepickups.com" }` (e.g. from Postman or a small script) to post to your Page

### 2. Optional improvements

- **Campaign list**: Right now the list on **Campaigns** is sample data. To show real campaigns, add an API that calls Meta’s Marketing API to list campaigns for your ad account and wire the Campaign List to that API.
- **AI Generate Copy**: Wire the **AI Generate Copy** button in the campaign creator to an API that uses `OPENAI_API_KEY` to generate ad copy from the campaign name/strategy.
- **Meta token expiry**: Your Meta token will expire. For a permanent setup, use a **System User** token from [Business Settings → System Users](https://business.facebook.com/settings) and put it in `META_ACCESS_TOKEN`.

### 3. Production / deploy

- Keep **all secrets** in env vars (e.g. Vercel/Netlify env), never commit `.env.local`
- If you deploy, set `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID` in the host’s environment

---

## Quick reference

| What              | Where / how |
|-------------------|-------------|
| View/edit API keys | **API Keys** page (from `.env.local`) |
| Create Meta campaign | **Campaigns** → **New Campaign** → Launch Campaign |
| Post to Facebook Page | `POST /api/facebook/post` with `message` and optional `link` |
| Manage/activate ads | [Meta Ads Manager](https://business.facebook.com/adsmanager) |
| Run testing rotation | **Campaigns** → **Run rotation (pause one, start new)** |
| Schedule rotation (cron) | Call `POST /api/automation/rotate` on a schedule (e.g. daily); see below |

---

## Automating the testing rotation (schedule)

To run “pause one, start new” on a schedule instead of clicking the button:

1. **Deploy the app** (e.g. Vercel) so it has a public URL.
2. **Cron or scheduler**: Use a cron job or service (e.g. [cron-job.org](https://cron-job.org), Vercel Cron, or GitHub Actions) to send a **POST** request to:
   - `https://your-domain.com/api/automation/rotate`
   - No body required. Use a secret header or query param if you want to protect the endpoint from random calls.
3. **Frequency**: e.g. once per day or every few days, so a new test campaign is created and one active one is paused.

New campaigns from rotation are created in **PAUSED** state. You can turn them on in Ads Manager when you want them to run, or add logic later to auto-activate the newest campaign.
