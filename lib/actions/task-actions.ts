"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import {
  getTasks as getFirebaseTasks,
  getTaskById as getFirebaseTaskById,
  createTask as createFirebaseTask,
  updateTask as updateFirebaseTask,
  deleteTask as deleteFirebaseTask,
  toggleTaskCompletion as toggleFirebaseTaskCompletion,
  type Task,
  type TaskFormData,
} from "@/lib/services/task-service"

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.array(z.string()).optional(),
})

export type { Task, TaskFormData }

export async function getTasks(): Promise<Task[]> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return []
  }

  try {
    return await getFirebaseTasks(session.user.id)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  try {
    return await getFirebaseTaskById(id, session.user.id)
  } catch (error) {
    console.error("Error fetching task:", error)
    return null
  }
}

export async function createTask(taskData: TaskFormData): Promise<Task> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const validatedData = taskSchema.parse(taskData)

    const newTask = await createFirebaseTask(validatedData, session.user.id)

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard")

    return newTask
  } catch (error) {
    console.error("Error creating task:", error)
    throw error
  }
}

export async function updateTask(id: string, taskData: TaskFormData): Promise<Task> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const validatedData = taskSchema.parse(taskData)

    const updatedTask = await updateFirebaseTask(id, validatedData, session.user.id)

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard")

    return updatedTask
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

export async function deleteTask(id: string): Promise<void> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    await deleteFirebaseTask(id, session.user.id)

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard")
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

export async function toggleTaskCompletion(id: string): Promise<Task> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const updatedTask = await toggleFirebaseTaskCompletion(id, session.user.id)

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard")

    return updatedTask
  } catch (error) {
    console.error("Error toggling task completion:", error)
    throw error
  }
}
