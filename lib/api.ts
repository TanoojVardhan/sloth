import type { Event, Project, Task, Goal, ID } from "@/types/entities"
import { getCurrentUser } from "./firebase-auth"
import * as db from "./firebase-db"

// Helper to get current user ID
function getUserId(): ID {
  const user = getCurrentUser()
  if (!user) {
    console.error("User not authenticated - getCurrentUser returned null")
    throw { code: "UNAUTHORIZED", message: "User not authenticated" }
  }
  console.log("Current user ID:", user.uid)
  return user.uid
}

// SWR fetcher function for Firebase
export const swrFetcher = async (key: string) => {
  const userId = getUserId()
  
  if (key === "tasks") return db.getTasks(userId)
  if (key === "events") return db.getEvents(userId)
  if (key === "projects") return db.getProjects(userId)
  if (key === "goals") return db.getGoals(userId)
  if (key.startsWith("projects/")) {
    const parts = key.split("/")
    if (parts.length === 3 && parts[2] === "tasks") {
      return db.getProjectTasks(userId, parts[1])
    }
    if (parts.length === 2) {
      return db.getProject(parts[1])
    }
  }
  
  throw new Error(`Unknown SWR key: ${key}`)
}

export const api = {
  // tasks
  async getTasks(): Promise<Task[]> {
    try {
      const userId = getUserId()
      console.log("Fetching tasks for user:", userId)
      const tasks = await db.getTasks(userId)
      console.log("Retrieved tasks:", tasks.length)
      return tasks
    } catch (error) {
      console.error("Error fetching tasks:", error)
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to get tasks" }
    }
  },

  async getProjectTasks(projectId: ID): Promise<Task[]> {
    try {
      const userId = getUserId()
      return await db.getProjectTasks(userId, projectId)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to get project tasks" }
    }
  },

  async createTask(task: Omit<Task, "taskId">): Promise<ID> {
    try {
      const userId = getUserId()
      return await db.createTask(userId, task)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to create task" }
    }
  },

  async updateTask(taskId: ID, updates: Partial<Omit<Task, "taskId">>): Promise<void> {
    try {
      await db.updateTask(taskId, updates)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to update task" }
    }
  },

  async deleteTask(taskId: ID): Promise<void> {
    try {
      await db.deleteTask(taskId)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to delete task" }
    }
  },

  // events
  async getEvents(): Promise<Event[]> {
    try {
      const userId = getUserId()
      console.log("Fetching events for user:", userId)
      const events = await db.getEvents(userId)
      console.log("Retrieved events:", events.length)
      return events
    } catch (error) {
      console.error("Error fetching events:", error)
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to get events" }
    }
  },

  async createEvent(event: Omit<Event, "eventId">): Promise<ID> {
    try {
      const userId = getUserId()
      return await db.createEvent(userId, event)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to create event" }
    }
  },

  async updateEvent(eventId: ID, updates: Partial<Omit<Event, "eventId">>): Promise<void> {
    try {
      await db.updateEvent(eventId, updates)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to update event" }
    }
  },

  async deleteEvent(eventId: ID): Promise<void> {
    try {
      await db.deleteEvent(eventId)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to delete event" }
    }
  },

  // projects
  async getProjects(): Promise<Project[]> {
    try {
      const userId = getUserId()
      return await db.getProjects(userId)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to get projects" }
    }
  },

  async getProject(projectId: ID): Promise<Project> {
    try {
      const project = await db.getProject(projectId)
      if (!project) throw { code: "NOT_FOUND", message: "Project not found" }
      return project
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to get project" }
    }
  },

  async createProject(project: Omit<Project, "projectId" | "createdAt">): Promise<ID> {
    try {
      const userId = getUserId()
      return await db.createProject(userId, project)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to create project" }
    }
  },

  async updateProject(projectId: ID, updates: Partial<Omit<Project, "projectId" | "createdAt">>): Promise<void> {
    try {
      await db.updateProject(projectId, updates)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to update project" }
    }
  },

  async deleteProject(projectId: ID): Promise<void> {
    try {
      await db.deleteProject(projectId)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to delete project" }
    }
  },

  // goals
  async getGoals(): Promise<Goal[]> {
    try {
      const userId = getUserId()
      console.log("Fetching goals for user:", userId)
      const goals = await db.getGoals(userId)
      console.log("Retrieved goals:", goals.length)
      return goals
    } catch (error) {
      console.error("Error fetching goals:", error)
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to get goals" }
    }
  },

  async createGoal(goal: Omit<Goal, "goalId">): Promise<ID> {
    try {
      const userId = getUserId()
      return await db.createGoal(userId, goal)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to create goal" }
    }
  },

  async updateGoal(goalId: ID, updates: Partial<Omit<Goal, "goalId">>): Promise<void> {
    try {
      await db.updateGoal(goalId, updates)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to update goal" }
    }
  },

  async deleteGoal(goalId: ID): Promise<void> {
    try {
      await db.deleteGoal(goalId)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      throw { code: err.code || "ERROR", message: err.message || "Failed to delete goal" }
    }
  },
}
