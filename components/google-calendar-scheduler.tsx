"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle2, AlertCircle, Loader2, LogOut } from "lucide-react"
import { GoogleCalendarBrowser } from "@/components/google-calendar-browser"

export default function GoogleCalendarScheduler() {
  const { user, logout } = useAuth()
  const { isConnected, setIsConnected } = useGoogleCalendar()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setStatus(null)

    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) {
        throw new Error("User not authenticated")
      }
      const idToken = await firebaseUser.getIdToken()

      // Ask the server to start a real OAuth 2.0 flow (with offline access,
      // so Google actually issues a refresh token) and hand back the
      // consent-screen URL to navigate to.
      const response = await fetch("/api/auth/google/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await response.json()
      if (!response.ok || !data.authUrl) {
        throw new Error(data.error || "Failed to start Google sign-in")
      }

      window.location.href = data.authUrl
    } catch (error) {
      console.error("Error starting Google Sign-In:", error)
      setStatus({
        type: "error",
        message: (error as { message?: string }).message || "Failed to connect Google Calendar",
      })
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      const idToken = await firebaseUser.getIdToken()

      const response = await fetch("/api/disconnect-calendar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (response.ok) {
        setIsConnected(false)
        setStatus({
          type: "success",
          message: "Google Calendar disconnected successfully",
        })
      }
    } catch (error) {
      console.error("Error disconnecting:", error)
      setStatus({
        type: "error",
        message: "Failed to disconnect calendar",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Not logged in state
  if (!user) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Please log in to connect your Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to use this feature. Please log in to your Sloth Planner account first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Not connected to Google Calendar
  if (!isConnected) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Connect Google Calendar
          </CardTitle>
          <CardDescription>
            Signed in as <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to automatically sync tasks and events you create in Sloth Planner.
            You&apos;ll be asked to grant permission to manage your calendar events.
          </p>

          {status && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
            <Button variant="outline" onClick={logout} size="lg">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-semibold text-sm">Required Permissions:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-chart-1" />
                View and manage your calendar events
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-chart-1" />
                Create new calendar events
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected - Show the live calendar browser (view/create/edit/delete events,
  // including any holiday calendars), plus a way to disconnect.
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-chart-1" />
            Google Calendar Connected
          </CardTitle>
          <CardDescription>
            Signed in as <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Google Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <GoogleCalendarBrowser />
    </div>
  )
}
