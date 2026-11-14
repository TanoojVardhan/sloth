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
  deleteField,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type QuerySnapshot,
} from "firebase/firestore"
import { db } from "./firebase"
import { sheetDocId } from "./timetable-sheet"
import { isPlainMode, open, seal, splitMeta } from "./e2ee"
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


// ============= ENCRYPTION LAYER =============
// The passphrase is optional. With one, a document is stored as
// { userId, enc, createdAt, updatedAt }: the content sits inside `enc`
// (AES-256-GCM, key only on the user's devices). Without one, the content fields
// sit next to userId as they are, protected by Firestore's own encryption at rest.
// seal() and open() handle both forms, so the rest of this file doesn't care which.

/** Opens every document of a query result (older plaintext documents pass through). */
async function openSnapshot(snapshot: QuerySnapshot<DocumentData>): Promise<{ docs: { id: string; data: () => DocumentData }[] }> {
  const docs = await Promise.all(
    snapshot.docs.map(async (d) => {
      const opened = await open(d.data())
      return { id: d.id, data: () => opened as DocumentData }
    }),
  )
  return { docs }
}

async function addSealed(col: string, userId: ID, fields: Record<string, unknown>): Promise<ID> {
  const ref = await addDoc(collection(db, col), {
    userId,
    ...(await seal(fields)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Merges [updates] into a document's encrypted content. A null value clears the field. */
async function updateSealed(ref: DocumentReference, updates: Record<string, unknown>): Promise<void> {
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("That item no longer exists.")
  const raw = snap.data()
  const { inner } = splitMeta(await open(raw))
  const merged: Record<string, unknown> = { ...inner }
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue
    merged[k] = v
  }
  await setDoc(ref, {
    userId: raw.userId,
    ...(await seal(merged)),
    createdAt: raw.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

function plain(v: unknown): unknown {
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  return v
}

/**
 * Seals everything that was saved before encryption existed. Safe to run again:
 * documents that already have `enc` are skipped. Returns how many were sealed.
 */
export async function migrateToEncrypted(userId: ID): Promise<number> {
  let sealed = 0
  for (const name of DATA_COLLECTIONS) {
    const snapshot = await getDocs(query(collection(db, name), where("userId", "==", userId)))
    const todo = snapshot.docs.filter((d) => !d.data().enc)
    for (let i = 0; i < todo.length; i += 200) {
      const batch = writeBatch(db)
      for (const d of todo.slice(i, i + 200)) {
        const raw = d.data()
        const { inner } = splitMeta(raw)
        for (const k of Object.keys(inner)) inner[k] = plain(inner[k])
        batch.set(d.ref, {
          userId,
          ...(await seal(inner)),
          createdAt: raw.createdAt ?? serverTimestamp(),
          updatedAt: raw.updatedAt ?? serverTimestamp(),
        })
        sealed++
      }
      await batch.commit()
    }
  }
  sealed += await migrateUserDoc(userId)
  return sealed
}

/**
 * The reverse: opens every encrypted document and stores it readable, then drops
 * the wrapped key from the user document. Needs the key in memory. The key is
 * removed last, so if this stops halfway everything can still be opened and
 * running it again finishes the job.
 */
export async function migrateToPlain(userId: ID): Promise<void> {
  for (const name of DATA_COLLECTIONS) {
    const snapshot = await getDocs(query(collection(db, name), where("userId", "==", userId)))
    const todo = snapshot.docs.filter((d) => d.data().enc)
    for (let i = 0; i < todo.length; i += 200) {
      const batch = writeBatch(db)
      for (const d of todo.slice(i, i + 200)) {
        const raw = d.data()
        const { inner } = splitMeta(await open(raw))
        batch.set(d.ref, {
          userId,
          ...inner,
          createdAt: raw.createdAt ?? serverTimestamp(),
          updatedAt: raw.updatedAt ?? serverTimestamp(),
        })
      }
      await batch.commit()
    }
  }
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  const raw = (await getDoc(docRef)).data() ?? {}
  const fields: Record<string, unknown> = {}
  if (raw.enc) {
    const opened = await open(raw)
    for (const f of ENCRYPTED_USER_FIELDS) if (opened[f] !== undefined) fields[f] = opened[f]
  }
  await updateDoc(docRef, {
    ...fields,
    enc: deleteField(),
    e2ee: deleteField(),
    e2eeDisabling: deleteField(),
    updatedAt: serverTimestamp(),
  })
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

const DATA_COLLECTIONS = [
  COLLECTIONS.TASKS,
  COLLECTIONS.EVENTS,
  COLLECTIONS.PROJECTS,
  COLLECTIONS.GOALS,
  COLLECTIONS.NOTES,
  COLLECTIONS.CLASSES,
  COLLECTIONS.ASSIGNMENTS,
]

// ============= USER OPERATIONS =============

export async function createUser(userId: ID, data: Omit<User, "userId">): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/** Fields of the user document that are encrypted. Everything else stays readable (name, email, key wrapper). */
const ENCRYPTED_USER_FIELDS = [
  "occupation",
  "timetableSheetUrl",
  "specializations",
  "timetableOptions",
  "timetableSyncedAt",
  "timetableUntil",
] as const

export async function getUser(userId: ID): Promise<User | null> {
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const raw = docSnap.data()
  let data: DocumentData = raw
  if (raw.enc) {
    try {
      data = await open(raw)
    } catch {
      // Locked (no key in this tab yet): the readable part is enough to show the unlock screen.
      data = raw
    }
  }
  return {
    userId: docSnap.id,
    email: data.email,
    name: data.name,
    photoURL: data.photoURL ?? null,
    browserNotificationsEnabled: data.browserNotificationsEnabled ?? false,
    e2ee: raw.e2ee ?? undefined,
    e2eeDisabling: raw.e2eeDisabling === true,
    occupation: data.occupation ?? undefined,
    timetableSheetUrl: data.timetableSheetUrl ?? null,
    specializations: Array.isArray(data.specializations) ? data.specializations : undefined,
    timetableOptions: Array.isArray(data.timetableOptions) ? data.timetableOptions : [],
    timetableSyncedAt: typeof data.timetableSyncedAt === "number" ? data.timetableSyncedAt : null,
    timetableUntil: data.timetableUntil || null,
  }
}

/** Plain fields are written as they are; encrypted ones are merged into the sealed blob. null clears a field. */
export async function updateUser(userId: ID, data: Partial<Omit<User, "userId">>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  const plainPart: Record<string, unknown> = {}
  const secret: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if ((ENCRYPTED_USER_FIELDS as readonly string[]).includes(k)) secret[k] = v
    else plainPart[k] = v
  }

  const extra: Record<string, unknown> = {}
  if (isPlainMode()) {
    // No passphrase on this account: these fields are stored like any other.
    for (const [k, v] of Object.entries(secret)) if (v !== undefined) extra[k] = v === null ? deleteField() : v
  } else if (Object.keys(secret).length) {
    const raw = (await getDoc(docRef)).data() ?? {}
    const current: Record<string, unknown> = {}
    const opened = raw.enc ? await open(raw) : raw
    for (const f of ENCRYPTED_USER_FIELDS) if (opened[f] !== undefined) current[f] = opened[f]
    for (const [k, v] of Object.entries(secret)) {
      if (v === null || v === undefined) delete current[k]
      else current[k] = v
    }
    extra.enc = (await seal(current)).enc
    // Remove any readable leftovers from before encryption.
    for (const f of ENCRYPTED_USER_FIELDS) if (raw[f] !== undefined) extra[f] = deleteField()
  }

  await updateDoc(docRef, { ...plainPart, ...extra, updatedAt: serverTimestamp() })
}

/** Moves the sensitive user fields into the encrypted blob (once). Returns 1 if it changed anything. */
async function migrateUserDoc(userId: ID): Promise<number> {
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return 0
  const raw = snap.data()
  if (raw.enc) return 0
  const inner: Record<string, unknown> = {}
  const extra: Record<string, unknown> = {}
  for (const f of ENCRYPTED_USER_FIELDS) {
    if (raw[f] !== undefined) {
      inner[f] = raw[f]
      extra[f] = deleteField()
    }
  }
  await updateDoc(docRef, { ...extra, enc: (await seal(inner)).enc, updatedAt: serverTimestamp() })
  return 1
}

// ============= TASK OPERATIONS =============

export async function getTasks(userId: ID): Promise<Task[]> {
  const q = query(
    collection(db, COLLECTIONS.TASKS), 
    where("userId", "==", userId)
  )

  const snapshot = await openSnapshot(await getDocs(q))
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
      completedAt: data.completedAt || null,
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
  // Filtering happens here because project ids are encrypted too.
  return (await getTasks(userId)).filter((t) => t.projectId === projectId)
}

export async function createTask(userId: ID, task: Omit<Task, "taskId">): Promise<ID> {
  return addSealed(COLLECTIONS.TASKS, userId, {
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || null,
    projectId: task.projectId || null,
    tags: task.tags || [],
    notes: task.notes || "",
    parentTaskId: task.parentTaskId || null,
  })
}

export async function updateTask(taskId: ID, updates: Partial<Omit<Task, "taskId">>): Promise<void> {
  // Remember when a task was finished, for Insights.
  if (updates.status && updates.completedAt === undefined) {
    updates = { ...updates, completedAt: updates.status === "done" ? new Date().toISOString() : null }
  }
  await updateSealed(doc(db, COLLECTIONS.TASKS, taskId), updates)
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

  const snapshot = await openSnapshot(await getDocs(q))
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
  return addSealed(COLLECTIONS.EVENTS, userId, {
    title: event.title,
    start: event.start,
    end: event.end || null,
    location: event.location || null,
    projectId: event.projectId || null,
    reminderMinutes: event.reminderMinutes ?? null,
  })
}

export async function updateEvent(eventId: ID, updates: Partial<Omit<Event, "eventId">>): Promise<void> {
  await updateSealed(doc(db, COLLECTIONS.EVENTS, eventId), updates)
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

  const snapshot = await openSnapshot(await getDocs(q))
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

  const data = (await open(docSnap.data())) as DocumentData
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
  return addSealed(COLLECTIONS.PROJECTS, userId, {
    name: project.name,
    description: project.description || null,
    tags: project.tags || [],
    notes: project.notes || "",
  })
}

export async function updateProject(projectId: ID, updates: Partial<Omit<Project, "projectId" | "createdAt">>): Promise<void> {
  await updateSealed(doc(db, COLLECTIONS.PROJECTS, projectId), updates)
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

  const snapshot = await openSnapshot(await getDocs(q))
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
  return addSealed(COLLECTIONS.GOALS, userId, {
    title: goal.title,
    description: goal.description || null,
    status: goal.status || "active",
    targetDate: goal.targetDate || null,
    tags: goal.tags || [],
  })
}

export async function updateGoal(goalId: ID, updates: Partial<Omit<Goal, "goalId">>): Promise<void> {
  await updateSealed(doc(db, COLLECTIONS.GOALS, goalId), updates)
}

export async function deleteGoal(goalId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.GOALS, goalId))
}

// ============= NOTE OPERATIONS =============

export async function getNotes(userId: ID): Promise<Note[]> {
  const q = query(collection(db, COLLECTIONS.NOTES), where("userId", "==", userId))
  const snapshot = await openSnapshot(await getDocs(q))
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
  return addSealed(COLLECTIONS.NOTES, userId, {
    title: note.title || "",
    icon: note.icon || null,
    content: note.content || "",
    parentId: note.parentId || null,
    tags: note.tags || [],
    pinned: !!note.pinned,
    archived: !!note.archived,
  })
}

export async function updateNote(noteId: ID, updates: Partial<Omit<Note, "noteId" | "createdAt" | "updatedAt">>): Promise<void> {
  await updateSealed(doc(db, COLLECTIONS.NOTES, noteId), updates)
}

export async function deleteNote(noteId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.NOTES, noteId))
}


// ============= TIMETABLE (CLASSES) =============

export async function getClasses(userId: ID): Promise<ClassSlot[]> {
  const q = query(collection(db, COLLECTIONS.CLASSES), where("userId", "==", userId))
  const snapshot = await openSnapshot(await getDocs(q))
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return {
        classId: d.id,
        subject: data.subject || "",
        code: data.code || "",
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
  return addSealed(COLLECTIONS.CLASSES, userId, {
    subject: c.subject,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    endTime: c.endTime,
    location: c.location || "",
    teacher: c.teacher || "",
    color: c.color || "moss",
    notes: c.notes || "",
  })
}

export async function updateClass(classId: ID, updates: Partial<Omit<ClassSlot, "classId">>): Promise<void> {
  await updateSealed(doc(db, COLLECTIONS.CLASSES, classId), updates)
}

export async function deleteClass(classId: ID): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CLASSES, classId))
}

// ============= ASSIGNMENTS & EXAMS =============

export async function getAssignments(userId: ID): Promise<Assignment[]> {
  const q = query(collection(db, COLLECTIONS.ASSIGNMENTS), where("userId", "==", userId))
  const snapshot = await openSnapshot(await getDocs(q))
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
  return addSealed(COLLECTIONS.ASSIGNMENTS, userId, {
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
  })
}

export async function updateAssignment(
  assignmentId: ID,
  updates: Partial<Omit<Assignment, "assignmentId" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await updateSealed(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), updates)
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
      code: c.code || "",
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
      const sealed = await seal({ ...fields, notes: "", source: "sheet", sheetKey: key })
      ops.push((b) =>
        b.set(doc(db, COLLECTIONS.CLASSES, sheetDocId(userId, key)), {
          userId,
          ...sealed,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      )
    } else if (
      (old.code ?? "") !== fields.code ||
      old.location !== fields.location ||
      old.teacher !== fields.teacher ||
      !!old.cancelled !== fields.cancelled ||
      (old.until ?? null) !== fields.until ||
      old.color !== fields.color
    ) {
      const next = { ...old, ...fields }
      updated.push(next)
      const { classId: _classId, ...content } = next
      const sealed = await seal(content)
      ops.push((b) =>
        b.set(doc(db, COLLECTIONS.CLASSES, old.classId), { userId, ...sealed, updatedAt: serverTimestamp() }, { merge: true }),
      )
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
