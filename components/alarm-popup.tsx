"use client"

import { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell, MapPin, X } from "lucide-react"
import { formatEventTime } from "@/lib/format"

export type AlarmEvent = {
  eventId: string
  title: string
  start: string
  location?: string | null
}

// Plays a short, gentle two-tone chime using the Web Audio API — no sound
// file needed. Browsers that block audio without a prior user gesture will
// just silently skip it; the visual alarm still shows either way.
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[880, 1108.73].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const start = now + i * 0.18
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.55)
    })
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch {
    // Autoplay restrictions or no Web Audio support — fine, it's a bonus.
  }
}

export function AlarmPopup({
  event,
  onDismiss,
  onSnooze,
}: {
  event: AlarmEvent | null
  onDismiss: () => void
  onSnooze: () => void
}) {
  const played = useRef<string | null>(null)

  useEffect(() => {
    if (event && played.current !== event.eventId) {
      played.current = event.eventId
      playChime()
    }
  }, [event])

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm overflow-hidden border-primary/30 p-0 gap-0 data-[state=open]:zoom-in-90 data-[state=open]:duration-300"
      >
        <DialogTitle className="sr-only">Event reminder</DialogTitle>
        <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-alarm-pulse-ring" />
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-alarm-pulse-ring [animation-delay:0.6s]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Bell className="h-8 w-8 animate-alarm-ring" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Reminder</p>
            <h2 className="text-lg font-semibold leading-snug text-balance">{event?.title}</h2>
            {event && (
              <p className="text-sm text-muted-foreground">{formatEventTime(event.start)}</p>
            )}
            {event?.location && (
              <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </p>
            )}
          </div>

          <div className="flex w-full gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onSnooze}>
              Snooze 5m
            </Button>
            <Button className="flex-1" onClick={onDismiss}>
              <X className="mr-1 h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
