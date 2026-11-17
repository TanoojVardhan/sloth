let turn = 0

/**
 * GEMINI_API_KEYS (comma-separated) or, failing that, the single GEMINI_API_KEY.
 * The starting key rotates per call to spread load; callers move on to the next key when one is out of quota.
 * ponytail: the rotation counter is per server instance, which is fine for spreading free-tier quota.
 */
export function geminiKeys(): string[] {
  const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
  if (keys.length < 2) return keys
  const start = turn++ % keys.length
  return [...keys.slice(start), ...keys.slice(0, start)]
}
