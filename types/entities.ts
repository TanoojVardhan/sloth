export type ID = string

export interface User {
  userId: ID
  email: string
  name?: string
  photoURL?: string | null
  browserNotificationsEnabled?: boolean
  /** Drives which tools the workspace shows (timetable, assignments, ...). */
  occupation?: Occupation | null
  /** Public Google Sheet link the timetable is synced from. */
  timetableSheetUrl?: string | null
  /** The specializations this student follows (undefined = not chosen yet). */
  specializations?: string[]
  /** Every specialization found in the sheet on the last sync. */
  timetableOptions?: string[]
  timetableSyncedAt?: number | null
  /** Last day (YYYY-MM-DD) the weekly timetable is valid; classes stop showing after it. */
  timetableUntil?: string | null
}

export type Occupation = "student" | "educator" | "professional" | "freelancer" | "other"

export type AssignmentType = "assignment" | "exam" | "quiz" | "project" | "lab" | "reading"
export type AssignmentStatus = "todo" | "in_progress" | "submitted" | "graded"

/** One recurring weekly slot in the timetable. dayOfWeek: 0 = Monday ... 6 = Sunday. */
export interface ClassSlot {
  classId: ID
  subject: string
  dayOfWeek: number
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  location?: string
  teacher?: string
  color?: string // palette key, see lib/student.ts
  notes?: string
  /** One-off entry for a single date (YYYY-MM-DD); replaces the weekly class of the same subject that day. */
  date?: string | null
  cancelled?: boolean
  /** Last date (YYYY-MM-DD) this weekly class runs. Empty = no end date. */
  until?: string | null
  /** Set on rows that come from the Google Sheet; they are rewritten on every sync. */
  source?: "sheet" | null
  sheetKey?: string | null
  specialization?: string
}

export interface Assignment {
  assignmentId: ID
  title: string
  subject?: string
  type: AssignmentType
  status: AssignmentStatus
  priority: TaskPriority
  dueDate?: string | null // "YYYY-MM-DD"
  dueTime?: string | null // "HH:mm"
  notes?: string
  score?: number | null
  maxScore?: number | null
  weight?: number | null // percent of the final grade
  createdAt?: string
  updatedAt?: string
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
  tags?: string[] // freeform labels, Notion-style
  notes?: string // rich-ish notes: plain text; lines starting "- [ ] "/"- [x] " render as a checklist
  parentTaskId?: ID | null // Notion-style one-level nesting: set to make this a sub-task
  createdAt?: string // ISO
}

export interface Event {
  eventId: ID
  title: string
  start: string // ISO
  end?: string | null // ISO
  location?: string | null
  projectId?: ID | null
  reminderMinutes?: number | null // minutes before start to remind, 0 = at start time, null = no reminder
  createdAt?: string // ISO
}

export interface Project {
  projectId: ID
  name: string
  description?: string | null
  tags?: string[] // freeform labels, Notion-style
  notes?: string // rich-ish notes: plain text; lines starting "- [ ] "/"- [x] " render as a checklist
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

// Notion-style pages: markdown content, nestable via parentId, soft-deleted
// to a trash (archived) before permanent deletion.
export interface Note {
  noteId: ID
  title: string
  icon?: string | null // a single emoji
  content: string // markdown
  parentId?: ID | null
  tags?: string[]
  pinned?: boolean
  archived?: boolean
  createdAt?: string // ISO
  updatedAt?: string // ISO
}

export interface ApiError {
  code: string
  message: string
}
