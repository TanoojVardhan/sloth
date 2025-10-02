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

export interface Goal {
  id: string
  title: string
  description?: string
  targetAmount?: number
  currentAmount?: number
  completed: boolean
  archived?: boolean
  dueDate?: string
  category?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface GoalFormData {
  title: string
  description?: string
  targetAmount?: number
  currentAmount?: number
  completed?: boolean
  archived?: boolean
  dueDate?: string
  category?: string
  tags?: string[]
}

export interface GoalsQueryOptions {
  completed?: boolean
  category?: string
  tag?: string
  dueBefore?: Date
  dueAfter?: Date
  limit?: number
  startAfter?: DocumentSnapshot
  orderByField?: "dueDate" | "category" | "createdAt" | "updatedAt"
  orderDirection?: "asc" | "desc"
}

export async function getGoals(userId: string, options: GoalsQueryOptions = {}): Promise<Goal[]> {
  console.log("getGoals: Starting with userId", userId, "and options:", options);
  try {
    const goalsRef = collection(db, "goals");
    console.log("getGoals: Created collection reference for 'goals'");
    
    let q = query(goalsRef, where("userId", "==", userId));
    console.log("getGoals: Applied userId filter");

    // Apply filters
    if (options.completed !== undefined) {
      q = query(q, where("completed", "==", options.completed));
      console.log("getGoals: Applied completed filter:", options.completed);
    }
    
    if (options.category) {
      q = query(q, where("category", "==", options.category));
      console.log("getGoals: Applied category filter:", options.category);
    }
    
    if (options.tag) {
      q = query(q, where("tags", "array-contains", options.tag));
      console.log("getGoals: Applied tag filter:", options.tag);
    }
    
    if (options.dueBefore) {
      const dueBefore = Timestamp.fromDate(options.dueBefore);
      q = query(q, where("dueDate", "<=", dueBefore));
      console.log("getGoals: Applied dueBefore filter");
    }
    
    if (options.dueAfter) {
      const dueAfter = Timestamp.fromDate(options.dueAfter);
      q = query(q, where("dueDate", ">=", dueAfter));
      console.log("getGoals: Applied dueAfter filter");
    }

    // Apply ordering
    const orderByField = options.orderByField || "createdAt";
    const orderDirection = options.orderDirection || "desc";
    q = query(q, orderBy(orderByField, orderDirection));
    console.log(`getGoals: Applied ordering by ${orderByField} ${orderDirection}`);

    // Apply pagination
    if (options.limit) {
      q = query(q, limit(options.limit));
      console.log("getGoals: Applied limit:", options.limit);
    }
    
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
      console.log("getGoals: Applied startAfter pagination");
    }

    console.log("getGoals: Executing query...");
    const querySnapshot = await getDocs(q);
    console.log(`getGoals: Query returned ${querySnapshot.size} documents`);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        description: data.description || undefined,
        targetAmount: data.targetAmount || undefined,
        currentAmount: data.currentAmount || 0,
        completed: data.completed || false,
        archived: typeof data.archived === 'boolean' ? data.archived : false,
        dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
        category: data.category || undefined,
        tags: data.tags || [],
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [];
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
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      completed: data.completed,
      dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  } catch (error) {
    // (removed stray archived line)
    console.error("Error fetching goal:", error)
    return null
  }
}

export async function createGoal(goalData: GoalFormData, userId: string): Promise<Goal> {
  try {
    if (!userId) {
      throw new Error("User ID is required to create a goal")
    }
    
    const goalsRef = collection(db, "goals")
    
    // Handle date conversion safely
    let dueDate = null
    if (goalData.dueDate) {
      try {
        const parsedDate = new Date(goalData.dueDate)
        if (!isNaN(parsedDate.getTime())) {
          dueDate = Timestamp.fromDate(parsedDate)
        }
      } catch (dateError) {
        console.error("Error parsing date:", dateError)
      }
    }
    
    // Create the goal object for Firestore
    const goalToAdd = {
      title: goalData.title,
      description: goalData.description || null,
      targetAmount: goalData.targetAmount || null,
      currentAmount: goalData.currentAmount || 0,
      completed: goalData.completed || false,
      archived: typeof goalData.archived === 'boolean' ? goalData.archived : false,
      dueDate: dueDate,
      category: goalData.category || null,
      tags: goalData.tags || [],
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    const docRef = await addDoc(goalsRef, goalToAdd)
    const createdAt = new Date()
    
    // Return the created goal object
    return {
      id: docRef.id,
      title: goalData.title,
      description: goalData.description,
      targetAmount: goalData.targetAmount,
      currentAmount: goalData.currentAmount || 0,
      completed: goalData.completed || false,
      archived: typeof goalData.archived === 'boolean' ? goalData.archived : false,
      dueDate: goalData.dueDate,
      category: goalData.category,
      tags: goalData.tags || [],
      createdAt,
      updatedAt: createdAt,
    }
  } catch (error) {
    console.error("Error creating goal:", error)
    throw error
  }
}

export async function updateGoal(goalId: string, goalData: GoalFormData, userId: string): Promise<Goal> {
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
    
    const goalToUpdate = {
      title: goalData.title,
      description: goalData.description || null,
      targetAmount: goalData.targetAmount !== undefined ? goalData.targetAmount : data.targetAmount,
      currentAmount: goalData.currentAmount !== undefined ? goalData.currentAmount : data.currentAmount,
      completed: goalData.completed !== undefined ? goalData.completed : data.completed,
      archived: typeof goalData.archived === 'boolean' ? goalData.archived : (typeof data.archived === 'boolean' ? data.archived : false),
      dueDate: goalData.dueDate ? Timestamp.fromDate(new Date(goalData.dueDate)) : data.dueDate,
      category: goalData.category || data.category,
      tags: goalData.tags || data.tags,
      updatedAt: serverTimestamp(),
    }
    
    await updateDoc(goalRef, goalToUpdate)
    const updatedAt = new Date()
    
    return {
      id: goalId,
      title: goalData.title,
      description: goalData.description || data.description,
      targetAmount: goalData.targetAmount !== undefined ? goalData.targetAmount : data.targetAmount,
      currentAmount: goalData.currentAmount !== undefined ? goalData.currentAmount : data.currentAmount,
      completed: goalData.completed !== undefined ? goalData.completed : data.completed,
      archived: typeof goalData.archived === 'boolean' ? goalData.archived : (typeof data.archived === 'boolean' ? data.archived : false),
      dueDate: goalData.dueDate || (data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined),
      category: goalData.category || data.category,
      tags: goalData.tags || data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt,
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

export async function toggleGoalCompletion(goalId: string, userId: string): Promise<Goal> {
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
    
    const newCompletedState = !data.completed
    await updateDoc(goalRef, {
      completed: newCompletedState,
      updatedAt: serverTimestamp(),
    })
    
    return {
      id: goalId,
      title: data.title,
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      completed: newCompletedState,
      dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error toggling goal completion:", error)
    throw error
  }
}

export async function updateGoalProgress(goalId: string, amount: number, userId: string): Promise<Goal> {
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
    
    const newAmount = amount
    const isCompleted = data.targetAmount ? newAmount >= data.targetAmount : false
    
    await updateDoc(goalRef, {
      currentAmount: newAmount,
      completed: isCompleted,
      updatedAt: serverTimestamp(),
    })
    
    return {
      id: goalId,
      title: data.title,
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: newAmount,
      completed: isCompleted,
      dueDate: data.dueDate ? data.dueDate.toDate().toISOString().split("T")[0] : undefined,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error updating goal progress:", error)
    throw error
  }
}

export async function getGoalStats(userId: string): Promise<{
  total: number
  completed: number
  inProgress: number
  upcoming: number
}> {
  try {
    const goalsRef = collection(db, "goals")
    
    // Get total goals
    const totalQuery = query(goalsRef, where("userId", "==", userId))
    const totalSnapshot = await getDocs(totalQuery)
    const total = totalSnapshot.size
    
    // Get completed goals
    const completedQuery = query(goalsRef, where("userId", "==", userId), where("completed", "==", true))
    const completedSnapshot = await getDocs(completedQuery)
    const completed = completedSnapshot.size
    
    // Get in-progress goals (has currentAmount > 0 but not completed)
    const inProgressQuery = query(
      goalsRef,
      where("userId", "==", userId),
      where("completed", "==", false),
      where("currentAmount", ">", 0)
    )
    const inProgressSnapshot = await getDocs(inProgressQuery)
    const inProgress = inProgressSnapshot.size
    
    // Get upcoming goals (future due date, not started)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcoming = total - completed - inProgress
    
    return {
      total,
      completed,
      inProgress,
      upcoming,
    }
  } catch (error) {
    console.error("Error getting goal stats:", error)
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      upcoming: 0,
    }
  }
}
