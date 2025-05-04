"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Calendar, 
  MoreHorizontal, 
  AlertCircle, 
  Mic, 
  Loader2, 
  MapPin, 
  Clock,
  CalendarDays 
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { EventDialog } from "@/components/event-dialog"
import { useEventDialog } from "@/hooks/use-event-dialog"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import {
  getEvents,
  deleteEvent,
  createEvent,
  updateEvent,
  type Event,
  type EventFormData,
  type EventsQueryOptions
} from "@/lib/services/event-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { format, isToday, isPast, isFuture, addDays, startOfDay } from "date-fns"

interface EventListProps {
  filter?: "all" | "today" | "upcoming" | "past"
}

export default function EventList({ filter = "all" }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newEventTitle, setNewEventTitle] = useState("")
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const { isOpen, openEventDialog, closeEventDialog, eventToEdit, setEventToEdit } = useEventDialog()
  const { startListening } = useAIAssistant()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        const fetchEvents = async () => {
          setIsLoading(true)
          try {
            const options: EventsQueryOptions = {}
            
            // Apply filters based on the selected tab
            const today = startOfDay(new Date())
            
            if (filter === "today") {
              options.startAfter = today
              options.endBefore = addDays(today, 1)
            } else if (filter === "upcoming") {
              options.startAfter = today
            } else if (filter === "past") {
              options.endBefore = today
            }
            
            // Sort events by start time
            options.orderByField = "startTime"
            options.orderDirection = "asc"
            
            const fetchedEvents = await getEvents(user.uid, options)
            setEvents(fetchedEvents)
          } catch (error) {
            console.error("Error fetching events:", error)
            toast({
              title: "Error",
              description: "Failed to load events. Please try again.",
              variant: "destructive",
            })
          } finally {
            setIsLoading(false)
          }
        }
        fetchEvents()
      } else {
        console.warn("User is not authenticated. Skipping event fetching.")
        setEvents([])
        setIsLoading(false)
      }
    }
  }, [user, authLoading, filter, toast])

  const handleQuickAddEvent = async () => {
    if (!newEventTitle.trim() || !user) {
      console.warn("Event title is empty or user is not authenticated.", { newEventTitle, user })
      return
    }
    
    setIsAddingEvent(true)
    
    try {
      // Create a basic event starting in 1 hour and lasting 1 hour
      const now = new Date()
      const startTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
      
      const eventData: EventFormData = {
        title: newEventTitle,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        allDay: false,
      }
      
      console.log("Adding quick event with data:", eventData)
      const newEvent = await createEvent(eventData, user.uid)
      setEvents((prevEvents) => [...prevEvents, newEvent])
      setNewEventTitle("")
      
      toast({
        title: "Event added",
        description: "Your event has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingEvent(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return
    
    const originalEvents = events
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
    
    try {
      await deleteEvent(eventId, user.uid)
      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully.",
      })
    } catch (error) {
      setEvents(originalEvents)
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const editEvent = (event: Event) => {
    setEventToEdit(event)
    openEventDialog()
  }

  const handleSaveEvent = async (updatedEventData: EventFormData, eventId?: string) => {
    if (!user) return
    
    const isNewEvent = !eventId
    const originalEvents = events
    
    try {
      let savedEvent: Event
      
      if (isNewEvent) {
        savedEvent = await createEvent(updatedEventData, user.uid)
        setEvents((prevEvents) => [...prevEvents, savedEvent])
      } else {
        savedEvent = await updateEvent(eventId!, updatedEventData, user.uid)
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event.id === savedEvent.id ? savedEvent : event))
        )
      }
      
      closeEventDialog()
      
      toast({
        title: isNewEvent ? "Event created" : "Event updated",
        description: `Your event has been ${isNewEvent ? "created" : "updated"} successfully.`,
      })
    } catch (error) {
      console.error("Error saving event:", error)
      setEvents(originalEvents)
      
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getEventStatusInfo = (event: Event) => {
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)
    const now = new Date()
    
    if (now > endDate) {
      return { label: "Past", color: "bg-gray-100 text-gray-800" }
    } else if (now > startDate) {
      return { label: "Ongoing", color: "bg-green-100 text-green-800" }
    } else if (isToday(startDate)) {
      return { label: "Today", color: "bg-blue-100 text-blue-800" }
    } else if (startDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { label: "Tomorrow", color: "bg-purple-100 text-purple-800" }
    } else {
      return { label: "Upcoming", color: "bg-yellow-100 text-yellow-800" }
    }
  }

  const handleVoiceAddEvent = () => {
    startListening()
  }

  const formatEventTime = (event: Event) => {
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)
    
    if (event.allDay) {
      return format(startDate, "MMM d, yyyy")
    }
    
    // Same day event
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${format(startDate, "MMM d, yyyy")} · ${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
    }
    
    // Multi-day event
    return `${format(startDate, "MMM d, h:mm a")} - ${format(endDate, "MMM d, h:mm a, yyyy")}`
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle>Events</CardTitle>
            {!isLoading && (
              <p className="text-sm text-foreground/60 mt-1">
                {events.length} event{events.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90" 
            onClick={() => openEventDialog()}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a new event..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleQuickAddEvent()
                  }
                }}
                className="flex-1"
                disabled={isAddingEvent}
              />
              <Button
                onClick={handleQuickAddEvent}
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={isAddingEvent || !newEventTitle.trim()}
              >
                {isAddingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
              <Button onClick={handleVoiceAddEvent} size="sm" variant="outline" className="text-foreground/70">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-foreground/40" />
              </div>
            ) : !user ? (
              <div className="text-center py-8">
                <p className="text-foreground/60 mb-4">Please log in to manage your events.</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-foreground/60 mb-4">You don't have any events yet.</p>
                <Button onClick={() => openEventDialog()} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const statusInfo = getEventStatusInfo(event)
                  return (
                    <div
                      key={event.id}
                      className="flex flex-col rounded-lg border p-3 transition-colors hover:bg-accent/50"
                      style={{ borderLeft: `4px solid ${event.color || "#3B82F6"}` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CalendarDays 
                            className="h-5 w-5 shrink-0" 
                            style={{ color: event.color || "#3B82F6" }}
                          />
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-medium truncate">{event.title}</h4>
                            <p className="text-xs text-foreground/60 flex items-center mt-0.5">
                              <Clock className="h-3 w-3 mr-1 shrink-0" />
                              {formatEventTime(event)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => editEvent(event)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Show details</DropdownMenuItem>
                              <DropdownMenuItem>Add to calendar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="text-red-600">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-foreground/70 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap mt-2 gap-2">
                        {event.location && (
                          <div className="flex items-center text-xs text-foreground/70">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[200px]">{event.location}</span>
                          </div>
                        )}
                        
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {event.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <EventDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeEventDialog()
        }}
        event={eventToEdit}
        onSave={(data) => handleSaveEvent(data, eventToEdit?.id)}
      />
    </>
  )
}