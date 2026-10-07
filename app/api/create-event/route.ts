import { NextRequest, NextResponse } from "next/server"
import { adminDb, verifyIdToken } from "@/lib/firebase-admin"
import { google } from "googleapis"

/**
 * POST /api/create-event
 * 
 * Creates a Google Calendar event using stored OAuth tokens.
 * 
 * Request Headers:
 *   - Authorization: Bearer <Firebase ID Token>
 * 
 * Request Body:
 *   - summary: string (event title)
 *   - description: string (event description)
 *   - startDateTime: string (ISO 8601 format: 2025-12-01T10:00:00)
 *   - endDateTime: string (ISO 8601 format: 2025-12-01T11:00:00)
 *   - timeZone: string (optional, defaults to Asia/Kolkata)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Firebase ID token
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      )
    }

    const idToken = authHeader.replace("Bearer ", "")
    const verification = await verifyIdToken(idToken)
    
    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || "Authentication failed" },
        { status: 401 }
      )
    }

    const uid = verification.uid!

    // 2. Get stored tokens from Firestore
    const tokenRef = adminDb.collection("userTokens").doc(uid)
    const tokenDoc = await tokenRef.get()

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { error: "No tokens found. Please connect your Google Calendar first." },
        { status: 403 }
      )
    }

    const { accessToken, refreshToken } = tokenDoc.data() as {
      accessToken: string
      refreshToken: string | null
    }

    // 3. Set up Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    // 4. Create Calendar client
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // 5. Parse event data from request body
    const body = await req.json()
    const { summary, description, startDateTime, endDateTime, timeZone = "UTC" } = body

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields: summary, startDateTime, endDateTime" },
        { status: 400 }
      )
    }

    // 6. Create the event
    const event = {
      summary,
      description: description || "",
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    })

    console.log(`✅ Event created for user ${uid}:`, response.data.id)

    return NextResponse.json({
      success: true,
      event: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        summary: response.data.summary,
        start: response.data.start,
        end: response.data.end,
      },
    })

  } catch (error: unknown) {
    console.error("❌ Error creating event:", error)

    // Handle specific Google API errors
    const apiError = error as { response?: { status?: number }; message?: string }
    
    if (apiError.response?.status === 401) {
      return NextResponse.json(
        { error: "Token expired. Please reconnect your Google Calendar." },
        { status: 401 }
      )
    }

    if (apiError.response?.status === 403) {
      return NextResponse.json(
        { error: "Permission denied. Please ensure calendar scope is granted." },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: apiError.message || "Failed to create event" },
      { status: 500 }
    )
  }
}
