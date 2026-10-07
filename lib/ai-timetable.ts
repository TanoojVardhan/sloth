import { createHash } from "crypto"

/**
 * Reads a timetable in ANY layout (grid with days across, days down, one sheet
 * per section, merged cells, course codes with a legend, ...) and rewrites it
 * as the flat table the rest of the sync understands. The flat table is then
 * validated by the normal parser, so the AI can't smuggle in bad times or days.
 *
 * Three passes: understand the layout and inventory every course, extract every
 * class against that inventory, then audit the result for anything missed.
 */

const MODEL_CHAIN = (() => {
  const chain = [
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash-lite",
  ]
  const env = process.env.GEMINI_MODEL
  return env ? [env, ...chain.filter((m) => m !== env)] : chain
})()

export const FLAT_HEADER = [
  "Specialization",
  "Section",
  "Day",
  "Start",
  "End",
  "Code",
  "Subject",
  "Room",
  "Teacher",
  "Date",
  "Until",
  "Status",
]

const SCHEMA = {
  type: "OBJECT",
  properties: {
    classes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          specialization: { type: "STRING" },
          section: { type: "STRING" },
          day: { type: "STRING" },
          start: { type: "STRING" },
          end: { type: "STRING" },
          code: { type: "STRING" },
          subject: { type: "STRING" },
          room: { type: "STRING" },
          teacher: { type: "STRING" },
          date: { type: "STRING" },
          until: { type: "STRING" },
          status: { type: "STRING" },
        },
        required: ["day", "start", "end", "subject"],
      },
    },
  },
  required: ["classes"],
}

type Item = Record<string, string>

const UNDERSTAND_SCHEMA = {
  type: "OBJECT",
  properties: {
    layout: { type: "STRING" },
    courses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          code: { type: "STRING" },
          name: { type: "STRING" },
          sections: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["code"],
      },
    },
  },
  required: ["layout", "courses"],
}

type Understanding = { layout: string; courses: { code: string; name?: string; sections?: string[] }[] }

const cache = new Map<string, string[][]>()

function gridToText(grids: string[][][]): string {
  const parts: string[] = []
  let budget = 150000
  grids.slice(0, 15).forEach((g, i) => {
    const lines = g
      .slice(0, 400)
      .map((r) => r.slice(0, 60).map((c) => (c ?? "").replace(/\s+/g, " ").trim()).join("\t").replace(/\t+$/, ""))
      .filter((l) => l.length)
    const text = `### Sheet ${i + 1}\n${lines.join("\n")}`
    if (text.length > budget) return
    budget -= text.length
    parts.push(text)
  })
  return parts.join("\n\n")
}

const RULES = `Return every class occurrence as one item:
- day: Mon, Tue, Wed, Thu, Fri, Sat or Sun
- start, end: 24-hour HH:MM. Work out the end time from the slot's stated range or the next slot. If a class spans several slots, use the first start and last end.
- code: the course / subject code or abbreviation exactly as written (like ABC, X101 or 22AB11). Courses are identified by this code. If the cell shows only a code, that code IS the course.
- subject: the full course name. If the cell holds only a code, look the name up in any legend / course list / course-details table elsewhere in the file; if none exists, repeat the code as the subject. Never leave a class out because its name is unknown.
- section: the section, batch or division of that course (A, B, 1, 2...) whenever the same course has several. Each section is a separate class: NEVER merge sections, and keep a class for every section even when they share a slot or room.
- specialization: an elective track or stream heading (for example a stream heading) if the sheet has one, else "". Never use the degree or programme name, year or semester here.
- room, teacher: only if the sheet says so, else ""
- date: YYYY-MM-DD only for a genuine one-off class or change on a specific date. Dates printed in a weekly grid's headings just label that week: the class stays weekly (date "").
- until: YYYY-MM-DD only if the sheet states a last day, else ""
- status: "Cancelled" only if explicitly marked cancelled, else ""

Rules: skip breaks, lunch, free periods and blank cells. Every other cell that holds a course is a class. Never invent classes, rooms or teachers.

Worked examples of unrelated, made-up timetables, to show the range of layouts (do not copy their content):

Example 1: days down the side, time slots across, codes only, a legend below.
  Day  | 9-10 | 10-11
  Mon  | AA1  | BB2 (Sec B)
  Tue  | BB2 (Sec A) | AA1
  Legend: AA1 = Alpha Studies, BB2 = Beta Methods
 -> Mon 09:00-10:00 AA1 Alpha Studies; Mon 10:00-11:00 BB2 Beta Methods section B; Tue 09:00-10:00 BB2 Beta Methods section A; Tue 10:00-11:00 AA1 Alpha Studies.

Example 2: one sheet per section, days across, names with room and teacher in one cell.
  Sheet "Sec A": header Mon Tue; row 9:00 | "Gamma Lab / R5 / Dr. K" | ""; row 10:00 | "" | "Delta Theory / R2 / Dr. M"
 -> Mon 09:00-10:00 Gamma Lab room R5 teacher Dr. K section A; Tue 10:00-11:00 Delta Theory room R2 teacher Dr. M section A.

Example 3: a long list with one row per class.
  Course | Section | Weekday | From | To
  EE5 | 1 | Wed | 2pm | 3pm
 -> Wed 14:00-15:00 EE5 section 1.`

function extractPrompt(sheetText: string, today: string, brief: string): string {
  return `You convert a school or college timetable into a flat list of weekly classes.
The spreadsheet below is tab-separated, one block per sheet. Its layout is unknown: days may run across or down,
time slots may be the other axis, cells may hold course codes, "Code / Room / Teacher" together, empty cells under a class
may mean it continues (merged cells), and one file may hold several sections or specializations.
Be exhaustive: go through the grid cell by cell, day by day, and slot by slot. Missing a class is the worst mistake.

${brief}${RULES}
Today is ${today}.

Spreadsheet:
${sheetText}`
}

function auditPrompt(sheetText: string, found: Item[], today: string, brief: string): string {
  const compact = found.map((c) => [c.day, c.start, c.end, c.code, c.subject, c.section].filter(Boolean).join(" | ")).join("\n")
  return `A first pass extracted these classes from the timetable spreadsheet below:

${compact}

${brief}Audit it. Read the spreadsheet again cell by cell and list every class that is MISSING from the list above:
any course code never mentioned, any section of a course that is not listed (a course may have several sections), any day or slot that was skipped.
Return ONLY the missing classes, in the same format. If nothing is missing return an empty list.

${RULES}
Today is ${today}.

Spreadsheet:
${sheetText}`
}

function understandPrompt(sheetText: string): string {
  return `Study this timetable spreadsheet (tab-separated, one block per sheet) before anything is extracted.
1. layout: in 2 to 4 sentences, explain how it is organised: what the rows and columns mean, where days, time slots, course codes, names, sections, rooms and teachers live, whether cells are merged, and whether there is a legend or course list.
2. courses: list EVERY distinct course or subject that appears anywhere in the file (grid cells, legends, headers, side tables), with its code or short name exactly as written, its full name if the file gives one, and every section / batch / division you can see for it.
Read all of it. Do not rely on any assumption about which courses should exist; report only what is written.

Spreadsheet:
${sheetText}`
}

async function callModel(apiKey: string, model: string, prompt: string, schema: object = SCHEMA): Promise<Response> {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0,
        maxOutputTokens: 48000,
      },
    }),
  })
}

type Step = { items: Item[] } | { error: "busy" | "failed" }

/** Runs a prompt through the model chain; first usable answer wins. */
async function askRaw(apiKey: string, prompt: string, schema: object): Promise<{ text: string } | { error: "busy" | "failed" }> {
  let busy = false
  for (const model of MODEL_CHAIN) {
    try {
      const res = await callModel(apiKey, model, prompt, schema)
      if (res.status === 429 || res.status === 503) {
        busy = true
        continue
      }
      if (!res.ok) {
        console.error("AI timetable error", model, res.status, (await res.text()).slice(0, 300))
        continue
      }
      const data = await res.json()
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) continue
      return { text }
    } catch (e) {
      console.error("AI timetable exception", model, e)
    }
  }
  return { error: busy ? "busy" : "failed" }
}

async function ask(apiKey: string, prompt: string): Promise<Step> {
  const r = await askRaw(apiKey, prompt, SCHEMA)
  if ("error" in r) return r
  try {
    return { items: (JSON.parse(r.text) as { classes?: Item[] }).classes ?? [] }
  } catch {
    return { error: "failed" }
  }
}

async function understand(apiKey: string, sheetText: string): Promise<Understanding | null> {
  const r = await askRaw(apiKey, understandPrompt(sheetText), UNDERSTAND_SCHEMA)
  if ("error" in r) return null
  try {
    return JSON.parse(r.text) as Understanding
  } catch {
    return null
  }
}

/** Turns what the AI understood into a checklist the later passes must satisfy. */
function briefing(u: Understanding | null): string {
  if (!u) return ""
  const courses = (u.courses ?? [])
    .map((c) => `- ${c.code}${c.name ? ` (${c.name})` : ""}${c.sections?.length ? `, sections: ${c.sections.join(", ")}` : ""}`)
    .join("\n")
  return `What the first read found.
Layout: ${u.layout}
Courses present in the file (each one, with each of its sections, must appear in the output at every slot where it is scheduled):
${courses}

`
}

const g = (c: Item, k: string) => (c[k] ?? "").toString().trim()
const keyOf = (c: Item) =>
  [g(c, "day"), g(c, "start"), g(c, "end"), g(c, "code"), g(c, "subject"), g(c, "section"), g(c, "date")].join("|").toLowerCase()

export type AiTimetableResult = { table: string[][] } | { error: "no_key" | "busy" | "empty" | "failed" }

export async function aiNormalizeTimetable(bytes: Uint8Array, grids: string[][][]): Promise<AiTimetableResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: "no_key" }

  const hash = createHash("sha256").update("v5").update(bytes).digest("hex")
  const hit = cache.get(hash)
  if (hit) return { table: hit }

  const sheetText = gridToText(grids)
  if (sheetText.replace(/### Sheet \d+/g, "").trim().length < 10) return { error: "empty" }
  const today = new Date().toISOString().slice(0, 10)

  const understood = await understand(apiKey, sheetText)
  const brief = briefing(understood)
  const first = await ask(apiKey, extractPrompt(sheetText, today, brief))
  if ("error" in first) return { error: first.error }
  if (!first.items.length) return { error: "empty" }

  // Second pass: ask what the first one missed. A failure here is not fatal.
  const items = [...first.items]
  const seen = new Set(items.map(keyOf))
  const audit = await ask(apiKey, auditPrompt(sheetText, first.items, today, brief))
  if ("items" in audit) {
    for (const c of audit.items) {
      const k = keyOf(c)
      if (!seen.has(k)) {
        seen.add(k)
        items.push(c)
      }
    }
  }

  const table = [
    FLAT_HEADER,
    ...items.map((c) => [
      g(c, "specialization"),
      g(c, "section"),
      g(c, "day"),
      g(c, "start"),
      g(c, "end"),
      g(c, "code"),
      g(c, "subject"),
      g(c, "room"),
      g(c, "teacher"),
      g(c, "date"),
      g(c, "until"),
      g(c, "status"),
    ]),
  ]
  if (cache.size >= 20) cache.delete(cache.keys().next().value as string)
  cache.set(hash, table)
  return { table }
}
