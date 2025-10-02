"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddEventDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  date?: Date
  onAdd: (payload: { title: string; time?: string }) => void
}) {
  const { open, onOpenChange, date, onAdd } = props
  const [title, setTitle] = React.useState("")
  const [time, setTime] = React.useState("")

  React.useEffect(() => {
    if (open) {
      // reset form when opened
      setTitle("")
      setTime("")
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), time: time.trim() || undefined })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add note {date ? `for ${date.toLocaleDateString()}` : ""}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Team sync, doctor appt..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Event title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time (optional)</Label>
            <Input
              id="time"
              placeholder="14:00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Event time"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
