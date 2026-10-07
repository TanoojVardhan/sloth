import { NextRequest, NextResponse } from "next/server"
import { adminDb, verifyIdToken } from "@/lib/firebase-admin"

/**
 * GET /api/check-token
 * 
 * Check if user has Google OAuth tokens stored in Firestore
 */
export async function GET(req: NextRequest) {
  try {
    // Verify Firebase ID token
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { hasToken: false },
        { status: 401 }
      )
    }

    const idToken = authHeader.replace("Bearer ", "")
    const verification = await verifyIdToken(idToken)
    
    if (!verification.success) {
      return NextResponse.json(
        { hasToken: false },
        { status: 401 }
      )
    }

    const uid = verification.uid!

    // Check if tokens exist in Firestore
    const tokenRef = adminDb.collection("userTokens").doc(uid)
    const tokenDoc = await tokenRef.get()

    return NextResponse.json({
      hasToken: tokenDoc.exists,
      connected: tokenDoc.exists
    })

  } catch (error) {
    console.error("Error checking token:", error)
    return NextResponse.json(
      { hasToken: false },
      { status: 500 }
    )
  }
}
