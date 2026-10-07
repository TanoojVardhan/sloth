"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTasks, useEvents, useGoals } from "@/hooks/use-firebase-data"
import { useAuth } from "@/components/auth-provider"
import { MicInput } from "./mic-input"
import { Calendar, Tag, Plus, Loader2 } from "lucide-react"
import type { TaskPriority } from "@/types/entities"

type ItemType = "task" | "event" | "goal"

export function AddItemPanel({ initialType }: { initialType?: ItemType }) {
  const [type, setType] = useState<ItemType>(initialType || "task")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<string>("")
  const [tags, setTags] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  const { createTask } = useTasks()
  const { createEvent } = useEvents()
  const { createGoal } = useGoals()
  const { user, loading } = useAuth()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim()) return

    setIsSaving(true)
    try {
      if (type === "task") {
        // Use Firebase for tasks
        await createTask({
          title: title.trim(),
          status: "todo",
          priority: priority,
          dueDate: date || null,
          projectId: null,
        })
      } else if (type === "event") {
        // Use Firebase for events
        await createEvent({
          title: title.trim(),
          start: date || new Date().toISOString(),
          end: null,
          location: location.trim() || null,
          projectId: null,
        })
      } else {
        // Use Firebase for goals
        await createGoal({
          title: title.trim(),
          description: description.trim() || null,
          status: "active",
          targetDate: date || null,
          tags: tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        })
      }

      // Reset form
      setTitle("")
      setDate("")
      setTags("")
      setLocation("")
      setDescription("")
      setPriority("medium")
    } catch (error) {
      console.error(`Failed to create ${type}:`, error)
      alert(`Failed to create ${type}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null // This shouldn't show since the layout redirects non-authenticated users
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as ItemType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="goal">Goal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Prepare weekly report"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Low
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  High
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {type === "event" ? "Start Date & Time" : "Date & Time"}
          </Label>
          <Input
            id="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>

        {type === "event" ? (
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Conference Room A"
              className="w-full"
            />
          </div>
        ) : type === "goal" ? (
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="More details about your goal..."
              className="w-full"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, urgent, meeting"
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="lg" className="gap-2" disabled={isSaving || !title.trim()}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </>
          )}
        </Button>
        <MicInput
          onCommand={(cmd) => {
            const t = /(^|\s)(task|event|goal)\b/i.exec(cmd)?.[2]?.toLowerCase() as ItemType | undefined
            const ttl = /(?:task|event|goal)[:\- ]+([^#@]+?)(?:tags|priority|date|time|$)/i.exec(cmd)?.[1]?.trim()
            const tg =
              /tags?[:\- ]+([^\s].*)/i
                .exec(cmd)?.[1]
                ?.split(",")
                .map((s) => s.trim()) ?? []
            const pr = /priority[:\- ]+(low|medium|high)/i.exec(cmd)?.[1]?.toLowerCase() as TaskPriority | undefined
            if (ttl) setTitle(ttl)
            if (tg.length) setTags(tg.join(", "))
            if (t) setType(t)
            if (pr) setPriority(pr)
          }}
        />
      </div>
    </form>
  )
}
