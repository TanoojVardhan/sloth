import type React from "react"

// A small markdown renderer that produces React elements directly, so note
// content can never inject HTML or scripts. Supports the subset people
// actually type in a planner: headings, lists, checklists (clickable),
// quotes, code, dividers, tables-free inline styling, links, and
// [[Wiki links]] between pages.

export interface MarkdownOptions {
  /** Called with the 0-based source line index of a clicked checklist item. */
  onToggleCheckbox?: (lineIndex: number) => void
  /** Called when a [[Page title]] link is clicked. */
  onWikiLink?: (title: string) => void
  /** Whether a [[Page title]] resolves to an existing page (unresolved ones render dimmed). */
  resolveWikiLink?: (title: string) => boolean
}

const INLINE_RE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(~~[^~]+~~)|(==[^=]+==)|(\[\[[^\]]+\]\])|(\[[^\]]+\]\([^)\s]+\))|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)|(https?:\/\/[^\s)]+)/g

function safeHref(url: string): string | null {
  const trimmed = url.trim()
  return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : null
}

export function renderInline(text: string, keyPrefix: string, opts: MarkdownOptions): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let i = 0
  const re = new RegExp(INLINE_RE.source, "g")
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    const key = `${keyPrefix}-${i++}`
    if (m[1]) {
      out.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (m[2]) {
      out.push(<strong key={key}>{renderInline(token.slice(2, -2), key, opts)}</strong>)
    } else if (m[3]) {
      out.push(<s key={key}>{renderInline(token.slice(2, -2), key, opts)}</s>)
    } else if (m[4]) {
      out.push(
        <mark key={key} className="rounded bg-yellow-200/70 px-0.5 text-inherit dark:bg-yellow-500/30">
          {renderInline(token.slice(2, -2), key, opts)}
        </mark>,
      )
    } else if (m[5]) {
      const title = token.slice(2, -2).trim()
      const exists = opts.resolveWikiLink ? opts.resolveWikiLink(title) : true
      out.push(
        <button
          key={key}
          type="button"
          onClick={() => opts.onWikiLink?.(title)}
          className={`rounded px-0.5 font-medium underline decoration-dotted underline-offset-4 ${
            exists ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
          }`}
          title={exists ? `Open “${title}”` : `Create page “${title}”`}
        >
          {title}
        </button>,
      )
    } else if (m[6]) {
      const close = token.indexOf("](")
      const label = token.slice(1, close)
      const href = safeHref(token.slice(close + 2, -1))
      out.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
            {label}
          </a>
        ) : (
          label
        ),
      )
    } else if (m[7] || m[8]) {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), key, opts)}</em>)
    } else if (m[9]) {
      const href = safeHref(token)
      out.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline underline-offset-4">
            {token}
          </a>
        ) : (
          token
        ),
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

type ListItem = { kind: "bullet" | "number" | "check"; checked?: boolean; text: string; indent: number; line: number }

export function renderMarkdown(content: string, opts: MarkdownOptions = {}): React.ReactNode {
  const lines = content.split("\n")
  const blocks: React.ReactNode[] = []
  let list: ListItem[] = []
  let listOrdered = false

  const flushList = () => {
    if (list.length === 0) return
    const items = list
    const key = `list-${items[0].line}`
    const ListTag = listOrdered ? "ol" : "ul"
    blocks.push(
      <ListTag key={key} className={`my-2 space-y-1 ${listOrdered ? "list-decimal" : items.every((x) => x.kind === "check") ? "list-none" : "list-disc"} pl-6`}>
        {items.map((it) =>
          it.kind === "check" ? (
            <li key={`li-${it.line}`} className="-ml-6 flex list-none items-start gap-2" style={{ marginLeft: `calc(-1.5rem + ${it.indent * 1.25}rem)` }}>
              <input
                type="checkbox"
                checked={!!it.checked}
                onChange={() => opts.onToggleCheckbox?.(it.line)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--primary)]"
                aria-label={it.text}
              />
              <span className={it.checked ? "text-muted-foreground line-through" : ""}>{renderInline(it.text, `li-${it.line}`, opts)}</span>
            </li>
          ) : (
            <li key={`li-${it.line}`} style={{ marginLeft: `${it.indent * 1.25}rem` }}>
              {renderInline(it.text, `li-${it.line}`, opts)}
            </li>
          ),
        )}
      </ListTag>,
    )
    list = []
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]
    const line = raw.replace(/\s+$/, "")

    // Fenced code block
    if (/^```/.test(line.trim())) {
      flushList()
      const start = idx
      const code: string[] = []
      idx++
      while (idx < lines.length && !/^```/.test(lines[idx].trim())) {
        code.push(lines[idx])
        idx++
      }
      blocks.push(
        <pre key={`code-${start}`} className="my-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm leading-relaxed">
          <code>{code.join("\n")}</code>
        </pre>,
      )
      continue
    }

    const check = /^(\s*)[-*+]\s+\[( |x|X)\]\s+(.*)$/.exec(line)
    const bullet = /^(\s*)[-*+]\s+(.*)$/.exec(line)
    const numbered = /^(\s*)\d+[.)]\s+(.*)$/.exec(line)

    if (check || (bullet && !/^(\s*)(-{3,}|\*{3,})$/.test(line)) || numbered) {
      const ordered = !!numbered && !check && !bullet
      if (list.length > 0 && ordered !== listOrdered) flushList()
      listOrdered = ordered
      if (check) {
        list.push({ kind: "check", checked: check[2].toLowerCase() === "x", text: check[3], indent: Math.floor(check[1].length / 2), line: idx })
      } else if (bullet) {
        list.push({ kind: "bullet", text: bullet[2], indent: Math.floor(bullet[1].length / 2), line: idx })
      } else if (numbered) {
        list.push({ kind: "number", text: numbered[2], indent: Math.floor(numbered[1].length / 2), line: idx })
      }
      continue
    }

    flushList()

    if (line.trim() === "") continue

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const cls =
        level === 1
          ? "mt-6 mb-2 font-serif text-2xl font-semibold"
          : level === 2
            ? "mt-5 mb-2 font-serif text-xl font-semibold"
            : "mt-4 mb-1 text-base font-semibold"
      const Tag = (`h${level + 1}` as "h2" | "h3" | "h4")
      blocks.push(
        <Tag key={`h-${idx}`} className={cls}>
          {renderInline(heading[2], `h-${idx}`, opts)}
        </Tag>,
      )
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${idx}`} className="my-5 border-border" />)
      continue
    }

    const quote = /^>\s?(.*)$/.exec(line)
    if (quote) {
      const quoteLines = [quote[1]]
      const start = idx
      while (idx + 1 < lines.length && /^>\s?/.test(lines[idx + 1])) {
        idx++
        quoteLines.push(lines[idx].replace(/^>\s?/, ""))
      }
      blocks.push(
        <blockquote key={`q-${start}`} className="my-3 rounded-r-md border-l-4 border-primary/50 bg-primary/5 py-2 pl-4 pr-3 text-foreground/90">
          {quoteLines.map((q, qi) => (
            <p key={qi}>{renderInline(q, `q-${start}-${qi}`, opts)}</p>
          ))}
        </blockquote>,
      )
      continue
    }

    blocks.push(
      <p key={`p-${idx}`} className="my-2 leading-relaxed">
        {renderInline(line, `p-${idx}`, opts)}
      </p>,
    )
  }
  flushList()

  return <>{blocks}</>
}

/** Flip the "[ ]" / "[x]" marker on one source line. */
export function toggleChecklistLine(content: string, lineIndex: number): string {
  const lines = content.split("\n")
  const l = lines[lineIndex]
  if (l === undefined) return content
  lines[lineIndex] = /\[( )\]/.test(l) ? l.replace("[ ]", "[x]") : l.replace(/\[(x|X)\]/, "[ ]")
  return lines.join("\n")
}

/** Plain-text preview for list rows and search snippets. */
export function markdownToPlain(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\s*[-*+]\s+\[( |x|X)\]\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~=`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function wordCount(content: string): number {
  const plain = markdownToPlain(content)
  return plain ? plain.split(/\s+/).length : 0
}
