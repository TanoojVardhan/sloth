"use client"

import { useState } from "react"
import { useProjects, useTasks, useEvents } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Folder,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  CheckSquare,
  Calendar as CalendarIcon,
  FolderOpen,
  Tag,
  StickyNote,
} from "lucide-react"
import { formatEventDateTime } from "@/lib/format"
import type { Project } from "@/types/entities"

export default function ProjectsPage() {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects()
  const { tasks } = useTasks()
  const { events } = useEvents()

  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)

  function addTagFromInput() {
    const t = tagInput.trim().replace(/,$/, "")
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput("")
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)
    try {
      await createProject({ name: name.trim(), description: description.trim() || null, tags, notes })
      setName("")
      setDescription("")
      setTags([])
      setTagInput("")
      setNotes("")
      setIsAdding(false)
    } catch (error) {
      console.error("Failed to create project:", error)
      alert("Failed to create project. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  function startEditing(project: Project) {
    setEditingId(project.projectId)
    setEditName(project.name)
    setEditDescription(project.description || "")
    setEditNotes(project.notes || "")
  }

  async function saveEdit(projectId: string) {
    if (!editName.trim()) return
    try {
      await updateProject(projectId, { name: editName.trim(), description: editDescription.trim() || null, notes: editNotes })
      setEditingId(null)
    } catch (error) {
      console.error("Failed to update project:", error)
      alert("Failed to update project. Please try again.")
    }
  }

  async function handleDelete(projectId: string) {
    const taskCount = tasks.filter((t) => t.projectId === projectId).length
    const eventCount = events.filter((e) => e.projectId === projectId).length
    const warning =
      taskCount || eventCount
        ? `This project has ${taskCount} task${taskCount === 1 ? "" : "s"} and ${eventCount} event${eventCount === 1 ? "" : "s"} linked to it. They won't be deleted, but they'll lose their project. Delete this project anyway?`
        : "Delete this project?"
    if (!confirm(warning)) return
    try {
      await deleteProject(projectId)
    } catch (error) {
      console.error("Failed to delete project:", error)
      alert("Failed to delete project. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader icon={Folder} title="Projects" description="Group related tasks and events together" />
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Input
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this project about?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags (optional)
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`} className="opacity-60 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Input
                  id="project-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addTagFromInput()
                    }
                  }}
                  onBlur={addTagFromInput}
                  placeholder="Add a tag and press Enter..."
                  className="h-8 w-44 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-notes" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes (optional)
              </Label>
              <Textarea
                id="project-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={'Details, links, a checklist...\nTip: start a line with "- [ ] " for a checklist item'}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving || !name.trim()}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setName("")
                  setDescription("")
                  setTags([])
                  setTagInput("")
                  setNotes("")
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {projects.some((p) => p.tags && p.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {Array.from(new Set(projects.flatMap((p) => p.tags || []))).sort().map((t) => (
            <button
              key={t}
              onClick={() => setActiveTagFilter((cur) => (cur === t ? null : t))}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTagFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {t}
            </button>
          ))}
          {activeTagFilter && (
            <button onClick={() => setActiveTagFilter(null)} className="text-xs text-muted-foreground underline underline-offset-2">
              Clear filter
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create one to group related tasks and events together.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(activeTagFilter ? projects.filter((p) => (p.tags || []).includes(activeTagFilter)) : projects).map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.projectId)
            const doneCount = projectTasks.filter((t) => t.status === "done").length
            const totalCount = projectTasks.length
            const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
            const projectEvents = events
              .filter((e) => e.projectId === project.projectId)
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            const nextEvent = projectEvents.find((e) => new Date(e.start).getTime() >= Date.now())
            const isEditing = editingId === project.projectId

            return (
              <Card key={project.projectId} className="group flex flex-col p-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                    />
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(project.projectId)} disabled={!editName.trim()}>
                        <Check className="mr-1 h-4 w-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Folder className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="truncate font-semibold">{project.name}</h3>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(project)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(project.projectId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {project.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                    )}

                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.tags.map((t) => (
                          <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {project.notes && project.notes.trim() && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <StickyNote className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {project.notes.split("\n").find((l) => l.trim())?.replace(/^- \[[ x]\] /, "")}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {doneCount}/{totalCount} tasks
                      </span>
                      {projectEvents.length > 0 && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {projectEvents.length} event{projectEvents.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    {totalCount > 0 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    {nextEvent && (
                      <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        Next: {nextEvent.title} · {formatEventDateTime(nextEvent.start)}
                      </div>
                    )}

                    {totalCount === 0 && projectEvents.length === 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        No tasks or events linked yet — add this project when creating one.
                      </p>
                    )}
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
