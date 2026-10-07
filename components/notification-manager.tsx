"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useTasks, useEvents } from "@/hooks/use-firebase-data"
import { getNotificationPermission, notifyOnceToday, showNotification } from "@/lib/notifications"
import { AlarmPopup, type AlarmEvent } from "@/components/alarm-popup"
import { formatEventTime } from "@/lib/format"

const CHECK_INTERVAL_MS = 15 * 1000 // 15s — fine-grained enough for "at start time" / "5 min before" reminders

/**
 * Mounted once inside the signed-in app shell. Doesn't render anything of
 * its own besides the alarm dialog it pops up.
 *
 * Two independent reminder channels:
 *  - Browser (OS) notifications for tasks due today, gated behind the
 *    user's explicit opt-in and actual browser permission.
 *  - In-app animated "alarm" popups for events, driven by each event's own
 *    `reminderMinutes` (set when creating/editing the event). These always
 *    show while the app is open — no permission needed — since they're the
 *    primary way events remind the user.
 */
export function NotificationManager() {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const { events } = useEvents()

  const browserNotifsEnabled = Boolean(user?.browserNotificationsEnabled) && getNotificationPermission() === "granted"

  const [activeAlarm, setActiveAlarm] = useState<AlarmEvent | null>(null)
  const alarmQueue = useRef<AlarmEvent[]>([])
  const snoozedUntil = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    function checkNow() {
      const now = new Date()
      const todayStr = now.toDateString()

      // Task due-today browser notifications (unchanged channel).
      if (browserNotifsEnabled) {
        for (const task of tasks) {
          if (task.status === "done" || !task.dueDate) continue
          const due = new Date(task.dueDate)
          if (due.toDateString() === todayStr) {
            notifyOnceToday(`task:${task.taskId}`, "Task due today", {
              body: task.title,
              tag: `task:${task.taskId}`,
            })
          }
        }
      }

      // Event reminders — fire at exactly the moment the user picked
      // (`reminderMinutes` before the event's start; 0 = at start time).
      for (const event of events) {
        if (event.reminderMinutes === null || event.reminderMinutes === undefined) continue

        const start = new Date(event.start)
        const fireAt = start.getTime() - event.reminderMinutes * 60000
        const msUntilFire = fireAt - now.getTime()

        const snoozeUntil = snoozedUntil.current.get(event.eventId)
        const dueToSnooze = snoozeUntil !== undefined && now.getTime() >= snoozeUntil

        // Fire within a small window after the moment it was due, so a 15s
        // poll never misses it, but don't re-fire for events long past.
        const isDue = (msUntilFire <= 0 && msUntilFire > -5 * 60000) || dueToSnooze

        const key = `sloth:alarmed:${event.eventId}:${event.start}`
        let alreadyFired = false
        try {
          alreadyFired = window.localStorage.getItem(key) === "1" && !dueToSnooze
        } catch {
          // ignore
        }

        if (isDue && !alreadyFired) {
          try {
            window.localStorage.setItem(key, "1")
          } catch {
            // ignore
          }
          snoozedUntil.current.delete(event.eventId)

          const alarmEvent: AlarmEvent = {
            eventId: event.eventId,
            title: event.title,
            start: event.start,
            location: event.location,
          }

          if (browserNotifsEnabled) {
            showNotification("Upcoming event", {
              body: `${event.title} at ${formatEventTime(event.start)}`,
              tag: `event:${event.eventId}`,
            })
          }

          setActiveAlarm((current) => {
            if (current) {
              alarmQueue.current.push(alarmEvent)
              return current
            }
            return alarmEvent
          })
        }
      }
    }

    checkNow()
    const interval = setInterval(checkNow, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [browserNotifsEnabled, tasks, events])

  function advanceQueue() {
    const next = alarmQueue.current.shift() ?? null
    setActiveAlarm(next)
  }

  function handleDismiss() {
    advanceQueue()
  }

  function handleSnooze() {
    if (activeAlarm) {
      snoozedUntil.current.set(activeAlarm.eventId, Date.now() + 5 * 60000)
    }
    advanceQueue()
  }

  return <AlarmPopup event={activeAlarm} onDismiss={handleDismiss} onSnooze={handleSnooze} />
}
