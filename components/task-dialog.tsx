
"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Clock, Tag, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  dueDate: z.date().optional(),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Please select a priority level",
  }),
  tags: z
    .string()
    .transform((str) => str.split(",").map((tag) => tag.trim()).filter(Boolean))
    .optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: any | null
  onSave?: (data: any, taskId?: string) => void
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const { toast } = useToast()

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
      priority: "medium",
      tags: "",
    },
  })

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title || "",
        description: task.description || "",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: task.priority || "medium",
        tags: task.tags?.join(", ") || "",
      })
    } else if (open) {
      form.reset({
        title: "",
        description: "",
        dueDate: undefined,
        priority: "medium",
        tags: "",
      })
    }
  }, [open, task, form])

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const taskData = {
        title: data.title,
        description: data.description || "",
        dueDate: data.dueDate?.toISOString(),
        priority: data.priority,
        tags: typeof data.tags === "string" 
          ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : data.tags || [],
      }

      if (onSave) {
        await onSave(taskData, task?.id)
      }

      toast({
        title: task ? "Task updated" : "Task created",
        description: `Your task has been ${task ? "updated" : "created"} successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <Clock className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? "Update your task details below."
              : "Fill in the details to create a new task. All fields except title are optional."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Task Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter task title..."
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a description for your task..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional details about this task (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date Field */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base font-medium">Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a due date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Set a deadline for this task (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority Field */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority">
                              {field.value && (
                                <div className="flex items-center gap-2">
                                  {getPriorityIcon(field.value)}
                                  <span className="capitalize">{field.value}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-500" />
                              <span>Low Priority</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span>Medium Priority</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span>High Priority</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How urgent is this task?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags Field */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="work, personal, urgent (comma-separated)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Add tags to categorize your task (comma-separated)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex gap-2 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isValid}
                className="min-w-[100px]"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : task
                  ? "Update Task"
                  : "Create Task"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

