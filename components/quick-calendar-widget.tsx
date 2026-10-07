"use client"

import { useState } from "react"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarCheck, CalendarPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/firebase"

export function QuickCalendarWidget() {
  const { user } = useAuth()
  const { isConnected } = useGoogleCalendar()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  
  const [eventData, setEventData] = useState({
    summary: "",
    startDateTime: "",
    endDateTime: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEventData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus(null)

    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) {
        throw new Error("User not authenticated")
      }
      const idToken = await firebaseUser.getIdToken()

      const response = await fetch("/api/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...eventData,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event")
      }

      setStatus({
        type: "success",
        message: "Event created successfully!",
      })

      // Reset form
      setEventData({
        summary: "",
        startDateTime: "",
        endDateTime: "",
      })

      // Close sheet after 2 seconds
      setTimeout(() => {
        setIsOpen(false)
        setStatus(null)
      }, 2000)
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create event",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>Quick event creation</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/calendar-integration">
            <Button variant="outline" className="w-full">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Connect Calendar
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-5 w-5 text-green-600" />
          Google Calendar
        </CardTitle>
        <CardDescription>Calendar connected ✓</CardDescription>
      </CardHeader>
      <CardContent>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="w-full">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Quick Add Event
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Calendar Event</SheetTitle>
              <SheetDescription>
                Add a new event to your Google Calendar
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {status && (
                <Alert variant={status.type === "error" ? "destructive" : "default"}>
                  {status.type === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="summary">Event Title *</Label>
                <Input
                  id="summary"
                  name="summary"
                  value={eventData.summary}
                  onChange={handleChange}
                  placeholder="Meeting with team"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDateTime">Start *</Label>
                <Input
                  id="startDateTime"
                  name="startDateTime"
                  type="datetime-local"
                  value={eventData.startDateTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDateTime">End *</Label>
                <Input
                  id="endDateTime"
                  name="endDateTime"
                  type="datetime-local"
                  value={eventData.endDateTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            </form>
          </SheetContent>
        </Sheet>

        <Link href="/calendar-integration" className="mt-2 block">
          <Button variant="ghost" size="sm" className="w-full">
            View Full Calendar
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
