import { NextRequest, NextResponse } from "next/server"
import { adminDb, verifyIdToken } from "@/lib/firebase-admin"

/**
 * DELETE /api/disconnect-calendar
 * 
 * Disconnects Google Calendar by deleting stored OAuth tokens
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify Firebase ID token
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

    // Delete tokens from Firestore
    const tokenRef = adminDb.collection("userTokens").doc(uid)
    await tokenRef.delete()

    console.log(`✅ Calendar disconnected for user: ${uid}`)

    return NextResponse.json({
      success: true,
      message: "Calendar disconnected successfully"
    })

  } catch (error) {
    console.error("❌ Error disconnecting calendar:", error)
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    )
  }
}
