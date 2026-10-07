"use client"

import useSWR from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import type { Task, Event, Project, Goal, ID } from "@/types/entities"

// ============= TASKS HOOKS =============

export function useTasks() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    user ? "tasks" : null,
    () => api.getTasks(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    tasks: data || [],
    isLoading,
    error,
    mutate,
    createTask: async (task: Omit<Task, "taskId">) => {
      const newTaskId = await api.createTask(task)
      await mutate() // Wait for revalidation
      return newTaskId
    },
    updateTask: async (taskId: ID, updates: Partial<Omit<Task, "taskId">>) => {
      await api.updateTask(taskId, updates)
      await mutate() // Wait for revalidation
    },
    deleteTask: async (taskId: ID) => {
      await api.deleteTask(taskId)
      await mutate() // Wait for revalidation
    },
  }
}

export function useProjectTasks(projectId: ID) {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    user && projectId ? `projects/${projectId}/tasks` : null,
    () => api.getProjectTasks(projectId),
  )

  return {
    tasks: data || [],
    isLoading,
    error,
    mutate,
  }
}

// ============= EVENTS HOOKS =============

export function useEvents() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Event[]>(
    user ? "events" : null,
    () => api.getEvents(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    events: data || [],
    isLoading,
    error,
    mutate,
    createEvent: async (event: Omit<Event, "eventId">) => {
      const newEventId = await api.createEvent(event)
      await mutate() // Wait for revalidation
      return newEventId
    },
    updateEvent: async (eventId: ID, updates: Partial<Omit<Event, "eventId">>) => {
      await api.updateEvent(eventId, updates)
      await mutate() // Wait for revalidation
    },
    deleteEvent: async (eventId: ID) => {
      await api.deleteEvent(eventId)
      await mutate() // Wait for revalidation
    },
  }
}

// ============= PROJECTS HOOKS =============

export function useProjects() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    user ? "projects" : null,
    () => api.getProjects(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    projects: data || [],
    isLoading,
    error,
    mutate,
    createProject: async (project: Omit<Project, "projectId" | "createdAt">) => {
      const newProjectId = await api.createProject(project)
      await mutate() // Wait for revalidation
      return newProjectId
    },
    updateProject: async (projectId: ID, updates: Partial<Omit<Project, "projectId" | "createdAt">>) => {
      await api.updateProject(projectId, updates)
      await mutate() // Wait for revalidation
    },
    deleteProject: async (projectId: ID) => {
      await api.deleteProject(projectId)
      await mutate() // Wait for revalidation
    },
  }
}

export function useProject(projectId: ID) {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Project>(
    user && projectId ? `projects/${projectId}` : null,
    () => api.getProject(projectId),
  )

  return {
    project: data,
    isLoading,
    error,
    mutate,
  }
}

// ============= GOALS HOOKS =============

export function useGoals() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Goal[]>(
    user ? "goals" : null,
    () => api.getGoals(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    goals: data || [],
    isLoading,
    error,
    mutate,
    createGoal: async (goal: Omit<Goal, "goalId">) => {
      const newGoalId = await api.createGoal(goal)
      await mutate() // Wait for revalidation
      return newGoalId
    },
    updateGoal: async (goalId: ID, updates: Partial<Omit<Goal, "goalId">>) => {
      await api.updateGoal(goalId, updates)
      await mutate() // Wait for revalidation
    },
    deleteGoal: async (goalId: ID) => {
      await api.deleteGoal(goalId)
      await mutate() // Wait for revalidation
    },
  }
}
