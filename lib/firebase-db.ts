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
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"
import { sheetDocId } from "./timetable-sheet"
import type { Task, Event, Project, User, Goal, Note, ClassSlot, Assignment, ID } from "@/types/entities"

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
  NOTES: "notes",
  CLASSES: "classes",
  ASSIGNMENTS: "assignments",
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
    photoURL: data.photoURL ?? null,
    browserNotificationsEnabled: data.browserNotificationsEnabled ?? false,
    occupation: data.occupation ?? undefined,
    timetableSheetUrl: data.timetableSheetUrl ?? null,
    specializations: Array.isArray(data.specializations) ? data.specializations : undefined,
    timetableOptions: Array.isArray(data.timetableOptions) ? data.timetableOptions : [],
    timetableSyncedAt: typeof data.timetableSyncedAt === "number" ? data.timetableSyncedAt : null,
    timetableUntil: data.timetableUntil || null,
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
      tags: data.tags || [],
      notes: data.notes || "",
      parentTaskId: data.parentTaskId || null,
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
      tags: data.tags || [],
      notes: data.notes || "",
      parentTaskId: data.parentTaskId || null,
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
    tags: task.tags || [],
    notes: task.notes || "",
    parentTaskId: task.parentTaskId || null,
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
      reminderMinutes: data.reminderMinutes ?? null,
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
    reminderMinutes: event.reminderMinutes ?? null,
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
      tags: data.tags || [],
      notes: data.notes || "",
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
    tags: data.tags || [],
    notes: data.notes || "",
    createdAt: toISOString(data.createdAt),
  }
}

export async function createProject(userId: ID, project: Omit<Project, "projectId" | "createdAt">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
    userId,
    name: project.name,
    description: project.description || null,
    tags: project.tags || [],
    notes: project.notes || "",
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

// ============= NOTE OPERATIONS =============

export async function getNotes(userId: ID): Promise<Note[]> {
  const q = query(collection(db, COLLECTIONS.NOTES), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const notes: Note[] = snapshot.docs.map((d) => {
    const data = d.data()
    return {
      noteId: d.id,
      title: data.title || "",
      icon: data.icon || null,
      content: data.content || "",
      parentId: data.parentId || null,
      tags: data.tags || [],
      pinned: !!data.pinned,
      archived: !!data.archived,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  })
  // Most recently edited first; pinned/archived grouping happens in the UI.
  return notes.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return dateB - dateA
  })
}

export async function createNote(userId: ID, note: Omit<Note, "noteId" | "createdAt" | "updatedAt">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.NOTES), {
    userId,
    title: note.title || "",
    icon: note.icon || null,
    content: note.content || "",
    parentId: note.parentId || null,
    tags: note.tags || [],
    pinned: !!note.pinned,
    archived: !!note.archived,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateNote(noteId: ID, updates: Partial<Omit<Note, "noteId" | "createdAt" | "updatedAt">>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.NOTES, noteId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteNote(noteId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.NOTES, noteId))
}


// ============= TIMETABLE (CLASSES) =============

export async function getClasses(userId: ID): Promise<ClassSlot[]> {
  const q = query(collection(db, COLLECTIONS.CLASSES), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return {
        classId: d.id,
        subject: data.subject || "",
        dayOfWeek: typeof data.dayOfWeek === "number" ? data.dayOfWeek : 0,
        startTime: data.startTime || "09:00",
        endTime: data.endTime || "10:00",
        location: data.location || "",
        teacher: data.teacher || "",
        color: data.color || "moss",
        notes: data.notes || "",
        date: data.date || null,
        cancelled: !!data.cancelled,
        until: data.until || null,
        source: data.source === "sheet" ? "sheet" : null,
        sheetKey: data.sheetKey || null,
        specialization: data.specialization || "",
      } satisfies ClassSlot
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
}

export async function createClass(userId: ID, c: Omit<ClassSlot, "classId">): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.CLASSES), {
    userId,
    subject: c.subject,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    endTime: c.endTime,
    location: c.location || "",
    teacher: c.teacher || "",
    color: c.color || "moss",
    notes: c.notes || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateClass(classId: ID, updates: Partial<Omit<ClassSlot, "classId">>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CLASSES, classId), { ...updates, updatedAt: serverTimestamp() })
}

export async function deleteClass(classId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CLASSES, classId))
}

// ============= ASSIGNMENTS & EXAMS =============

export async function getAssignments(userId: ID): Promise<Assignment[]> {
  const q = query(collection(db, COLLECTIONS.ASSIGNMENTS), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      assignmentId: d.id,
      title: data.title || "",
      subject: data.subject || "",
      type: data.type || "assignment",
      status: data.status || "todo",
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      dueTime: data.dueTime || null,
      notes: data.notes || "",
      score: typeof data.score === "number" ? data.score : null,
      maxScore: typeof data.maxScore === "number" ? data.maxScore : null,
      weight: typeof data.weight === "number" ? data.weight : null,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    } satisfies Assignment
  })
}

export async function createAssignment(
  userId: ID,
  a: Omit<Assignment, "assignmentId" | "createdAt" | "updatedAt">,
): Promise<ID> {
  const docRef = await addDoc(collection(db, COLLECTIONS.ASSIGNMENTS), {
    userId,
    title: a.title,
    subject: a.subject || "",
    type: a.type,
    status: a.status,
    priority: a.priority,
    dueDate: a.dueDate || null,
    dueTime: a.dueTime || null,
    notes: a.notes || "",
    score: a.score ?? null,
    maxScore: a.maxScore ?? null,
    weight: a.weight ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateAssignment(
  assignmentId: ID,
  updates: Partial<Omit<Assignment, "assignmentId" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), { ...updates, updatedAt: serverTimestamp() })
}

export async function deleteAssignment(assignmentId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId))
}

/**
 * Makes the sheet-sourced classes match [desired] exactly: adds new rows,
 * updates changed ones and removes rows that left the sheet. Classes the
 * student added by hand (no source) are never touched.
 */
export async function syncSheetClasses(
  userId: ID,
  desired: Omit<ClassSlot, "classId">[],
): Promise<{ added: ClassSlot[]; updated: ClassSlot[]; removed: ClassSlot[] }> {
  const existing = (await getClasses(userId)).filter((c) => c.source === "sheet")
  const byKey = new Map(existing.map((c) => [c.sheetKey ?? "", c]))
  const wanted = new Map(desired.map((c) => [c.sheetKey ?? "", c]))

  const added: ClassSlot[] = []
  const updated: ClassSlot[] = []
  const removed: ClassSlot[] = []
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = []

  for (const [key, c] of wanted) {
    const old = byKey.get(key)
    const fields = {
      subject: c.subject,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location || "",
      teacher: c.teacher || "",
      color: c.color || "moss",
      date: c.date || null,
      until: c.until || null,
      cancelled: !!c.cancelled,
      specialization: c.specialization || "",
    }
    if (!old) {
      added.push({ classId: "", ...c })
      ops.push((b) =>
        b.set(doc(db, COLLECTIONS.CLASSES, sheetDocId(userId, key)), {
          userId,
          ...fields,
          notes: "",
          source: "sheet",
          sheetKey: key,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      )
    } else if (
      old.location !== fields.location ||
      old.teacher !== fields.teacher ||
      !!old.cancelled !== fields.cancelled ||
      (old.until ?? null) !== fields.until ||
      old.color !== fields.color
    ) {
      updated.push({ ...old, ...fields })
      ops.push((b) => b.update(doc(db, COLLECTIONS.CLASSES, old.classId), { ...fields, updatedAt: serverTimestamp() }))
    }
  }
  for (const [key, old] of byKey) {
    if (!wanted.has(key)) {
      removed.push(old)
      ops.push((b) => b.delete(doc(db, COLLECTIONS.CLASSES, old.classId)))
    }
  }

  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db)
    ops.slice(i, i + 400).forEach((op) => op(batch))
    await batch.commit()
  }
  return { added, updated, removed }
}
