/**
 * The Gemini models this API key can use for text, asked from Google rather than
 * hard-coded, so a retired model drops out and a new one shows up without a deploy.
 * Callers still fall through to the next model when one fails: the list includes
 * models that are listed but closed to this key or out of free quota.
 */

// Listed under generateContent but not for plain text in, JSON text out.
const NOT_TEXT = /image|tts|audio|embedding|transcribe|live|robotics|computer-use|omni|banana|customtools/

export function textModels(listed: { name?: string; supportedGenerationMethods?: string[] }[]): string[] {
  return listed
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => (m.name ?? "").replace(/^models\//, ""))
    .filter((id) => id.startsWith("gemini-") && !NOT_TEXT.test(id))
}

/** `first` (the configured model, if any), then the preferred ones that exist, then every other available model, newest name first. */
export function orderChain(available: string[], preferred: string[], first?: string | null): string[] {
  const rest = available.filter((m) => !preferred.includes(m)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  const chain = [...preferred.filter((m) => available.includes(m)), ...rest]
  return first ? [first, ...chain.filter((m) => m !== first)] : chain
}

let cache: { at: number; models: string[] } | null = null
const HOUR = 60 * 60 * 1000

export async function availableModels(apiKey: string): Promise<string[]> {
  if (cache && Date.now() - cache.at < HOUR) return cache.models
  try {
    const listed: { name?: string; supportedGenerationMethods?: string[] }[] = []
    let pageToken = ""
    do {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
        { headers: { "x-goog-api-key": apiKey } },
      )
      if (!res.ok) throw new Error(`model list ${res.status}`)
      const data = (await res.json()) as { models?: typeof listed; nextPageToken?: string }
      listed.push(...(data.models ?? []))
      pageToken = data.nextPageToken ?? ""
    } while (pageToken)
    const models = textModels(listed)
    if (models.length) cache = { at: Date.now(), models }
    return models
  } catch (e) {
    console.error("Couldn't list Gemini models", e)
    return cache?.models ?? []
  }
}

/**
 * The order to try models in: GEMINI_MODEL if set, the preferred ones that exist,
 * then the rest. If the list can't be fetched, the preferred names are used as they are.
 */
export async function modelChain(apiKey: string, preferred: string[]): Promise<string[]> {
  const available = await availableModels(apiKey)
  return available.length ? orderChain(available, preferred, process.env.GEMINI_MODEL) : preferred
}
