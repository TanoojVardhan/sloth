"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project, Task, TaskPriority, TaskStatus } from "@/types/entities"

interface TaskEditDialogProps {
  task: Task | null
  allTasks: Task[]
  projects: Project[]
  onClose: () => void
  onSave: (taskId: string, updates: Partial<Omit<Task, "taskId">>) => Promise<void>
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TaskEditDialog({ task, allTasks, projects, onClose, onSave }: TaskEditDialogProps) {
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [projectId, setProjectId] = useState("none")
  const [parentTaskId, setParentTaskId] = useState("none")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setStatus(task.status)
    setPriority(task.priority)
    setDueDate(toLocalInput(task.dueDate))
    setProjectId(task.projectId || "none")
    setParentTaskId(task.parentTaskId || "none")
    setTags(task.tags || [])
    setTagInput("")
    setNotes(task.notes || "")
  }, [task])

  // A task can't be nested under itself or under one of its own sub-tasks,
  // and nesting stays one level deep.
  const parentCandidates = task
    ? allTasks.filter((t) => t.taskId !== task.taskId && !t.parentTaskId && !allTasks.some((c) => c.parentTaskId === task.taskId && c.taskId === t.taskId))
    : []
  const hasChildren = task ? allTasks.some((t) => t.parentTaskId === task.taskId) : false

  const commitTag = () => {
    const t = tagInput.trim().replace(/,$/, "")
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  const save = async () => {
    if (!task || !title.trim()) return
    setSaving(true)
    try {
      const finalTags = tagInput.trim() && !tags.includes(tagInput.trim()) ? [...tags, tagInput.trim()] : tags
      await onSave(task.taskId, {
        title: title.trim(),
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        projectId: projectId === "none" ? null : projectId,
        parentTaskId: parentTaskId === "none" ? null : parentTaskId,
        tags: finalTags,
        notes,
      })
      onClose()
    } catch (error) {
      console.error("Failed to update task:", error)
      alert("Couldn't save the task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
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

          <div className="space-y-2">
            <Label htmlFor="edit-due">Due date</Label>
            <Input id="edit-due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.projectId} value={p.projectId}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sub-task of</Label>
              <Select value={parentTaskId} onValueChange={setParentTaskId} disabled={hasChildren}>
                <SelectTrigger title={hasChildren ? "This task has its own sub-tasks, so it stays top-level" : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {parentCandidates.map((t) => (
                    <SelectItem key={t.taskId} value={t.taskId}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="opacity-60 hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Input
                id="edit-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    commitTag()
                  }
                }}
                placeholder="Add a tag…"
                className="h-8 w-36 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Details, links, a checklist…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
