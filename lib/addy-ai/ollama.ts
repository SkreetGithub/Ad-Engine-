export async function getOllamaResponse(
  message: string,
  contextPrompt: string,
  ollamaUrl: string,
  model: string
): Promise<string> {
  const res = await fetch(ollamaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: `You are Addy, a profit-focused social media ad manager. Be concise and actionable.\n\nContext:\n${contextPrompt}\n\nUser: ${message}\n\nAddy:`,
      stream: false,
    }),
  })
  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}. Is Ollama running at ${ollamaUrl}?`)
  }
  const data = (await res.json()) as { response?: string }
  return data.response?.trim() || "No response from Ollama."
}
