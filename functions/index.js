/**
 * Scheduled push-notification sender for Sloth Planner.
 *
 * Runs every 15 minutes. For every user with an FCM token saved on their
 * `users/{uid}` doc (written by the Android app when it signs in — see
 * UserRepository.updateFcmToken), checks that user's tasks/events for
 * anything due "now" and sends a push via FCM. This is the server half of
 * the reminder system: the Android app's local WorkManager job covers
 * reminders even if this function is ever down or not deployed, and this
 * function adds real push delivery (works even if the app isn't open).
 *
 * De-duping: each task/event document gets a `lastRemindedAt` (ISO date
 * string) field set after a reminder is sent for it, so the same item is
 * never pushed twice in one day.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler")
const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")
const { getMessaging } = require("firebase-admin/messaging")

initializeApp()

const db = getFirestore()
const messaging = getMessaging()

function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

async function sendToUser(userId, title, body) {
  const userSnap = await db.collection("users").doc(userId).get()
  const token = userSnap.exists ? userSnap.get("fcmToken") : null
  if (!token) return

  try {
    await messaging.send({
      token,
      notification: { title, body },
    })
  } catch (error) {
    // An expired/invalid token is expected churn (app reinstalled, token
    // rotated) — log and move on rather than failing the whole run.
    console.warn(`Failed to send to user ${userId}:`, error.message)
  }
}

exports.sendReminders = onSchedule("every 15 minutes", async () => {
  const today = todayKey()
  const now = Date.now()

  // --- Tasks due today, not yet done, not already reminded today ---
  const tasksSnap = await db
    .collection("tasks")
    .where("status", "in", ["todo", "in_progress"])
    .get()

  for (const doc of tasksSnap.docs) {
    const task = doc.data()
    if (!task.dueDate || task.lastRemindedAt === today) continue
    const dueDate = new Date(task.dueDate).toISOString().slice(0, 10)
    if (dueDate !== today) continue

    await sendToUser(task.userId, "Task due today", task.title)
    await doc.ref.update({ lastRemindedAt: today })
  }

  // --- Events starting within the next 30 minutes, not already reminded today ---
  const eventsSnap = await db.collection("events").get()

  for (const doc of eventsSnap.docs) {
    const event = doc.data()
    if (!event.start || event.lastRemindedAt === today) continue
    const startMs = new Date(event.start).getTime()
    if (Number.isNaN(startMs)) continue
    const minutesUntil = (startMs - now) / 60000
    if (minutesUntil < 0 || minutesUntil > 30) continue

    const time = new Date(event.start).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    await sendToUser(event.userId, "Upcoming event", `${event.title} at ${time}`)
    await doc.ref.update({ lastRemindedAt: today })
  }
})
