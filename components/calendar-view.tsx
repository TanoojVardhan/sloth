"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"

interface Event {
  id: string
  title: string
  time: string
  date: number
  color: string
}

export function CalendarView() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // Get current date information
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // Calculate first day of month and total days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Get first and last day of month for query
        const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1)
        const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
        
        // Query events for current month
        const eventsRef = collection(db, "events")
        const eventsQuery = query(
          eventsRef,
          where("userId", "==", user.uid),
          where("startDate", ">=", Timestamp.fromDate(firstDayOfCurrentMonth)),
          where("startDate", "<=", Timestamp.fromDate(lastDayOfCurrentMonth))
        )

        const querySnapshot = await getDocs(eventsQuery)
        const fetchedEvents: Event[] = []

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
  }, [user, currentMonth, currentYear])

  // Helper function to get a random event color
  const getRandomEventColor = () => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-red-500", "bg-green-500", "bg-yellow-500"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const getEventsForDay = (day: number) => events.filter((event) => event.date === day)

  return (
    <div className="w-full">
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
          const isToday = day === currentDay
          return (
            <div
              key={day}
              className={cn(
                "h-24 border border-slate-200 rounded-md p-1 overflow-hidden",
                isToday && "bg-slate-50 border-slate-300",
              )}
            >
              <div
                className={cn(
                  "text-right text-sm p-1",
                  isToday &&
                    "font-bold bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto",
                )}
              >
                {day}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.map((event, i) => (
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
