// Sloth Planner service worker.
// Keeps the app shell installable and shows an offline page. It never caches
// API responses or Firebase traffic, so encrypted data is only ever held by the app itself.
const VERSION = "sloth-v1"
const SHELL = ["/offline.html", "/icon-192.png", "/icon-512.png", "/sloth-planner-logo.png"]

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (e) => {
  const req = e.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return

  // Pages: network first, offline page when there is no connection.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")))
    return
  }
  // Built static assets are content-hashed, so cache-first is safe.
  if (url.pathname.startsWith("/_next/static/") || SHELL.includes(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(VERSION).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})

// Clicking a reminder focuses an open Sloth window, or opens one.
self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || "/dashboard"
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate && c.url.indexOf(target) === -1 && c.navigate(target)
          return c.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
