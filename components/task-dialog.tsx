"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Mic, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { createTask, updateTask, type Task, type TaskFormData } from "@/lib/services/task-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave: (task: Task) => void
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { startListening } = useAIAssistant()
  const { toast } = useToast()
  const { user } = useAuth()

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
      setTags(task.tags || [])
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setDate(task.dueDate ? new Date(task.dueDate) : undefined)
    } else if (open && !task) {
      setTitle("")
      setDescription("")
      setPriority("medium")
      setTags([])
      setDueDate(undefined)
      setDate(undefined)
    }
  }, [open, task])

  // Add a console log to check auth state when the dialog opens
  useEffect(() => {
    if (open) {
      console.log("TaskDialog opened - Auth state:", { 
        isAuthenticated: !!user, 
        userId: user?.uid,
        userEmail: user?.email,
        providerId: user?.providerId
      });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      console.error("User not authenticated when saving task");
      toast({
        title: "Error",
        description: "You must be logged in to create tasks",
        variant: "destructive",
      })
      return
    }

    // Print full user object for debugging (removing sensitive info)
    const userDebug = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      providerId: user.providerId,
      authProvider: user.providerData?.length > 0 ? user.providerData[0].providerId : 'unknown'
    };
    
    console.log("Starting task save process with authenticated user:", userDebug);
    setIsSubmitting(true)

    try {
      // Create task data without the dueDate first
      const taskData: TaskFormData = {
        title,
        description: description || undefined,
        priority,
        completed: task?.completed || false,
        tags: tags.length > 0 ? tags : undefined,
      }

      // Add dueDate if it exists, with explicit formatting and validation
      if (dueDate && dueDate instanceof Date && !isNaN(dueDate.getTime())) {
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, '0');
        const day = String(dueDate.getDate()).padStart(2, '0');
        taskData.dueDate = `${year}-${month}-${day}`;
        console.log("Formatted due date:", taskData.dueDate);
      }

      console.log("Task data prepared:", JSON.stringify(taskData));
      console.log("User ID for task:", user.uid);
      
      let savedTask: Task;
      
      if (task?.id) {
        // Update existing task
        console.log("Updating existing task with ID:", task.id);
        savedTask = await updateTask(task.id, taskData, user.uid);
        console.log("Task updated successfully:", savedTask);
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully.",
        });
      } else {
        // Create new task
        console.log("Creating new task...");
        try {
          savedTask = await createTask(taskData, user.uid);
          console.log("Task created successfully:", savedTask);
          toast({
            title: "Task created",
            description: "Your task has been created successfully.",
          });
        } catch (createError) {
          console.error("Detailed create task error:", createError);
          throw createError;
        }
      }

      onSave(savedTask);
      onOpenChange(false);
    } catch (error) {
      console.error("Error details:", error);
      
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // More descriptive error message
      let errorMessage = "Failed to save task. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Add additional context for specific errors
        if (errorMessage.includes("permission-denied") || errorMessage.includes("unauthorized")) {
          errorMessage = "You don't have permission to create or modify this task.";
        } else if (errorMessage.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (errorMessage.includes("unauthenticated") || errorMessage.includes("auth")) {
          errorMessage = "Authentication error. Please log out and log back in.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()])
      setTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleVoiceInput = (field: string) => {
    startListening()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Make changes to your task here." : "Add the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleVoiceInput("title")}
                className="shrink-0"
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Use voice for title</span>
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <div className="flex gap-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this task"
                className="resize-none flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleVoiceInput("description")}
                className="shrink-0 self-start"
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Use voice for description</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="due-date"
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !date && "text-foreground/60")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      setDate(date)
                      setDueDate(date)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={() => handleVoiceInput("tags")}>
                <Mic className="h-4 w-4" />
                <span className="sr-only">Use voice for tags</span>
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="flex items-center gap-1">
                    {t}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveTag(t)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {t} tag</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {task ? "Saving..." : "Creating..."}
              </>
            ) : task ? (
              "Save Changes"
            ) : (
              "Create Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
