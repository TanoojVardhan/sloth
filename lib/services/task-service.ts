import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore"

export interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
  tags?: string[]
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface TaskFormData {
  title: string
  description?: string
  completed?: boolean
  dueDate?: string
  priority?: "low" | "medium" | "high"
  tags?: string[]
}

export interface TasksQueryOptions {
  completed?: boolean
  priority?: "low" | "medium" | "high"
  tag?: string
  dueBefore?: Date
  dueAfter?: Date
  limit?: number
  startAfter?: DocumentSnapshot
  orderByField?: "dueDate" | "priority" | "createdAt" | "updatedAt"
  orderDirection?: "asc" | "desc"
}

export async function getTasks(userId: string, options: TasksQueryOptions = {}): Promise<Task[]> {
  try {
    const tasksRef = collection(db, "tasks")
    let q = query(tasksRef, where("userId", "==", userId))

    // Apply filters
    if (options.completed !== undefined) {
      q = query(q, where("completed", "==", options.completed))
    }

    if (options.priority) {
      q = query(q, where("priority", "==", options.priority))
    }

    if (options.tag) {
      q = query(q, where("tags", "array-contains", options.tag))
    }

    if (options.dueBefore) {
      q = query(q, where("dueDate", "<=", Timestamp.fromDate(options.dueBefore)))
    }

    if (options.dueAfter) {
      q = query(q, where("dueDate", ">=", Timestamp.fromDate(options.dueAfter)))
    }

    // Apply ordering
    const orderByField = options.orderByField || "createdAt"
    const orderDirection = options.orderDirection || "desc"
    q = query(q, orderBy(orderByField, orderDirection))

    // Apply pagination
    if (options.limit) {
      q = query(q, limit(options.limit))
    }

    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter))
    }

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        completed: data.completed,
        dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
        priority: data.priority,
        tags: data.tags || [],
        description: data.description || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      }
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}

export async function getTaskById(taskId: string, userId: string): Promise<Task | null> {
  try {
    const taskRef = doc(db, "tasks", taskId)
    const taskSnap = await getDoc(taskRef)

    if (!taskSnap.exists()) {
      return null
    }

    const data = taskSnap.data()

    // Verify that the task belongs to the user
    if (data.userId !== userId) {
      return null
    }

    return {
      id: taskSnap.id,
      title: data.title,
      completed: data.completed,
      dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
      priority: data.priority,
      tags: data.tags || [],
      description: data.description || undefined,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  } catch (error) {
    console.error("Error fetching task:", error)
    return null
  }
}

export async function createTask(taskData: TaskFormData, userId: string): Promise<Task> {
  try {
    console.log("Creating task with data:", taskData, "for user:", userId);
    
    // Validate the user ID
    if (!userId) {
      throw new Error("User ID is required to create a task");
    }
    
    const taskRef = collection(db, "tasks");
    
    // Handle date conversion more safely
    let dueDate = null;
    if (taskData.dueDate) {
      try {
        // Parse the date string carefully
        const parsedDate = new Date(taskData.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          dueDate = Timestamp.fromDate(parsedDate);
        } else {
          console.warn("Invalid date format received:", taskData.dueDate);
        }
      } catch (dateError) {
        console.error("Error parsing date:", dateError);
      }
    }
    
    // Create the task object for Firestore
    const taskToAdd = {
      title: taskData.title,
      description: taskData.description || null,
      completed: taskData.completed || false,
      dueDate: dueDate,
      priority: taskData.priority || "medium",
      tags: taskData.tags || [],
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log("Final task data being sent to Firestore:", taskToAdd);
    
    const docRef = await addDoc(taskRef, taskToAdd);
    console.log("Document added with ID:", docRef.id);
    
    const createdAt = new Date();
    
    // Return the created task object
    return {
      id: docRef.id,
      title: taskData.title,
      completed: taskData.completed || false,
      dueDate: taskData.dueDate,
      priority: taskData.priority || "medium",
      tags: taskData.tags || [],
      description: taskData.description,
      createdAt,
      updatedAt: createdAt,
    };
  } catch (error) {
    console.error("Error creating task:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    throw error;
  }
}

export async function updateTask(taskId: string, taskData: TaskFormData, userId: string): Promise<Task> {
  try {
    const taskRef = doc(db, "tasks", taskId)
    const taskSnap = await getDoc(taskRef)

    if (!taskSnap.exists()) {
      throw new Error("Task not found")
    }

    const data = taskSnap.data()

    // Verify that the task belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const taskToUpdate = {
      title: taskData.title,
      description: taskData.description || null,
      completed: taskData.completed !== undefined ? taskData.completed : data.completed,
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : data.dueDate,
      priority: taskData.priority || data.priority,
      tags: taskData.tags || data.tags,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(taskRef, taskToUpdate)
    const updatedAt = new Date()

    return {
      id: taskId,
      title: taskData.title,
      completed: taskData.completed !== undefined ? taskData.completed : data.completed,
      dueDate: taskData.dueDate || (data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined),
      priority: taskData.priority || data.priority,
      tags: taskData.tags || data.tags || [],
      description: taskData.description || data.description,
      createdAt: data.createdAt.toDate(),
      updatedAt,
    }
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  try {
    const taskRef = doc(db, "tasks", taskId)
    const taskSnap = await getDoc(taskRef)

    if (!taskSnap.exists()) {
      throw new Error("Task not found")
    }

    const data = taskSnap.data()

    // Verify that the task belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    await deleteDoc(taskRef)
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

export async function toggleTaskCompletion(taskId: string, userId: string): Promise<Task> {
  try {
    const taskRef = doc(db, "tasks", taskId)
    const taskSnap = await getDoc(taskRef)

    if (!taskSnap.exists()) {
      throw new Error("Task not found")
    }

    const data = taskSnap.data()

    // Verify that the task belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const newCompletedState = !data.completed

    await updateDoc(taskRef, {
      completed: newCompletedState,
      updatedAt: serverTimestamp(),
    })

    return {
      id: taskId,
      title: data.title,
      completed: newCompletedState,
      dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
      priority: data.priority,
      tags: data.tags || [],
      description: data.description,
      createdAt: data.createdAt.toDate(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error toggling task completion:", error)
    throw error
  }
}

export async function getTaskStats(userId: string): Promise<{
  total: number
  completed: number
  pending: number
  overdue: number
}> {
  try {
    const tasksRef = collection(db, "tasks")

    // Get total tasks
    const totalQuery = query(tasksRef, where("userId", "==", userId))
    const totalSnapshot = await getDocs(totalQuery)
    const total = totalSnapshot.size

    // Get completed tasks
    const completedQuery = query(tasksRef, where("userId", "==", userId), where("completed", "==", true))
    const completedSnapshot = await getDocs(completedQuery)
    const completed = completedSnapshot.size

    // Get pending tasks
    const pending = total - completed

    // Get overdue tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueQuery = query(
      tasksRef,
      where("userId", "==", userId),
      where("completed", "==", false),
      where("dueDate", "<", Timestamp.fromDate(today)),
    )
    const overdueSnapshot = await getDocs(overdueQuery)
    const overdue = overdueSnapshot.size

    return {
      total,
      completed,
      pending,
      overdue,
    }
  } catch (error) {
    console.error("Error getting task stats:", error)
    return {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
    }
  }
}
