import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Task, Event, Project, User, Goal, ID } from "@/types/entities"

// Helper to convert Firestore timestamp to ISO string
function toISOString(timestamp: unknown): string | undefined {
  if (!timestamp) return undefined
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }
  if (typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp && typeof (timestamp as { toDate: unknown }).toDate === "function") {
    return ((timestamp as { toDate: () => Date }).toDate()).toISOString()
  }
  if (typeof timestamp === "string") {
    return timestamp
  }
  return undefined
}

// Collection names
const COLLECTIONS = {
  USERS: "users",
  TASKS: "tasks",
  EVENTS: "events",
  PROJECTS: "projects",
  GOALS: "goals",
} as const

// ============= USER OPERATIONS =============

export async function createUser(userId: ID, data: Omit<User, "userId">): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getUser(userId: ID): Promise<User | null> {
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = docSnap.data()
  return {
    userId: docSnap.id,
    email: data.email,
    name: data.name,
  }
}

export async function updateUser(userId: ID, data: Partial<Omit<User, "userId">>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ============= TASK OPERATIONS =============

export async function getTasks(userId: ID): Promise<Task[]> {
  const q = query(
    collection(db, COLLECTIONS.TASKS), 
    where("userId", "==", userId)
  )

  const snapshot = await getDocs(q)
  const tasks = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      taskId: doc.id,
      title: data.title,
      status: data.status,
      priority: data.priority,
      dueDate: toISOString(data.dueDate),
      projectId: data.projectId || null,
      createdAt: toISOString(data.createdAt),
    }
  })
  
  // Sort in memory instead of in query
  return tasks.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })
}

export async function getProjectTasks(userId: ID, projectId: ID): Promise<Task[]> {
  const q = query(
    collection(db, COLLECTIONS.TASKS),
    where("userId", "==", userId),
    where("projectId", "==", projectId)
  )

  const snapshot = await getDocs(q)
  const tasks = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      taskId: doc.id,
      title: data.title,
      status: data.status,
      priority: data.priority,
      dueDate: toISOString(data.dueDate),
      projectId: data.projectId || null,
      createdAt: toISOString(data.createdAt),
    }
  })
  
  // Sort in memory instead of in query
  return tasks.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })
}

export async function createTask(userId: ID, task: Omit<Task, "taskId">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
    userId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || null,
    projectId: task.projectId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateTask(taskId: ID, updates: Partial<Omit<Task, "taskId">>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TASKS, taskId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTask(taskId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId))
}

// ============= EVENT OPERATIONS =============

export async function getEvents(userId: ID): Promise<Event[]> {
  const q = query(
    collection(db, COLLECTIONS.EVENTS), 
    where("userId", "==", userId)
  )

  const snapshot = await getDocs(q)
  const events = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      eventId: doc.id,
      title: data.title,
      start: toISOString(data.start) || "",
      end: toISOString(data.end),
      location: data.location || null,
      projectId: data.projectId || null,
      createdAt: toISOString(data.createdAt),
    }
  })
  
  // Sort in memory by start date
  return events.sort((a, b) => {
    const dateA = new Date(a.start).getTime()
    const dateB = new Date(b.start).getTime()
    return dateA - dateB
  })
}

export async function createEvent(userId: ID, event: Omit<Event, "eventId">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
    userId,
    title: event.title,
    start: event.start,
    end: event.end || null,
    location: event.location || null,
    projectId: event.projectId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateEvent(eventId: ID, updates: Partial<Omit<Event, "eventId">>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVENTS, eventId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteEvent(eventId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId))
}

// ============= PROJECT OPERATIONS =============

export async function getProjects(userId: ID): Promise<Project[]> {
  const q = query(
    collection(db, COLLECTIONS.PROJECTS), 
    where("userId", "==", userId)
  )

  const snapshot = await getDocs(q)
  const projects = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      projectId: doc.id,
      name: data.name,
      description: data.description || null,
      createdAt: toISOString(data.createdAt),
    }
  })
  
  // Sort in memory by created date
  return projects.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })
}

export async function getProject(projectId: ID): Promise<Project | null> {
  const docRef = doc(db, COLLECTIONS.PROJECTS, projectId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = docSnap.data()
  return {
    projectId: docSnap.id,
    name: data.name,
    description: data.description || null,
    createdAt: toISOString(data.createdAt),
  }
}

export async function createProject(userId: ID, project: Omit<Project, "projectId" | "createdAt">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
    userId,
    name: project.name,
    description: project.description || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateProject(projectId: ID, updates: Partial<Omit<Project, "projectId" | "createdAt">>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PROJECTS, projectId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProject(projectId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId))
}

// ============= GOAL OPERATIONS =============

export async function getGoals(userId: ID): Promise<Goal[]> {
  const q = query(
    collection(db, COLLECTIONS.GOALS), 
    where("userId", "==", userId)
  )

  const snapshot = await getDocs(q)
  const goals = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      goalId: doc.id,
      title: data.title,
      description: data.description || null,
      status: data.status,
      targetDate: toISOString(data.targetDate),
      tags: data.tags || [],
      createdAt: toISOString(data.createdAt),
    }
  })
  
  // Sort in memory by created date
  return goals.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })
}

export async function createGoal(userId: ID, goal: Omit<Goal, "goalId">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GOALS), {
    userId,
    title: goal.title,
    description: goal.description || null,
    status: goal.status || "active",
    targetDate: goal.targetDate || null,
    tags: goal.tags || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateGoal(goalId: ID, updates: Partial<Omit<Goal, "goalId">>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GOALS, goalId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGoal(goalId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.GOALS, goalId))
}
