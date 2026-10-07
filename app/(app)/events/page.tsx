"use client"

import { useState } from "react"
import { useEvents } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, MapPin, Plus, Loader2, Trash2, Clock } from "lucide-react"

export default function EventsPage() {
  const { events, isLoading, createEvent, deleteEvent } = useEvents()
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [location, setLocation] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !start) return

    setIsSaving(true)
    try {
      await createEvent({
        title: title.trim(),
        start,
        end: end || null,
        location: location.trim() || null,
        projectId: null,
      })
      setTitle("")
      setStart("")
      setEnd("")
      setLocation("")
      setIsAdding(false)
    } catch (error) {
      console.error("Failed to create event:", error)
      alert("Failed to create event. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return
    try {
      await deleteEvent(eventId)
    } catch (error) {
      console.error("Failed to delete event:", error)
      alert("Failed to delete event. Please try again.")
    }
  }

  const upcomingEvents = events.filter((e) => new Date(e.start) >= new Date())
  const pastEvents = events.filter((e) => new Date(e.start) < new Date())

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarIcon}
        title="Events"
        description="Schedule and manage your meetings, appointments, and important dates with locations"
        gradient="from-blue-600 to-cyan-600"
      >
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="lg" className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        )}
      </PageHeader>

      {isAdding && (
        <Card className="p-6">
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title..."
                autoFocus
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Date & Time
                </Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Date & Time
                </Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location (optional)
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving || !title.trim() || !start}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Upcoming Events
              <span className="ml-auto text-sm font-normal text-muted-foreground">{upcomingEvents.length}</span>
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(event.start).toLocaleString()}
                            {event.end && ` - ${new Date(event.end).toLocaleString()}`}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(event.eventId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No upcoming events</div>
              )}
            </div>
          </Card>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                Past Events
                <span className="ml-auto text-sm font-normal text-muted-foreground">{pastEvents.length}</span>
              </h2>
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="group rounded-lg border bg-card p-4 opacity-60 transition-all hover:opacity-100"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.title}</h3>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(event.start).toLocaleString()}
                              {event.end && ` - ${new Date(event.end).toLocaleString()}`}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event.eventId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
