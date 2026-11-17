import { NextResponse } from "next/server"
import { adminDb, requireUid } from "@/lib/firebase-admin"
import { checkTotp, newSecret } from "@/lib/totp"

export const runtime = "nodejs"

/**
 * Authenticator-app (TOTP) second step. The secret lives in userMfa/{uid}, a collection no
 * client can read (see firestore.rules), so the browser only ever sees it once, at setup.
 *
 * POST { action: "status" | "setup" | "enable" | "verify" | "disable", code? }
 */
export async function POST(req: Request) {
  let uid: string
  try {
    uid = await requireUid(req)
  } catch (res) {
    return res as Response
  }

  const { action, code } = (await req.json().catch(() => ({}))) as { action?: string; code?: string }
  const ref = adminDb.collection("userMfa").doc(uid)
  const doc = ((await ref.get()).data() ?? {}) as {
    secret?: string
    enabled?: boolean
    lastStep?: number
    fails?: number
    lockUntil?: number
  }

  if (action === "status") return NextResponse.json({ enabled: !!doc.enabled })

  if (action === "setup") {
    if (doc.enabled) return NextResponse.json({ error: "Already on." }, { status: 409 })
    const secret = newSecret()
    await ref.set({ secret, enabled: false, lastStep: 0, fails: 0, lockUntil: 0 })
    return NextResponse.json({ secret })
  }

  const wanted = action === "enable" ? !doc.enabled : action === "verify" || action === "disable" ? doc.enabled : null
  if (wanted === null) return NextResponse.json({ error: "Unknown action." }, { status: 400 })
  if (!wanted || !doc.secret || typeof code !== "string") return NextResponse.json({ error: "Not available." }, { status: 400 })

  if ((doc.lockUntil ?? 0) > Date.now()) {
    return NextResponse.json({ error: "Too many wrong codes. Wait a minute and try again." }, { status: 429 })
  }

  const step = checkTotp(doc.secret, code, doc.lastStep ?? 0)
  if (step === null) {
    const fails = (doc.fails ?? 0) + 1
    // Five wrong codes in a row lock it for a minute (a 6-digit code is only 1 in a million per guess).
    await ref.update(fails >= 5 ? { fails: 0, lockUntil: Date.now() + 60_000 } : { fails })
    return NextResponse.json({ error: "That code isn't right." }, { status: 401 })
  }

  if (action === "disable") await ref.delete()
  else await ref.update({ lastStep: step, fails: 0, ...(action === "enable" ? { enabled: true } : {}) })
  return NextResponse.json({ ok: true })
}
