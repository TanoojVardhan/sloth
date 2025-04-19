"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import UpcomingEvents from "./upcoming-events"

interface CalendarEvent {
  id: string
  date: number
  title: string
  time: string
  color: string
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { openAssistant } = useAIAssistant()
  const { user } = useAuth()
  
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
  
  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Get first and last day of month for query
        const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
        
        // Query events for current month
        const eventsRef = collection(db, "events")
        const eventsQuery = query(
          eventsRef,
          where("userId", "==", user.uid),
          where("startDate", ">=", Timestamp.fromDate(firstDayOfCurrentMonth)),
          where("startDate", "<=", Timestamp.fromDate(lastDayOfCurrentMonth))
        )

        const querySnapshot = await getDocs(eventsQuery)
        const fetchedEvents: CalendarEvent[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const eventDate = data.startDate.toDate()
          fetchedEvents.push({
            id: doc.id,
            title: data.title,
            time: eventDate.toLocaleTimeString("en-US", { 
              hour: "numeric", 
              minute: "2-digit",
              hour12: true 
            }),
            date: eventDate.getDate(),
            color: data.color || getRandomEventColor()
          })
        })

        setEvents(fetchedEvents)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [user, currentDate])
  
  // Helper function to get a random event color
  const getRandomEventColor = () => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-red-500", "bg-green-500", "bg-yellow-500"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear()
    
  const getEventsForDay = (day: number) => events.filter((event) => event.date === day)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  const handleAddEvent = () => {
    openAssistant("I'd like to add a new event to my calendar")
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
            const dayEvents = getEventsForDay(day)
            return (
              <TooltipProvider key={day} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-9 flex flex-col items-center justify-center rounded-md relative cursor-pointer hover:bg-slate-100 transition-colors",
                        isToday(day) && "bg-slate-800 text-white hover:bg-slate-700",
                        !isToday(day) && dayEvents.length > 0 && "font-medium",
                      )}
                    >
                      <span className="text-sm">{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex space-x-0.5 absolute -bottom-1">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div key={i} className={cn("w-1 h-1 rounded-full", event.color)}></div>
                          ))}
                          {dayEvents.length > 3 && <div className="w-1 h-1 rounded-full bg-slate-400"></div>}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {dayEvents.length > 0 && (
                    <TooltipContent side="bottom" className="p-0 overflow-hidden">
                      <div className="p-2">
                        <div className="font-medium text-sm pb-1">
                          {monthName} {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event, i) => (
                            <div key={i} className="flex items-center text-xs">
                              <div className={cn("w-2 h-2 rounded-full mr-2", event.color)}></div>
                              <span className="font-medium">{event.time}</span>
                              <span className="mx-1">-</span>
                              <span>{event.title}</span>
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
            <h4 className="text-sm font-medium">Upcoming Events</h4>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleAddEvent}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Replace hardcoded events with our dynamic UpcomingEvents component */}
          <div className="mt-2">
            <UpcomingEvents />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
