"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  CalendarIcon, 
  ListIcon, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from "lucide-react"
import { format, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameDay, startOfDay, endOfDay, addDays as addDate, subDays } from "date-fns"
import { useEventDialog } from "@/hooks/use-event-dialog"
import { getEvents } from "@/lib/services/event-service"
import { motion } from "framer-motion";

interface Event {
  id: string
  title: string
  time: string
  date: number
  color: string
  startDate: Date 
  description?: string
  location?: string
}

type CalendarViewType = "month" | "agenda" | "week" | "day"

export function CalendarView() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewType, setViewType] = useState<CalendarViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const { user } = useAuth()
  const { openEventDialog } = useEventDialog()

  // Get current date information
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  // Calculate first day of month and total days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  // Check if the current displayed date is today
  const isToday = (
    currentDate.getDate() === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()
  )
  
  // Navigation functions
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())
  const goToNextDay = () => setCurrentDate(addDate(currentDate, 1))
  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1))
  
  // Fetch events from Firestore using our service
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        
        // Determine date range based on view type
        let startDate, endDate;
        if (viewType === "month") {
          // For month view, get full month
          startDate = new Date(currentYear, currentMonth, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        } else if (viewType === "week") {
          // For week view, get current week
          startDate = startOfWeek(currentDate);
          endDate = endOfWeek(currentDate);
        } else if (viewType === "day") {
          // For day view, get current day
          startDate = startOfDay(currentDate);
          endDate = endOfDay(currentDate);
        } else {
          // For agenda view, get full month by default
          startDate = new Date(currentYear, currentMonth, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        }
        
        // To avoid Firestore composite index errors, we'll use only startAfter and filter the results in memory
        // This is a workaround for the Firebase error about multiple range queries
        const fetchedServiceEvents = await getEvents(user.uid, {
          startAfter: new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate()),
          orderByField: "startTime",
          orderDirection: "asc"
        });
        
        // Filter events client-side to match the date range
        const filteredEvents = fetchedServiceEvents.filter(event => {
          const eventStartTime = new Date(event.startTime);
          const eventEndTime = new Date(event.endTime);
          
          // Include events that start before the end date and end after the start date
          return eventStartTime <= endDate && eventEndTime >= startDate;
        });
        
        // Convert to our local Event format
        const formattedEvents: Event[] = filteredEvents.map(event => {
          const eventStartDate = new Date(event.startTime);
          return {
            id: event.id,
            title: event.title,
            time: format(eventStartDate, 'h:mm a'),
            date: eventStartDate.getDate(),
            color: getEventColorClass(event.color),
            startDate: eventStartDate,
            description: event.description || "",
            location: event.location || ""
          };
        });
        
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEvents()
  }, [user, currentDate, currentMonth, currentYear, viewType])

  // Helper function to convert color hex to a Tailwind class
  const getEventColorClass = (colorHex?: string) => {
    if (!colorHex) return "bg-blue-500";
    
    const colorMap: Record<string, string> = {
      "#3B82F6": "bg-blue-500",
      "#10B981": "bg-green-500",
      "#EF4444": "bg-red-500",
      "#F59E0B": "bg-yellow-500", 
      "#8B5CF6": "bg-purple-500",
      "#EC4899": "bg-pink-500",
      "#6366F1": "bg-indigo-500"
    };
    
    return colorMap[colorHex] || "bg-blue-500";
  }

  // Helper function to get a random event color
  const getRandomEventColor = () => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-red-500", "bg-green-500", "bg-yellow-500"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  // Event helper functions
  const getEventsForDay = (day: number) => events.filter((event) => event.date === day)
  const getEventsForDate = (date: Date) => events.filter((event) => isSameDay(event.startDate, date))

  // Group events by date for agenda view
  const getGroupedEventsByDate = () => {
    const groupedEvents: { [key: string]: Event[] } = {}
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    
    sortedEvents.forEach(event => {
      const dateString = format(event.startDate, "EEEE, MMMM d, yyyy")
      if (!groupedEvents[dateString]) {
        groupedEvents[dateString] = []
      }
      groupedEvents[dateString].push(event)
    })
    
    return groupedEvents
  }

  // Get days of current week for week view
  const getDaysOfWeek = () => {
    const weekStart = startOfWeek(currentDate)
    return Array(7).fill(0).map((_, i) => addDays(weekStart, i))
  }

  const renderMonthView = () => {
    return (
      <motion.div
        key={currentDate.toISOString()}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((day) => (
            <div key={day} className="text-sm font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 border border-slate-100 rounded-md p-1"></div>
          ))}
          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayEvents = getEventsForDay(day)
            const isCurrentDay = 
              day === today.getDate() && 
              currentMonth === today.getMonth() && 
              currentYear === today.getFullYear()
            
            const isSelectedDay = day === currentDate.getDate() &&
                  currentMonth === currentDate.getMonth() &&
                  currentYear === currentDate.getFullYear();

                return (
                  <div
                    key={day}
                    className={cn(
                      "h-24 border border-slate-200 rounded-md p-1 overflow-hidden cursor-pointer hover:bg-slate-50",
                      isCurrentDay && "bg-slate-50 border-slate-300",
                      isSelectedDay && "bg-orange-200 text-white"
                    )}
                    onClick={() => {
                      setCurrentDate(new Date(currentYear, currentMonth, day))
                      setViewType("day")
                    }}
                  >
                    <div
                      className={cn(
                        "text-right text-sm p-1",
                        isCurrentDay &&
                          "font-bold bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto",
                        isSelectedDay &&
                          "font-bold bg-orange-800 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto"
                      )}
                    >
                      {day}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={cn(
                            "text-xs truncate px-1 py-0.5 rounded",
                            event.color.replace("bg-", "bg-opacity-15 text-").replace("-500", "-800"),
                          )}
                        >
                          <div className="flex items-center">
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-1", event.color)}></div>
                            <span>
                              {event.time} {event.title}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  const renderAgendaView = () => {
    const groupedEvents = getGroupedEventsByDate()
    const dateKeys = Object.keys(groupedEvents)
    
    if (dateKeys.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md bg-slate-50">
          <p className="text-slate-500">No events scheduled for {monthNames[currentMonth]} {currentYear}</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        {dateKeys.map((dateString) => (
          <div key={dateString} className="border rounded-md overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 font-medium">
              {dateString}
            </div>
            <div className="divide-y">
              {groupedEvents[dateString].map((event) => (
                <div key={event.id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-16 text-slate-500">
                      {event.time}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <div className={cn("w-2 h-2 rounded-full mr-2", event.color)}></div>
                        <h3 className="font-medium">{event.title}</h3>
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center">
                          <span className="inline-block w-3 h-3 mr-1">📍</span> {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderWeekView = () => {
    const days = getDaysOfWeek()
    
    return (
      <div className="border rounded-md overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-slate-100">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "px-2 py-3 text-center text-sm font-medium",
                isSameDay(day, today) && "bg-slate-200"
              )}
            >
              <div>{format(day, "EEE")}</div>
              <div className={cn(
                "w-6 h-6 mx-auto rounded-full flex items-center justify-center",
                isSameDay(day, today) && "bg-slate-800 text-white"
              )}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week events */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day)
            return (
              <div 
                key={index} 
                className={cn(
                  "border-r border-b p-1 overflow-y-auto",
                  isSameDay(day, today) && "bg-slate-50",
                  index === 6 && "border-r-0" // no right border on last column
                )}
                onClick={() => {
                  setCurrentDate(day)
                  setViewType("day")
                }}
              >
                {dayEvents.map((event, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-xs mb-1 p-1 rounded",
                      event.color.replace("bg-", "bg-opacity-15 text-").replace("-500", "-800"),
                    )}
                  >
                    <div className="flex items-center">
                      <div className={cn("w-1.5 h-1.5 rounded-full mr-1", event.color)}></div>
                      <span className="truncate">
                        {event.time} {event.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const eventsOfDay = getEventsForDate(currentDate)
    
    if (eventsOfDay.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md bg-slate-50">
          <p className="text-slate-500">No events scheduled for {format(currentDate, "EEEE, MMMM d, yyyy")}</p>
        </div>
      )
    }
    
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 font-medium">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </div>
        <div className="divide-y">
          {eventsOfDay.map((event) => (
            <div key={event.id} className="p-4 hover:bg-slate-50">
              <div className="flex">
                <div className="flex-shrink-0 w-16 text-slate-500">
                  {event.time}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center">
                    <div className={cn("w-2 h-2 rounded-full mr-2", event.color)}></div>
                    <h3 className="font-medium">{event.title}</h3>
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-500 mt-2">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center">
                      <span className="inline-block w-3 h-3 mr-1">📍</span> {event.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          {/* Top row with month/date navigation */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPreviousMonth}
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium">
              {format(currentDate, "MMMM yyyy")}
            </span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth}
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPreviousDay}
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium">
              {format(currentDate, "MMMM d, yyyy")}
            </span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextDay}
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          {/* Bottom row with title and controls */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {viewType === "month" && format(currentDate, "MMMM yyyy")}
              {viewType === "week" && `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`}
              {viewType === "day" && format(currentDate, "MMMM d, yyyy")}
              {viewType === "agenda" && "Agenda"}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* View controls */}
            <div className="bg-slate-100 rounded-lg p-1 flex">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setViewType("day")}
                className={cn(
                  "rounded-md px-3",
                  viewType === "day" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                Day
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setViewType("week")}
                className={cn(
                  "rounded-md px-3",
                  viewType === "week" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                Week
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setViewType("month")}
                className={cn(
                  "rounded-md px-3",
                  viewType === "month" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                Month
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              disabled={isToday}
              className={cn(
                "rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200",
                isToday && "opacity-50 cursor-not-allowed"
              )}
            >
              Today
            </Button>
            
            <Button 
              variant={viewType === "agenda" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewType("agenda")}
              className="rounded-lg"
            >
              <ListIcon className="h-4 w-4 mr-2" />
              Agenda
            </Button>
            
            <Button 
              variant="default"
              size="sm"
              onClick={openEventDialog}
              className="rounded-lg bg-amber-700 hover:bg-amber-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {viewType === "month" && renderMonthView()}
            {viewType === "agenda" && renderAgendaView()}
            {viewType === "week" && renderWeekView()}
            {viewType === "day" && renderDayView()}
          </>
        )}
      </div>
    </div>
  )
}
