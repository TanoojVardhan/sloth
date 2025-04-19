import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  writeBatch,
} from "firebase/firestore"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error" | "announcement"
  link?: string
  read: boolean
  createdAt: Date
  expiresAt?: Date
  recipientId: string | "all"
  senderId: string
}

export interface NotificationFormData {
  title: string
  message: string
  type: "info" | "warning" | "success" | "error" | "announcement"
  link?: string
  expiresAt?: Date
  recipientId?: string | "all"
}

// Create a notification for a specific user or all users
export async function createNotification(data: NotificationFormData, senderId: string): Promise<string> {
  try {
    const notificationsRef = collection(db, "notifications")

    const notificationData = {
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link || null,
      read: false,
      createdAt: serverTimestamp(),
      expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
      recipientId: data.recipientId || "all",
      senderId,
    }

    const docRef = await addDoc(notificationsRef, notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Get notifications for a user
export async function getUserNotifications(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {},
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, "notifications")

    // Build query
    let q = query(notificationsRef, where("recipientId", "in", [userId, "all"]), orderBy("createdAt", "desc"))

    // Add filters
    if (options.unreadOnly) {
      q = query(q, where("read", "==", false))
    }

    // Add limit
    if (options.limit) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)

    // Filter out expired notifications
    const now = new Date()

    return querySnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link,
          read: data.read,
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
          recipientId: data.recipientId,
          senderId: data.senderId,
        }
      })
      .filter((notification) => !notification.expiresAt || notification.expiresAt > now)
  } catch (error) {
    console.error("Error getting user notifications:", error)
    return []
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const notificationRef = doc(db, "notifications", notificationId)

    await updateDoc(notificationRef, {
      read: true,
    })

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("recipientId", "in", [userId, "all"]), where("read", "==", false))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return true
    }

    const batch = writeBatch(db)

    querySnapshot.docs.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { read: true })
    })

    await batch.commit()
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const notificationRef = doc(db, "notifications", notificationId)

    await deleteDoc(notificationRef)

    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    return false
  }
}

// Get all notifications (admin only)
export async function getAllNotifications(limit = 100): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, orderBy("createdAt", "desc"), limit(limit))

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        read: data.read,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
        recipientId: data.recipientId,
        senderId: data.senderId,
      }
    })
  } catch (error) {
    console.error("Error getting all notifications:", error)
    return []
  }
}

// Create a system announcement
export async function createAnnouncement(
  title: string,
  message: string,
  expiresAt?: Date,
  link?: string,
): Promise<string> {
  try {
    return await createNotification(
      {
        title,
        message,
        type: "announcement",
        expiresAt,
        link,
        recipientId: "all",
      },
      "system",
    )
  } catch (error) {
    console.error("Error creating announcement:", error)
    throw error
  }
}
