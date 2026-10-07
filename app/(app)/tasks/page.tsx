"use client"

import { useState } from "react"
import { useTasks } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PriorityBadge } from "@/components/priority-badge"
import { CheckCircle2, Circle, Trash2, Plus, Loader2, ListTodo, Calendar as CalendarIcon } from "lucide-react"
import type { TaskStatus, TaskPriority } from "@/types/entities"

export default function TasksPage() {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks()
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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
      })
      setTitle("")
      setPriority("medium")
      setDueDate("")
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

  const todoTasks = tasks.filter((t) => t.status === "todo")
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ListTodo}
        title="Tasks"
        description="Organize and track your daily work with priorities and due dates across three stages"
        gradient="from-emerald-600 to-teal-600"
      >
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="lg" className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </PageHeader>

      {isAdding && (
        <Card className="p-6">
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
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* To Do */}
          <Card className="p-4">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Circle className="h-5 w-5 text-blue-500" />
              To Do
              <span className="ml-auto text-sm font-normal text-muted-foreground">{todoTasks.length}</span>
            </h2>
            <div className="space-y-2">
              {todoTasks.map((task) => (
                <div key={task.taskId} className="group rounded-lg border bg-card p-3 transition-colors hover:bg-accent">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      {task.dueDate && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1"
                      onClick={() => handleToggleStatus(task.taskId, task.status)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(task.taskId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {todoTasks.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
              )}
            </div>
          </Card>

          {/* In Progress */}
          <Card className="p-4">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Circle className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              In Progress
              <span className="ml-auto text-sm font-normal text-muted-foreground">{inProgressTasks.length}</span>
            </h2>
            <div className="space-y-2">
              {inProgressTasks.map((task) => (
                <div key={task.taskId} className="group rounded-lg border bg-card p-3 transition-colors hover:bg-accent">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      {task.dueDate && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1"
                      onClick={() => handleToggleStatus(task.taskId, task.status)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(task.taskId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {inProgressTasks.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No tasks in progress</div>
              )}
            </div>
          </Card>

          {/* Done */}
          <Card className="p-4">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Done
              <span className="ml-auto text-sm font-normal text-muted-foreground">{doneTasks.length}</span>
            </h2>
            <div className="space-y-2">
              {doneTasks.map((task) => (
                <div key={task.taskId} className="group rounded-lg border bg-card p-3 opacity-75 transition-all hover:opacity-100">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium line-through">{task.title}</div>
                      {task.dueDate && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 flex-1"
                      onClick={() => handleToggleStatus(task.taskId, task.status)}
                    >
                      <Circle className="mr-1 h-3 w-3" />
                      Undo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(task.taskId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {doneTasks.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No completed tasks</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
