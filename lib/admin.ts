import { verifyIdTokenLite } from "./verify-token"

/** ADMIN_EMAILS="you@gmail.com, other@x.com" */
export const adminEmails = () => (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean)

/** Returns the admin's uid, or throws a Response (401 not signed in, 403 not an admin) the route can return as is. */
export async function requireAdmin(req: Request): Promise<string> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  const who = token ? await verifyIdTokenLite(token) : null
  if (!who?.success) throw Response.json({ error: "unauthorized" }, { status: 401 })
  if (!who.emailVerified || !who.email || !adminEmails().includes(who.email.toLowerCase())) {
    throw Response.json({ error: "forbidden" }, { status: 403 })
  }
  return who.uid
}
