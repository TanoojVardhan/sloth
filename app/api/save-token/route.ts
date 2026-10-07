import { NextRequest, NextResponse } from "next/server"
import { adminDb, verifyIdToken } from "@/lib/firebase-admin"

/**
 * POST /api/save-token
 * 
 * Saves Google OAuth tokens (access token and refresh token) to Firestore.
 * This endpoint is called after successful Google Sign-In to persist tokens
 * for making Google Calendar API calls on behalf of the user.
 * 
 * Request Headers:
 *   - Authorization: Bearer <Firebase ID Token>
 * 
 * Request Body:
 *   - accessToken: string
 *   - refreshToken: string (optional but highly recommended for long-term access)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      )
    }

    // 2. Verify Firebase ID token
    const idToken = authHeader.replace("Bearer ", "")
    const verification = await verifyIdToken(idToken)
    
    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || "Authentication failed" },
        { status: 401 }
      )
    }

    const uid = verification.uid!

    // 3. Get tokens from request body
    const body = await req.json()
    const { accessToken, refreshToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      )
    }

    // 4. Save tokens to Firestore
    const tokenRef = adminDb.collection("userTokens").doc(uid)
    await tokenRef.set({
      accessToken,
      refreshToken: refreshToken || null,
      updatedAt: new Date().toISOString(),
    })

    console.log(`✅ Tokens saved for user: ${uid}`)

    return NextResponse.json({ 
      success: true,
      message: "Tokens saved successfully"
    })

  } catch (error) {
    console.error("❌ Error saving tokens:", error)
    return NextResponse.json(
      { error: "Failed to save tokens" },
      { status: 500 }
    )
  }
}
