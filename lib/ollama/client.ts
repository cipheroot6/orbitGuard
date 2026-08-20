const BASE_URL = process.env.OLLAMA_BASE_URL ?? "https://ollama.com"
const MODEL = "gemma3:27b"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function chatCompletion(
  messages: Message[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: {
        num_predict: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.3,
      }
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Ollama Cloud error ${res.status}: ${error}`)
  }

  const data = await res.json()
  return data.message?.content ?? ""
}
