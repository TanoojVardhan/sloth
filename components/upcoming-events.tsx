"use client"

import { useState, useEffect } from "react"
import { FolderOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"

interface Event {
  id: string
  title: string
  time: string
  color: string
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Get current date
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Query for upcoming events
        const eventsRef = collection(db, "events")
        const eventsQuery = query(
          eventsRef,
          where("userId", "==", user.uid),
          where("startDate", ">=", Timestamp.fromDate(today)),
          orderBy("startDate", "asc"),
          limit(5)
        )

        const querySnapshot = await getDocs(eventsQuery)
        const fetchedEvents: Event[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedEvents.push({
            id: doc.id,
            title: data.title,
            time: formatEventTime(data.startDate.toDate(), data.endDate?.toDate()),
            color: data.color || "#3B82F6" // Default blue color
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
  }, [user])

  // Format event time for display
  const formatEventTime = (startDate: Date, endDate?: Date) => {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    
    let dateStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    
    const timeStr = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
    
    if (startDate.toDateString() === today.toDateString()) {
      dateStr = "Today"
    } else if (startDate.toDateString() === tomorrow.toDateString()) {
      dateStr = "Tomorrow"
    }
    
    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
      return `${dateStr}, ${timeStr} - ${endTimeStr}`
    }
    
    return `${dateStr}, ${timeStr}`
  }

  return (
    <>
      <h3 className="font-medium mb-3">Upcoming Events</h3>
      {isLoading ? (
        <div className="text-center py-6">Loading...</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
          <FolderOpen className="h-12 w-12 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">No upcoming events.</p>
          <p className="text-xs text-slate-500">Your scheduled events will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center p-2 rounded-md border border-slate-200 bg-slate-50"
            >
              <div className="w-2 h-10 rounded-full mr-3" style={{ backgroundColor: event.color }}></div>
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-slate-500">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}