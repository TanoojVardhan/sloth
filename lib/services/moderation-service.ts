import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"

export type ContentType = "task" | "goal" | "event" | "comment" | "profile"
export type ModerationStatus = "pending" | "approved" | "rejected"
export type ModerationReason = "inappropriate" | "spam" | "offensive" | "other"

export interface ModerationReport {
  id: string
  contentId: string
  contentType: ContentType
  reportedBy: string
  reason: ModerationReason
  description: string
  status: ModerationStatus
  createdAt: Date
  updatedAt: Date
  moderatedBy?: string
  moderationNotes?: string
}

// Report content for moderation
export async function reportContent(
  contentId: string,
  contentType: ContentType,
  reportedBy: string,
  reason: ModerationReason,
  description: string,
): Promise<string> {
  try {
    const reportsRef = collection(db, "moderationReports")

    const reportData = {
      contentId,
      contentType,
      reportedBy,
      reason,
      description,
      status: "pending" as ModerationStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(reportsRef, reportData)
    return docRef.id
  } catch (error) {
    console.error("Error reporting content:", error)
    throw error
  }
}

// Get moderation reports
export async function getModerationReports(status?: ModerationStatus, limit = 100): Promise<ModerationReport[]> {
  try {
    const reportsRef = collection(db, "moderationReports")

    let q = query(reportsRef, orderBy("createdAt", "desc"))

    if (status) {
      q = query(q, where("status", "==", status))
    }

    q = query(q, limit(limit))

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        contentId: data.contentId,
        contentType: data.contentType,
        reportedBy: data.reportedBy,
        reason: data.reason,
        description: data.description,
        status: data.status,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        moderatedBy: data.moderatedBy,
        moderationNotes: data.moderationNotes,
      }
    })
  } catch (error) {
    console.error("Error getting moderation reports:", error)
    return []
  }
}

// Update moderation report status
export async function updateModerationStatus(
  reportId: string,
  status: ModerationStatus,
  moderatorId: string,
  notes?: string,
): Promise<boolean> {
  try {
    const reportRef = doc(db, "moderationReports", reportId)

    await updateDoc(reportRef, {
      status,
      moderatedBy: moderatorId,
      moderationNotes: notes || null,
      updatedAt: serverTimestamp(),
    })

    // If rejecting content, take action on the content
    if (status === "rejected") {
      const reportSnap = await getDoc(reportRef)
      if (reportSnap.exists()) {
        const data = reportSnap.data()
        await handleRejectedContent(data.contentId, data.contentType)
      }
    }

    return true
  } catch (error) {
    console.error("Error updating moderation status:", error)
    return false
  }
}

// Handle rejected content
async function handleRejectedContent(contentId: string, contentType: ContentType): Promise<void> {
  try {
    // Different actions based on content type
    switch (contentType) {
      case "task":
        // Mark task as hidden or delete it
        const taskRef = doc(db, "tasks", contentId)
        await updateDoc(taskRef, { hidden: true })
        break
      case "goal":
        // Mark goal as hidden or delete it
        const goalRef = doc(db, "goals", contentId)
        await updateDoc(goalRef, { hidden: true })
        break
      case "event":
        // Mark event as hidden or delete it
        const eventRef = doc(db, "events", contentId)
        await updateDoc(eventRef, { hidden: true })
        break
      case "comment":
        // Delete comment
        const commentRef = doc(db, "comments", contentId)
        await deleteDoc(commentRef)
        break
      case "profile":
        // Flag user profile
        const [userId] = contentId.split(":")
        const userRef = doc(db, "users", userId)
        await updateDoc(userRef, { flagged: true })
        break
    }
  } catch (error) {
    console.error("Error handling rejected content:", error)
  }
}

// Get moderation stats
export async function getModerationStats(): Promise<{
  pending: number
  approved: number
  rejected: number
}> {
  try {
    const reportsRef = collection(db, "moderationReports")

    const pendingQuery = query(reportsRef, where("status", "==", "pending"))
    const approvedQuery = query(reportsRef, where("status", "==", "approved"))
    const rejectedQuery = query(reportsRef, where("status", "==", "rejected"))

    const [pendingSnapshot, approvedSnapshot, rejectedSnapshot] = await Promise.all([
      getDocs(pendingQuery),
      getDocs(approvedQuery),
      getDocs(rejectedQuery),
    ])

    return {
      pending: pendingSnapshot.size,
      approved: approvedSnapshot.size,
      rejected: rejectedSnapshot.size,
    }
  } catch (error) {
    console.error("Error getting moderation stats:", error)
    return { pending: 0, approved: 0, rejected: 0 }
  }
}
