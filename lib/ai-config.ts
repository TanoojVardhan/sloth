import { adminDb } from "./firebase-admin"

/** Settings the admin page edits, kept in Firestore (appConfig/ai, readable only by the server). */
export type AiConfig = { dailyLimit: number | null; unlimited: string[]; blocked: string[] }

let memo: { at: number; value: AiConfig } | null = null

const emails = (v: unknown): string[] => (Array.isArray(v) ? v.map((e) => String(e).toLowerCase()) : [])

/** Read at most once a minute per server instance; pass fresh=true right after a write. */
export async function getAiConfig(fresh = false): Promise<AiConfig> {
  if (!fresh && memo && Date.now() - memo.at < 60_000) return memo.value
  let value: AiConfig = { dailyLimit: null, unlimited: [], blocked: [] }
  try {
    const d = (await adminDb.collection("appConfig").doc("ai").get()).data()
    value = { dailyLimit: typeof d?.dailyLimit === "number" ? d.dailyLimit : null, unlimited: emails(d?.unlimited), blocked: emails(d?.blocked) }
  } catch (e) {
    console.error("Couldn't read AI config", e)
    if (memo) return memo.value
  }
  memo = { at: Date.now(), value }
  return value
}

export const forgetAiConfig = () => {
  memo = null
}
