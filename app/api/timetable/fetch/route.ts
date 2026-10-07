import { NextRequest, NextResponse } from "next/server"
import { verifyIdTokenLite } from "@/lib/verify-token"
import {
  parseCsv,
  parseTimetableTable,
  resolveSource,
  rowsToClasses,
  sheetDocId,
  type ParseResult,
} from "@/lib/timetable-sheet"
import { looksLikeXlsx, readXlsxSheets } from "@/lib/xlsx-lite"
import { aiNormalizeTimetable } from "@/lib/ai-timetable"


export const dynamic = "force-dynamic"

const MAX_BYTES = 8 * 1024 * 1024

const ALLOWED_SUFFIXES = [
  "docs.google.com",
  "drive.google.com",
  "drive.usercontent.google.com",
  "googleusercontent.com",
  "api.onedrive.com",
  "onedrive.live.com",
  "1drv.ms",
  "files.1drv.com",
  "sharepoint.com",
  "microsoftpersonalcontent.com",
  "livefilestore.com",
]
// Sign-in pages: reaching one means the file isn't shared publicly.
const LOGIN_HOSTS = ["accounts.google.com", "login.microsoftonline.com", "login.live.com"]

const hostAllowed = (h: string) => ALLOWED_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`))

type Fetched = { bytes: Uint8Array } | { error: "private" | "upstream" | "too_large"; message?: string }

async function download(start: string): Promise<Fetched> {
  let target = start
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(target, { redirect: "manual", cache: "no-store", headers: { Accept: "*/*" } })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location")
      if (!loc) break
      const next = new URL(loc, target)
      if (LOGIN_HOSTS.includes(next.hostname)) return { error: "private" }
      if (next.protocol !== "https:" || !hostAllowed(next.hostname)) return { error: "private" }
      target = next.toString()
      continue
    }
    if (res.status === 401 || res.status === 403 || res.status === 404) return { error: "private" }
    if (!res.ok) return { error: "upstream", message: `The file host returned ${res.status}.` }
    const buf = new Uint8Array(await res.arrayBuffer())
    if (buf.byteLength > MAX_BYTES) return { error: "too_large" }
    return { bytes: buf }
  }
  return { error: "upstream", message: "Too many redirects." }
}

type Grids = string[][][] | "private"

function toGrids(bytes: Uint8Array): Grids {
  if (looksLikeXlsx(bytes)) return readXlsxSheets(bytes)
  const text = new TextDecoder().decode(bytes)
  // A sign-in or "request access" page comes back as HTML.
  if (/^\s*<(!doctype|html)/i.test(text)) return "private"
  return [parseCsv(text)]
}

/** Strict parse of the template layout; first sheet that works wins. */
function parseGrids(grids: string[][][]): ParseResult {
  let first: ParseResult | null = null
  for (const grid of grids) {
    const r = parseTimetableTable(grid)
    if (!r.error && r.rows.length) return r
    first ??= r
  }
  return first ?? { rows: [], specializations: [], skipped: [], error: "That file has no sheets with data." }
}

/**
 * POST /api/timetable/fetch  { url, specializations, until }
 *
 * Downloads a publicly shared Google Sheet, Google Drive / OneDrive / SharePoint
 * Excel file, parses it, and returns the classes for the chosen specializations.
 * The web app and the Android app both call this, so there is exactly one
 * parser. Only Google and Microsoft hosts are contacted, and only for
 * signed-in users, so it can't be used as an open proxy.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  const verification = token ? await verifyIdTokenLite(token) : null
  if (!verification || !verification.success) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const uid = verification.uid

  let body: { url?: string; specializations?: string[] | null; until?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }

  const source = resolveSource(body.url ?? "")
  if ("error" in source) return NextResponse.json({ error: "bad_url", message: source.error }, { status: 400 })

  try {
    let got = await download(source.url)
    // An uploaded .xlsx opened in Google Sheets can't be exported as CSV (Google
    // answers 400). Try the Excel export, then the plain Drive file download.
    if ("error" in got && got.error === "upstream" && source.kind === "gsheet") {
      const id = source.url.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1]
      const alts = [
        source.url.replace("format=csv", "format=xlsx").replace("output=csv", "output=xlsx"),
        ...(id && id !== "e" ? [`https://drive.google.com/uc?export=download&id=${id}`] : []),
      ].filter((a) => a !== source.url)
      for (const alt of alts) {
        const retry = await download(alt)
        if (!("error" in retry) || retry.error !== "upstream") {
          got = retry
          break
        }
        got = { error: "upstream", message: `${got.message ?? ""} then ${retry.message ?? ""}` }
      }
    }
    if ("error" in got) {
      const status = got.error === "private" ? 403 : got.error === "too_large" ? 413 : 502
      const hint =
        got.error === "upstream"
          ? " Make sure the link is shared as Anyone with the link can view, and that it is a Google Sheet or an Excel file."
          : ""
      return NextResponse.json({ error: got.error, message: got.message ? got.message + hint : undefined }, { status })
    }
    const grids = toGrids(got.bytes)
    if (grids === "private") return NextResponse.json({ error: "private" }, { status: 403 })

    // 1) Template layout parses instantly. 2) Any other layout: let the AI read it.
    let parsed = parseGrids(grids)
    let aiAssisted = false
    if (parsed.error || !parsed.rows.length) {
      const ai = await aiNormalizeTimetable(got.bytes, grids)
      if ("table" in ai) {
        const viaAi = parseTimetableTable(ai.table)
        if (!viaAi.error && viaAi.rows.length) {
          parsed = viaAi
          aiAssisted = true
        }
      } else if (ai.error === "no_key") {
        return NextResponse.json(
          {
            error: "bad_sheet",
            message:
              "This file isn't in the template layout, and AI reading isn't set up on the server. Add GEMINI_API_KEY in the Vercel project settings, then redeploy.",
          },
          { status: 422 },
        )
      } else if (ai.error === "busy") {
        return NextResponse.json(
          { error: "upstream", message: "The AI is busy reading this timetable. Try again in a minute." },
          { status: 503 },
        )
      }
    }
    if (parsed.error || !parsed.rows.length) {
      return NextResponse.json(
        {
          error: "bad_sheet",
          message: "I couldn't find any classes in that file, even with AI. Check that it holds a timetable with days and times.",
        },
        { status: 422 },
      )
    }

    // null = the student hasn't chosen yet, so nothing is imported.
    const classes =
      body.specializations == null
        ? []
        : rowsToClasses(parsed.rows, body.specializations, body.until ?? null).map((c) => ({
            ...c,
            docId: sheetDocId(uid, c.sheetKey ?? ""),
          }))
    let note: string | undefined
    if (body.specializations != null && classes.length === 0) {
      const wanted = new Set(body.specializations.map((x) => x.toLowerCase()))
      const mine = parsed.rows.filter((r) => wanted.has(r.subject.trim().toLowerCase()))
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (mine.length === 0) {
        note = `None of your picked subjects are in the file any more. Tap Change and choose again.`
      } else {
        const pastDated = mine.filter((r) => r.date && r.date < yesterday).length
        const ended = mine.filter((r) => !r.date && (r.until ?? body.until) && (r.until ?? body.until)! < yesterday).length
        note = `Found ${mine.length} classes for your choice, but ${pastDated} are dated in the past and ${ended} have already ended, so none are shown.`
      }
    }
    // The picker lists subjects. "specializations" is kept as the field name so
    // saved data and the Android app keep working; it now holds subject names.
    const subjectNames: string[] = []
    const groups: Record<string, string> = {}
    const seenNames = new Set<string>()
    for (const r of parsed.rows) {
      const k = r.subject.trim().toLowerCase()
      if (!seenNames.has(k)) {
        seenNames.add(k)
        subjectNames.push(r.subject.trim())
      }
      if (r.specialization && !groups[r.subject.trim()]) groups[r.subject.trim()] = r.specialization
    }
    subjectNames.sort((a, b) => a.localeCompare(b))
    return NextResponse.json({ specializations: subjectNames, groups, skipped: parsed.skipped, classes, aiAssisted, note })
  } catch {
    return NextResponse.json({ error: "upstream", message: "Couldn't read that file. Try again in a moment." }, { status: 502 })
  }
}
