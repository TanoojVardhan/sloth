import { NextRequest, NextResponse } from "next/server"
import { requireUid } from "@/lib/firebase-admin"
import { getAuthorizedClientForUser, getCalendarClient } from "@/lib/google-calendar"

function friendlyError(error: unknown, fallback: string) {
  const apiError = error as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string }
  if (apiError.response?.status === 401) return { message: "Token expired. Please reconnect your Google Calendar.", status: 401 }
  if (apiError.response?.status === 403) return { message: "Permission denied for this calendar.", status: 403 }
  if (apiError.response?.status === 404) return { message: "Event or calendar not found.", status: 404 }
  return { message: apiError.response?.data?.error?.message || apiError.message || fallback, status: 500 }
}

/**
 * GET /api/calendar/events?calendarId=primary&timeMin=...&timeMax=...
 *
 * Lists events from any calendar the user has access to — their own
 * calendar, a shared one, or a subscribed holiday calendar — within an
 * optional time window (defaults to the next 90 days).
 */
export async function GET(req: NextRequest) {
  try {
    const uid = await requireUid(req)
    const auth = await getAuthorizedClientForUser(uid)
    if (!auth) {
      return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const calendarId = searchParams.get("calendarId") || "primary"
    const now = new Date()
    const timeMin = searchParams.get("timeMin") || now.toISOString()
    const timeMax =
      searchParams.get("timeMax") || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const calendar = getCalendarClient(auth)
    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    })

    const events = (res.data.items ?? []).map((e) => ({
      id: e.id,
      summary: e.summary || "(No title)",
      description: e.description || "",
      location: e.location || "",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay: !e.start?.dateTime,
      htmlLink: e.htmlLink,
      status: e.status,
    }))

    return NextResponse.json({ events })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error listing events:", error)
    const { message, status } = friendlyError(error, "Failed to list events")
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * POST /api/calendar/events
 *
 * Creates an event on the given calendar (defaults to "primary").
 */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUid(req)
    const auth = await getAuthorizedClientForUser(uid)
    if (!auth) {
      return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 403 })
    }

    const body = await req.json()
    const { calendarId = "primary", summary, description, location, startDateTime, endDateTime, timeZone } = body

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields: summary, startDateTime, endDateTime" },
        { status: 400 }
      )
    }

    const calendar = getCalendarClient(auth)
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description: description || "",
        location: location || "",
        start: { dateTime: startDateTime, timeZone: timeZone || "Asia/Kolkata" },
        end: { dateTime: endDateTime, timeZone: timeZone || "Asia/Kolkata" },
      },
    })

    return NextResponse.json({ event: res.data })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error creating event:", error)
    const { message, status } = friendlyError(error, "Failed to create event")
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * PATCH /api/calendar/events
 *
 * Updates an existing event. Only fields provided in the body are changed.
 */
export async function PATCH(req: NextRequest) {
  try {
    const uid = await requireUid(req)
    const auth = await getAuthorizedClientForUser(uid)
    if (!auth) {
      return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 403 })
    }

    const body = await req.json()
    const { calendarId = "primary", eventId, summary, description, location, startDateTime, endDateTime, timeZone } = body

    if (!eventId) {
      return NextResponse.json({ error: "Missing required field: eventId" }, { status: 400 })
    }

    const calendar = getCalendarClient(auth)
    const res = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        ...(summary !== undefined && { summary }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(startDateTime !== undefined && { start: { dateTime: startDateTime, timeZone: timeZone || "Asia/Kolkata" } }),
        ...(endDateTime !== undefined && { end: { dateTime: endDateTime, timeZone: timeZone || "Asia/Kolkata" } }),
      },
    })

    return NextResponse.json({ event: res.data })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error updating event:", error)
    const { message, status } = friendlyError(error, "Failed to update event")
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * DELETE /api/calendar/events?calendarId=primary&eventId=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const uid = await requireUid(req)
    const auth = await getAuthorizedClientForUser(uid)
    if (!auth) {
      return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const calendarId = searchParams.get("calendarId") || "primary"
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Missing required field: eventId" }, { status: 400 })
    }

    const calendar = getCalendarClient(auth)
    await calendar.events.delete({ calendarId, eventId })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting event:", error)
    const { message, status } = friendlyError(error, "Failed to delete event")
    return NextResponse.json({ error: message }, { status })
  }
}
