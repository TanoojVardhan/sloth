"use client"

import { useEffect, useMemo, useState } from "react"
import { GraduationCap, MapPin, Plus, Trash2, User as UserIcon } from "lucide-react"
import { useClasses } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CLASS_COLORS, DAYS, DAYS_SHORT, entriesForDate, format12, minutesOf, todayIndex, weekDates } from "@/lib/student"
import { TimetableSheetPanel } from "@/components/timetable-sheet-panel"
import { cn } from "@/lib/utils"
import type { ClassSlot } from "@/types/entities"

type Draft = Omit<ClassSlot, "classId"> & { classId?: string }

const emptyDraft = (day: number): Draft => ({
  subject: "",
  dayOfWeek: day,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  teacher: "",
  color: "moss",
  notes: "",
})

export default function TimetablePage() {
  const { classes, isLoading, createClass, updateClass, deleteClass } = useClasses()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = todayIndex()

  // Don't carry an old validation message into the next dialog.
  useEffect(() => setError(null), [draft?.classId, draft === null])

  // This week's real schedule: weekly classes with any one-off changes from the sheet applied.
  const dates = useMemo(() => weekDates(), [])
  const byDay = useMemo(() => dates.map((d) => entriesForDate(classes, d)), [classes, dates])

  // Hide the weekend columns until something is scheduled there.
  const visibleDays = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].filter((d) => d < 5 || byDay[d].length > 0 || d === today),
    [byDay, today],
  )

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const todays = byDay[today].filter((e) => e.state !== "cancelled").map((e) => e.slot)
  const current = todays.find((c) => minutesOf(c.startTime) <= nowMin && nowMin < minutesOf(c.endTime))
  const next = todays.find((c) => minutesOf(c.startTime) > nowMin)

  async function save() {
    if (!draft) return
    if (!draft.subject.trim()) return setError("Add a subject name.")
    if (minutesOf(draft.endTime) <= minutesOf(draft.startTime)) return setError("End time must be after the start time.")
    setSaving(true)
    setError(null)
    try {
      const { classId, ...data } = draft
      const clean = { ...data, subject: data.subject.trim() }
      if (classId) await updateClass(classId, clean)
      else await createClass(clean)
      setDraft(null)
    } catch {
      setError("Couldn't save. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!draft?.classId) return
    setSaving(true)
    try {
      await deleteClass(draft.classId)
      setDraft(null)
    } catch {
      setError("Couldn't delete. Try again?")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={GraduationCap} title="Timetable" description="Your weekly classes in one place">
        <Button onClick={() => setDraft(emptyDraft(today))} className="gap-2">
          <Plus className="h-4 w-4" /> Add class
        </Button>
      </PageHeader>

      <TimetableSheetPanel />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-muted-foreground">{DAYS[today]}</h2>
        {current ? (
          <p className="mt-1 text-lg font-semibold">
            Now: {current.subject}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              until {format12(current.endTime)}
              {current.location ? ` in ${current.location}` : ""}
            </span>
          </p>
        ) : next ? (
          <p className="mt-1 text-lg font-semibold">
            Next: {next.subject}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              at {format12(next.startTime)}
              {next.location ? ` in ${next.location}` : ""}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-lg font-semibold">
            {todays.length ? "No more classes today." : "No classes today."}
          </p>
        )}
      </Card>

      {!isLoading && classes.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-medium">Your timetable is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Add each class once and it repeats every week.</p>
          <Button className="mt-4" onClick={() => setDraft(emptyDraft(today))}>
            Add your first class
          </Button>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]" style={{ ["--cols" as string]: visibleDays.length }}>
        {visibleDays.map((d) => (
          <div key={d} className={cn("rounded-2xl border bg-card p-3", d === today && "border-primary/50 ring-1 ring-primary/20")}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className={cn("text-sm font-semibold", d === today && "text-primary")}>
                <span className="hidden lg:inline">{DAYS_SHORT[d]}</span>
                <span className="lg:hidden">{DAYS[d]}</span>
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{dates[d].getDate()}</span>
              </h3>
              <button
                type="button"
                aria-label={`Add class on ${DAYS[d]}`}
                onClick={() => setDraft(emptyDraft(d))}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {byDay[d].length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">Free day</p>}
              {byDay[d].map(({ slot: c, state }) => {
                const col = CLASS_COLORS[c.color || "moss"] ?? CLASS_COLORS.moss
                return (
                  <button
                    key={c.classId}
                    type="button"
                    onClick={() => setDraft({ ...c })}
                    className={cn("block w-full rounded-xl border-l-4 p-2.5 text-left transition-transform hover:-translate-y-0.5", state === "cancelled" && "opacity-60")}
                    style={{ background: col.soft, borderLeftColor: col.swatch }}
                  >
                    {state !== "normal" && (
                      <span
                        className={cn(
                          "mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          state === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {state === "cancelled" ? "Cancelled" : "Changed"}
                      </span>
                    )}
                    <p className={cn("text-sm font-semibold leading-tight", state === "cancelled" && "line-through")}>{c.subject}</p>
                    {c.code && <p className="text-[11px] font-medium text-muted-foreground">{c.code}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {format12(c.startTime)} – {format12(c.endTime)}
                    </p>
                    {c.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {c.location}
                      </p>
                    )}
                    {c.teacher && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <UserIcon className="h-3 w-3" /> {c.teacher}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.classId ? "Edit class" : "Add class"}</DialogTitle>
          </DialogHeader>
          {draft?.source === "sheet" && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              This class comes from your Google Sheet, so change it there. It updates here within about 15 minutes, or press Refresh.
            </p>
          )}
          {draft && (
            <fieldset disabled={draft.source === "sheet"} className="min-w-0 space-y-4 border-0 p-0">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" autoFocus value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="e.g. Data Structures" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Day</Label>
                  <Select value={String(draft.dayOfWeek)} onValueChange={(v) => setDraft({ ...draft, dayOfWeek: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => (
                        <SelectItem key={d} value={String(i)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start">Starts</Label>
                  <Input id="start" type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Ends</Label>
                  <Input id="end" type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Room</Label>
                  <Input id="loc" value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Room 204" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Input id="teacher" value={draft.teacher ?? ""} onChange={(e) => setDraft({ ...draft, teacher: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Colour</Label>
                <div className="flex gap-2">
                  {Object.entries(CLASS_COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={c.label}
                      aria-pressed={draft.color === key}
                      onClick={() => setDraft({ ...draft, color: key })}
                      className={cn("h-7 w-7 rounded-full border-2", draft.color === key ? "border-foreground" : "border-transparent")}
                      style={{ background: c.swatch }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnotes">Notes</Label>
                <Textarea id="cnotes" rows={2} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </fieldset>
          )}
          <DialogFooter className={cn("gap-2 sm:justify-between", draft?.source === "sheet" && "hidden")}>
            {draft?.classId ? (
              <Button variant="ghost" className="gap-2 text-destructive" disabled={saving} onClick={() => void remove()}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
