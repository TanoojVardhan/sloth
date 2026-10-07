"use client"

import { useEffect, useState } from "react"
import { useTasks, useProjects } from "@/hooks/use-firebase-data"
import { TaskEditDialog } from "@/components/task-edit-dialog"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PriorityBadge } from "@/components/priority-badge"
import { CheckCircle2, Circle, Trash2, Plus, Loader2, ListTodo, Calendar as CalendarIcon, Tag, X, StickyNote, LayoutGrid, Table2, PlayCircle } from "lucide-react"
import type { TaskStatus, TaskPriority, Task } from "@/types/entities"

// One level of Notion-style nesting: pairs each top-level task with its direct
// sub-tasks right after it. A sub-task whose parent isn't in this same list
// (e.g. the parent landed in a different status column) is shown flat instead.
function buildTaskRenderList(items: Task[]): { task: Task; indent: number }[] {
  const byParent = new Map<string, Task[]>()
  const topLevel: Task[] = []
  for (const t of items) {
    if (t.parentTaskId) {
      byParent.set(t.parentTaskId, [...(byParent.get(t.parentTaskId) || []), t])
    } else {
      topLevel.push(t)
    }
  }
  const result: { task: Task; indent: number }[] = []
  for (const top of topLevel) {
    result.push({ task: top, indent: 0 })
    for (const child of byParent.get(top.taskId) || []) {
      result.push({ task: child, indent: 1 })
    }
  }
  const includedIds = new Set(result.map((r) => r.task.taskId))
  for (const t of items) {
    if (!includedIds.has(t.taskId)) result.push({ task: t, indent: 0 })
  }
  return result
}

function TaskTable({
  tasks,
  onToggle,
  onDelete,
  onEdit,
}: {
  tasks: Task[]
  onToggle: (taskId: string, status: TaskStatus) => void
  onDelete: (taskId: string) => void
  onEdit: (task: Task) => void
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Done</th>
            <th className="p-3 font-medium">Title</th>
            <th className="p-3 font-medium">Priority</th>
            <th className="p-3 font-medium">Due date</th>
            <th className="p-3 font-medium">Tags</th>
            <th className="p-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.taskId} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() => onToggle(task.taskId, task.status)}
                  className="h-4 w-4"
                  aria-label={`Mark ${task.title} as done`}
                />
              </td>
              <td className={`p-3 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                {task.parentTaskId && <span className="mr-1 text-muted-foreground">↳</span>}
                <button type="button" onClick={() => onEdit(task)} className="text-left hover:underline">
                  {task.title}
                </button>
              </td>
              <td className="p-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="p-3 text-muted-foreground">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {(task.tags || []).map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-3 text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(task.taskId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                No tasks match this view
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  )
}

export default function TasksPage() {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks()
  const { projects } = useProjects()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [parentTaskId, setParentTaskId] = useState<string>("none")
  const [isSaving, setIsSaving] = useState(false)
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [view, setView] = useState<"board" | "table">("board")

  // /tasks?new=1 (from the command palette) opens the add form.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new")) setIsAdding(true)
  }, [])

  function addTagFromInput() {
    const t = tagInput.trim().replace(/,$/, "")
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput("")
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await createTask({
        title: title.trim(),
        status: "todo",
        priority,
        dueDate: dueDate || null,
        projectId: null,
        tags,
        notes,
        parentTaskId: parentTaskId === "none" ? null : parentTaskId,
      })
      setTitle("")
      setPriority("medium")
      setDueDate("")
      setTags([])
      setTagInput("")
      setNotes("")
      setParentTaskId("none")
      setIsAdding(false)
    } catch (error) {
      console.error("Failed to create task:", error)
      alert("Failed to create task. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === "done" ? "todo" : "done"
    try {
      await updateTask(taskId, { status: nextStatus })
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return
    try {
      await deleteTask(taskId)
    } catch (error) {
      console.error("Failed to delete task:", error)
      alert("Failed to delete task. Please try again.")
    }
  }

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || []))).sort()
  const visibleTasks = activeTagFilter ? tasks.filter((t) => (t.tags || []).includes(activeTagFilter)) : tasks

  const todoTasks = visibleTasks.filter((t) => t.status === "todo")
  const inProgressTasks = visibleTasks.filter((t) => t.status === "in_progress")
  const doneTasks = visibleTasks.filter((t) => t.status === "done")

  // Only nest within a column when no tag filter separates a parent from its
  // children; candidates for "Sub-task of" exclude tasks that are themselves
  // sub-tasks, keeping nesting to one level.
  const todoRender = activeTagFilter ? todoTasks.map((task) => ({ task, indent: 0 })) : buildTaskRenderList(todoTasks)
  const inProgressRender = activeTagFilter ? inProgressTasks.map((task) => ({ task, indent: 0 })) : buildTaskRenderList(inProgressTasks)
  const doneRender = activeTagFilter ? doneTasks.map((task) => ({ task, indent: 0 })) : buildTaskRenderList(doneTasks)
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId)

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ListTodo}
        title="Tasks"
        description="Organize and track your daily work with priorities and due dates across three stages"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              size="sm"
              variant={view === "board" ? "secondary" : "ghost"}
              className="h-8 px-2.5"
              onClick={() => setView("board")}
              aria-label="Board view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "secondary" : "ghost"}
              className="h-8 px-2.5"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="lg" className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </PageHeader>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {allTags.map((t) => (
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

      {isAdding && (
        <Card className="p-6 shadow-md">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                autoFocus
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagInput" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
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
                  id="tagInput"
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
              <Label htmlFor="notes" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={'Details, links, a checklist...\nTip: start a line with "- [ ] " for a checklist item'}
                rows={3}
              />
            </div>

            {topLevelTasks.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parentTask">Sub-task of (optional)</Label>
                <Select value={parentTaskId} onValueChange={setParentTaskId}>
                  <SelectTrigger id="parentTask">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (top-level task)</SelectItem>
                    {topLevelTasks.map((t) => (
                      <SelectItem key={t.taskId} value={t.taskId}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving || !title.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : view === "table" ? (
        <TaskTable tasks={visibleTasks} onToggle={handleToggleStatus} onDelete={handleDelete} onEdit={setEditingTask} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* To Do */}
          <Card className="p-4 border-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Circle className="h-5 w-5 text-chart-2" />
              To Do
              <span className="ml-auto text-sm font-normal text-muted-foreground">{todoTasks.length}</span>
            </h2>
            <div className="space-y-3">
              {todoRender.map(({ task, indent }) => (
                <div key={task.taskId} style={{ marginLeft: indent * 20 }} className={`group rounded-lg border-2 bg-card p-4 transition-all hover:shadow-md hover:border-chart-2/50 ${indent > 0 ? "bg-muted/30" : ""}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button type="button" onClick={() => setEditingTask(task)} className="mb-1 block text-left text-base font-semibold break-words hover:underline">{task.title}</button>
                      {task.dueDate && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((t) => (
                            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {task.notes && task.notes.trim() && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <StickyNote className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {task.notes.split("\n").find((l) => l.trim())?.replace(/^- \[[ x]\] /, "")}
                          </span>
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1 text-xs"
                      onClick={() => void updateTask(task.taskId, { status: "in_progress" })}
                    >
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1 text-xs"
                      onClick={() => handleToggleStatus(task.taskId, task.status)}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(task.taskId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {todoTasks.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No tasks yet</div>
              )}
            </div>
          </Card>

          {/* In Progress */}
          <Card className="p-4 border-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Circle className="h-5 w-5 fill-warning text-warning" />
              In Progress
              <span className="ml-auto text-sm font-normal text-muted-foreground">{inProgressTasks.length}</span>
            </h2>
            <div className="space-y-3">
              {inProgressRender.map(({ task, indent }) => (
                <div key={task.taskId} style={{ marginLeft: indent * 20 }} className={`group rounded-lg border-2 bg-card p-4 transition-all hover:shadow-md hover:border-warning/50 ${indent > 0 ? "bg-muted/30" : ""}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button type="button" onClick={() => setEditingTask(task)} className="mb-1 block text-left text-base font-semibold break-words hover:underline">{task.title}</button>
                      {task.dueDate && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((t) => (
                            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {task.notes && task.notes.trim() && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <StickyNote className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {task.notes.split("\n").find((l) => l.trim())?.replace(/^- \[[ x]\] /, "")}
                          </span>
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1 text-xs"
                      onClick={() => handleToggleStatus(task.taskId, task.status)}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(task.taskId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {inProgressTasks.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No tasks in progress</div>
              )}
            </div>
          </Card>

          {/* Done */}
          <Card className="p-4 border-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-chart-1" />
              Done
              <span className="ml-auto text-sm font-normal text-muted-foreground">{doneTasks.length}</span>
            </h2>
            <div className="space-y-3">
              {doneRender.map(({ task, indent }) => (
                <div key={task.taskId} style={{ marginLeft: indent * 20 }} className={`group rounded-lg border-2 bg-card p-4 transition-all hover:shadow-md hover:border-accent/50 ${indent > 0 ? "bg-muted/30" : ""}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button type="button" onClick={() => setEditingTask(task)} className="mb-1 block text-left text-base font-semibold break-words text-muted-foreground line-through hover:underline">{task.title}</button>
                      {task.dueDate && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((t) => (
                            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground opacity-70">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {task.notes && task.notes.trim() && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <StickyNote className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {task.notes.split("\n").find((l) => l.trim())?.replace(/^- \[[ x]\] /, "")}
                          </span>
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1 text-xs"
                      onClick={() => handleToggleStatus(task.taskId, task.status)}
                    >
                      <Circle className="mr-1.5 h-3.5 w-3.5" />
                      Undo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(task.taskId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {doneTasks.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No completed tasks</div>
              )}
            </div>
          </Card>
        </div>
      )}

      <TaskEditDialog
        task={editingTask}
        allTasks={tasks}
        projects={projects}
        onClose={() => setEditingTask(null)}
        onSave={(taskId, updates) => updateTask(taskId, updates)}
      />
    </div>
  )
}
