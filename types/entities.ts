export type ID = string

export interface User {
  userId: ID
  email: string
  name?: string
}

export type TaskStatus = "todo" | "in_progress" | "done"
export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  taskId: ID
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null // ISO
  projectId?: ID | null
  createdAt?: string // ISO
}

export interface Event {
  eventId: ID
  title: string
  start: string // ISO
  end?: string | null // ISO
  location?: string | null
  projectId?: ID | null
  createdAt?: string // ISO
}

export interface Project {
  projectId: ID
  name: string
  description?: string | null
  createdAt?: string
}

export type GoalStatus = "active" | "completed"

export interface Goal {
  goalId: ID
  title: string
  description?: string | null
  status: GoalStatus
  targetDate?: string | null // ISO
  tags?: string[]
  createdAt?: string // ISO
}

export interface ApiError {
  code: string
  message: string
}
