import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { adminDb, verifyIdToken } from "@/lib/firebase-admin"
import { getAuthUrl } from "@/lib/google-calendar"

/**
 * POST /api/auth/google/start
 *
 * Starts the server-side Google OAuth flow for Calendar access. Unlike the
 * old Firebase-popup approach, this is a real OAuth 2.0 authorization-code
 * flow, so Google actually issues a refresh token and the connection keeps
 * working after the first access token expires.
 *
 * Returns an authUrl the client should navigate the browser to.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization token provided" }, { status: 401 })
    }

    const idToken = authHeader.replace("Bearer ", "")
    const verification = await verifyIdToken(idToken)
    if (!verification.success) {
      return NextResponse.json({ error: verification.error || "Authentication failed" }, { status: 401 })
    }

    const uid = verification.uid!

    // A short-lived, single-use nonce ties the OAuth redirect (which the
    // browser follows with no custom headers) back to this Firebase user.
    const state = randomUUID()
    await adminDb.collection("oauthState").doc(state).set({
      uid,
      createdAt: Date.now(),
    })

    const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`
    const authUrl = getAuthUrl(redirectUri, state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Error starting Google OAuth flow:", error)
    return NextResponse.json({ error: "Failed to start Google sign-in" }, { status: 500 })
  }
}
