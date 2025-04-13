"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAIAssistant } from "@/hooks/use-ai-assistant"

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { openAssistant } = useAIAssistant()

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

  // Sample events
  const events = [
    { date: 15, title: "Team Meeting", time: "10:00 AM", color: "bg-blue-500" },
    { date: 15, title: "Project Review", time: "2:00 PM", color: "bg-purple-500" },
    { date: 20, title: "Project Deadline", time: "5:00 PM", color: "bg-red-500" },
    { date: 25, title: "Client Call", time: "11:30 AM", color: "bg-green-500" },
  ]

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
          {events.slice(0, 3).map((event, index) => (
            <div key={index} className="flex items-center text-sm">
              <div className={cn("w-2 h-2 rounded-full mr-2", event.color)}></div>
              <div className="w-8 text-right mr-2 text-slate-500">{event.date}</div>
              <div className="flex-1 p-1.5 bg-slate-50 rounded-md">
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-slate-500">{event.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
