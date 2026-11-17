import { NextResponse } from "next/server"
import { dailyLimit, isUnlimited, usedToday } from "@/lib/ai-quota"
import { verifyIdTokenLite } from "@/lib/verify-token"

export const runtime = "nodejs"

/** POST: how many AI messages the signed-in user has used today. `limit` is null for unlimited accounts. */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  const who = token ? await verifyIdTokenLite(token) : null
  if (!who?.success) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json({
    used: await usedToday(who.uid),
    limit: (await isUnlimited(who.email, who.emailVerified)) ? null : await dailyLimit(),
  })
}
