"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/** Counts a page view for the admin page's traffic numbers (see /api/track). Sends nothing personal. */
export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    let vid = ""
    try {
      vid = localStorage.getItem("sloth.vid") ?? ""
      if (!vid) {
        vid = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("")
        localStorage.setItem("sloth.vid", vid)
      }
    } catch {
      return // storage blocked: skip counting rather than count the same person many times
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, vid }),
      keepalive: true,
    }).catch(() => undefined)
  }, [pathname])

  return null
}
