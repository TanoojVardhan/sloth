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
import { CalendarIcon, Mic, Loader2, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addHours } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { type Event, type EventFormData } from "@/lib/services/event-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Checkbox } from "@/components/ui/checkbox"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: Event | null
  onSave: (eventData: EventFormData, eventId?: string) => void
}

const EVENT_COLORS = [
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#10B981" },
  { label: "Red", value: "#EF4444" },
  { label: "Yellow", value: "#F59E0B" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Pink", value: "#EC4899" },
  { label: "Indigo", value: "#6366F1" },
]

export function EventDialog({ open, onOpenChange, event, onSave }: EventDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>("12:00")
  const [endTime, setEndTime] = useState<string>("13:00")
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState("#3B82F6") // Default blue
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { startListening } = useAIAssistant()
  const { toast } = useToast()
  const { user } = useAuth()

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open && event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setLocation(event.location || "")
      
      // Parse dates from ISO strings
      const startDateTime = new Date(event.startTime)
      const endDateTime = new Date(event.endTime)
      
      setStartDate(startDateTime)
      setEndDate(endDateTime)
      
      // Format times from Date objects
      setStartTime(format(startDateTime, "HH:mm"))
      setEndTime(format(endDateTime, "HH:mm"))
      
      setAllDay(event.allDay)
      setColor(event.color || "#3B82F6")
      setTags(event.tags || [])
    } else if (open && !event) {
      // Default values for new event
      const now = new Date()
      setTitle("")
      setDescription("")
      setLocation("")
      setStartDate(now)
      setEndDate(addHours(now, 1))
      setStartTime(format(now, "HH:mm"))
      setEndTime(format(addHours(now, 1), "HH:mm"))
      setAllDay(false)
      setColor("#3B82F6")
      setTags([])
    }
  }, [open, event])

  // Log auth state for debugging
  useEffect(() => {
    if (open) {
      console.log("EventDialog opened - Auth state:", { 
        isAuthenticated: !!user, 
        userId: user?.uid,
        userEmail: user?.email,
        providerId: user?.providerId
      })
    }
  }, [open, user])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      })
      return
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Start and end dates are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time into ISO strings
      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)
      
      if (!allDay) {
        const [startHours, startMinutes] = startTime.split(":").map(Number)
        const [endHours, endMinutes] = endTime.split(":").map(Number)
        
        startDateTime.setHours(startHours, startMinutes, 0, 0)
        endDateTime.setHours(endHours, endMinutes, 0, 0)
      } else {
        // For all-day events, set start to beginning of day and end to end of day
        startDateTime.setHours(0, 0, 0, 0)
        endDateTime.setHours(23, 59, 59, 999)
      }

      // Create event data object
      const eventData: EventFormData = {
        title,
        description: description || undefined,
        location: location || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        allDay,
        color,
        tags: tags.length > 0 ? tags : undefined,
      }

      console.log("Event data prepared:", JSON.stringify(eventData))
      
      // Call the onSave callback with the form data and event ID if editing
      onSave(eventData, event?.id)
      
    } catch (error) {
      console.error("Error saving event:", error)
      
      let errorMessage = "Failed to save event. Please try again."
      
      if (error instanceof Error) {
        console.error("Error name:", error.name)
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
        
        if (error.message.includes("permission-denied") || error.message.includes("unauthorized")) {
          errorMessage = "You don't have permission to create or modify this event."
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("unauthenticated") || error.message.includes("auth")) {
          errorMessage = "Authentication error. Please log out and log back in."
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
  
  // Function to render color circle
  const renderColorCircle = (colorValue: string) => (
    <div
      className="w-4 h-4 rounded-full mr-2 event-dialog-color"
      data-color={colorValue}
    />
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
          <DialogDescription>
            {event ? "Make changes to your event here." : "Add the details for your new event."}
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
                placeholder="Event title"
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
                placeholder="Add details about this event"
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

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event location"
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleVoiceInput("location")}
                className="shrink-0"
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Use voice for location</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="all-day" 
              checked={allDay} 
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">All-day event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !startDate && "text-foreground/60")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        // If end date is before start date, set it to start date
                        if (endDate && date > endDate) {
                          setEndDate(date)
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !endDate && "text-foreground/60")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => !startDate || date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value)
                      // If start time is after end time, adjust end time
                      if (startDate?.toDateString() === endDate?.toDateString() && e.target.value > endTime) {
                        setEndTime(e.target.value)
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={(value: string) => setColor(value)}>
              <SelectTrigger id="color" className="flex items-center">
                <div className="flex items-center">
                  {renderColorCircle(color)}
                  <SelectValue placeholder="Select color" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {EVENT_COLORS.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value} className="flex items-center">
                    <div className="flex items-center">
                      {renderColorCircle(colorOption.value)}
                      {colorOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {event ? "Saving..." : "Creating..."}
              </>
            ) : event ? (
              "Save Changes"
            ) : (
              "Create Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}