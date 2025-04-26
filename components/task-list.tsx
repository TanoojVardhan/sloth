"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, MoreHorizontal, AlertCircle, Mic, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskDialog } from "@/components/task-dialog"
import { useTaskDialog } from "@/hooks/use-task-dialog"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import {
  getTasks,
  deleteTask,
  toggleTaskCompletion,
  createTask,
  updateTask,
  getTaskStats,
  type Task,
  type TaskFormData,
} from "@/lib/services/task-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface TaskStats {
  total: number
  completed: number
  pending: number
  overdue: number
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, pending: 0, overdue: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const { isOpen, openTaskDialog, closeTaskDialog, taskToEdit, setTaskToEdit } = useTaskDialog()
  const { startListening } = useAIAssistant()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const [fetchedTasks, fetchedStats] = await Promise.all([getTasks(user.uid), getTaskStats(user.uid)])
          setTasks(fetchedTasks)
          setStats(fetchedStats)
        } catch (error) {
          console.error("Error fetching tasks or stats:", error)
          toast({
            title: "Error",
            description: "Failed to load tasks or stats. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    } else if (!authLoading && !user) {
      setTasks([])
      setStats({ total: 0, completed: 0, pending: 0, overdue: 0 })
      setIsLoading(false)
    }
  }, [user, authLoading, toast])

  const refreshStats = async () => {
    if (!user) return
    try {
      const fetchedStats = await getTaskStats(user.uid)
      setStats(fetchedStats)
    } catch (error) {
      console.error("Error refreshing stats:", error)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) {
      console.warn("Task title is empty or user is not authenticated.", { newTaskTitle, user })
      return
    }
    setIsAddingTask(true)
    try {
      const taskData: TaskFormData = {
        title: newTaskTitle,
        completed: false,
        priority: "medium",
      }
      console.log("Adding task with data:", taskData)
      const newTask = await createTask(taskData, user.uid)
      setTasks((prevTasks) => [...prevTasks, newTask])
      setNewTaskTitle("")
      await refreshStats()
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingTask(false)
    }
  }

  const handleToggleTaskCompletion = async (taskId: string) => {
    if (!user) return

    const originalTasks = tasks
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    )
    await refreshStats()

    try {
      await toggleTaskCompletion(taskId, user.uid)
      await refreshStats()
    } catch (error) {
      setTasks(originalTasks)
      await refreshStats()
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return

    const originalTasks = tasks
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
    await refreshStats()

    try {
      await deleteTask(taskId, user.uid)
      await refreshStats()
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      })
    } catch (error) {
      setTasks(originalTasks)
      await refreshStats()
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const editTask = (task: Task) => {
    setTaskToEdit(task)
    openTaskDialog()
  }

  const handleSaveTask = async (updatedTaskData: TaskFormData, taskId?: string) => {
    if (!user) return

    const isNewTask = !taskId
    const originalTasks = tasks

    if (!isNewTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...updatedTaskData,
                dueDate: updatedTaskData.dueDate
                  ? new Date(updatedTaskData.dueDate).toISOString().split("T")[0]
                  : undefined,
              }
            : task
        )
      )
    }
    await refreshStats()

    try {
      let savedTask: Task
      if (isNewTask) {
        savedTask = await createTask(updatedTaskData, user.uid)
        setTasks((prevTasks) => [...prevTasks, savedTask])
      } else {
        savedTask = await updateTask(taskId!, updatedTaskData, user.uid)
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === savedTask.id ? savedTask : task))
        )
      }
      await refreshStats()
      closeTaskDialog()
      toast({
        title: isNewTask ? "Task created" : "Task updated",
        description: `Your task has been ${isNewTask ? "created" : "updated"} successfully.`,
      })
    } catch (error) {
      console.error("Error saving task:", error)
      setTasks(originalTasks)
      await refreshStats()
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-foreground/10 text-foreground/70"
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const taskDate = new Date(dueDate)
    return taskDate < today
  }

  const handleVoiceAddTask = () => {
    startListening()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle>Tasks</CardTitle>
            {!isLoading && stats.pending > 0 && (
              <p className="text-sm text-foreground/60 mt-1">
                {stats.pending} pending task{stats.pending !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => openTaskDialog()}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTask()
                  }
                }}
                className="flex-1"
                disabled={isAddingTask}
              />
              <Button
                onClick={handleAddTask}
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={isAddingTask || !newTaskTitle.trim()}
              >
                {isAddingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
              <Button onClick={handleVoiceAddTask} size="sm" variant="outline" className="text-foreground/70">
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-foreground/40" />
              </div>
            ) : !user ? (
              <div className="text-center py-8">
                <p className="text-foreground/60 mb-4">Please log in to manage your tasks.</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-foreground/60 mb-4">You don't have any tasks yet.</p>
                <Button onClick={() => openTaskDialog()} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50",
                      task.completed ? "bg-accent/30 border-accent/30" : "bg-white",
                      isOverdue(task.dueDate) && !task.completed && "border-red-200 bg-red-50/30"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTaskCompletion(task.id)}
                        id={`task-${task.id}`}
                        className={task.completed ? "text-foreground/40" : ""}
                      />
                      <div className="flex flex-col min-w-0">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                            task.completed && "line-through text-foreground/40"
                          )}
                        >
                          {task.title}
                        </label>
                        {task.description && (
                          <p className="text-xs text-foreground/60 mt-1 truncate max-w-[300px]">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.dueDate && (
                        <div
                          className={cn(
                            "flex items-center text-xs",
                            isOverdue(task.dueDate) && !task.completed ? "text-red-500" : "text-foreground/60"
                          )}
                        >
                          {isOverdue(task.dueDate) && !task.completed ? (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Calendar className="h-3 w-3 mr-1" />
                          )}
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                      <div className={cn("text-xs px-2 py-0.5 rounded-full", getPriorityColor(task.priority))}>
                        {task.priority}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editTask(task)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Set reminder</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeTaskDialog()
        }}
        task={taskToEdit}
        onSave={(data) => handleSaveTask(data, taskToEdit?.id)}
      />
    </>
  )
}
