"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { useTasks, useEvents, useProjects, useGoals, useNotes, useAssignments } from "@/hooks/use-firebase-data"
import { subjectAverages, isFinished, isoDate } from "@/lib/student"

const DAY = 86400000

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function lastDays(n: number) {
  const today = startOfDay(new Date())
  return Array.from({ length: n }, (_, i) => new Date(today.getTime() - (n - 1 - i) * DAY))
}

function readFocus(day: Date): number {
  try {
    const raw = window.localStorage.getItem(`sloth-focus-${day.toISOString().slice(0, 10)}`)
    return raw ? Number(JSON.parse(raw).minutes) || 0 : 0
  } catch {
    return 0
  }
}

function Stat({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="font-display text-3xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      {note && <div className="text-xs text-muted-foreground">{note}</div>}
    </div>
  )
}

// One series of horizontal bars. Values are printed beside each bar, and the
// row's title gives the same text on hover, so nothing depends on color.
function Bars({ rows, unit = "" }: { rows: { label: string; value: number; note?: string; href?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const label = (
          <span className="truncate">
            {r.label}
            {r.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}
          </span>
        )
        return (
          <li key={r.label} title={`${r.label}: ${r.value}${unit}`} className="grid grid-cols-[minmax(80px,160px)_1fr_auto] items-center gap-3 text-sm">
            {r.href ? (
              <Link href={r.href} className="truncate hover:underline">
                {label}
              </Link>
            ) : (
              label
            )}
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(100 * r.value) / max}%` }} />
            </div>
            <span className="tabular-nums text-muted-foreground">
              {r.value}
              {unit}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// Vertical day columns for a 14-day trend; each column carries its own value as a tooltip and an sr-only label.
function DayColumns({ days, values, unit }: { days: Date[]; values: number[]; unit: string }) {
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  return (
    <div>
      <div className="flex h-36 items-end gap-1" role="list">
        {days.map((d, i) => (
          <div key={i} role="listitem" className="group flex h-full flex-1 flex-col justify-end" title={`${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${values[i]}${unit}`}>
            <span className="sr-only">
              {d.toDateString()}: {values[i]}
              {unit}
            </span>
            <div className="rounded-t-[4px] bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${values[i] ? Math.max(4, (100 * values[i]) / max) : 0}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
        <span>
          {total}
          {unit} in 14 days
        </span>
        <span>Today</span>
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const { tasks } = useTasks()
  const { events } = useEvents()
  const { projects } = useProjects()
  const { goals } = useGoals()
  const { notes } = useNotes()
  const { assignments } = useAssignments()
  const [focus, setFocus] = useState<number[]>([])
  const days = useMemo(() => lastDays(14), [])

  useEffect(() => {
    setFocus(days.map(readFocus))
  }, [days])

  const now = new Date()
  const today = startOfDay(now)
  const weekAgo = today.getTime() - 6 * DAY
  const inAWeek = today.getTime() + 8 * DAY

  const open = tasks.filter((t) => t.status !== "done")
  const done = tasks.filter((t) => t.status === "done")
  const doneThisWeek = done.filter((t) => t.completedAt && new Date(t.completedAt).getTime() >= weekAgo).length
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < today.getTime()).length
  const dueSoon = open.filter((t) => t.dueDate && new Date(t.dueDate).getTime() >= today.getTime() && new Date(t.dueDate).getTime() < inAWeek).length
  const eventsSoon = events.filter((e) => new Date(e.start).getTime() >= now.getTime() && new Date(e.start).getTime() < inAWeek).length
  const finishedPerDay = days.map((d) => done.filter((t) => t.completedAt && isoDate(new Date(t.completedAt)) === isoDate(d)).length)
  const focusWeek = focus.slice(-7).reduce((a, b) => a + b, 0)

  const byPriority = (["high", "medium", "low"] as const).map((p) => ({ label: p[0].toUpperCase() + p.slice(1), value: open.filter((t) => t.priority === p).length }))
  const projectRows = projects
    .map((p) => {
      const mine = tasks.filter((t) => t.projectId === p.projectId)
      const d = mine.filter((t) => t.status === "done").length
      return { label: p.name, value: mine.length ? Math.round((100 * d) / mine.length) : 0, note: `${d} of ${mine.length} tasks done`, href: `/projects/${p.projectId}`, n: mine.length }
    })
    .filter((r) => r.n > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  const tagCounts = new Map<string, number>()
  open.forEach((t) => (t.tags || []).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)))
  const tagRows = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label: `#${label}`, value }))
  const grades = subjectAverages(assignments).map((s) => ({ label: s.subject, value: s.average, note: `${s.count} graded` }))
  const pendingAssignments = assignments.filter((a) => !isFinished(a)).length

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Insights" description="How your planning is going, worked out on this device from your own data." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat value={open.length} label="Open tasks" />
        <Stat value={doneThisWeek} label="Finished this week" />
        <Stat value={overdue} label="Overdue" />
        <Stat value={dueSoon} label="Due in the next 7 days" />
        <Stat value={eventsSoon} label="Events in the next 7 days" />
        <Stat value={focusWeek} label="Focus minutes this week" note="on this device" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Tasks finished per day</h2>
          <DayColumns days={days} values={finishedPerDay} unit=" tasks" />
          <p className="mt-3 text-xs text-muted-foreground">Counts tasks marked done since Insights started tracking finish times.</p>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Focus minutes per day</h2>
          <DayColumns days={days} values={focus.length ? focus : days.map(() => 0)} unit=" min" />
          <p className="mt-3 text-xs text-muted-foreground">From the Focus timer. Stored only on this device.</p>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Open tasks by priority</h2>
          <Bars rows={byPriority} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Projects</h2>
          <Bars rows={projectRows} unit="%" />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Most used tags on open tasks</h2>
          <Bars rows={tagRows} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Goals and notes</h2>
          <Bars
            rows={[
              { label: "Active goals", value: goals.filter((g) => g.status === "active").length },
              { label: "Completed goals", value: goals.filter((g) => g.status === "completed").length },
              { label: "Notes", value: notes.filter((n) => !n.archived).length },
            ]}
          />
        </Card>
        {(grades.length > 0 || pendingAssignments > 0) && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-1 font-semibold">Assignments</h2>
            <p className="mb-4 text-sm text-muted-foreground">{pendingAssignments} still to submit. Average score by subject:</p>
            <Bars rows={grades} unit="%" />
          </Card>
        )}
      </div>
    </div>
  )
}
