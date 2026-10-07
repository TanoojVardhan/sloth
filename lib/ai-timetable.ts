import { createHash } from "crypto"

/**
 * Reads a timetable in ANY layout (grid with days across, days down, one sheet
 * per section, merged cells, "Subject - Room - Teacher" in one cell...) and
 * rewrites it as the flat table the rest of the sync understands. The flat
 * table is then validated by the normal parser, so the AI can't smuggle in
 * bad times or days.
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

export const FLAT_HEADER = ["Specialization", "Day", "Start", "End", "Code", "Subject", "Room", "Teacher", "Date", "Until", "Status"]

const SCHEMA = {
  type: "OBJECT",
  properties: {
    classes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          specialization: { type: "STRING" },
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

const cache = new Map<string, string[][]>()

function gridToText(grids: string[][][]): string {
  const parts: string[] = []
  let budget = 60000
  grids.slice(0, 12).forEach((g, i) => {
    const lines = g
      .slice(0, 200)
      .map((r) => r.slice(0, 40).map((c) => (c ?? "").replace(/\s+/g, " ").trim()).join("\t").replace(/\t+$/, ""))
      .filter((l) => l.length)
    const text = `### Sheet ${i + 1}\n${lines.join("\n")}`
    if (text.length > budget) return
    budget -= text.length
    parts.push(text)
  })
  return parts.join("\n\n")
}

function buildPrompt(sheetText: string, today: string): string {
  return `You convert a school or college timetable into a flat list of weekly classes.
The spreadsheet below is tab-separated, one block per sheet. Its layout is unknown: days may run across or down,
time slots may be the other axis, cells may hold "Subject / Room / Teacher" together, empty cells under a class
may mean it continues (merged cells), and one file may hold several sections or specializations (as separate
sheets, stacked tables, or a column).

Return every class occurrence as one item:
- day: Mon, Tue, Wed, Thu, Fri, Sat or Sun
- start, end: 24-hour HH:MM. Work out the end time from the next slot or the slot's stated range. If a class spans several slots, use the first start and last end.
- code: the subject or course code if the sheet shows one (like MBA201, FIN-305, 22MBA11). Keep it exactly as written, else "".
- subject: the course name only, without the code, room or teacher
- room, teacher: only if the sheet says so, else ""
- specialization: the elective track or stream a class belongs to (for an MBA: Finance, Marketing, HR, Business Analytics, Operations and so on), taken from a heading, tab name, column, or the subject itself. A student picks one track and sees only its subjects, so list each track's subjects under that track's name.
  Subjects every student takes (core subjects, common classes) get specialization "".
  NEVER use the degree or programme name (MBA, BBA, PGDM, B.Tech...), the college, the year, the semester or the section letter as a specialization, unless the file truly has nothing else to separate the subjects by; in that case use "".
- date: YYYY-MM-DD only for a genuine one-off class or a change on a specific date. Dates printed in a weekly grid's column headings only label the days of that week: they do NOT make the class one-off. Treat the grid as a repeating weekly timetable (date "") unless the sheet clearly says a class happens once.
- until: YYYY-MM-DD only if the sheet states a last day for the timetable or class, else ""
- status: "Cancelled" only if explicitly marked cancelled, else ""

Rules: skip breaks, lunch, free periods, assemblies and blank cells. Never invent classes, rooms or teachers.
Do not merge different subjects. Today is ${today}; use it to resolve dates that omit the year.

Spreadsheet:
${sheetText}`
}

async function callModel(apiKey: string, model: string, prompt: string): Promise<Response> {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0,
        maxOutputTokens: 16000,
      },
    }),
  })
}

export type AiTimetableResult = { table: string[][] } | { error: "no_key" | "busy" | "empty" | "failed" }

export async function aiNormalizeTimetable(bytes: Uint8Array, grids: string[][][]): Promise<AiTimetableResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: "no_key" }

  const hash = createHash("sha256").update("v3").update(bytes).digest("hex")
  const hit = cache.get(hash)
  if (hit) return { table: hit }

  const sheetText = gridToText(grids)
  if (sheetText.replace(/### Sheet \d+/g, "").trim().length < 10) return { error: "empty" }
  const prompt = buildPrompt(sheetText, new Date().toISOString().slice(0, 10))

  let busy = false
  for (const model of MODEL_CHAIN) {
    try {
      const res = await callModel(apiKey, model, prompt)
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
      const parsed = JSON.parse(text) as { classes?: Record<string, string>[] }
      const list = parsed.classes ?? []
      if (!list.length) return { error: "empty" }
      const g = (c: Record<string, string>, k: string) => (c[k] ?? "").toString().trim()
      const table = [
        FLAT_HEADER,
        ...list.map((c) => [
          g(c, "specialization"),
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
    } catch (e) {
      console.error("AI timetable exception", model, e)
    }
  }
  return { error: busy ? "busy" : "failed" }
}
