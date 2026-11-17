import { FieldValue } from "firebase-admin/firestore"
import { getAiConfig } from "./ai-config"
import { adminDb } from "./firebase-admin"

const envList = (name: string) => (process.env[name] ?? "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean)

/** Messages per person per day: the admin page's value, else AI_DAILY_LIMIT, else 30. */
export async function dailyLimit(): Promise<number> {
  return (await getAiConfig()).dailyLimit ?? (Number(process.env.AI_DAILY_LIMIT) || 30)
}

/** No daily limit: emails added on the admin page or in AI_UNLIMITED_EMAILS. The email must be verified. */
export async function isUnlimited(email?: string, verified?: boolean): Promise<boolean> {
  if (!email || !verified) return false
  const who = email.toLowerCase()
  return envList("AI_UNLIMITED_EMAILS").includes(who) || (await getAiConfig()).unlimited.includes(who)
}

// The day rolls over at midnight India time (UTC+5:30).
export const dayKey = (daysAgo = 0) => new Date(Date.now() + 5.5 * 3600_000 - daysAgo * 86_400_000).toISOString().slice(0, 10)
const docFor = (uid: string) => adminDb.collection("aiUsage").doc(`${uid}_${dayKey()}`)

/**
 * Counts one AI message. `ok` is false once the day's limit is used up.
 * ponytail: if Firestore itself fails we let the message through rather than break the assistant.
 */
export async function takeQuota(uid: string, unlimited: boolean, limit: number): Promise<{ ok: boolean; used: number }> {
  try {
    const ref = docFor(uid)
    const day = dayKey()
    if (unlimited) {
      await ref.set({ used: FieldValue.increment(1), uid, day }, { merge: true })
      return { ok: true, used: 0 }
    }
    return await adminDb.runTransaction(async (tx) => {
      const used = ((await tx.get(ref)).data()?.used as number | undefined) ?? 0
      if (used >= limit) return { ok: false, used }
      tx.set(ref, { used: used + 1, uid, day }, { merge: true })
      return { ok: true, used: used + 1 }
    })
  } catch (e) {
    console.error("AI quota check failed", e)
    return { ok: true, used: 0 }
  }
}

export async function usedToday(uid: string): Promise<number> {
  try {
    return ((await docFor(uid).get()).data()?.used as number | undefined) ?? 0
  } catch {
    return 0
  }
}
