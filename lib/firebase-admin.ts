import admin from "firebase-admin"
import { getApps } from "firebase-admin/app"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// Initialize Firebase Admin SDK for server-side operations
if (!getApps().length) {
  try {
    // Check if service account path is provided
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

    if (serviceAccountPath) {
      // Load service account from file
      const fullPath = join(process.cwd(), serviceAccountPath)
      
      // Check if file exists before trying to read it
      if (existsSync(fullPath)) {
        const serviceAccount = JSON.parse(readFileSync(fullPath, "utf8"))

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        })

        console.log("✅ Firebase Admin initialized with service account")
      } else {
        console.warn("⚠️ Service account file not found. Google Calendar features will not work.")
        console.warn(`   Expected path: ${fullPath}`)
        console.warn("   Download it from Firebase Console → Project Settings → Service Accounts")
        
        // Initialize with default credentials (limited functionality)
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        })
      }
    } else {
      // Fallback: Initialize with application default credentials (for production)
      // This works in Google Cloud environments (Cloud Functions, Cloud Run, etc.)
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })

      console.log("✅ Firebase Admin initialized with default credentials")
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error)
    // Don't throw - allow app to continue without Calendar features
    // Initialize with basic config as fallback
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }
}

// Export Firestore and Auth instances
export const adminDb = admin.firestore()
export const adminAuth = admin.auth()

// Helper function to verify Firebase ID token
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return { success: true, uid: decodedToken.uid, token: decodedToken }
  } catch (error) {
    console.error("Token verification error:", error)
    return { success: false, error: "Invalid or expired token" }
  }
}
