"use client"

import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck } from "lucide-react"
import Link from "next/link"

export function QuickCalendarWidget() {
  const { user } = useAuth()
  const { isConnected } = useGoogleCalendar()

  // Don't show anything if user is not logged in
  if (!user) return null

  // Only show if calendar is NOT connected - hide completely when connected
  if (isConnected) {
    return null
  }

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
