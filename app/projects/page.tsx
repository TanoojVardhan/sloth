"use client"

import useSWR from "swr"
import { api } from "@/lib/api"
import type { Project } from "@/types/entities"
import { ProjectCard } from "@/components/project-card"

export default function ProjectsPage() {
  const { data, error, isLoading } = useSWR<Project[]>("projects", () => api.getProjects())

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-muted-foreground">Browse your projects and open details to see related tasks.</p>
      </header>

      {isLoading && <p className="text-muted-foreground">Loading projects…</p>}
      {error && <p className="text-destructive-foreground">Failed to load projects.</p>}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <ProjectCard key={p.projectId} project={p} />
        ))}
      </section>
    </main>
  )
}
