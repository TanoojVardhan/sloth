"use client"

import { useCallback, useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"

interface GCalendar {
  id: string
  summary: string
  primary: boolean
  accessRole: string
  backgroundColor?: string
}

interface GEvent {
  id: string
  summary: string
  description: string
  location: string
  start: string
  end: string
  allDay: boolean
  htmlLink: string
  status: string
}

const HOLIDAY_PRESETS = [
  { id: "en.indian#holiday@group.v.calendar.google.com", label: "Holidays in India" },
  { id: "en.usa#holiday@group.v.calendar.google.com", label: "Holidays in United States" },
  { id: "en.uk#holiday@group.v.calendar.google.com", label: "Holidays in United Kingdom" },
]

type EventFormState = {
  summary: string
  description: string
  location: string
  start: string // yyyy-MM-dd'T'HH:mm
  end: string
}

const emptyForm: EventFormState = { summary: "", description: "", location: "", start: "", end: "" }

function toInputValue(iso: string) {
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
  } catch {
    return ""
  }
}

export function GoogleCalendarBrowser() {
  const [calendars, setCalendars] = useState<GCalendar[]>([])
  const [calendarId, setCalendarId] = useState<string>("primary")
  const [events, setEvents] = useState<GEvent[]>([])
  const [loadingCalendars, setLoadingCalendars] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [viewingEvent, setViewingEvent] = useState<GEvent | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [form, setForm] = useState<EventFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) throw new Error("Not signed in")
    const idToken = await firebaseUser.getIdToken()
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${idToken}`,
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Request failed")
    return data
  }, [])

  // Pure data fetchers — no state writes, safe to call from anywhere.
  const fetchCalendarsList = useCallback(async (): Promise<GCalendar[]> => {
    const data = await authedFetch("/api/calendar/calendars")
    return data.calendars || []
  }, [authedFetch])

  const fetchEventsList = useCallback(
    async (id: string): Promise<GEvent[]> => {
      const data = await authedFetch(`/api/calendar/events?calendarId=${encodeURIComponent(id)}`)
      return data.events || []
    },
    [authedFetch]
  )

  // Imperative reloaders used by button clicks / after mutations.
  const loadCalendars = useCallback(async () => {
    setLoadingCalendars(true)
    setError(null)
    try {
      const list = await fetchCalendarsList()
      setCalendars(list)
      setCalendarId((current) => {
        if (list.length && !list.some((c) => c.id === current)) {
          return list.find((c) => c.primary)?.id || list[0].id
        }
        return current
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingCalendars(false)
    }
  }, [fetchCalendarsList])

  const loadEvents = useCallback(
    async (id: string) => {
      setLoadingEvents(true)
      setError(null)
      try {
        const list = await fetchEventsList(id)
        setEvents(list)
      } catch (err) {
        setError((err as Error).message)
        setEvents([])
      } finally {
        setLoadingEvents(false)
      }
    },
    [fetchEventsList]
  )

  // Initial load on mount — declared inline so each effect owns its own
  // fetch-and-set sequence instead of calling out to a shared setter.
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoadingCalendars(true)
      setError(null)
      try {
        const list = await fetchCalendarsList()
        if (cancelled) return
        setCalendars(list)
        setCalendarId((current) => {
          if (list.length && !list.some((c) => c.id === current)) {
            return list.find((c) => c.primary)?.id || list[0].id
          }
          return current
        })
      } catch (err) {
        if (!cancelled) setError((err as Error).message)
      } finally {
        if (!cancelled) setLoadingCalendars(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [fetchCalendarsList])

  useEffect(() => {
    if (!calendarId) return
    let cancelled = false
    async function run() {
      setLoadingEvents(true)
      setError(null)
      try {
        const list = await fetchEventsList(calendarId)
        if (cancelled) return
        setEvents(list)
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoadingEvents(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [calendarId, fetchEventsList])

  const handleSubscribe = async (presetId: string) => {
    setSubscribing(presetId)
    setError(null)
    try {
      await authedFetch("/api/calendar/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: presetId }),
      })
      await loadCalendars()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubscribing(null)
    }
  }

  const openCreateForm = () => {
    setEditingEventId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditForm = (event: GEvent) => {
    setViewingEvent(null)
    setEditingEventId(event.id)
    setForm({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: toInputValue(event.start),
      end: toInputValue(event.end),
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.summary || !form.start || !form.end) {
      setError("Title, start, and end are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingEventId) {
        await authedFetch("/api/calendar/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarId,
            eventId: editingEventId,
            summary: form.summary,
            description: form.description,
            location: form.location,
            startDateTime: new Date(form.start).toISOString(),
            endDateTime: new Date(form.end).toISOString(),
          }),
        })
      } else {
        await authedFetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarId,
            summary: form.summary,
            description: form.description,
            location: form.location,
            startDateTime: new Date(form.start).toISOString(),
            endDateTime: new Date(form.end).toISOString(),
          }),
        })
      }
      setFormOpen(false)
      await loadEvents(calendarId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId)
    setError(null)
    try {
      await authedFetch(
        `/api/calendar/events?calendarId=${encodeURIComponent(calendarId)}&eventId=${encodeURIComponent(eventId)}`,
        { method: "DELETE" }
      )
      setViewingEvent((current) => (current?.id === eventId ? null : current))
      await loadEvents(calendarId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const currentCalendar = calendars.find((c) => c.id === calendarId)
  const canEdit = currentCalendar?.accessRole === "owner" || currentCalendar?.accessRole === "writer"
  const unsubscribedPresets = HOLIDAY_PRESETS.filter((p) => !calendars.some((c) => c.id === p.id))

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Your Google Calendars
        </CardTitle>
        <CardDescription>Browse, create, and edit events across every calendar on your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <Select value={calendarId} onValueChange={setCalendarId} disabled={loadingCalendars}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingCalendars ? "Loading calendars..." : "Select a calendar"} />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.summary} {c.primary ? "(Primary)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadEvents(calendarId)}
            disabled={loadingEvents || !calendarId}
            aria-label="Refresh events"
          >
            <RefreshCw className={`h-4 w-4 ${loadingEvents ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateForm} disabled={!canEdit}>
                <Plus className="mr-2 h-4 w-4" />
                New event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingEventId ? "Edit event" : "New event"}</DialogTitle>
                <DialogDescription>
                  {editingEventId ? "Update this event on " : "Add this event to "}
                  <strong>{currentCalendar?.summary}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="gc-title">Title</Label>
                  <Input
                    id="gc-title"
                    value={form.summary}
                    onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                    placeholder="Team sync"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-start">Starts</Label>
                    <Input
                      id="gc-start"
                      type="datetime-local"
                      value={form.start}
                      onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-end">Ends</Label>
                    <Input
                      id="gc-end"
                      type="datetime-local"
                      value={form.end}
                      onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-location">Location</Label>
                  <Input
                    id="gc-location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-description">Description</Label>
                  <Textarea
                    id="gc-description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingEventId ? "Save changes" : "Create event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!canEdit && currentCalendar && (
          <p className="text-xs text-muted-foreground">
            This calendar is read-only for your account, so you can view its events but not edit them.
          </p>
        )}

        {unsubscribedPresets.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            <p className="text-sm font-medium">Add a holiday calendar</p>
            <div className="flex flex-wrap gap-2">
              {unsubscribedPresets.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubscribe(p.id)}
                  disabled={subscribing === p.id}
                >
                  {subscribing === p.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {loadingEvents ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No events in the next 90 days on this calendar.
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewingEvent(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setViewingEvent(event)
                  }
                }}
                className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{event.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.allDay
                      ? format(parseISO(event.start), "MMM d, yyyy")
                      : `${format(parseISO(event.start), "MMM d, yyyy · h:mm a")} – ${format(parseISO(event.end), "h:mm a")}`}
                  </p>
                  {event.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </div>
                {canEdit ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditForm(event)
                      }}
                      aria-label="Edit event"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(event.id)
                      }}
                      disabled={deletingId === event.id}
                      aria-label="Delete event"
                    >
                      {deletingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    View only
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Event details popup */}
      <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="max-w-md">
          {viewingEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingEvent.summary}</DialogTitle>
                <DialogDescription>
                  {viewingEvent.allDay
                    ? format(parseISO(viewingEvent.start), "EEEE, MMM d, yyyy")
                    : `${format(parseISO(viewingEvent.start), "EEEE, MMM d, yyyy · h:mm a")} – ${format(parseISO(viewingEvent.end), "h:mm a")}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                {viewingEvent.location && (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {viewingEvent.location}
                  </p>
                )}
                {viewingEvent.description && (
                  <p className="whitespace-pre-wrap text-foreground">{viewingEvent.description}</p>
                )}
                {viewingEvent.htmlLink && (
                  <a
                    href={viewingEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open in Google Calendar
                  </a>
                )}
              </div>

              <DialogFooter>
                {canEdit ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(viewingEvent.id)}
                      disabled={deletingId === viewingEvent.id}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === viewingEvent.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                    <Button onClick={() => openEditForm(viewingEvent)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setViewingEvent(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
