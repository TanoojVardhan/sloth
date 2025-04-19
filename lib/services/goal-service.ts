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
} from "firebase/firestore"

export interface Goal {
  id: string
  title: string
  description?: string
  progress: number
  target: number
  unit: string
  category: "personal" | "work" | "health" | string
  startDate?: string
  endDate?: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GoalFormData {
  title: string
  description?: string
  progress?: number
  target: number
  unit: string
  category: "personal" | "work" | "health" | string
  startDate?: string
  endDate?: string
  completed?: boolean
}

export async function getGoals(userId: string): Promise<Goal[]> {
  try {
    const goalsRef = collection(db, "goals")
    const q = query(goalsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        progress: data.progress,
        target: data.target,
        unit: data.unit,
        category: data.category,
        startDate: data.startDate ? data.startDate.toDate().toISOString().split("T")[0] : undefined,
        endDate: data.endDate ? data.endDate.toDate().toISOString().split("T")[0] : undefined,
        completed: data.completed,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      }
    })
  } catch (error) {
    console.error("Error fetching goals:", error)
    return []
  }
}

export async function getGoalById(goalId: string, userId: string): Promise<Goal | null> {
  try {
    const goalRef = doc(db, "goals", goalId)
    const goalSnap = await getDoc(goalRef)

    if (!goalSnap.exists()) {
      return null
    }

    const data = goalSnap.data()

    // Verify that the goal belongs to the user
    if (data.userId !== userId) {
      return null
    }

    return {
      id: goalSnap.id,
      title: data.title,
      description: data.description,
      progress: data.progress,
      target: data.target,
      unit: data.unit,
      category: data.category,
      startDate: data.startDate ? data.startDate.toDate().toISOString().split("T")[0] : undefined,
      endDate: data.endDate ? data.endDate.toDate().toISOString().split("T")[0] : undefined,
      completed: data.completed,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  } catch (error) {
    console.error("Error fetching goal:", error)
    return null
  }
}

export async function createGoal(goalData: GoalFormData, userId: string): Promise<Goal> {
  try {
    const goalRef = collection(db, "goals")

    const now = serverTimestamp()
    const goalToAdd = {
      title: goalData.title,
      description: goalData.description || null,
      progress: goalData.progress || 0,
      target: goalData.target,
      unit: goalData.unit,
      category: goalData.category,
      startDate: goalData.startDate ? Timestamp.fromDate(new Date(goalData.startDate)) : null,
      endDate: goalData.endDate ? Timestamp.fromDate(new Date(goalData.endDate)) : null,
      completed: goalData.completed || false,
      userId,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDoc(goalRef, goalToAdd)
    const createdAt = new Date()

    return {
      id: docRef.id,
      title: goalData.title,
      description: goalData.description,
      progress: goalData.progress || 0,
      target: goalData.target,
      unit: goalData.unit,
      category: goalData.category,
      startDate: goalData.startDate,
      endDate: goalData.endDate,
      completed: goalData.completed || false,
      createdAt,
      updatedAt: createdAt,
    }
  } catch (error) {
    console.error("Error creating goal:", error)
    throw error
  }
}

export async function updateGoal(goalId: string, goalData: Partial<GoalFormData>, userId: string): Promise<Goal> {
  try {
    const goalRef = doc(db, "goals", goalId)
    const goalSnap = await getDoc(goalRef)

    if (!goalSnap.exists()) {
      throw new Error("Goal not found")
    }

    const data = goalSnap.data()

    // Verify that the goal belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const goalToUpdate: any = {
      updatedAt: serverTimestamp(),
    }

    // Only update fields that are provided
    if (goalData.title !== undefined) goalToUpdate.title = goalData.title
    if (goalData.description !== undefined) goalToUpdate.description = goalData.description
    if (goalData.progress !== undefined) goalToUpdate.progress = goalData.progress
    if (goalData.target !== undefined) goalToUpdate.target = goalData.target
    if (goalData.unit !== undefined) goalToUpdate.unit = goalData.unit
    if (goalData.category !== undefined) goalToUpdate.category = goalData.category
    if (goalData.startDate !== undefined) {
      goalToUpdate.startDate = goalData.startDate ? Timestamp.fromDate(new Date(goalData.startDate)) : null
    }
    if (goalData.endDate !== undefined) {
      goalToUpdate.endDate = goalData.endDate ? Timestamp.fromDate(new Date(goalData.endDate)) : null
    }
    if (goalData.completed !== undefined) goalToUpdate.completed = goalData.completed

    // Check if progress meets target and update completed status
    if (goalData.progress !== undefined && data.target !== undefined) {
      if (goalData.progress >= data.target && !data.completed) {
        goalToUpdate.completed = true
      } else if (goalData.progress < data.target && data.completed) {
        goalToUpdate.completed = false
      }
    }

    await updateDoc(goalRef, goalToUpdate)

    // Get the updated document
    const updatedGoalSnap = await getDoc(goalRef)
    const updatedData = updatedGoalSnap.data()

    return {
      id: goalId,
      title: updatedData.title,
      description: updatedData.description,
      progress: updatedData.progress,
      target: updatedData.target,
      unit: updatedData.unit,
      category: updatedData.category,
      startDate: updatedData.startDate ? updatedData.startDate.toDate().toISOString().split("T")[0] : undefined,
      endDate: updatedData.endDate ? updatedData.endDate.toDate().toISOString().split("T")[0] : undefined,
      completed: updatedData.completed,
      createdAt: updatedData.createdAt.toDate(),
      updatedAt: updatedData.updatedAt.toDate(),
    }
  } catch (error) {
    console.error("Error updating goal:", error)
    throw error
  }
}

export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  try {
    const goalRef = doc(db, "goals", goalId)
    const goalSnap = await getDoc(goalRef)

    if (!goalSnap.exists()) {
      throw new Error("Goal not found")
    }

    const data = goalSnap.data()

    // Verify that the goal belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    await deleteDoc(goalRef)
  } catch (error) {
    console.error("Error deleting goal:", error)
    throw error
  }
}

export async function updateGoalProgress(goalId: string, progress: number, userId: string): Promise<Goal> {
  try {
    const goalRef = doc(db, "goals", goalId)
    const goalSnap = await getDoc(goalRef)

    if (!goalSnap.exists()) {
      throw new Error("Goal not found")
    }

    const data = goalSnap.data()

    // Verify that the goal belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Check if progress meets target
    const completed = progress >= data.target

    await updateDoc(goalRef, {
      progress,
      completed,
      updatedAt: serverTimestamp(),
    })

    return {
      id: goalId,
      title: data.title,
      description: data.description,
      progress,
      target: data.target,
      unit: data.unit,
      category: data.category,
      startDate: data.startDate ? data.startDate.toDate().toISOString().split("T")[0] : undefined,
      endDate: data.endDate ? data.endDate.toDate().toISOString().split("T")[0] : undefined,
      completed,
      createdAt: data.createdAt.toDate(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error updating goal progress:", error)
    throw error
  }
}
