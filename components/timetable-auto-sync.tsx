"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { runTimetableSync, TIMETABLE_SYNCED_EVENT, type SyncResult } from "@/lib/timetable-sync"
import { hasTool } from "@/lib/student"

const EVERY_MS = 15 * 60 * 1000
const MIN_GAP_MS = 2 * 60 * 1000

/**
 * Keeps the timetable fresh without anyone pressing a button: syncs when the
 * app opens, every 15 minutes while it stays open, and whenever the tab comes
 * back into view (rate-limited so switching tabs doesn't hammer Google).
 */
export function TimetableAutoSync() {
  const { user } = useAuth()
  const userRef = useRef(user)
  const lastRun = useRef(0)
  userRef.current = user

  const url = user?.timetableSheetUrl ?? ""
  const specKey = `${user?.specializations === undefined ? "unset" : user.specializations.join("|")}#${user?.timetableUntil ?? ""}`
  const enabled = !!user && !!url && hasTool(user.occupation, "timetable")

  useEffect(() => {
    if (!enabled) return
    const go = (force = false) => {
      const u = userRef.current
      if (!u) return
      if (!force && Date.now() - lastRun.current < MIN_GAP_MS) return
      lastRun.current = Date.now()
      void runTimetableSync(u)
    }
    go(true) // also re-runs when the link or chosen specializations change
    const timer = setInterval(() => go(), EVERY_MS)
    const onVisible = () => document.visibilityState === "visible" && go()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [enabled, url, specKey])

  // Tell students when their classes changed, if they allowed notifications.
  useEffect(() => {
    const onSynced = (e: Event) => {
      const r = (e as CustomEvent<SyncResult>).detail
      if (!r?.ok || r.changes.length === 0) return
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Timetable updated", { body: r.changes.slice(0, 3).join("\n") })
      }
    }
    window.addEventListener(TIMETABLE_SYNCED_EVENT, onSynced)
    return () => window.removeEventListener(TIMETABLE_SYNCED_EVENT, onSynced)
  }, [])

  return null
}
