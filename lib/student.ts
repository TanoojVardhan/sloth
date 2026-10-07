import type { Assignment, AssignmentType, ClassSlot, Occupation } from "@/types/entities"

// ---------- occupations ----------

export interface OccupationDef {
  id: Occupation
  label: string
  blurb: string
  emoji: string
  /** Extra sidebar destinations this occupation gets on top of the shared workspace. */
  tools: ("timetable" | "assignments")[]
}

export const OCCUPATIONS: OccupationDef[] = [
  { id: "student", label: "Student", emoji: "🎓", blurb: "Class timetable, assignments, exams and grades", tools: ["timetable", "assignments"] },
  { id: "educator", label: "Teacher or lecturer", emoji: "🍎", blurb: "Your teaching timetable plus a deadline and grading tracker", tools: ["timetable", "assignments"] },
  { id: "professional", label: "Working professional", emoji: "💼", blurb: "Tasks, projects, notes and focus sessions", tools: [] },
  { id: "freelancer", label: "Freelancer or founder", emoji: "🚀", blurb: "Projects, goals, notes and focus sessions", tools: [] },
  { id: "other", label: "Something else", emoji: "🌿", blurb: "The standard workspace, nothing extra", tools: [] },
]

export function occupationDef(o?: Occupation | null): OccupationDef | undefined {
  return OCCUPATIONS.find((d) => d.id === o)
}

export function hasTool(o: Occupation | null | undefined, tool: "timetable" | "assignments"): boolean {
  return !!occupationDef(o)?.tools.includes(tool)
}

// ---------- timetable ----------

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** JS getDay() is Sunday-first; the timetable is Monday-first. */
export function todayIndex(d = new Date()): number {
  return (d.getDay() + 6) % 7
}

export const CLASS_COLORS: Record<string, { label: string; swatch: string; soft: string }> = {
  moss: { label: "Moss", swatch: "#6E8F5D", soft: "#6E8F5D26" },
  terracotta: { label: "Terracotta", swatch: "#E2906B", soft: "#E2906B2E" },
  gold: { label: "Gold", swatch: "#D9A441", soft: "#D9A44133" },
  sky: { label: "Sky", swatch: "#5B8FB9", soft: "#5B8FB926" },
  plum: { label: "Plum", swatch: "#8E6AA8", soft: "#8E6AA826" },
  rose: { label: "Rose", swatch: "#C9677A", soft: "#C9677A26" },
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function format12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number)
  const suffix = h >= 12 ? "pm" : "am"
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m || 0).padStart(2, "0")}${suffix}`
}

// ---------- assignments ----------

export const ASSIGNMENT_TYPES: Record<AssignmentType, { label: string; emoji: string }> = {
  assignment: { label: "Assignment", emoji: "📝" },
  exam: { label: "Exam", emoji: "🧪" },
  quiz: { label: "Quiz", emoji: "❓" },
  project: { label: "Project", emoji: "🛠️" },
  lab: { label: "Lab / practical", emoji: "🔬" },
  reading: { label: "Reading", emoji: "📖" },
}

export function isFinished(a: Assignment): boolean {
  return a.status === "submitted" || a.status === "graded"
}

/** Due moment as a local Date (end of day when no time is set), or null. */
export function dueAt(a: Assignment): Date | null {
  if (!a.dueDate) return null
  const [y, m, d] = a.dueDate.split("-").map(Number)
  if (!y || !m || !d) return null
  const [hh, mm] = (a.dueTime || "23:59").split(":").map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function dueLabel(a: Assignment, now = new Date()): { text: string; tone: "overdue" | "soon" | "later" | "none" } {
  const due = dueAt(a)
  if (!due) return { text: "No due date", tone: "none" }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  const days = Math.round((startOfDue - startOfToday) / 86400000)
  const time = a.dueTime ? ` at ${format12(a.dueTime)}` : ""
  if (due.getTime() < now.getTime()) {
    return { text: days === 0 ? `Was due today${time}` : `${-days} day${days === -1 ? "" : "s"} overdue`, tone: "overdue" }
  }
  if (days === 0) return { text: `Due today${time}`, tone: "soon" }
  if (days === 1) return { text: `Due tomorrow${time}`, tone: "soon" }
  if (days <= 7) return { text: `Due in ${days} days`, tone: "soon" }
  return { text: due.toLocaleDateString(undefined, { day: "numeric", month: "short" }), tone: "later" }
}

/** Percent score, or null when not graded. */
export function percent(a: Assignment): number | null {
  if (a.score == null || !a.maxScore) return null
  return Math.round((a.score / a.maxScore) * 1000) / 10
}

/** Weighted average per subject over graded work (weight defaults to 1 when unset). */
export function subjectAverages(list: Assignment[]): { subject: string; average: number; count: number }[] {
  const map = new Map<string, { sum: number; w: number; count: number }>()
  for (const a of list) {
    const p = percent(a)
    if (p == null) continue
    const key = a.subject?.trim() || "General"
    const w = a.weight && a.weight > 0 ? a.weight : 1
    const cur = map.get(key) ?? { sum: 0, w: 0, count: 0 }
    cur.sum += p * w
    cur.w += w
    cur.count += 1
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([subject, v]) => ({ subject, average: Math.round((v.sum / v.w) * 10) / 10, count: v.count }))
    .sort((a, b) => a.subject.localeCompare(b.subject))
}

// ---------- timetable: one-off changes ----------

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** The seven dates of the week containing [ref], Monday first. */
export function weekDates(ref = new Date()): Date[] {
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - todayIndex(ref))
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
}

export interface DayEntry {
  slot: ClassSlot
  state: "normal" | "changed" | "cancelled"
}

/**
 * What actually happens on [date]: the weekly classes, except that a dated row
 * replaces the weekly class of the same subject that day (and shows as
 * cancelled when its status says so).
 */
export function entriesForDate(classes: ClassSlot[], date: Date): DayEntry[] {
  const iso = isoDate(date)
  const idx = todayIndex(date)
  const dated = classes.filter((c) => c.date === iso)
  const replaced = new Set(dated.map((c) => c.subject.trim().toLowerCase()))
  const weekly = classes.filter(
    (c) => !c.date && c.dayOfWeek === idx && (!c.until || iso <= c.until) && !replaced.has(c.subject.trim().toLowerCase()),
  )
  return [
    ...weekly.map((slot): DayEntry => ({ slot, state: "normal" })),
    ...dated.map((slot): DayEntry => ({ slot, state: slot.cancelled ? "cancelled" : "changed" })),
  ].sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
}

export function timeAgo(ms?: number | null, now = Date.now()): string {
  if (!ms) return "never"
  const mins = Math.round((now - ms) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return `${Math.round(hrs / 24)} d ago`
}
