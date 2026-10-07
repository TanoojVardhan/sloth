import { mutate } from "swr"
import { auth } from "@/lib/firebase"
import { syncSheetClasses, updateUser } from "@/lib/firebase-db"
import { DAYS_SHORT, format12 } from "@/lib/student"
import type { ClassSlot, User } from "@/types/entities"

export interface SyncResult {
  ok: boolean
  /** Plain-language problem, ready to show. */
  error?: string
  privateSheet?: boolean
  needsPick?: boolean
  specializations: string[]
  changes: string[]
  skipped: { line: number; reason: string }[]
  imported: number
  at: number
}

export const TIMETABLE_SYNCED_EVENT = "sloth:timetable-synced"

let inFlight: Promise<SyncResult> | null = null

function describe(c: ClassSlot, verb: string): string {
  const when = c.date ? `${DAYS_SHORT[c.dayOfWeek]} ${c.date.slice(5)}` : DAYS_SHORT[c.dayOfWeek]
  return `${verb}: ${c.subject}, ${when} ${format12(c.startTime)}`
}

async function run(user: User): Promise<SyncResult> {
  const base: SyncResult = { ok: false, specializations: user.timetableOptions ?? [], changes: [], skipped: [], imported: 0, at: Date.now() }
  if (!user.timetableSheetUrl) return { ...base, error: "No sheet connected yet." }

  type Wire = Omit<ClassSlot, "classId"> & { docId?: string }
  let data: { specializations?: string[]; skipped?: SyncResult["skipped"]; classes?: Wire[]; error?: string; message?: string }
  try {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch("/api/timetable/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        url: user.timetableSheetUrl,
        specializations: user.specializations ?? null,
        until: user.timetableUntil ?? null,
      }),
    })
    data = await res.json().catch(() => ({}))
    if (!res.ok || !data.classes) {
      if (data.error === "private") {
        return {
          ...base,
          privateSheet: true,
          error: "This file isn't shared publicly. Open Share, set General access to \"Anyone with the link\" (Viewer), then press Refresh.",
        }
      }
      return { ...base, error: data.message ?? "Couldn't read the file. Try again in a moment." }
    }
  } catch {
    return { ...base, error: "You appear to be offline. Showing the last saved timetable." }
  }

  const options = data.specializations ?? []
  const result: SyncResult = { ...base, ok: true, specializations: options, skipped: data.skipped ?? [] }

  // Make students choose: nothing is imported until they pick their specialization(s).
  if (options.length > 0 && user.specializations === undefined) {
    // Nothing from an earlier sheet should linger while the student chooses.
    const cleared = await syncSheetClasses(user.userId, [])
    if (cleared.removed.length) await mutate("classes")
    await updateUser(user.userId, { timetableOptions: options, timetableSyncedAt: result.at }).catch(() => undefined)
    return { ...result, needsPick: true }
  }

  const desired = (data.classes ?? []).map(({ docId: _docId, ...c }) => c)
  const diff = await syncSheetClasses(user.userId, desired)
  result.imported = desired.length

  const firstImport = diff.added.length === desired.length && diff.updated.length === 0 && diff.removed.length === 0
  if (!firstImport) {
    for (const c of diff.updated) result.changes.push(c.cancelled ? describe(c, "Cancelled") : describe(c, "Changed"))
    for (const c of diff.added) result.changes.push(describe(c, "New"))
    for (const c of diff.removed) result.changes.push(describe(c, "Removed"))
  }

  await updateUser(user.userId, { timetableOptions: options, timetableSyncedAt: result.at }).catch(() => undefined)
  if (diff.added.length || diff.updated.length || diff.removed.length) await mutate("classes")
  return result
}

/** One sync at a time; callers share the in-flight result. Never throws. */
export function runTimetableSync(user: User): Promise<SyncResult> {
  if (inFlight) return inFlight
  inFlight = run(user)
    .catch(
      (): SyncResult => ({
        ok: false,
        error: "Couldn't update the timetable. Try again in a moment.",
        specializations: user.timetableOptions ?? [],
        changes: [],
        skipped: [],
        imported: 0,
        at: Date.now(),
      }),
    )
    .then((r) => {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(TIMETABLE_SYNCED_EVENT, { detail: r }))
      return r
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}
