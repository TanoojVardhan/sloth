// Thin wrapper around the browser Notification API. There's no email/push
// backend for this app, so "notifications" means on-device browser
// notifications shown while a tab is open, gated behind the user's explicit
// opt-in (stored on their user doc) and the browser's own permission prompt.

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported"
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied"
  if (Notification.permission !== "default") return Notification.permission
  return Notification.requestPermission()
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return
  try {
    new Notification(title, { icon: "/sloth-planner-logo.png", ...options })
  } catch {
    // Some browsers (notably iOS Safari) throw on `new Notification` even
    // when permission is "granted" — fail quietly, it's a nice-to-have.
  }
}

// De-dupes a notification so it only fires once per calendar day for a given
// item, using localStorage as a simple cross-reload memory.
export function notifyOnceToday(key: string, title: string, options?: NotificationOptions) {
  if (typeof window === "undefined") return
  const today = new Date().toDateString()
  const storageKey = `sloth:notified:${key}`
  try {
    if (window.localStorage.getItem(storageKey) === today) return
    window.localStorage.setItem(storageKey, today)
  } catch {
    // localStorage can throw in private-browsing modes — just skip dedup.
  }
  showNotification(title, options)
}
