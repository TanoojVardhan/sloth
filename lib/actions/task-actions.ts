"use server"

import { revalidatePath } from "next/cache"

export interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
  tags?: string[]
  description?: string
}

// Mock database
let tasks: Task[] = [
  {
    id: "1",
    title: "Complete project proposal",
    completed: false,
    dueDate: "2025-04-15",
    priority: "high",
    tags: ["work", "project"],
    description: "Finish the quarterly project proposal including budget and timeline estimates.",
  },
  {
    id: "2",
    title: "Schedule team meeting",
    completed: false,
    dueDate: "2025-04-14",
    priority: "medium",
    tags: ["work", "meeting"],
  },
  {
    id: "3",
    title: "Review quarterly goals",
    completed: true,
    dueDate: "2025-04-10",
    priority: "medium",
    tags: ["work", "planning"],
  },
  {
    id: "4",
    title: "Update documentation",
    completed: false,
    dueDate: "2025-04-20",
    priority: "low",
    tags: ["work", "documentation"],
  },
]

export async function getTasks(): Promise<Task[]> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...tasks]
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return tasks.find((task) => task.id === id)
}

export async function createTask(task: Omit<Task, "id">): Promise<Task> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const newTask: Task = {
    ...task,
    id: Date.now().toString(),
  }

  tasks.push(newTask)
  revalidatePath("/dashboard/tasks")
  revalidatePath("/dashboard")

  return newTask
}

export async function updateTask(task: Task): Promise<Task> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const index = tasks.findIndex((t) => t.id === task.id)

  if (index === -1) {
    throw new Error("Task not found")
  }

  tasks[index] = task
  revalidatePath("/dashboard/tasks")
  revalidatePath("/dashboard")

  return task
}

export async function deleteTask(id: string): Promise<void> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  tasks = tasks.filter((task) => task.id !== id)
  revalidatePath("/dashboard/tasks")
  revalidatePath("/dashboard")
}

export async function toggleTaskCompletion(id: string): Promise<Task> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const index = tasks.findIndex((t) => t.id === id)

  if (index === -1) {
    throw new Error("Task not found")
  }

  tasks[index] = {
    ...tasks[index],
    completed: !tasks[index].completed,
  }

  revalidatePath("/dashboard/tasks")
  revalidatePath("/dashboard")

  return tasks[index]
}
