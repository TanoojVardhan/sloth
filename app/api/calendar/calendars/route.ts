import { NextRequest, NextResponse } from "next/server"
import { requireUid } from "@/lib/firebase-admin"
import { getAuthorizedClientForUser, getCalendarClient } from "@/lib/google-calendar"

/**
 * GET /api/calendar/calendars
 *
 * Lists every calendar on the user's Google account — their own primary
 * calendar, any shared calendars, and any holiday calendars they're
 * subscribed to — so the UI can offer them as a picker.
 */
export async function GET(req: NextRequest) {
  try {
    const uid = await requireUid(req)

    const auth = await getAuthorizedClientForUser(uid)
    if (!auth) {
      return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 403 })
    }

    const calendar = getCalendarClient(auth)
    const res = await calendar.calendarList.list({ maxResults: 250 })

    const calendars = (res.data.items ?? []).map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: !!c.primary,
      accessRole: c.accessRole,
      backgroundColor: c.backgroundColor,
    }))

    return NextResponse.json({ calendars })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error listing calendars:", error)
    return NextResponse.json({ error: "Failed to list calendars" }, { status: 500 })
  }
}
