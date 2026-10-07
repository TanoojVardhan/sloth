import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Dedicated live-transcription model (see app/api/ai/parse/route.ts's
// MODEL_CHAIN comment for the full free-tier model list this app uses).
const TRANSCRIBE_MODEL = "models/gemini-3.5-transcribe-live"

/**
 * Mints a short-lived Gemini "ephemeral token" and hands it to the browser,
 * which then connects to Gemini's Live API *directly* using that token
 * instead of the real GEMINI_API_KEY. This is the piece that makes live
 * transcription work on Vercel: minting a token is one quick REST call
 * (a normal serverless function), unlike holding open a WebSocket relay
 * (which Vercel's serverless functions can't do). See
 * hooks/use-live-transcribe.ts for the client side.
 *
 * The token is single-use, restricted to the transcription model, and
 * expires in a few minutes either way — if it leaks, there's nothing
 * lasting to abuse.
 */
export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI isn't set up yet — add a GEMINI_API_KEY to .env.local." }, { status: 500 })
  }

  const now = Date.now()
  const expireTime = new Date(now + 5 * 60 * 1000).toISOString() // 5 min to actually use it
  const newSessionExpireTime = new Date(now + 60 * 1000).toISOString() // 1 min to open the session

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: TRANSCRIBE_MODEL,
          config: {
            responseModalities: ["TEXT"],
          },
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Ephemeral token mint failed:", res.status, errText)
      return NextResponse.json({ error: "Couldn't start live transcription — try again." }, { status: 502 })
    }

    const data = await res.json()
    const token: string | undefined = data?.name ?? data?.token?.name ?? data?.token
    if (!token) {
      console.error("Ephemeral token response had no token field:", data)
      return NextResponse.json({ error: "Couldn't start live transcription — try again." }, { status: 502 })
    }

    return NextResponse.json({ token, model: TRANSCRIBE_MODEL })
  } catch (error) {
    console.error("Ephemeral token mint error:", error)
    return NextResponse.json({ error: "Couldn't start live transcription — try again." }, { status: 500 })
  }
}
