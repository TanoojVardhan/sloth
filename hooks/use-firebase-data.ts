"use client"

import useSWR from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import type { Task, Event, Project, Goal, Note, ClassSlot, Assignment, ID } from "@/types/entities"

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

// ============= NOTES HOOKS =============

export function useNotes() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Note[]>(user ? "notes" : null, () => api.getNotes(), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    notes: data || [],
    isLoading,
    error,
    mutate,
    createNote: async (note: Omit<Note, "noteId" | "createdAt" | "updatedAt">) => {
      const id = await api.createNote(note)
      await mutate()
      return id
    },
    // Optimistic: the editor autosaves on every pause in typing, so waiting on
    // a refetch per keystroke-burst would make the sidebar flicker.
    updateNote: async (noteId: ID, updates: Partial<Omit<Note, "noteId" | "createdAt" | "updatedAt">>) => {
      await mutate(
        async (current) => {
          await api.updateNote(noteId, updates)
          return (current || []).map((n) =>
            n.noteId === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
          )
        },
        {
          optimisticData: (current) =>
            (current || []).map((n) =>
              n.noteId === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
            ),
          revalidate: false,
          rollbackOnError: true,
        },
      )
    },
    deleteNote: async (noteId: ID) => {
      await api.deleteNote(noteId)
      await mutate()
    },
  }
}

// ============= TIMETABLE HOOK =============

export function useClasses() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<ClassSlot[]>(user ? "classes" : null, () => api.getClasses(), {
    revalidateOnFocus: true,
  })
  return {
    classes: data || [],
    isLoading,
    error,
    createClass: async (c: Omit<ClassSlot, "classId">) => {
      const id = await api.createClass(c)
      await mutate()
      return id
    },
    updateClass: async (classId: ID, updates: Partial<Omit<ClassSlot, "classId">>) => {
      await api.updateClass(classId, updates)
      await mutate()
    },
    deleteClass: async (classId: ID) => {
      await api.deleteClass(classId)
      await mutate()
    },
  }
}

// ============= ASSIGNMENTS HOOK =============

export function useAssignments() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Assignment[]>(user ? "assignments" : null, () => api.getAssignments(), {
    revalidateOnFocus: true,
  })
  return {
    assignments: data || [],
    isLoading,
    error,
    createAssignment: async (a: Omit<Assignment, "assignmentId" | "createdAt" | "updatedAt">) => {
      const id = await api.createAssignment(a)
      await mutate()
      return id
    },
    // Optimistic so ticking "submitted" feels instant.
    updateAssignment: async (
      assignmentId: ID,
      updates: Partial<Omit<Assignment, "assignmentId" | "createdAt" | "updatedAt">>,
    ) => {
      const apply = (list: Assignment[] | undefined) =>
        (list || []).map((x) => (x.assignmentId === assignmentId ? { ...x, ...updates } : x))
      await mutate(
        async (current) => {
          await api.updateAssignment(assignmentId, updates)
          return apply(current)
        },
        { optimisticData: apply, revalidate: false, rollbackOnError: true },
      )
    },
    deleteAssignment: async (assignmentId: ID) => {
      await api.deleteAssignment(assignmentId)
      await mutate()
    },
  }
}
