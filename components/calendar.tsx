"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import UpcomingEvents from "./upcoming-events"
import { createEvent } from "@/lib/services/event-service"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getTasks } from "@/lib/services/task-service"
import { getGoals } from "@/lib/services/goal-service"

interface CalendarItem {
  id: string
  date: number
  title: string
  time: string
  color: string
  type: 'event' | 'task' | 'goal' | 'project'
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  })

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const monthName = currentDate.toLocaleString("default", { month: "long" })
  const year = currentDate.getFullYear()

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Fetch events, tasks, goals, and projects from Firestore
  useEffect(() => {
    const fetchCalendarItems = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Get first and last day of month for query
        const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

        // 1. Query events for current month
        const eventsRef = collection(db, "events")
        const eventsQuery = query(
          eventsRef,
          where("userId", "==", user.uid),
          where("startTime", ">=", Timestamp.fromDate(firstDayOfCurrentMonth)),
          where("startTime", "<=", Timestamp.fromDate(lastDayOfCurrentMonth))
        )

        // 2. Get tasks with due dates in the current month
        const tasksPromise = getTasks(user.uid, {
          dueAfter: firstDayOfCurrentMonth,
          dueBefore: lastDayOfCurrentMonth
        });

        // 3. Get goals with due dates in the current month
        const goalsPromise = getGoals(user.uid, {
          dueAfter: firstDayOfCurrentMonth,
          dueBefore: lastDayOfCurrentMonth
        });

        // 4. Execute event query
        const eventsPromise = getDocs(eventsQuery);

        // 5. Wait for all promises to resolve
        const [tasksResult, goalsResult, eventsSnapshot] = await Promise.all([
          tasksPromise, 
          goalsPromise,
          eventsPromise
        ]);

        const calendarItems: CalendarItem[] = [];

        // Process events
        eventsSnapshot.forEach((doc) => {
          const data = doc.data();
          const eventDate = data.startTime.toDate();

          calendarItems.push({
            id: doc.id,
            title: data.title,
            time: eventDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            }),
            date: eventDate.getDate(),
            color: data.color || "bg-blue-500", // Default color for events
            type: 'event'
          });
        });

        // Process tasks
        tasksResult.forEach(task => {
          if (task.dueDate) {
            // Create a proper date object from the ISO date string
            const taskDate = new Date(task.dueDate);
            
            // Make sure the date is valid before adding it to calendar items
            if (!isNaN(taskDate.getTime())) {
              calendarItems.push({
                id: task.id,
                title: task.title,
                time: "Due",
                date: taskDate.getDate(),
                color: getPriorityColor(task.priority),
                type: 'task'
              });
              console.log(`Added task to calendar: ${task.title} for date ${taskDate.getDate()}`);
            } else {
              console.error(`Invalid date for task ${task.id}: ${task.dueDate}`);
            }
          }
        });

        // Process goals
        goalsResult.forEach(goal => {
          if (goal.dueDate) {
            const goalDate = new Date(goal.dueDate);
            
            calendarItems.push({
              id: goal.id,
              title: goal.title,
              time: "Due",
              date: goalDate.getDate(),
              color: "bg-purple-500", // Color for goals
              type: 'goal'
            });
          }
        });

        // Sort items by date and time
        calendarItems.sort((a, b) => {
          // First sort by date
          if (a.date !== b.date) return a.date - b.date;
          
          // If same date, events with specific times go first
          if (a.time !== 'Due' && b.time === 'Due') return -1;
          if (a.time === 'Due' && b.time !== 'Due') return 1;
          
          // Otherwise sort by type priority: event, task, goal, project
          const typePriority = { 'event': 0, 'task': 1, 'goal': 2, 'project': 3 };
          return typePriority[a.type] - typePriority[b.type];
        });

        setCalendarItems(calendarItems);
      } catch (error) {
        console.error("Error fetching calendar items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendarItems()
  }, [user, currentDate])

  // Helper function to get a color for task priority
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-slate-500"
    }
  }

  // Get a random event color (maintained for backward compatibility)
  const getRandomEventColor = () => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-red-500", "bg-green-500", "bg-yellow-500"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear()

  const getItemsForDay = (day: number) => calendarItems.filter((item) => item.date === day)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const handleAddEvent = () => {
    setIsDialogOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!user) return

    try {
      if (!newEvent.title) {
        toast({
          title: "Error",
          description: "Title is required",
          variant: "destructive",
        })
        return
      }

      if (!newEvent.startDate || !newEvent.startTime) {
        toast({
          title: "Error",
          description: "Start date and time are required",
          variant: "destructive",
        })
        return
      }

      if (!newEvent.endDate || !newEvent.endTime) {
        toast({
          title: "Error",
          description: "End date and time are required",
          variant: "destructive",
        })
        return
      }

      // Create ISO strings for start and end times
      const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}:00`);
      const endDateTime = new Date(`${newEvent.endDate}T${newEvent.endTime}:00`);

      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({
          title: "Error",
          description: "Invalid date format",
          variant: "destructive",
        })
        return
      }

      // Check if end time is after start time
      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        })
        return
      }

      await createEvent(
        {
          title: newEvent.title,
          description: newEvent.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          allDay: false,
        },
        user.uid
      )

      setIsDialogOpen(false)
      setNewEvent({ title: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "" })

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      // Refresh events
      const currentDateCopy = new Date(currentDate);
      setCurrentDate(new Date(currentDateCopy));

    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  // Helper function to get an icon/indicator for different item types
  const getItemTypeIndicator = (type: string): string => {
    switch(type) {
      case 'event':
        return '●' // Circle for events
      case 'task':
        return '■' // Square for tasks
      case 'goal':
        return '★' // Star for goals
      case 'project':
        return '◆' // Diamond for projects
      default:
        return '●'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {monthName} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((day) => (
            <div key={day} className="text-xs font-medium text-slate-500 py-1">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-9 rounded-md"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayItems = getItemsForDay(day)
            return (
              <TooltipProvider key={day} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-9 flex flex-col items-center justify-center rounded-md relative cursor-pointer hover:bg-slate-100 transition-colors",
                        isToday(day) && "bg-slate-800 text-white hover:bg-slate-700",
                        !isToday(day) && dayItems.length > 0 && "font-medium"
                      )}
                    >
                      <span className="text-sm">{day}</span>
                      {dayItems.length > 0 && (
                        <div className="flex space-x-0.5 absolute -bottom-1">
                          {dayItems.slice(0, 3).map((item, i) => (
                            <div key={i} className={cn("w-1 h-1 rounded-full", item.color)}></div>
                          ))}
                          {dayItems.length > 3 && <div className="w-1 h-1 rounded-full bg-slate-400"></div>}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {dayItems.length > 0 && (
                    <TooltipContent side="bottom" className="p-0 overflow-hidden">
                      <div className="p-2">
                        <div className="font-medium text-sm pb-1">
                          {monthName} {day}
                        </div>
                        <div className="space-y-1">
                          {dayItems.map((item, i) => (
                            <div key={i} className="flex items-center text-xs">
                              <div className={cn("w-2 h-2 rounded-full mr-2", item.color)}></div>
                              <span className="font-medium">{item.time}</span>
                              <span className="mx-1">-</span>
                              <span>{item.title}</span>
                              <span className="ml-1 text-xs opacity-70">{getItemTypeIndicator(item.type)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Upcoming Items</h4>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleAddEvent}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleAddEvent}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <UpcomingEvents />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
              <span>Events</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
              <span>High Priority Tasks</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
              <span>Goals</span>
            </div>
          </div>
        </div>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <Textarea
              placeholder="Event Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Start Date"
              value={newEvent.startDate}
              onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
            />
            <Input
              type="time"
              placeholder="Start Time"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={newEvent.endDate}
              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
            />
            <Input
              type="time"
              placeholder="End Time"
              value={newEvent.endTime}
              onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}