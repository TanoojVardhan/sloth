"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { CalendarDays, CheckSquare, FileText, Folder, Plus, Search, Settings, Timer, Target, LayoutDashboard, GraduationCap, ClipboardList } from "lucide-react"
import { useEvents, useNotes, useProjects, useTasks } from "@/hooks/use-firebase-data"
import { useAuth } from "@/components/auth-provider"
import { hasTool } from "@/lib/student"

/** Opens the palette from anywhere (e.g. a sidebar button). */
export function openCommandPalette() {
  window.dispatchEvent(new Event("sloth:open-palette"))
}

const itemCls =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/90 aria-selected:bg-primary/10 aria-selected:text-foreground"
const groupCls =
  "px-1 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"

export function CommandPalette() {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { notes } = useNotes()
  const { tasks } = useTasks()
  const { projects } = useProjects()
  const { events } = useEvents()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener("sloth:open-palette", onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("sloth:open-palette", onOpen)
    }
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const openNote = (id: string) => {
    setOpen(false)
    router.push(`/notes?id=${encodeURIComponent(id)}`)
    // If the Notes page is already mounted it won't re-read the URL, so tell it directly.
    window.dispatchEvent(new CustomEvent("sloth:open-note", { detail: id }))
  }

  const activeNotes = notes.filter((n) => !n.archived)
  const openTasks = tasks.filter((t) => t.status !== "done")

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search everything"
      overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[12vh] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Command.Input
          autoFocus
          placeholder="Search pages, tasks, projects, events… or type a command"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">Esc</kbd>
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-1">
        <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing matches that.</Command.Empty>

        <Command.Group heading="Quick actions" className={groupCls}>
          <Command.Item value="new page note" onSelect={() => go("/notes?new=1")} className={itemCls}>
            <Plus className="h-4 w-4" /> New page
          </Command.Item>
          <Command.Item value="new task add" onSelect={() => go("/tasks?new=1")} className={itemCls}>
            <Plus className="h-4 w-4" /> New task
          </Command.Item>
          <Command.Item value="focus timer pomodoro start" onSelect={() => go("/focus")} className={itemCls}>
            <Timer className="h-4 w-4" /> Start a focus session
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Go to" className={groupCls}>
          {(
            [
              ["/dashboard", "Dashboard", LayoutDashboard],
              ["/notes", "Notes", FileText],
              ["/tasks", "Tasks", CheckSquare],
              ["/events", "Events", CalendarDays],
              ["/projects", "Projects", Folder],
              ["/goals", "Goals", Target],
              ["/focus", "Focus", Timer],
              ...(hasTool(user?.occupation, "timetable") ? ([["/timetable", "Timetable", GraduationCap]] as const) : []),
              ...(hasTool(user?.occupation, "assignments") ? ([["/assignments", "Assignments", ClipboardList]] as const) : []),
              ["/settings", "Settings", Settings],
            ] as const
          ).map(([href, label, Icon]) => (
            <Command.Item key={href} value={`go ${label}`} onSelect={() => go(href)} className={itemCls}>
              <Icon className="h-4 w-4" /> {label}
            </Command.Item>
          ))}
        </Command.Group>

        {activeNotes.length > 0 && (
          <Command.Group heading="Pages" className={groupCls}>
            {activeNotes.slice(0, 200).map((n) => (
              <Command.Item
                key={n.noteId}
                value={`page ${n.title || "Untitled"} ${n.noteId} ${(n.tags || []).join(" ")} ${n.content.slice(0, 300)}`}
                onSelect={() => openNote(n.noteId)}
                className={itemCls}
              >
                <span className="w-4 text-center">{n.icon || "📄"}</span>
                <span className="truncate">{n.title || "Untitled"}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {openTasks.length > 0 && (
          <Command.Group heading="Open tasks" className={groupCls}>
            {openTasks.slice(0, 200).map((t) => (
              <Command.Item key={t.taskId} value={`task ${t.title} ${t.taskId} ${(t.tags || []).join(" ")}`} onSelect={() => go("/tasks")} className={itemCls}>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
                {t.status === "in_progress" && <span className="ml-auto text-xs text-muted-foreground">In progress</span>}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {projects.length > 0 && (
          <Command.Group heading="Projects" className={groupCls}>
            {projects.map((p) => (
              <Command.Item key={p.projectId} value={`project ${p.name} ${p.projectId}`} onSelect={() => go("/projects")} className={itemCls}>
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{p.name}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {events.length > 0 && (
          <Command.Group heading="Events" className={groupCls}>
            {events.slice(0, 100).map((ev) => (
              <Command.Item key={ev.eventId} value={`event ${ev.title} ${ev.eventId}`} onSelect={() => go("/events")} className={itemCls}>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{ev.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{new Date(ev.start).toLocaleDateString()}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}
