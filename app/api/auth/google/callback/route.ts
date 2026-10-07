import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getOAuthClient, saveTokensForUser } from "@/lib/google-calendar"

/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user grants (or denies) consent. We look
 * up which Firebase user started the flow via the one-time state nonce,
 * exchange the authorization code for real tokens (including a refresh
 * token, since we requested offline access), and store them.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  const redirectTo = (status: "connected" | "error", message?: string) => {
    const url = new URL("/calendar-integration", origin)
    url.searchParams.set("status", status)
    if (message) url.searchParams.set("message", message)
    return NextResponse.redirect(url)
  }

  if (errorParam) {
    return redirectTo("error", errorParam === "access_denied" ? "Permission was not granted." : errorParam)
  }

  if (!code || !state) {
    return redirectTo("error", "Missing authorization code.")
  }

  try {
    const stateRef = adminDb.collection("oauthState").doc(state)
    const stateDoc = await stateRef.get()

    if (!stateDoc.exists) {
      return redirectTo("error", "This sign-in link expired. Please try connecting again.")
    }

    const { uid, createdAt } = stateDoc.data() as { uid: string; createdAt: number }
    await stateRef.delete() // single-use

    if (Date.now() - createdAt > 10 * 60 * 1000) {
      return redirectTo("error", "This sign-in link expired. Please try connecting again.")
    }

    const redirectUri = `${origin}/api/auth/google/callback`
    const oauth2Client = getOAuthClient(redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return redirectTo("error", "Google did not return an access token.")
    }

    await saveTokensForUser(uid, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    })

    return redirectTo("connected")
  } catch (error) {
    console.error("Error completing Google OAuth flow:", error)
    return redirectTo("error", "Failed to connect Google Calendar.")
  }
}
