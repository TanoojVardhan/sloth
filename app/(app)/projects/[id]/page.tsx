"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, Folder, Loader2, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PriorityBadge } from "@/components/priority-badge"
import { useProject, useTasks } from "@/hooks/use-firebase-data"
import type { Task } from "@/types/entities"

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const { project, isLoading, error } = useProject(id)
  const { tasks, createTask, updateTask } = useTasks()
  const [title, setTitle] = useState("")
  const [adding, setAdding] = useState(false)

  const mine = tasks.filter((t) => t.projectId === id)
  const open = mine.filter((t) => t.status !== "done")
  const done = mine.filter((t) => t.status === "done")
  const pct = mine.length ? Math.round((100 * done.length) / mine.length) : 0

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    try {
      await createTask({ title: title.trim(), status: "todo", priority: "medium", projectId: id, tags: [], dueDate: null })
      setTitle("")
    } finally {
      setAdding(false)
    }
  }

  function toggle(t: Task) {
    void updateTask(t.taskId, { status: t.status === "done" ? "todo" : "done" })
  }

  if (isLoading) return <p className="text-muted-foreground">Loading project…</p>
  if (error || !project)
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">This project doesn&apos;t exist or was deleted.</p>
        <Link href="/projects" className="text-sm underline">
          Back to projects
        </Link>
      </div>
    )

  const row = (t: Task) => (
    <li key={t.taskId} className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <button type="button" onClick={() => toggle(t)} aria-label={t.status === "done" ? "Mark as not done" : "Mark as done"} className="shrink-0 text-primary">
        {t.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={t.status === "done" ? "truncate text-muted-foreground line-through" : "truncate font-medium"}>{t.title}</p>
        {t.dueDate && <p className="text-xs text-muted-foreground">Due {new Date(t.dueDate).toLocaleDateString()}</p>}
      </div>
      <PriorityBadge priority={t.priority} />
    </li>
  )

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <PageHeader icon={Folder} title={project.name} description={project.description || undefined} />

      <Card className="p-6">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="tabular-nums text-muted-foreground">
            {done.length} of {mine.length} tasks · {pct}%
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        {project.tags && project.tags.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{project.tags.map((t) => `#${t}`).join("  ")}</p>}
      </Card>

      <form onSubmit={add} className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task to this project" aria-label="New task" />
        <Button type="submit" disabled={adding || !title.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1">Add</span>
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">To do ({open.length})</h2>
        {open.length ? <ul className="space-y-2">{open.map(row)}</ul> : <p className="text-sm text-muted-foreground">Nothing left to do here.</p>}
      </section>
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Done ({done.length})</h2>
          <ul className="space-y-2">{done.map(row)}</ul>
        </section>
      )}
      {project.notes && (
        <Card className="p-6">
          <h2 className="mb-2 font-semibold">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{project.notes}</p>
        </Card>
      )}
    </div>
  )
}
