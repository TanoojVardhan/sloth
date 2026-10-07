"use client"

import { useState } from "react"
import { useEvents, useProjects } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, MapPin, Plus, Loader2, Trash2, Clock, Bell, Folder } from "lucide-react"
import { formatEventTime, formatEventDate, REMINDER_OPTIONS, reminderLabel } from "@/lib/format"

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

type TimeParts = { hour: string; minute: string; meridiem: "AM" | "PM" }

function defaultTimeParts(): TimeParts {
  const now = new Date()
  const hour24 = now.getHours()
  const meridiem: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour: String(hour12), minute: "00", meridiem }
}

// Builds a real UTC-instant ISO string from a YYYY-MM-DD date plus 12-hour
// parts, so events created here carry the same kind of instant the Android
// app stores (rather than a timezone-less local string).
function toIsoInstant(dateStr: string, parts: TimeParts): string | null {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split("-").map(Number)
  let hour24 = parseInt(parts.hour, 10) % 12
  if (parts.meridiem === "PM") hour24 += 12
  const minute = parseInt(parts.minute, 10)
  const date = new Date(year, month - 1, day, hour24, minute, 0, 0)
  return date.toISOString()
}

function TimePicker({ value, onChange, label }: { value: TimeParts; onChange: (v: TimeParts) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {label}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <Select value={value.hour} onValueChange={(h) => onChange({ ...value, hour: h })}>
          <SelectTrigger aria-label="Hour">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.minute} onValueChange={(m) => onChange({ ...value, minute: m })}>
          <SelectTrigger aria-label="Minute">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.meridiem} onValueChange={(m) => onChange({ ...value, meridiem: m as "AM" | "PM" })}>
          <SelectTrigger aria-label="AM or PM">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { events, isLoading, createEvent, deleteEvent } = useEvents()
  const { projects } = useProjects()
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState<TimeParts>(defaultTimeParts)
  const [includeEnd, setIncludeEnd] = useState(false)
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState<TimeParts>(defaultTimeParts)
  const [location, setLocation] = useState("")
  const [projectId, setProjectId] = useState<string>("none")
  const [reminder, setReminder] = useState<string>("none")
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setTitle("")
    setStartDate("")
    setStartTime(defaultTimeParts())
    setIncludeEnd(false)
    setEndDate("")
    setEndTime(defaultTimeParts())
    setLocation("")
    setProjectId("none")
    setReminder("none")
    setIsAdding(false)
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    const start = toIsoInstant(startDate, startTime)
    if (!title.trim() || !start) return

    const end = includeEnd ? toIsoInstant(endDate, endTime) : null
    const reminderOption = REMINDER_OPTIONS.find((o) => o.value === reminder)

    setIsSaving(true)
    try {
      await createEvent({
        title: title.trim(),
        start,
        end,
        location: location.trim() || null,
        projectId: projectId === "none" ? null : projectId,
        reminderMinutes: reminderOption?.minutes ?? null,
      })
      resetForm()
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

  const projectName = (id?: string | null) => projects.find((p) => p.projectId === id)?.name

  const upcomingEvents = events.filter((e) => new Date(e.start) >= new Date())
  const pastEvents = events.filter((e) => new Date(e.start) < new Date())

  const renderEvent = (event: (typeof events)[number], muted: boolean) => (
    <div
      key={event.eventId}
      className={`group rounded-xl border bg-card p-4 transition-all hover:shadow-md ${muted ? "opacity-60 hover:opacity-100" : "hover:border-primary/40"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-[10px] font-medium uppercase leading-none">
              {new Date(event.start).toLocaleDateString(undefined, { month: "short" })}
            </span>
            <span className="text-base font-bold leading-none">{new Date(event.start).getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{event.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatEventTime(event.start)}
                {event.end && ` – ${formatEventTime(event.end)}`}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
            {(projectName(event.projectId) || event.reminderMinutes != null) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {projectName(event.projectId) && (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Folder className="h-3 w-3" />
                    {projectName(event.projectId)}
                  </Badge>
                )}
                {event.reminderMinutes != null && (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Bell className="h-3 w-3" />
                    {reminderLabel(event.reminderMinutes)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={() => handleDelete(event.eventId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarIcon}
        title="Events"
        description="Schedule and manage your meetings, appointments, and important dates with locations"
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
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date
                </Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <TimePicker value={startTime} onChange={setStartTime} label="Time" />
            </div>

            {includeEnd ? (
              <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-dashed p-3">
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    End Date
                  </Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <TimePicker value={endTime} onChange={setEndTime} label="End Time" />
                <button
                  type="button"
                  className="col-span-full text-left text-xs text-muted-foreground underline"
                  onClick={() => setIncludeEnd(false)}
                >
                  Remove end time
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setEndDate(startDate)
                  setIncludeEnd(true)
                }}
              >
                + Add an end time
              </button>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="reminder" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Reminder
                </Label>
                <Select value={reminder} onValueChange={setReminder}>
                  <SelectTrigger id="reminder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Project (optional)
                </Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.projectId} value={p.projectId}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving || !title.trim() || !startDate}>
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
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
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
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Upcoming Events
              <span className="ml-auto text-sm font-normal text-muted-foreground">{upcomingEvents.length}</span>
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => renderEvent(event, false))}
              {upcomingEvents.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No upcoming events</div>
              )}
            </div>
          </Card>

          {pastEvents.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                Past Events
                <span className="ml-auto text-sm font-normal text-muted-foreground">{pastEvents.length}</span>
              </h2>
              <div className="space-y-3">{pastEvents.map((event) => renderEvent(event, true))}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
