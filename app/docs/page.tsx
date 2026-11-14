import type { Metadata } from "next"
import { ContentPage } from "@/components/content-page"

export const metadata: Metadata = { title: "Documentation · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="Documentation"
      intro="A reference for every part of Sloth Planner."
      toc
      sections={[
        { id: "start", title: "Getting started", body: <ol><li>Sign up with email or Google.</li><li>Add your first task or note.</li><li>Optional: add a passphrase in Settings to end-to-end encrypt your data, and save the recovery key it shows you.</li></ol> },
        { id: "dashboard", title: "Dashboard", body: <p>Your day at a glance: open tasks, upcoming events and goal progress.</p> },
        { id: "tasks", title: "Tasks", body: <p>Create tasks with a priority, due date and tags. Switch between a kanban board and a table, nest subtasks, and mark things done. Say a task out loud with the microphone button.</p> },
        { id: "events", title: "Events and calendar", body: <p>Add events with a time and location, and see them on the calendar. You can also connect Google Calendar to view it alongside your own events.</p> },
        { id: "projects", title: "Projects", body: <p>Group tasks under a project to see the whole picture and track what is left.</p> },
        { id: "goals", title: "Goals", body: <p>Set a target date and tags for what matters, then watch progress build up.</p> },
        { id: "notes", title: "Notes", body: <p>Write in markdown with a to-do format. Items written as checkboxes can be sent to Tasks.</p> },
        { id: "schedule", title: "Schedule and focus", body: <p>The schedule merges tasks, events and classes into one timeline. The focus timer helps you work in uninterrupted blocks.</p> },
        { id: "timetable", title: "Timetable and assignments", body: <p>Import a timetable from a Google Sheet or Excel link, pick your subjects, and your classes appear on the schedule. Assignments track deadlines per subject.</p> },
        { id: "assistant", title: "AI assistant", body: <p>Ask questions and add items in plain language. The assistant sees your data only if you enable sharing in Settings.</p> },
        { id: "shortcuts", title: "Shortcuts", body: <ul><li><code>Ctrl</code> / <code>⌘</code> + <code>K</code> opens the command palette to jump anywhere or find a note, task or project.</li></ul> },
        { id: "security", title: "Encryption and security", body: <><p>Planner content is encrypted in transit and on our servers. Add a passphrase in Settings and it is also encrypted on your device with AES-256-GCM before it is saved. With a passphrase you can change it, create a new recovery key, lock the app, choose whether this device remembers you, or remove the passphrase again. AI sharing is controlled there too.</p><p>See the <a href="/privacy">privacy policy</a> for exactly what is and isn&apos;t protected.</p></> },
      ]}
    />
  )
}
