"use client"

import type React from "react"

import { useState } from "react"
import type { Task, TaskPriority, TaskStatus } from "@/types/entities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  initial?: Partial<Task>
  onSubmit: (data: {
    title: string
    status: TaskStatus
    priority: TaskPriority
    dueDate?: string | null
  }) => Promise<void> | void
  submittingText?: string
}

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"]
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"]

export function TaskForm({ initial, onSubmit, submittingText = "Saving..." }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [status, setStatus] = useState<TaskStatus>((initial?.status as TaskStatus) ?? "todo")
  const [priority, setPriority] = useState<TaskPriority>((initial?.priority as TaskPriority) ?? "medium")
  const [dueDate, setDueDate] = useState<string | undefined | null>(initial?.dueDate ?? undefined)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ title, status, priority, dueDate: dueDate || null })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="due">Due Date</Label>
        <Input id="due" type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value || null)} />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? submittingText : "Save"}
      </Button>
    </form>
  )
}
