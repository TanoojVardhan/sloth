"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getProjects, createProject, updateProject, deleteProject, Project as FirestoreProject } from "@/lib/services/project-service";

// Valid status and difficulty values from Firestore service
type ProjectStatus = "idea" | "planning" | "in-progress" | "completed" | "archived";
type ProjectDifficulty = "easy" | "medium" | "hard";

interface ProjectsContextType {
  projects: Project[];
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  addProject: (project: Partial<Project>) => Promise<void>;
  updateProjectById: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProjectById: (id: string) => Promise<void>;
}
import { useAuth } from "@/contexts/auth-context";
export interface Project {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  archived?: boolean;
  dueDate?: string;
  category?: string;
  status?: ProjectStatus;
  difficulty?: ProjectDifficulty;
  estimatedHours?: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}
const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Map Firestore project to context Project type
  const mapProject = (p: FirestoreProject): Project => ({
    ...p,
    completed: p.status === "completed",
    archived: p.status === "archived",
    dueDate: (p as any).dueDate || undefined,
  });

  const refreshProjects = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetched = await getProjects(user.uid);
      setProjects(fetched.map(mapProject));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshProjects();
    else setProjects([]);
  }, [user, refreshProjects]);

  // Helper to coerce status/difficulty to valid values
  const coerceStatus = (status: any): ProjectStatus | undefined => {
    const valid: ProjectStatus[] = ["idea", "planning", "in-progress", "completed", "archived"];
    return valid.includes(status) ? status : undefined;
  };
  const coerceDifficulty = (difficulty: any): ProjectDifficulty | undefined => {
    const valid: ProjectDifficulty[] = ["easy", "medium", "hard"];
    return valid.includes(difficulty) ? difficulty : undefined;
  };

  const addProject = async (project: Partial<Project>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Project", status, difficulty, ...rest } = project;
    await createProject({
      title,
      status: coerceStatus(status),
      difficulty: coerceDifficulty(difficulty),
      ...rest
    }, user.uid);
    await refreshProjects();
    setIsLoading(false);
  };

  const updateProjectById = async (id: string, updates: Partial<Project>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Project", status, difficulty, ...rest } = updates;
    await updateProject(id, {
      title,
      status: coerceStatus(status),
      difficulty: coerceDifficulty(difficulty),
      ...rest
    }, user.uid);
    await refreshProjects();
    setIsLoading(false);
  };

  const deleteProjectById = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    await deleteProject(id, user.uid);
    await refreshProjects();
    setIsLoading(false);
  };

  return (
    <ProjectsContext.Provider value={{ projects, isLoading, refreshProjects, addProject, updateProjectById, deleteProjectById }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within a ProjectsProvider");
  return ctx;
}
