"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, ClipboardList, Plus, Trash2 } from "lucide-react"
import { useAssignments, useClasses } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ASSIGNMENT_TYPES, dueAt, dueLabel, isFinished, percent, subjectAverages } from "@/lib/student"
import { cn } from "@/lib/utils"
import type { Assignment, AssignmentStatus, AssignmentType, TaskPriority } from "@/types/entities"

type Draft = Omit<Assignment, "assignmentId" | "createdAt" | "updatedAt"> & { assignmentId?: string }

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  submitted: "Submitted",
  graded: "Graded",
}

const emptyDraft = (type: AssignmentType = "assignment"): Draft => ({
  title: "",
  subject: "",
  type,
  status: "todo",
  priority: "medium",
  dueDate: "",
  dueTime: "",
  notes: "",
  score: null,
  maxScore: null,
  weight: null,
})

const numOrNull = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v))

type Tab = "open" | "done" | "all"

export default function AssignmentsPage() {
  const { assignments, isLoading, createAssignment, updateAssignment, deleteAssignment } = useAssignments()
  const { classes } = useClasses()
  const [tab, setTab] = useState<Tab>("open")
  const [typeFilter, setTypeFilter] = useState<"all" | AssignmentType>("all")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setError(null), [draft?.assignmentId, draft === null])

  // Suggest subjects from the timetable plus anything already used.
  const subjects = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((c) => c.subject && set.add(c.subject))
    assignments.forEach((a) => a.subject && set.add(a.subject))
    return [...set].sort()
  }, [classes, assignments])

  const visible = useMemo(() => {
    return assignments
      .filter((a) => (tab === "all" ? true : tab === "done" ? isFinished(a) : !isFinished(a)))
      .filter((a) => typeFilter === "all" || a.type === typeFilter)
      .sort((a, b) => {
        const da = dueAt(a)?.getTime() ?? Infinity
        const db = dueAt(b)?.getTime() ?? Infinity
        return tab === "done" ? db - da : da - db
      })
  }, [assignments, tab, typeFilter])

  const groups = useMemo(() => {
    if (tab !== "open") return [{ title: tab === "done" ? "Finished" : "Everything", items: visible }]
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekEnd = startToday + 8 * 86400000
    const out: Record<string, Assignment[]> = { Overdue: [], Today: [], "This week": [], Later: [], "No due date": [] }
    for (const a of visible) {
      const d = dueAt(a)
      if (!d) out["No due date"].push(a)
      else if (d.getTime() < now.getTime()) out.Overdue.push(a)
      else if (d.getTime() < startToday + 86400000) out.Today.push(a)
      else if (d.getTime() < weekEnd) out["This week"].push(a)
      else out.Later.push(a)
    }
    return Object.entries(out)
      .filter(([, items]) => items.length)
      .map(([title, items]) => ({ title, items }))
  }, [visible, tab])

  const nextExam = useMemo(
    () =>
      assignments
        .filter((a) => a.type === "exam" && !isFinished(a) && dueAt(a) && dueAt(a)!.getTime() >= Date.now())
        .sort((a, b) => dueAt(a)!.getTime() - dueAt(b)!.getTime())[0],
    [assignments],
  )
  const overdueCount = assignments.filter((a) => !isFinished(a) && dueAt(a) && dueAt(a)!.getTime() < Date.now()).length
  const openCount = assignments.filter((a) => !isFinished(a)).length
  const averages = useMemo(() => subjectAverages(assignments), [assignments])

  async function save() {
    if (!draft) return
    if (!draft.title.trim()) return setError("Give it a title.")
    if (draft.dueTime && !draft.dueDate) return setError("Pick a due date for that time.")
    setSaving(true)
    setError(null)
    try {
      const { assignmentId, ...data } = draft
      const clean = {
        ...data,
        title: data.title.trim(),
        subject: data.subject?.trim() || "",
        dueDate: data.dueDate || null,
        dueTime: data.dueDate ? data.dueTime || null : null,
      }
      if (assignmentId) await updateAssignment(assignmentId, clean)
      else await createAssignment(clean)
      setDraft(null)
    } catch {
      setError("Couldn't save. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!draft?.assignmentId) return
    setSaving(true)
    try {
      await deleteAssignment(draft.assignmentId)
      setDraft(null)
    } catch {
      setError("Couldn't delete. Try again?")
    } finally {
      setSaving(false)
    }
  }

  const toggleDone = (a: Assignment) =>
    void updateAssignment(a.assignmentId, { status: isFinished(a) ? "todo" : "submitted" })

  return (
    <div className="space-y-6">
      <PageHeader icon={ClipboardList} title="Assignments" description="Deadlines, exams and grades for every subject">
        <Button variant="outline" onClick={() => setDraft(emptyDraft("exam"))}>
          Add exam
        </Button>
        <Button className="gap-2" onClick={() => setDraft(emptyDraft())}>
          <Plus className="h-4 w-4" /> Add assignment
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-2xl font-semibold tabular-nums">{openCount}</p>
          <p className="text-xs text-muted-foreground">still to do</p>
        </Card>
        <Card className={cn("p-4", overdueCount > 0 && "border-destructive/40")}>
          <p className={cn("text-2xl font-semibold tabular-nums", overdueCount > 0 && "text-destructive")}>{overdueCount}</p>
          <p className="text-xs text-muted-foreground">overdue</p>
        </Card>
        <Card className="p-4">
          {nextExam ? (
            <>
              <p className="truncate text-sm font-semibold">{nextExam.title}</p>
              <p className="text-xs text-muted-foreground">
                Next exam{nextExam.subject ? ` · ${nextExam.subject}` : ""} · {dueLabel(nextExam).text}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">No exams coming up</p>
              <p className="text-xs text-muted-foreground">Add one to see a countdown</p>
            </>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border p-1">
          {(["open", "done", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "open" ? "To do" : t === "done" ? "Done" : "All"}
            </button>
          ))}
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | AssignmentType)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(ASSIGNMENT_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.emoji} {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && visible.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-medium">{tab === "open" ? "Nothing due. Enjoy it." : "Nothing here yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Add assignments and exams with their due dates and they will show up here in order.</p>
        </Card>
      )}

      {groups.map((g) => (
        <section key={g.title} className="space-y-2">
          <h2 className={cn("text-sm font-semibold", g.title === "Overdue" ? "text-destructive" : "text-muted-foreground")}>
            {g.title} <span className="font-normal">({g.items.length})</span>
          </h2>
          {g.items.map((a) => {
            const due = dueLabel(a)
            const pct = percent(a)
            return (
              <Card key={a.assignmentId} className="flex items-center gap-3 p-3.5">
                <button
                  type="button"
                  aria-label={isFinished(a) ? "Mark as not done" : "Mark as submitted"}
                  onClick={() => toggleDone(a)}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  {isFinished(a) ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                </button>
                <button type="button" onClick={() => setDraft({ ...a, dueDate: a.dueDate ?? "", dueTime: a.dueTime ?? "" })} className="min-w-0 flex-1 text-left">
                  <p className={cn("truncate text-sm font-semibold", isFinished(a) && "text-muted-foreground line-through")}>
                    <span aria-hidden>{ASSIGNMENT_TYPES[a.type]?.emoji} </span>
                    {a.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {a.subject && <span>{a.subject}</span>}
                    <span>{STATUS_LABEL[a.status]}</span>
                    {a.weight ? <span>{a.weight}% of grade</span> : null}
                  </p>
                </button>
                {pct != null && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums">{pct}%</span>}
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    due.tone === "overdue" && !isFinished(a) && "text-destructive",
                    due.tone === "soon" && !isFinished(a) && "text-amber-600 dark:text-amber-400",
                    (due.tone === "later" || due.tone === "none" || isFinished(a)) && "text-muted-foreground",
                  )}
                >
                  {due.text}
                </span>
              </Card>
            )
          })}
        </section>
      ))}

      {averages.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold">Grades so far</h2>
          <p className="text-xs text-muted-foreground">Weighted by each item&apos;s share of the final grade</p>
          <div className="mt-3 space-y-3">
            {averages.map((s) => (
              <div key={s.subject}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s.subject}</span>
                  <span className="tabular-nums font-medium">
                    {s.average}% <span className="font-normal text-muted-foreground">· {s.count} graded</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, s.average))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.assignmentId ? "Edit" : "Add"} {draft ? ASSIGNMENT_TYPES[draft.type].label.toLowerCase() : ""}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="atitle">Title</Label>
                <Input id="atitle" autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Lab report 3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="asubject">Subject</Label>
                  <Input id="asubject" list="subject-list" value={draft.subject ?? ""} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
                  <datalist id="subject-list">
                    {subjects.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as AssignmentType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASSIGNMENT_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.emoji} {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adate">Due date</Label>
                  <Input id="adate" type="date" value={draft.dueDate ?? ""} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="atime">Time (optional)</Label>
                  <Input id="atime" type="time" value={draft.dueTime ?? ""} onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as AssignmentStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as TaskPriority })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ascore">Score</Label>
                  <Input id="ascore" inputMode="decimal" value={draft.score ?? ""} onChange={(e) => setDraft({ ...draft, score: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amax">Out of</Label>
                  <Input id="amax" inputMode="decimal" value={draft.maxScore ?? ""} onChange={(e) => setDraft({ ...draft, maxScore: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aweight">Weight %</Label>
                  <Input id="aweight" inputMode="decimal" value={draft.weight ?? ""} onChange={(e) => setDraft({ ...draft, weight: numOrNull(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anotes">Notes</Label>
                <Textarea id="anotes" rows={3} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {draft?.assignmentId ? (
              <Button variant="ghost" className="gap-2 text-destructive" disabled={saving} onClick={() => void remove()}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
