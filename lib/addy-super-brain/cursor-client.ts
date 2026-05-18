/**
 * Cursor Cloud Agents API — https://cursor.com/docs/cloud-agent/api/endpoints
 * Auth: Basic with API key as username (empty password). NOT api.cursor.sh chat completions.
 */

const CURSOR_API = "https://api.cursor.com"

function basicAuth(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`
}

export interface CursorAgentResult {
  ok: boolean
  answer: string
  agentUrl?: string
  error?: string
  model: "cursor-cloud-agent"
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function parseSseAssistantEvents(chunk: string): string[] {
  const texts: string[] = []
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) continue
    try {
      const data = JSON.parse(line.slice(6)) as { text?: string }
      if (data.text) texts.push(data.text)
    } catch {
      // ignore non-json lines
    }
  }
  return texts
}

export async function askCursorCloudAgent(opts: {
  question: string
  codebaseSummary: string
  repoUrl?: string
  timeoutMs?: number
}): Promise<CursorAgentResult> {
  const apiKey = process.env.CURSOR_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      answer: "",
      error: "CURSOR_API_KEY not set on server",
      model: "cursor-cloud-agent",
    }
  }

  const repo =
    process.env.CURSOR_GITHUB_REPO_URL || "https://github.com/SkreetGithub/Ad-Engine-"
  const timeoutMs = opts.timeoutMs ?? 90_000

  const fullPrompt = `You are Addy's super-brain helping Demetrius (owner) improve profit for his ad engine.

Answer in plain English with specific file paths and code/SQL when relevant. Max 400 words.

Codebase context (deployed Ad Engine):
${opts.codebaseSummary.slice(0, 12000)}

Question from Demetrius:
${opts.question}`

  try {
    const createRes = await fetch(`${CURSOR_API}/v1/agents`, {
      method: "POST",
      headers: {
        Authorization: basicAuth(apiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: { text: fullPrompt },
        repos: [{ url: repo, startingRef: "main" }],
        autoCreatePR: false,
      }),
      signal: AbortSignal.timeout(25_000),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      return {
        ok: false,
        answer: "",
        error: `Cursor agent create failed (${createRes.status}): ${errText.slice(0, 200)}`,
        model: "cursor-cloud-agent",
      }
    }

    const created = (await createRes.json()) as {
      agent?: { id: string; url?: string; latestRunId?: string }
      run?: { id: string }
    }

    const agentId = created.agent?.id
    const runId = created.run?.id ?? created.agent?.latestRunId
    if (!agentId || !runId) {
      return { ok: false, answer: "", error: "Cursor returned no agent/run id", model: "cursor-cloud-agent" }
    }

    const started = Date.now()
    let assistantText = ""

    while (Date.now() - started < timeoutMs) {
      const streamRes = await fetch(
        `${CURSOR_API}/v1/agents/${agentId}/runs/${runId}/stream`,
        {
          headers: {
            Authorization: basicAuth(apiKey),
            Accept: "text/event-stream",
          },
          signal: AbortSignal.timeout(20_000),
        }
      )

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          assistantText += parseSseAssistantEvents(buffer).join("")
          if (buffer.includes("event: done")) break
        }
      }

      const runRes = await fetch(`${CURSOR_API}/v1/agents/${agentId}/runs/${runId}`, {
        headers: { Authorization: basicAuth(apiKey) },
        signal: AbortSignal.timeout(10_000),
      })

      if (runRes.ok) {
        const run = (await runRes.json()) as { status?: string }
        if (run.status === "FINISHED" || run.status === "FAILED" || run.status === "CANCELLED") {
          break
        }
      }

      await sleep(2500)
    }

    if (!assistantText.trim()) {
      return {
        ok: false,
        answer: "",
        agentUrl: created.agent?.url,
        error:
          "Cursor agent is still working. Open the agent URL to see full analysis, or ask a shorter question.",
        model: "cursor-cloud-agent",
      }
    }

    return {
      ok: true,
      answer: assistantText.trim(),
      agentUrl: created.agent?.url,
      model: "cursor-cloud-agent",
    }
  } catch (e) {
    return {
      ok: false,
      answer: "",
      error: e instanceof Error ? e.message : "Cursor API error",
      model: "cursor-cloud-agent",
    }
  }
}

export async function verifyCursorApiKey(): Promise<boolean> {
  const apiKey = process.env.CURSOR_API_KEY
  if (!apiKey) return false
  try {
    const res = await fetch(`${CURSOR_API}/v1/me`, {
      headers: { Authorization: basicAuth(apiKey) },
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}
