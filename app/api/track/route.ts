import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { dayKey } from "@/lib/ai-quota"
import { adminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

/**
 * POST { path, vid }: one page view, for the admin page's traffic numbers. No sign-in needed, so it works on
 * public pages. Stores only the day, the first part of the path and a random per-browser id: no IP, no
 * account, no page contents.
 * ponytail: public and unmetered. If someone floods it, add a rate limit (or move to a sharded counter).
 */
export async function POST(req: Request) {
  const { path, vid } = (await req.json().catch(() => ({}))) as { path?: string; vid?: string }
  if (typeof path !== "string" || path.length > 200 || typeof vid !== "string" || !/^[a-z0-9]{16,40}$/.test(vid)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const day = dayKey()
  const section = path.split("?")[0].split("/")[1]?.replace(/[^a-z0-9-]/gi, "").slice(0, 30) || "home" // /projects/abc -> projects
  try {
    await adminDb.collection("traffic").doc(day).set({ day, views: FieldValue.increment(1), paths: { [section]: FieldValue.increment(1) } }, { merge: true })
    // One small doc per browser per day, so unique visitors can be counted.
    await adminDb.collection("trafficVisitors").doc(`${day}_${vid}`).create({ day }).catch(() => undefined)
  } catch (e) {
    console.error("track failed", e)
  }
  return NextResponse.json({ ok: true })
}
