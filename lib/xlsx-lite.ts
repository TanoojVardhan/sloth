import { inflateRawSync } from "zlib"

/**
 * A small, dependency-free reader for .xlsx files (server only). An .xlsx is a
 * zip of XML parts, so this unzips the shared strings and each worksheet and
 * returns every sheet as a grid of cell text. Numbers come back as their raw
 * digits; the timetable parser knows which columns are times and dates.
 */

const MAX_ENTRY_BYTES = 25 * 1024 * 1024
const MAX_ROWS = 5000
const MAX_COLS = 60

function readZipEntries(buf: Buffer): Map<string, Buffer> {
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error("not an xlsx file")

  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const out = new Map<string, Buffer>()
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("corrupt xlsx file")
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOffset = buf.readUInt32LE(p + 42)
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen)
    p += 46 + nameLen + extraLen + commentLen

    if (!/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(name)) continue
    const dataStart = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28)
    const data = buf.subarray(dataStart, dataStart + compSize)
    out.set(name, method === 0 ? Buffer.from(data) : inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES }))
  }
  return out
}

function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

function textOf(xml: string): string {
  return [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join("")
}

function readSharedStrings(xml: string): string[] {
  const cleaned = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "")
  return [...cleaned.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)].map((m) => textOf(m[1] ?? ""))
}

function colIndex(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function readSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = []
  for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(/\br="(\d+)"/.exec(rm[1])?.[1] ?? rows.length + 1)
    if (rowNumber > MAX_ROWS) break
    const cells: string[] = []
    for (const cm of (rm[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1]
      const inner = cm[2] ?? ""
      const col = colIndex(/\br="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? "")
      if (col < 0 || col >= MAX_COLS) continue
      const type = /\bt="(\w+)"/.exec(attrs)?.[1]
      let value = ""
      if (type === "inlineStr") value = textOf(inner)
      else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1]
        const text = raw === undefined ? "" : decodeXml(raw)
        value = type === "s" ? (shared[Number(text)] ?? "") : type === "b" ? (text === "1" ? "TRUE" : "FALSE") : text
      }
      cells[col] = value
    }
    for (let i = 0; i < cells.length; i++) cells[i] ??= ""
    rows[rowNumber - 1] = cells
  }
  for (let i = 0; i < rows.length; i++) rows[i] ??= []
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

/** True when the bytes look like a zip (every .xlsx starts with "PK"). */
export function looksLikeXlsx(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

/** Every worksheet of the workbook, in order, as grids of text. */
export function readXlsxSheets(bytes: Uint8Array): string[][][] {
  const entries = readZipEntries(Buffer.from(bytes))
  const shared = entries.get("xl/sharedStrings.xml") ? readSharedStrings(entries.get("xl/sharedStrings.xml")!.toString("utf8")) : []
  return [...entries.keys()]
    .filter((k) => k.startsWith("xl/worksheets/"))
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)![1]) - Number(b.match(/(\d+)\.xml$/)![1]))
    .map((k) => readSheet(entries.get(k)!.toString("utf8"), shared))
}
