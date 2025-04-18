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
import { getTasks, deleteTask, toggleTaskCompletion, createTask, type Task } from "@/lib/actions/task-actions"
import { useToast } from "@/hooks/use-toast"

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const { isOpen, openTaskDialog, closeTaskDialog, taskToEdit, setTaskToEdit } = useTaskDialog()
  const { startListening } = useAIAssistant()
  const { toast } = useToast()

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTasks()
        setTasks(fetchedTasks)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [toast])

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsAddingTask(true)

    try {
      const newTask = await createTask({
        title: newTaskTitle,
        completed: false,
        priority: "medium",
      })

      setTasks([...tasks, newTask])
      setNewTaskTitle("")
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      })
    } catch (error) {
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
    try {
      const updatedTask = await toggleTaskCompletion(taskId)
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      })
    } catch (error) {
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

  const handleSaveTask = (updatedTask: Task) => {
    if (taskToEdit) {
      // Update existing task
      setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    } else {
      // Add new task
      setTasks([...tasks, updatedTask])
    }
    closeTaskDialog()
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
        return "bg-slate-100 text-slate-800"
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
          <CardTitle>Tasks</CardTitle>
          <Button size="sm" className="bg-slate-800 hover:bg-slate-700" onClick={() => openTaskDialog()}>
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
                className="bg-slate-800 hover:bg-slate-700"
                disabled={isAddingTask || !newTaskTitle.trim()}
              >
                {isAddingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
              <Button onClick={handleVoiceAddTask} size="sm" variant="outline" className="text-slate-700">
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">You don't have any tasks yet.</p>
                <Button onClick={() => openTaskDialog()} className="bg-slate-800 hover:bg-slate-700">
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50",
                      task.completed ? "bg-slate-50/50 border-slate-100" : "bg-white",
                      isOverdue(task.dueDate) && !task.completed && "border-red-200 bg-red-50/30",
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTaskCompletion(task.id)}
                        id={`task-${task.id}`}
                        className={task.completed ? "text-slate-400" : ""}
                      />
                      <div className="flex flex-col min-w-0">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                            task.completed && "line-through text-slate-400",
                          )}
                        >
                          {task.title}
                        </label>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 truncate max-w-[300px]">{task.description}</p>
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
                            isOverdue(task.dueDate) && !task.completed ? "text-red-500" : "text-slate-500",
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

      <TaskDialog open={isOpen} onOpenChange={closeTaskDialog} task={taskToEdit} onSave={handleSaveTask} />
    </>
  )
}
