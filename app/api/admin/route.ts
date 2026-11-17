import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminEmails, requireAdmin } from "@/lib/admin"
import { forgetAiConfig, getAiConfig } from "@/lib/ai-config"
import { dailyLimit, dayKey } from "@/lib/ai-quota"
import { adminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST { action } for the admin page. Only emails in ADMIN_EMAILS (verified) get in.
 *   overview | setLimit {value} | addUnlimited / removeUnlimited {email} | block / unblock {email}
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req)
  } catch (res) {
    return res as Response
  }
  try {
    return await handle(req)
  } catch (e) {
    console.error("admin route failed", e)
    // Only a verified admin gets here, so it is safe to say what went wrong.
    return NextResponse.json({ error: `Server error: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }
}

async function handle(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; value?: number | null; email?: string }
  if (body.action === "me") return NextResponse.json({ admin: true }) // the sidebar uses this to decide whether to show the link
  const config = adminDb.collection("appConfig").doc("ai")

  if (body.action === "setLimit") {
    const v = body.value
    if (v !== null && v !== undefined && (!Number.isInteger(v) || v < 0 || v > 100000)) {
      return NextResponse.json({ error: "Enter a whole number from 0 to 100000, or leave it empty for the default." }, { status: 400 })
    }
    await config.set({ dailyLimit: v ?? FieldValue.delete() }, { merge: true })
  } else if (["addUnlimited", "removeUnlimited", "block", "unblock"].includes(body.action ?? "")) {
    const email = (body.email ?? "").trim().toLowerCase()
    if (!EMAIL.test(email)) return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 })
    const field = body.action?.endsWith("nlimited") ? "unlimited" : "blocked"
    const add = body.action === "addUnlimited" || body.action === "block"
    await config.set({ [field]: add ? FieldValue.arrayUnion(email) : FieldValue.arrayRemove(email) }, { merge: true })
  } else if (body.action !== "overview") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 })
  }
  forgetAiConfig()

  // ponytail: reads up to 5000 users and 14 days of usage in one go. Fine for a small app; add paging or a counter doc if it grows.
  const users = (await adminDb.collection("users").select("email", "createdAt", "e2ee").limit(5000).get()).docs
  const emailOf = new Map(users.map((u) => [u.id, (u.get("email") as string | undefined) ?? "(no email)"]))
  const days = Array.from({ length: 14 }, (_, i) => dayKey(i))
  const usage = (await adminDb.collection("aiUsage").where("day", ">=", days[days.length - 1]).get()).docs

  const perDay = new Map(days.map((d) => [d, { signups: 0, messages: 0, aiUsers: 0 }]))
  const now = Date.now()
  let new7 = 0
  let new30 = 0
  let encrypted = 0
  for (const u of users) {
    if (u.get("e2ee")) encrypted++
    const ms = (u.get("createdAt") as { toMillis?: () => number } | undefined)?.toMillis?.()
    if (!ms) continue
    if (now - ms < 7 * 86_400_000) new7++
    if (now - ms < 30 * 86_400_000) new30++
    const row = perDay.get(new Date(ms + 5.5 * 3600_000).toISOString().slice(0, 10))
    if (row) row.signups++
  }
  for (const d of usage) {
    const row = perDay.get(d.get("day") as string)
    if (row) {
      row.messages += (d.get("used") as number) ?? 0
      row.aiUsers++
    }
  }
  const top = usage
    .filter((d) => d.get("day") === days[0])
    .map((d) => ({ email: emailOf.get(d.get("uid") as string) ?? "(unknown)", used: (d.get("used") as number) ?? 0 }))
    .sort((a, b) => b.used - a.used)
    .slice(0, 10)

  // Traffic: page views, unique browsers and the busiest sections.
  const traffic = new Map((await adminDb.collection("traffic").where("day", ">=", days[days.length - 1]).get()).docs.map((d) => [d.id, d]))
  const visitors = await Promise.all(
    days.map(async (d) => (await adminDb.collection("trafficVisitors").where("day", "==", d).count().get()).data().count),
  )
  const sections = new Map<string, number>()
  days.slice(0, 7).forEach((d) => {
    const paths = (traffic.get(d)?.get("paths") ?? {}) as Record<string, number>
    for (const [k, n] of Object.entries(paths)) sections.set(k, (sections.get(k) ?? 0) + n)
  })

  // Abusive-language flags in the last 14 days, per account (never the messages).
  const flagDocs = (await adminDb.collection("aiFlags").where("day", ">=", days[days.length - 1]).get()).docs
  const flags = new Map<string, { email: string; count: number; lastDay: string }>()
  for (const f of flagDocs) {
    const email = (f.get("email") as string) || emailOf.get(f.get("uid") as string) || "(unknown)"
    const cur = flags.get(email) ?? { email, count: 0, lastDay: "" }
    cur.count += (f.get("count") as number) ?? 0
    if ((f.get("day") as string) > cur.lastDay) cur.lastDay = f.get("day") as string
    flags.set(email, cur)
  }

  const cfg = await getAiConfig(true)
  return NextResponse.json({
    traffic: {
      days: days.map((d, i) => ({ day: d, views: (traffic.get(d)?.get("views") as number) ?? 0, visitors: visitors[i] })),
      sections: [...sections].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, views]) => ({ name, views })),
    },
    flags: [...flags.values()].sort((a, b) => b.count - a.count),
    totals: {
      users: users.length,
      new7,
      new30,
      encrypted,
      twoStep: (await adminDb.collection("userMfa").where("enabled", "==", true).count().get()).data().count,
      messagesToday: perDay.get(days[0])?.messages ?? 0,
    },
    days: days.map((d) => ({ day: d, ...perDay.get(d)! })),
    top,
    settings: {
      dailyLimit: cfg.dailyLimit, // null = using the default below
      effectiveLimit: await dailyLimit(),
      unlimited: cfg.unlimited,
      blocked: cfg.blocked,
      unlimitedFromEnv: (process.env.AI_UNLIMITED_EMAILS ?? "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean),
      admins: adminEmails(),
    },
  })
}
