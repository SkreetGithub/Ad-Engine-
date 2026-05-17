/**
 * Netlify Scheduled Function: run the AI Business Engine every 6 hours.
 *
 * 1. Deploy this Next.js app to Netlify.
 * 2. In Netlify: Build settings — build command: npm run build, publish: .next
 *    (or use @netlify/plugin-nextjs so /api/* is available).
 * 3. In Netlify: Functions → ai-engine-scheduled → Schedule: 0 */6 * * * (every 6h).
 *
 * This function calls your own site's API so the engine runs inside Next.js.
 */

exports.handler = async function () {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3550"
  const url = `${base.replace(/\/$/, "")}/api/ai-engine/run`
  try {
    const res = await fetch(url, { method: "POST" })
    const data = await res.json()
    return {
      statusCode: res.status,
      body: JSON.stringify({ ok: data.ok, cycleId: data.cycleId, adsProcessed: data.adsProcessed, error: data.error }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err) }),
    }
  }
}
