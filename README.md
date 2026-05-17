# Ad Engine

Autonomous Meta ads dashboard — campaigns, analytics, AI optimization, and scheduled automation.

**Repository:** [github.com/SkreetGithub/Ad-Engine-](https://github.com/SkreetGithub/Ad-Engine-)

## Deploy on Vercel (live URL)

1. **Push this repo to GitHub** (see below).
2. Open [vercel.com/new](https://vercel.com/new) → **Import** `SkreetGithub/Ad-Engine-`.
3. Framework: **Next.js** (auto-detected). Root directory: `.` (repo root).
4. **Environment variables** (Project → Settings → Environment Variables). Copy from `.env.example`:
   - `OPENAI_API_KEY`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (optional, for AI brain persistence)
   - `NEXT_PUBLIC_APP_URL` = your production URL (e.g. `https://ad-engine-xxx.vercel.app`)
   - `CRON_SECRET` (optional, for securing automation cron routes)
5. **Deploy**. Vercel assigns a URL like `https://ad-engine-xxxx.vercel.app`. Add a custom domain under Project → Domains if needed.

Git pushes to `main` trigger automatic redeploys when the Vercel project is linked to GitHub.

### Cron jobs

`vercel.json` schedules `POST /api/ai-engine/run` every 6 hours. Requires a Vercel plan that supports Cron (Hobby: limited; Pro: full).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3550
```

## Connect GitHub

```bash
git init
git remote add origin https://github.com/SkreetGithub/Ad-Engine-.git
git add .
git commit -m "Initial Ad Engine release"
git branch -M main
git push -u origin main
```

Use SSH if you prefer: `git@github.com:SkreetGithub/Ad-Engine-.git`

## CLI deploy (without GitHub import)

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

Set the same environment variables in the Vercel dashboard before production deploy.
