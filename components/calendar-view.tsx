"use client"
import { cn } from "@/lib/utils"

export function CalendarView() {
  // Get current date information
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Calculate first day of month and total days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Sample events data
  const events = [
    { date: 15, title: "Team Meeting", time: "10:00 AM", color: "bg-blue-500" },
    { date: 15, title: "Project Review", time: "2:00 PM", color: "bg-purple-500" },
    { date: 20, title: "Project Deadline", time: "5:00 PM", color: "bg-red-500" },
    { date: 25, title: "Client Call", time: "11:30 AM", color: "bg-green-500" },
  ]

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
