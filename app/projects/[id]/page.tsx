"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { api } from "@/lib/api"
import type { Project, Task } from "@/types/entities"

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  const { data: project, error: projErr } = useSWR<Project>(
    id ? `projects/${id}` : null, 
    () => api.getProject(id)
  )
  const { data: tasks, error: tasksErr } = useSWR<Task[]>(
    id ? `projects/${id}/tasks` : null, 
    () => api.getProjectTasks(id)
  )

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {!project && !projErr && <p className="text-muted-foreground">Loading project…</p>}
      {projErr && <p className="text-destructive-foreground">Failed to load project.</p>}

      {project && (
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-pretty">{project.name}</h1>
            {project.description && <p className="text-muted-foreground leading-relaxed">{project.description}</p>}
          </header>

          <section className="grid gap-3">
            <h2 className="text-lg font-medium">Tasks</h2>
            {!tasks && !tasksErr && <p className="text-muted-foreground">Loading tasks…</p>}
            {tasksErr && <p className="text-destructive-foreground">Failed to load tasks.</p>}
            <ul className="grid gap-3">
              {tasks?.map((t) => (
                <li key={t.taskId} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {t.status} • {t.priority}
                    </span>
                  </div>
                  {t.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                  )}
                </li>
              ))}
              {!tasks?.length && !tasksErr && <p className="text-muted-foreground">No tasks for this project.</p>}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
