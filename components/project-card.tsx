"use client"

import Link from "next/link"
import type { Project } from "@/types/entities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.projectId}`} className="block focus:outline-none focus:ring-2 rounded-lg">
      <Card className="hover:bg-accent/30 transition-colors">
        <CardHeader>
          <CardTitle className="text-base">{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed line-clamp-2">
            {project.description || "No description"}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
