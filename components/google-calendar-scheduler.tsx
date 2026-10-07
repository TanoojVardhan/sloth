"use client"

import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle2, AlertCircle, Loader2, LogOut } from "lucide-react"

interface EventFormData {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  timeZone: string
}

export default function GoogleCalendarScheduler() {
  const { user, logout } = useAuth()
  const { isConnected, isChecking, setIsConnected } = useGoogleCalendar()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  
  const [eventData, setEventData] = useState<EventFormData>({
    summary: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  })

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setStatus(null)

    try {
      const provider = new GoogleAuthProvider()
      
      // Add Calendar scope for creating events
      provider.addScope("https://www.googleapis.com/auth/calendar.events")
      
      // Request offline access to get refresh token
      provider.setCustomParameters({
        access_type: "offline",
        prompt: "consent", // Force consent screen to ensure refresh token
      })

      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)

      if (!credential) {
        throw new Error("No credential received from Google")
      }

      const accessToken = credential.accessToken
      const refreshToken = credential.idToken // Use idToken instead (available from Firebase)

      // Get Firebase ID token for backend auth
      const firebaseUser = await auth.currentUser
      if (!firebaseUser) {
        throw new Error("User not authenticated")
      }
      const idToken = await firebaseUser.getIdToken()

      // Send tokens to backend to store in Firestore
      const response = await fetch("/api/save-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save tokens")
      }

      setIsConnected(true)
      setStatus({
        type: "success",
        message: "✅ Google Calendar connected successfully! You can now create events.",
      })
    } catch (error) {
      console.error("Error during Google Sign-In:", error)
      
      // Handle specific Firebase auth errors
      const errorCode = (error as { code?: string }).code
      const errorMessage = (error as { message?: string }).message || "Failed to connect Google Calendar"
      
      // User closed the popup - don't show error, just info
      if (errorCode === "auth/popup-closed-by-user") {
        setStatus({
          type: "info",
          message: "Sign-in cancelled. Click the button to try again.",
        })
        return
      }
      
      // User cancelled the consent screen
      if (errorCode === "auth/cancelled-popup-request" || errorCode === "auth/popup-blocked") {
        setStatus({
          type: "error",
          message: "Pop-up was blocked. Please allow pop-ups for this site and try again.",
        })
        return
      }
      
      // Generic error
      setStatus({
        type: "error",
        message: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEventData((prev) => ({ ...prev, [name]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setStatus({ type: "error", message: "You must be logged in" })
      return
    }

    if (!eventData.summary || !eventData.startDateTime || !eventData.endDateTime) {
      setStatus({ type: "error", message: "Please fill in all required fields" })
      return
    }

    setIsLoading(true)
    setStatus({ type: "info", message: "Creating event..." })

    try {
      const firebaseUser = await auth.currentUser
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
        body: JSON.stringify(eventData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event")
      }

      setStatus({
        type: "success",
        message: `✅ Event created successfully! ${data.event.htmlLink ? `View: ${data.event.htmlLink}` : ""}`,
      })

      // Reset form
      setEventData({
        summary: "",
        description: "",
        startDateTime: "",
        endDateTime: "",
        timeZone: eventData.timeZone,
      })
    } catch (error) {
      console.error("Error creating event:", error)
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create event",
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
            Please log in to connect your Google Calendar and create events
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
            Connect your Google Calendar to create events directly from Sloth Planner.
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
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                View and manage your calendar events
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Create new calendar events
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected - Show event creation form
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-green-600" />
          Create Calendar Event
        </CardTitle>
        <CardDescription>
          Signed in as <strong>{user.email}</strong> • Google Calendar connected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {status && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="summary">
              Event Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="summary"
              name="summary"
              value={eventData.summary}
              onChange={handleChange}
              placeholder="Team meeting, Doctor appointment, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleChange}
              placeholder="Add any additional details about the event..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDateTime">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="endDateTime">
                End Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDateTime"
                name="endDateTime"
                type="datetime-local"
                value={eventData.endDateTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeZone">Time Zone</Label>
            <Input
              id="timeZone"
              name="timeZone"
              value={eventData.timeZone}
              onChange={handleChange}
              placeholder="UTC, Asia/Kolkata, America/New_York, etc."
            />
            <p className="text-xs text-muted-foreground">
              Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="flex-1" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
              size="lg"
            >
              Disconnect
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
