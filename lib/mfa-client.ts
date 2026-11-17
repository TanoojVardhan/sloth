import { auth } from "@/lib/firebase"

type MfaReply = { ok: boolean; enabled?: boolean; secret?: string; error?: string }

export async function mfa(action: "status" | "setup" | "enable" | "verify" | "disable", code?: string): Promise<MfaReply> {
  const res = await fetch("/api/mfa", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
    body: JSON.stringify({ action, code }),
  })
  return { ...(await res.json().catch(() => ({}))), ok: res.ok }
}

// A correct code is remembered for this browser session only (closing the browser asks again).
const KEY = "sloth.mfa.ok"
export const mfaPassedFor = (uid: string) => {
  try {
    return sessionStorage.getItem(KEY) === uid
  } catch {
    return false
  }
}
export const rememberMfaPass = (uid: string) => {
  try {
    sessionStorage.setItem(KEY, uid)
  } catch {
    /* asks again next time */
  }
}
