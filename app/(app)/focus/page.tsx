"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react"
import { useTasks } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Phase = "focus" | "short" | "long"

const PHASE_LABEL: Record<Phase, string> = { focus: "Focus", short: "Short break", long: "Long break" }

// Per-browser conveniences only (durations, today's tally). Nothing here
// needs to sync, so localStorage is fine — and every access is guarded.
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — the timer still works for this session */
  }
}

function todayKey() {
  return `sloth-focus-${new Date().toISOString().slice(0, 10)}`
}

function chime() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.18, 0.36].forEach((t, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = [660, 880, 990][i]
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.4)
    })
    setTimeout(() => void ctx.close(), 1200)
  } catch {
    /* audio blocked — the on-screen state still changes */
  }
}

export default function FocusPage() {
  const { tasks, updateTask } = useTasks()
  const [durations, setDurations] = useState<Record<Phase, number>>({ focus: 25, short: 5, long: 15 })
  const [phase, setPhase] = useState<Phase>("focus")
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [completedToday, setCompletedToday] = useState(0)
  const [minutesToday, setMinutesToday] = useState(0)
  const [taskId, setTaskId] = useState("none")
  const endAt = useRef<number | null>(null)

  useEffect(() => {
    const d = readLocal("sloth-focus-durations", { focus: 25, short: 5, long: 15 })
    setDurations(d)
    setRemaining(d.focus * 60)
    const t = readLocal(todayKey(), { sessions: 0, minutes: 0 })
    setCompletedToday(t.sessions)
    setMinutesToday(t.minutes)
  }, [])

  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks])
  const focusTask = openTasks.find((t) => t.taskId === taskId)

  const switchPhase = (p: Phase, autoStart = false) => {
    setPhase(p)
    setRemaining(durations[p] * 60)
    endAt.current = autoStart ? Date.now() + durations[p] * 60 * 1000 : null
    setRunning(autoStart)
  }

  // Tick against a wall-clock end time so background-tab throttling can't drift it.
  useEffect(() => {
    if (!running) return
    if (!endAt.current) endAt.current = Date.now() + remaining * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.round(((endAt.current ?? Date.now()) - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        clearInterval(id)
        setRunning(false)
        endAt.current = null
        chime()
        if (phase === "focus") {
          const sessions = completedToday + 1
          const minutes = minutesToday + durations.focus
          setCompletedToday(sessions)
          setMinutesToday(minutes)
          writeLocal(todayKey(), { sessions, minutes })
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Focus session done 🦥", { body: "Nice work. Take a breather." })
          }
          switchPhase(sessions % 4 === 0 ? "long" : "short")
        } else {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Break's over", { body: "Ready for another focus session?" })
          }
          switchPhase("focus")
        }
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase])

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0")
  const ss = String(remaining % 60).padStart(2, "0")

  useEffect(() => {
    const base = "Sloth Planner"
    document.title = running ? `${mm}:${ss} · ${PHASE_LABEL[phase]}` : base
    return () => {
      document.title = base
    }
  }, [mm, ss, running, phase])

  const total = durations[phase] * 60
  const progress = total ? 1 - remaining / total : 0
  const R = 120
  const C = 2 * Math.PI * R

  const toggle = () => {
    if (!running && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission()
    }
    if (running) {
      endAt.current = null
      setRunning(false)
    } else {
      endAt.current = Date.now() + remaining * 1000
      setRunning(true)
    }
  }

  const setDuration = (p: Phase, mins: number) => {
    const next = { ...durations, [p]: Math.min(120, Math.max(1, mins)) }
    setDurations(next)
    writeLocal("sloth-focus-durations", next)
    if (p === phase && !running) setRemaining(next[p] * 60)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Timer} title="Focus" description="Work in calm, timed sessions with breaks built in" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex flex-col items-center gap-6 p-6 md:p-10">
          <div className="flex rounded-full border p-1">
            {(Object.keys(PHASE_LABEL) as Phase[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => switchPhase(p)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  phase === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {PHASE_LABEL[p]}
              </button>
            ))}
          </div>

          <div className="relative h-[280px] w-[280px]">
            <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90">
              <circle cx="140" cy="140" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
              <circle
                cx="140"
                cy="140"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                className={cn("transition-[stroke-dashoffset] duration-300", phase === "focus" ? "text-primary" : "text-chart-2")}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-6xl font-semibold tabular-nums">
                {mm}:{ss}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">{PHASE_LABEL[phase]}</span>
            </div>
          </div>

          {focusTask && phase === "focus" && (
            <p className="max-w-md text-center text-sm">
              Working on <span className="font-semibold">{focusTask.title}</span>
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => switchPhase(phase)} aria-label="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="lg" className="w-36 gap-2" onClick={toggle}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => switchPhase(phase === "focus" ? "short" : "focus")}
              aria-label="Skip to next"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Focus on a task</h2>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific task</SelectItem>
                {openTasks.map((t) => (
                  <SelectItem key={t.taskId} value={t.taskId}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {focusTask && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  void updateTask(focusTask.taskId, { status: "done" })
                  setTaskId("none")
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark “{focusTask.title}” done
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Today</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-semibold tabular-nums">{completedToday}</p>
                <p className="text-xs text-muted-foreground">sessions</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-semibold tabular-nums">{minutesToday}</p>
                <p className="text-xs text-muted-foreground">minutes focused</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn("h-2 flex-1 rounded-full", i < completedToday % 4 ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">A long break comes after every 4 sessions.</p>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Session lengths</h2>
            {(Object.keys(PHASE_LABEL) as Phase[]).map((p) => (
              <label key={p} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{PHASE_LABEL[p]}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={durations[p]}
                    onChange={(e) => setDuration(p, Number(e.target.value) || 1)}
                    className="h-8 w-16 rounded-md border bg-background px-2 text-right tabular-nums"
                  />
                  min
                </span>
              </label>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
