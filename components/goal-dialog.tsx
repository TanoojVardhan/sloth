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
import { createGoal, updateGoal, type Goal, type GoalFormData } from "@/lib/services/goal-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Slider } from "@/components/ui/slider"

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal | null
  onSave: (goalFormData: GoalFormData, goalId?: string) => void
}

const GOAL_CATEGORIES = [
  "Finance",
  "Health",
  "Career",
  "Education",
  "Personal",
  "Travel",
  "Fitness",
  "Other"
]

export function GoalDialog({ open, onOpenChange, goal, onSave }: GoalDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState<number | undefined>(undefined)
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(0)
  const [completed, setCompleted] = useState(false)
  const [category, setCategory] = useState<string | undefined>("Other")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { startListening } = useAIAssistant()
  const { toast } = useToast()
  const { user } = useAuth()

  // Reset form when dialog opens/closes or goal changes
  useEffect(() => {
    if (open && goal) {
      setTitle(goal.title)
      setDescription(goal.description || "")
      setTargetAmount(goal.targetAmount)
      setCurrentAmount(goal.currentAmount || 0)
      setCompleted(goal.completed)
      setCategory(goal.category || "Other")
      setTags(goal.tags || [])
      setDueDate(goal.dueDate ? new Date(goal.dueDate) : undefined)
      setDate(goal.dueDate ? new Date(goal.dueDate) : undefined)
    } else if (open && !goal) {
      setTitle("")
      setDescription("")
      setTargetAmount(undefined)
      setCurrentAmount(0)
      setCompleted(false)
      setCategory("Other")
      setTags([])
      setDueDate(undefined)
      setDate(undefined)
    }
  }, [open, goal])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create goals",
        variant: "destructive",
      })
      return
    }

    // Validate goal data
    if (targetAmount !== undefined && targetAmount <= 0) {
      toast({
        title: "Error",
        description: "Target amount must be greater than zero",
        variant: "destructive",
      })
      return
    }

    if (currentAmount !== undefined && currentAmount < 0) {
      toast({
        title: "Error",
        description: "Current amount cannot be negative",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const goalData: GoalFormData = {
        title,
        description: description || undefined,
        targetAmount,
        currentAmount,
        completed,
        category,
        tags: tags.length > 0 ? tags : undefined,
      }

      // Add dueDate if it exists
      if (dueDate && dueDate instanceof Date && !isNaN(dueDate.getTime())) {
        const year = dueDate.getFullYear()
        const month = String(dueDate.getMonth() + 1).padStart(2, "0")
        const day = String(dueDate.getDate()).padStart(2, "0")
        goalData.dueDate = `${year}-${month}-${day}`
      }

      // Call the onSave callback with the form data and goal ID if editing
      onSave(goalData, goal?.id)
      
    } catch (error) {
      console.error("Error saving goal:", error)
      
      toast({
        title: "Error",
        description: "Failed to save goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  const getProgressPercentage = (): number => {
    if (targetAmount && targetAmount > 0 && currentAmount !== undefined) {
      const percentage = (currentAmount / targetAmount) * 100
      return Math.min(100, Math.max(0, percentage))
    }
    return 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {goal ? "Make changes to your goal here." : "Add the details for your new goal."}
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
                placeholder="Goal title"
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
                placeholder="Add details about this goal"
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
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value: string) => setCategory(value)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
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

          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input 
                  type="number" 
                  value={targetAmount || ''}
                  onChange={(e) => setTargetAmount(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-32 text-right"
                  placeholder="Optional"
                  min={0}
                />
              </div>
            </div>

            {(goal || targetAmount !== undefined) && (
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="currentAmount">Current Progress</Label>
                  <Input 
                    type="number" 
                    value={currentAmount || 0}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setCurrentAmount(value)
                      if (targetAmount !== undefined) {
                        setCompleted(value >= targetAmount)
                      }
                    }}
                    className="w-32 text-right"
                    min={0}
                    max={targetAmount}
                  />
                </div>

                {targetAmount !== undefined && targetAmount > 0 && (
                  <div className="grid gap-1">
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-primary">
                            {getProgressPercentage().toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-foreground/60">
                            {currentAmount} / {targetAmount}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-muted">
                        <div 
                          style={{ width: `${getProgressPercentage()}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                {goal ? "Saving..." : "Creating..."}
              </>
            ) : goal ? (
              "Save Changes"
            ) : (
              "Create Goal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}