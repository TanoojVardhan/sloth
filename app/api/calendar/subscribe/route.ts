import { NextRequest, NextResponse } from "next/server"
import { requireUid } from "@/lib/firebase-admin"
import { getAuthorizedClientForUser, getCalendarClient } from "@/lib/google-calendar"

/**
 * POST /api/calendar/subscribe
 *
 * Subscribes the user's Google account to a public calendar (most commonly
 * one of Google's public holiday calendars) so it shows up in their
 * calendar list and events can be read from it going forward. This mirrors
 * "Add a coworker's calendar" / "Add holiday calendar" in Google Calendar's
 * own UI.
 */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUid(req)
    const auth = await getAuthorizedClientForUser(uid)
    if (!auth) {
      return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 403 })
    }

    const body = await req.json()
    const { calendarId } = body
    if (!calendarId) {
      return NextResponse.json({ error: "Missing required field: calendarId" }, { status: 400 })
    }

    const calendar = getCalendarClient(auth)
    const res = await calendar.calendarList.insert({ requestBody: { id: calendarId } })

    return NextResponse.json({ calendar: { id: res.data.id, summary: res.data.summary } })
  } catch (error) {
    if (error instanceof Response) return error
    const apiError = error as { response?: { status?: number } }
    // Already subscribed — treat as success rather than an error.
    if (apiError.response?.status === 409) {
      return NextResponse.json({ success: true, alreadySubscribed: true })
    }
    console.error("Error subscribing to calendar:", error)
    return NextResponse.json({ error: "Failed to add that calendar" }, { status: 500 })
  }
}
