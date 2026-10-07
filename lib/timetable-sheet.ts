import type { ClassSlot } from "@/types/entities"

/** The columns the sheet should have. Header names are matched loosely. */
export const SHEET_TEMPLATE = [
  ["Specialization", "Day", "Start", "End", "Subject", "Room", "Teacher", "Date", "Until", "Status"],
  ["CSE-AI", "Mon", "09:00", "10:00", "Machine Learning", "A-204", "Dr. Rao", "", "2026-12-20", ""],
  ["CSE-AI", "Mon", "10:15", "11:15", "Data Structures", "A-204", "Prof. Iyer", "", "2026-12-20", ""],
  ["CSE-AI", "Thu", "09:00", "10:00", "Machine Learning", "A-110", "Dr. Rao", "2026-10-15", "", ""],
  ["CSE-AI", "Fri", "14:00", "15:00", "Data Structures", "A-204", "Prof. Iyer", "2026-10-16", "", "Cancelled"],
  ["CSE-DS", "Tue", "09:00", "10:30", "Statistics", "B-101", "Dr. Mehta", "", "2026-12-20", ""],
  ["", "Wed", "11:00", "12:00", "Seminar (everyone)", "Hall 1", "", "", "", ""],
]

export function templateAsTsv(): string {
  return SHEET_TEMPLATE.map((r) => r.join("\t")).join("\n")
}

export interface SheetRow {
  specialization: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  location: string
  teacher: string
  date: string | null
  /** Last day this weekly class runs, if the row says so. */
  until: string | null
  cancelled: boolean
}

export interface ParseResult {
  rows: SheetRow[]
  specializations: string[]
  skipped: { line: number; reason: string }[]
  error?: string
}

// ---------- link handling ----------

export type SourceKind = "gsheet" | "drive" | "onedrive" | "sharepoint"

function base64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Works out where to download the timetable from. Understands Google Sheets,
 * Google Drive files (an uploaded .xlsx), OneDrive and SharePoint share links.
 * The file or sheet has to be shared as "anyone with the link can view".
 */
export function resolveSource(input: string): { url: string; kind: SourceKind } | { error: string } {
  let u: URL
  try {
    u = new URL(input.trim())
  } catch {
    return { error: "That doesn't look like a link." }
  }
  if (u.protocol !== "https:") return { error: "The link has to start with https://" }
  const host = u.hostname.toLowerCase()

  if (host === "docs.google.com") {
    const r = toCsvExportUrl(input)
    return "url" in r ? { url: r.url, kind: "gsheet" } : r
  }
  if (host === "drive.google.com") {
    const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? u.searchParams.get("id")
    if (!id) return { error: "Couldn't find the file id in that Google Drive link." }
    return { url: `https://drive.google.com/uc?export=download&id=${id}`, kind: "drive" }
  }
  if (host === "1drv.ms" || host === "onedrive.live.com") {
    return { url: `https://api.onedrive.com/v1.0/shares/u!${base64Url(input.trim())}/root/content`, kind: "onedrive" }
  }
  if (host.endsWith(".sharepoint.com")) {
    u.searchParams.set("download", "1")
    return { url: u.toString(), kind: "sharepoint" }
  }
  return { error: "Paste a link from Google Sheets, Google Drive, OneDrive or SharePoint." }
}

/** Turns any normal Google Sheets link into its CSV export URL. */
export function toCsvExportUrl(input: string): { url: string } | { error: string } {
  let u: URL
  try {
    u = new URL(input.trim())
  } catch {
    return { error: "That doesn't look like a link." }
  }
  if (u.protocol !== "https:" || u.hostname !== "docs.google.com" || !u.pathname.startsWith("/spreadsheets/")) {
    return { error: "Paste a Google Sheets link (docs.google.com/spreadsheets/...)." }
  }
  const gid = (u.hash.match(/gid=(\d+)/) ?? u.search.match(/gid=(\d+)/))?.[1]
  const published = u.pathname.match(/^\/spreadsheets\/d\/e\/([\w-]+)/)
  if (published) {
    return { url: `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv${gid ? `&gid=${gid}` : ""}` }
  }
  const id = u.pathname.match(/^\/spreadsheets\/d\/([\w-]+)/)?.[1]
  if (!id) return { error: "Couldn't find the sheet id in that link." }
  return { url: `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid ?? "0"}` }
}

// ---------- CSV ----------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const src = text.replace(/^﻿/, "")
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      row.push(cell)
      cell = ""
      rows.push(row)
      row = []
    } else cell += ch
  }
  if (cell !== "" || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

// ---------- cell parsing ----------

const ALIASES: Record<string, string[]> = {
  specialization: ["specialization", "specialisation", "branch", "stream", "group", "batch", "section", "program", "programme"],
  day: ["day", "weekday"],
  start: ["start", "starttime", "from", "begin", "begins"],
  end: ["end", "endtime", "to", "until", "ends"],
  subject: ["subject", "subjectname", "class", "title", "paper", "module"],
  room: ["room", "location", "venue", "hall", "classroom"],
  teacher: ["teacher", "faculty", "lecturer", "professor", "instructor", "staff"],
  date: ["date", "on"],
  until: ["until", "validuntil", "validtill", "till", "enddate", "lastday", "lastdate", "validto"],
  status: ["status", "note", "remarks"],
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "")

const DAY_INDEX: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 }

export function parseDay(s: string): number | null {
  const k = s.trim().toLowerCase().slice(0, 3)
  return k in DAY_INDEX ? DAY_INDEX[k] : null
}

export function parseTime(s: string): string | null {
  // Excel stores times as a fraction of a day (0.375 = 09:00); a full date-time serial carries the same fraction.
  if (/^(0?\.\d+|\d{5}\.\d+)$/.test(s.trim())) {
    const f = Number(s) - Math.floor(Number(s))
    const total = Math.round(f * 1440) % 1440
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
  }
  const m = s.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] ?? "0")
  const ap = m[3]?.toLowerCase()
  if (ap === "pm" && h < 12) h += 12
  if (ap === "am" && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

/** Accepts 2026-10-15, 15/10/2026 and 15-10-2026. Returns YYYY-MM-DD. */
export function parseDate(s: string): string | null {
  const t = s.trim()
  // Excel date serial (days since 1899-12-30)
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(t)) * 86400000)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
  }
  let y: number, m: number, d: number
  let r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (r) [y, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])]
  else {
    r = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (!r) return null
    ;[d, m, y] = [Number(r[1]), Number(r[2]), Number(r[3])]
  }
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function dayIndexOfDate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

export function parseTimetableCsv(text: string): ParseResult {
  return parseTimetableTable(parseCsv(text))
}

/** Same as the CSV parser, for a grid that is already split into cells (e.g. from an Excel file). */
export function parseTimetableTable(table: string[][]): ParseResult {
  const empty = { rows: [], specializations: [], skipped: [] }
  if (table.length < 2) return { ...empty, error: "The sheet is empty. Add a header row and at least one class." }

  const header = table[0].map(norm)
  const col: Record<string, number> = {}
  for (const [field, names] of Object.entries(ALIASES)) {
    const idx = header.findIndex((h) => names.includes(h))
    if (idx >= 0) col[field] = idx
  }
  const missing = ["start", "end", "subject"].filter((f) => !(f in col))
  if (!("day" in col) && !("date" in col)) missing.unshift("day")
  if (missing.length) {
    return { ...empty, error: `The first row needs these columns: ${missing.join(", ")}. Use the template if unsure.` }
  }

  const get = (r: string[], f: string) => (f in col ? (r[col[f]] ?? "").trim() : "")
  const rows: SheetRow[] = []
  const skipped: ParseResult["skipped"] = []
  table.slice(1).forEach((r, i) => {
    const line = i + 2
    const subject = get(r, "subject")
    const start = parseTime(get(r, "start"))
    const end = parseTime(get(r, "end"))
    const dateRaw = get(r, "date")
    const date = dateRaw ? parseDate(dateRaw) : null
    if (!subject) return skipped.push({ line, reason: "no subject" })
    if (dateRaw && !date) return skipped.push({ line, reason: `couldn't read the date "${dateRaw}"` })
    const untilRaw = get(r, "until")
    const until = untilRaw ? parseDate(untilRaw) : null
    if (untilRaw && !until) return skipped.push({ line, reason: `couldn't read the last day "${untilRaw}"` })
    const day = get(r, "day") ? parseDay(get(r, "day")) : date ? dayIndexOfDate(date) : null
    if (day == null) return skipped.push({ line, reason: "couldn't read the day" })
    if (!start || !end) return skipped.push({ line, reason: "couldn't read the start or end time" })
    if (end <= start) return skipped.push({ line, reason: "ends before it starts" })
    rows.push({
      specialization: get(r, "specialization"),
      dayOfWeek: date ? dayIndexOfDate(date) : day,
      startTime: start,
      endTime: end,
      subject,
      location: get(r, "room"),
      teacher: get(r, "teacher"),
      date,
      until: date ? null : until,
      cancelled: /cancel/i.test(get(r, "status")),
    })
  })

  const specializations = [...new Set(rows.map((r) => r.specialization).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  return { rows, specializations, skipped }
}

// ---------- rows -> classes ----------

function fnv1a(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h.toString(16).padStart(8, "0")
}

/**
 * Stable document id for a sheet row. The web app and the Android app both sync
 * the same sheet, so they must agree on ids; otherwise a sync running on each
 * at once would create every class twice. Keep in sync with TimetableSheet.kt.
 */
export function sheetDocId(userId: string, key: string): string {
  return `sh_${userId}_${fnv1a(key)}${fnv1a([...key].reverse().join(""))}`
}

const PALETTE = ["moss", "terracotta", "gold", "sky", "plum", "rose"]

function colorFor(subject: string): string {
  let h = 0
  for (const ch of subject.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function sheetKey(r: SheetRow): string {
  return [r.specialization.toLowerCase(), r.date ?? "weekly", r.dayOfWeek, r.startTime, r.endTime, r.subject.toLowerCase()].join("|")
}

/** Rows for the chosen specializations (plus rows with no specialization = everyone). */
export function rowsToClasses(
  rows: SheetRow[],
  selected: string[],
  /** Timetable-wide last day; a row's own "until" wins over it. */
  globalUntil: string | null = null,
  today = new Date(),
): Omit<ClassSlot, "classId">[] {
  const wanted = new Set(selected.map((s) => s.toLowerCase()))
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const iso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`
  const seen = new Set<string>()
  const out: Omit<ClassSlot, "classId">[] = []
  for (const r of rows) {
    if (r.specialization && !wanted.has(r.specialization.toLowerCase())) continue
    if (r.date && r.date < iso) continue // old one-off changes are noise
    const until = r.date ? null : (r.until ?? globalUntil)
    if (until && until < iso) continue // the timetable has already ended
    const key = sheetKey(r)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      subject: r.subject,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      location: r.location,
      teacher: r.teacher,
      color: colorFor(r.subject),
      notes: "",
      date: r.date,
      until,
      cancelled: r.cancelled,
      source: "sheet",
      sheetKey: key,
      specialization: r.specialization,
    })
  }
  return out
}
