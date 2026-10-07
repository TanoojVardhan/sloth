"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Bold,
  ChevronDown,
  ChevronRight,
  Code,
  Columns2,
  Copy,
  Download,
  Eye,
  FileText,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  ListTodo,
  Loader2,
  Minus,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Strikethrough,
  Trash2,
  X,
} from "lucide-react"
import { useNotes, useTasks } from "@/hooks/use-firebase-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { markdownToPlain, renderMarkdown, toggleChecklistLine, wordCount } from "@/lib/markdown"
import { NOTE_ICONS, NOTE_TEMPLATES } from "@/lib/note-templates"
import type { Note } from "@/types/entities"

type EditorMode = "edit" | "split" | "preview"
type SaveState = "saved" | "saving" | "unsaved" | "error"

// Blocks offered by the "/" menu and the toolbar. `prefix` blocks go at the
// start of the line; `wrap` formats surround the selection.
const SLASH_COMMANDS: { id: string; label: string; hint: string; insert: string }[] = [
  { id: "h1", label: "Heading 1", hint: "Big section title", insert: "# " },
  { id: "h2", label: "Heading 2", hint: "Medium section title", insert: "## " },
  { id: "h3", label: "Heading 3", hint: "Small section title", insert: "### " },
  { id: "todo", label: "To-do", hint: "Checkbox item", insert: "- [ ] " },
  { id: "bullet", label: "Bulleted list", hint: "Simple list", insert: "- " },
  { id: "number", label: "Numbered list", hint: "Ordered list", insert: "1. " },
  { id: "quote", label: "Quote / callout", hint: "Highlighted block", insert: "> " },
  { id: "code", label: "Code block", hint: "Monospace snippet", insert: "```\n\n```" },
  { id: "divider", label: "Divider", hint: "Horizontal rule", insert: "---\n" },
  { id: "link", label: "Link to page", hint: "[[Page title]]", insert: "[[]]" },
  { id: "date", label: "Today's date", hint: "Insert the date", insert: "__DATE__" },
]

function descendantsOf(id: string, notes: Note[]): Note[] {
  const out: Note[] = []
  const walk = (pid: string) => {
    for (const n of notes) {
      if (n.parentId === pid) {
        out.push(n)
        walk(n.noteId)
      }
    }
  }
  walk(id)
  return out
}

function relativeTime(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotesPage() {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes()
  const { createTask } = useTasks()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showTrash, setShowTrash] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [templateMenuFor, setTemplateMenuFor] = useState<"root" | null>(null)

  // Editor drafts — the source of truth while typing; flushed to Firestore on pause.
  const [draftTitle, setDraftTitle] = useState("")
  const [draftContent, setDraftContent] = useState("")
  const [mode, setMode] = useState<EditorMode>("edit")
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [flash, setFlash] = useState<string | null>(null)
  const [slash, setSlash] = useState<{ query: string; lineStart: number } | null>(null)
  const [slashIndex, setSlashIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{ id: string; title: string; content: string } | null>(null)
  const loadedId = useRef<string | null>(null)

  const active = useMemo(() => notes.filter((n) => !n.archived), [notes])
  const trashed = useMemo(() => notes.filter((n) => n.archived), [notes])
  const selected = useMemo(() => notes.find((n) => n.noteId === selectedId) || null, [notes, selectedId])

  // Deep links from the command palette: /notes?id=... opens a page,
  // /notes?new=1 opens the template picker.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")
    if (id) setSelectedId(id)
    if (params.get("new")) setTemplateMenuFor("root")
  }, [])

  // ---------- saving ----------
  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const p = pending.current
    if (!p) return
    pending.current = null
    setSaveState("saving")
    try {
      await updateNote(p.id, { title: p.title, content: p.content })
      setSaveState(pending.current ? "unsaved" : "saved")
    } catch {
      setSaveState("error")
    }
  }, [updateNote])

  const scheduleSave = (title: string, content: string) => {
    if (!selectedId) return
    pending.current = { id: selectedId, title, content }
    setSaveState("unsaved")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => void flushSave(), 700)
  }

  // Load drafts when the selected page changes (or first becomes available).
  useEffect(() => {
    if (!selected) return
    if (loadedId.current === selected.noteId) return
    loadedId.current = selected.noteId
    setDraftTitle(selected.title)
    setDraftContent(selected.content)
    setSaveState("saved")
    setIconPickerOpen(false)
    setSlash(null)
    setMode(selected.content.trim() ? mode : "edit")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  // Save before leaving the page/tab. Goes through a ref so this effect runs
  // once — re-subscribing per render would flush on every keystroke.
  const flushRef = useRef(flushSave)
  useEffect(() => {
    flushRef.current = flushSave
  })
  useEffect(() => {
    const handler = () => {
      if (pending.current) void flushRef.current()
    }
    window.addEventListener("beforeunload", handler)
    return () => {
      window.removeEventListener("beforeunload", handler)
      handler()
    }
  }, [])

  // Auto-grow the editor.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`
  }, [draftContent, mode, selectedId])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 3000)
    return () => clearTimeout(t)
  }, [flash])

  const openNote = async (id: string | null) => {
    await flushSave()
    loadedId.current = null
    setSelectedId(id)
    setShowTrash(false)
    if (id) {
      // Make sure the page is visible in the tree.
      const chain: Record<string, boolean> = {}
      let cur = notes.find((n) => n.noteId === id)
      while (cur?.parentId) {
        const pid = cur.parentId
        chain[pid] = true
        cur = notes.find((n) => n.noteId === pid)
      }
      setExpanded((e) => ({ ...e, ...chain }))
    }
  }

  // The palette also fires an event, since this page won't re-read the URL
  // when it's already open.
  const openNoteRef = useRef<(id: string | null) => Promise<void>>(async () => {})
  useEffect(() => {
    const h = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (id) void openNoteRef.current(id)
    }
    window.addEventListener("sloth:open-note", h)
    return () => window.removeEventListener("sloth:open-note", h)
  }, [])
  useEffect(() => {
    openNoteRef.current = openNote
  })

  // ---------- page operations ----------
  const createPage = async (opts: { parentId?: string | null; templateId?: string; title?: string } = {}) => {
    const tpl = NOTE_TEMPLATES.find((t) => t.id === (opts.templateId || "blank")) || NOTE_TEMPLATES[0]
    const built = tpl.build()
    const id = await createNote({
      title: opts.title ?? built.title,
      content: built.content,
      icon: tpl.id === "blank" ? null : tpl.icon,
      parentId: opts.parentId || null,
      tags: [],
      pinned: false,
      archived: false,
    })
    if (opts.parentId) setExpanded((e) => ({ ...e, [opts.parentId as string]: true }))
    setTemplateMenuFor(null)
    await openNote(id)
    setMode("edit")
    requestAnimationFrame(() => textareaRef.current?.focus())
    return id
  }

  const moveToTrash = async (note: Note) => {
    await flushSave()
    const family = [note, ...descendantsOf(note.noteId, active)]
    await Promise.all(family.map((n) => updateNote(n.noteId, { archived: true, pinned: false })))
    if (selectedId && family.some((n) => n.noteId === selectedId)) {
      loadedId.current = null
      setSelectedId(null)
    }
    setFlash(family.length > 1 ? `Moved ${family.length} pages to trash` : "Moved to trash")
  }

  const restore = async (note: Note) => {
    const family = [note, ...descendantsOf(note.noteId, trashed)]
    const parentStillTrashed = note.parentId ? trashed.some((n) => n.noteId === note.parentId) : false
    await Promise.all(
      family.map((n) =>
        updateNote(n.noteId, n.noteId === note.noteId && parentStillTrashed ? { archived: false, parentId: null } : { archived: false }),
      ),
    )
    setFlash("Restored")
  }

  const deleteForever = async (note: Note) => {
    if (!confirm(`Permanently delete “${note.title || "Untitled"}”${descendantsOf(note.noteId, notes).length ? " and its sub-pages" : ""}? This can't be undone.`)) return
    const family = [note, ...descendantsOf(note.noteId, notes)]
    await Promise.all(family.map((n) => deleteNote(n.noteId)))
  }

  const emptyTrash = async () => {
    if (!trashed.length || !confirm(`Permanently delete ${trashed.length} page(s) in the trash?`)) return
    await Promise.all(trashed.map((n) => deleteNote(n.noteId)))
  }

  const duplicate = async (note: Note) => {
    await flushSave()
    const id = await createNote({
      title: `${draftTitle || note.title || "Untitled"} (copy)`,
      content: note.noteId === selectedId ? draftContent : note.content,
      icon: note.icon || null,
      parentId: note.parentId || null,
      tags: note.tags || [],
      pinned: false,
      archived: false,
    })
    await openNote(id)
  }

  const exportMarkdown = (note: Note) => {
    const title = (note.noteId === selectedId ? draftTitle : note.title) || "Untitled"
    const body = note.noteId === selectedId ? draftContent : note.content
    const blob = new Blob([`# ${title}\n\n${body}\n`], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const checklistToTasks = async () => {
    const items = draftContent
      .split("\n")
      .map((l) => /^\s*[-*+]\s+\[ \]\s+(.+)$/.exec(l)?.[1]?.trim())
      .filter((t): t is string => !!t)
    if (!items.length) {
      setFlash("No unchecked to-dos on this page")
      return
    }
    if (!confirm(`Create ${items.length} task${items.length === 1 ? "" : "s"} from this page's unchecked to-dos?`)) return
    for (const title of items) {
      await createTask({
        title,
        status: "todo",
        priority: "medium",
        dueDate: null,
        projectId: null,
        tags: [],
        notes: `From page: ${draftTitle || "Untitled"}`,
      })
    }
    setFlash(`Created ${items.length} task${items.length === 1 ? "" : "s"} — see Tasks`)
  }

  const openWikiLink = async (title: string) => {
    const match = active.find((n) => n.title.trim().toLowerCase() === title.trim().toLowerCase())
    if (match) await openNote(match.noteId)
    else await createPage({ title })
  }

  // ---------- editor helpers ----------
  const setContent = (next: string, selStart?: number, selEnd?: number) => {
    setDraftContent(next)
    scheduleSave(draftTitle, next)
    if (selStart !== undefined) {
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        el.setSelectionRange(selStart, selEnd ?? selStart)
      })
    }
  }

  const wrapSelection = (marker: string, placeholder = "text") => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const sel = draftContent.slice(s, e) || placeholder
    const next = draftContent.slice(0, s) + marker + sel + marker + draftContent.slice(e)
    setContent(next, s + marker.length, s + marker.length + sel.length)
  }

  const prefixLine = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return
    const s = el.selectionStart
    const lineStart = draftContent.lastIndexOf("\n", s - 1) + 1
    // Replace an existing block prefix rather than stacking them.
    const lineText = draftContent.slice(lineStart)
    const rest = lineText.replace(/^(#{1,3}\s+|[-*+]\s+\[( |x|X)\]\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/, "")
    const oldPrefixLen = lineText.length - rest.length
    const next = draftContent.slice(0, lineStart) + prefix + rest
    setContent(next, Math.max(lineStart + prefix.length, s - oldPrefixLen + prefix.length))
  }

  const insertAtCursor = (text: string, caretOffset = text.length) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const next = draftContent.slice(0, s) + text + draftContent.slice(e)
    setContent(next, s + caretOffset)
  }

  const slashMatches = useMemo(() => {
    if (!slash) return []
    const q = slash.query.toLowerCase()
    return SLASH_COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q))
  }, [slash])

  const applySlash = (cmd: (typeof SLASH_COMMANDS)[number]) => {
    if (!slash) return
    const el = textareaRef.current
    const caret = el ? el.selectionStart : slash.lineStart + 1 + slash.query.length
    let insert = cmd.insert
    let caretPos = slash.lineStart + insert.length
    if (insert === "__DATE__") {
      insert = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      caretPos = slash.lineStart + insert.length
    } else if (cmd.id === "code") {
      caretPos = slash.lineStart + 4
    } else if (cmd.id === "link") {
      caretPos = slash.lineStart + 2
    }
    const next = draftContent.slice(0, slash.lineStart) + insert + draftContent.slice(caret)
    setSlash(null)
    setContent(next, caretPos)
  }

  const detectSlash = (value: string, caret: number) => {
    const lineStart = value.lastIndexOf("\n", caret - 1) + 1
    const line = value.slice(lineStart, caret)
    const m = /^\/([a-z0-9 ]{0,20})$/i.exec(line)
    if (m) {
      setSlash({ query: m[1], lineStart })
      setSlashIndex(0)
    } else if (slash) {
      setSlash(null)
    }
  }

  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const mod = e.metaKey || e.ctrlKey

    if (slash && slashMatches.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % slashMatches.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        applySlash(slashMatches[Math.min(slashIndex, slashMatches.length - 1)])
        return
      }
    }
    if (slash && e.key === "Escape") {
      e.preventDefault()
      setSlash(null)
      return
    }

    if (mod && e.key.toLowerCase() === "b") {
      e.preventDefault()
      wrapSelection("**")
      return
    }
    if (mod && e.key.toLowerCase() === "i") {
      e.preventDefault()
      wrapSelection("*")
      return
    }
    if (mod && e.key.toLowerCase() === "e") {
      e.preventDefault()
      wrapSelection("`", "code")
      return
    }
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault()
      void flushSave()
      return
    }

    // Tab / Shift+Tab indent list items.
    if (e.key === "Tab") {
      const s = el.selectionStart
      const lineStart = draftContent.lastIndexOf("\n", s - 1) + 1
      e.preventDefault()
      if (e.shiftKey) {
        if (draftContent.slice(lineStart, lineStart + 2) === "  ") {
          setContent(draftContent.slice(0, lineStart) + draftContent.slice(lineStart + 2), Math.max(lineStart, s - 2))
        }
      } else {
        setContent(draftContent.slice(0, lineStart) + "  " + draftContent.slice(lineStart), s + 2)
      }
      return
    }

    // Enter continues lists; Enter on an empty item ends the list.
    if (e.key === "Enter" && !e.shiftKey && !mod) {
      const s = el.selectionStart
      if (s !== el.selectionEnd) return
      const lineStart = draftContent.lastIndexOf("\n", s - 1) + 1
      const line = draftContent.slice(lineStart, s)
      const m = /^(\s*)([-*+]\s+\[( |x|X)\]\s+|[-*+]\s+|(\d+)([.)])\s+)(.*)$/.exec(line)
      if (!m) return
      e.preventDefault()
      const [, indent, marker, , num, numSep, text] = m
      if (!text.trim()) {
        // Empty item: drop the marker.
        setContent(draftContent.slice(0, lineStart) + draftContent.slice(s), lineStart)
        return
      }
      let nextMarker = marker
      if (/\[( |x|X)\]/.test(marker)) nextMarker = marker.replace(/\[(x|X)\]/, "[ ]")
      else if (num) nextMarker = `${Number(num) + 1}${numSep} `
      const insert = `\n${indent}${nextMarker}`
      setContent(draftContent.slice(0, s) + insert + draftContent.slice(s), s + insert.length)
    }
  }

  // ---------- derived ----------
  const children = useMemo(() => {
    const map = new Map<string | null, Note[]>()
    const ids = new Set(active.map((n) => n.noteId))
    for (const n of active) {
      const key = n.parentId && ids.has(n.parentId) ? n.parentId : null
      map.set(key, [...(map.get(key) || []), n])
    }
    for (const list of map.values()) list.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    return map
  }, [active])

  const pinned = active.filter((n) => n.pinned)

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return active
      .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.tags || []).some((t) => t.toLowerCase().includes(q)))
      .slice(0, 50)
  }, [search, active])

  const breadcrumbs = useMemo(() => {
    const chain: Note[] = []
    let cur = selected?.parentId ? active.find((n) => n.noteId === selected.parentId) : undefined
    while (cur) {
      chain.unshift(cur)
      const pid: string | null | undefined = cur.parentId
      cur = pid ? active.find((n) => n.noteId === pid) : undefined
    }
    return chain
  }, [selected, active])

  const subPages = selected ? children.get(selected.noteId) || [] : []

  const backlinks = useMemo(() => {
    const t = (draftTitle || "").trim().toLowerCase()
    if (!selected || !t) return []
    return active.filter((n) => n.noteId !== selected.noteId && n.content.toLowerCase().includes(`[[${t}]]`))
  }, [active, selected, draftTitle])

  const titleSet = useMemo(() => new Set(active.map((n) => n.title.trim().toLowerCase())), [active])

  const words = wordCount(draftContent)
  const checklistTotal = (draftContent.match(/^\s*[-*+]\s+\[( |x|X)\]/gm) || []).length
  const checklistDone = (draftContent.match(/^\s*[-*+]\s+\[(x|X)\]/gm) || []).length

  // ---------- render pieces ----------
  const renderTreeItem = (note: Note, depth: number): React.ReactNode => {
    const kids = children.get(note.noteId) || []
    const isOpen = !!expanded[note.noteId]
    const isActive = note.noteId === selectedId
    return (
      <div key={note.noteId}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1 pr-1 text-sm transition-colors",
            isActive ? "bg-primary/10 font-medium text-foreground" : "text-foreground/80 hover:bg-muted",
          )}
          style={{ paddingLeft: `${depth * 14 + 4}px` }}
        >
          <button
            type="button"
            onClick={() => setExpanded((e) => ({ ...e, [note.noteId]: !isOpen }))}
            className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted-foreground/10", !kids.length && "invisible")}
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={() => void openNote(note.noteId)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="shrink-0 text-base leading-none">{note.icon || "📄"}</span>
            <span className="truncate">{note.noteId === selectedId ? draftTitle || "Untitled" : note.title || "Untitled"}</span>
          </button>
          <button
            type="button"
            onClick={() => void createPage({ parentId: note.noteId })}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-muted-foreground/10 group-hover:opacity-100"
            aria-label="Add sub-page"
            title="Add sub-page"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {isOpen && kids.map((k) => renderTreeItem(k, depth + 1))}
      </div>
    )
  }

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved changes" : saveState === "error" ? "Couldn't save — retrying on next edit" : "Saved"

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4.5rem)] overflow-hidden border-y bg-card md:-mx-8 md:h-dvh md:border-y-0 lg:-mx-10">
      {/* ---------------- Sidebar ---------------- */}
      <aside className={cn("w-full shrink-0 flex-col border-r bg-muted/30 md:flex md:w-72", selectedId ? "hidden" : "flex")}>
        <div className="space-y-3 border-b p-3">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-lg font-semibold">Notes</h1>
            <div className="relative">
              <Button size="sm" onClick={() => setTemplateMenuFor(templateMenuFor ? null : "root")} className="h-8 gap-1">
                <Plus className="h-4 w-4" /> New
              </Button>
              {templateMenuFor && (
                <div className="absolute right-0 top-10 z-30 w-64 rounded-lg border bg-popover p-1 shadow-lg">
                  {NOTE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => void createPage({ templateId: t.id })}
                      className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                    >
                      <span className="text-lg leading-none">{t.icon}</span>
                      <span>
                        <span className="block text-sm font-medium">{t.name}</span>
                        <span className="block text-xs text-muted-foreground">{t.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages…" className="h-9 pl-8" />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-2.5 text-muted-foreground" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : search.trim() ? (
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
              </p>
              {searchResults.map((n) => {
                const plain = markdownToPlain(n.content)
                const q = search.trim().toLowerCase()
                const at = plain.toLowerCase().indexOf(q)
                const snippet = at >= 0 ? `${at > 30 ? "…" : ""}${plain.slice(Math.max(0, at - 30), at + 60)}…` : plain.slice(0, 80)
                return (
                  <button
                    key={n.noteId}
                    type="button"
                    onClick={() => void openNote(n.noteId)}
                    className={cn("block w-full rounded-md px-2 py-2 text-left hover:bg-muted", n.noteId === selectedId && "bg-primary/10")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span>{n.icon || "📄"}</span>
                      <span className="truncate">{n.title || "Untitled"}</span>
                    </span>
                    {snippet && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{snippet}</span>}
                  </button>
                )
              })}
            </div>
          ) : showTrash ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-xs font-medium text-muted-foreground">Trash · {trashed.length}</p>
                {trashed.length > 0 && (
                  <button type="button" onClick={() => void emptyTrash()} className="text-xs text-destructive hover:underline">
                    Empty trash
                  </button>
                )}
              </div>
              {trashed.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Trash is empty</p>}
              {trashed.map((n) => (
                <div key={n.noteId} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                  <span>{n.icon || "📄"}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{n.title || "Untitled"}</span>
                  <button type="button" onClick={() => void restore(n)} className="rounded p-1 hover:bg-background" title="Restore" aria-label="Restore">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => void deleteForever(n)} className="rounded p-1 text-destructive hover:bg-background" title="Delete forever" aria-label="Delete forever">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pinned.length > 0 && (
                <div>
                  <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Pinned</p>
                  {pinned.map((n) => (
                    <button
                      key={n.noteId}
                      type="button"
                      onClick={() => void openNote(n.noteId)}
                      className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-muted", n.noteId === selectedId && "bg-primary/10 font-medium")}
                    >
                      <span>{n.icon || "📄"}</span>
                      <span className="truncate">{n.title || "Untitled"}</span>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Pages</p>
                {(children.get(null) || []).length === 0 && (
                  <p className="px-2 py-4 text-sm text-muted-foreground">No pages yet. Click New to start one.</p>
                )}
                {(children.get(null) || []).map((n) => renderTreeItem(n, 0))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <button
            type="button"
            onClick={() => {
              setShowTrash((v) => !v)
              setSearch("")
            }}
            className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted", showTrash && "bg-muted text-foreground")}
          >
            <Trash2 className="h-4 w-4" /> Trash {trashed.length > 0 && <span className="ml-auto text-xs">{trashed.length}</span>}
          </button>
        </div>
      </aside>

      {/* ---------------- Editor ---------------- */}
      <section className={cn("min-w-0 flex-1 flex-col", selectedId ? "flex" : "hidden md:flex")}>
        {!selected ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="mx-auto max-w-2xl">
              <h2 className="font-serif text-2xl font-semibold">Your notes, linked together</h2>
              <p className="mt-2 text-muted-foreground">
                Write in markdown, nest pages inside pages, link them with <code className="rounded bg-muted px-1">[[Page title]]</code>, and turn any to-do
                list into real tasks. Type <code className="rounded bg-muted px-1">/</code> on a new line for blocks.
              </p>
              <h3 className="mt-8 text-sm font-medium text-muted-foreground">Start from a template</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {NOTE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => void createPage({ templateId: t.id })}
                    className="flex items-start gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="text-2xl leading-none">{t.icon}</span>
                    <span>
                      <span className="block font-medium">{t.name}</span>
                      <span className="block text-sm text-muted-foreground">{t.description}</span>
                    </span>
                  </button>
                ))}
              </div>
              {active.length > 0 && (
                <>
                  <h3 className="mt-8 text-sm font-medium text-muted-foreground">Recently edited</h3>
                  <div className="mt-3 divide-y rounded-xl border bg-background">
                    {active.slice(0, 6).map((n) => (
                      <button key={n.noteId} type="button" onClick={() => void openNote(n.noteId)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                        <span className="text-lg">{n.icon || "📄"}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{n.title || "Untitled"}</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(n.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 md:px-6">
              <Button size="icon" variant="ghost" className="h-8 w-8 md:hidden" onClick={() => void openNote(null)} aria-label="Back to pages">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm text-muted-foreground">
                {breadcrumbs.map((b) => (
                  <span key={b.noteId} className="flex min-w-0 items-center gap-1">
                    <button type="button" onClick={() => void openNote(b.noteId)} className="truncate rounded px-1 hover:bg-muted hover:text-foreground">
                      {b.icon || "📄"} {b.title || "Untitled"}
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  </span>
                ))}
                <span className="truncate font-medium text-foreground">{draftTitle || "Untitled"}</span>
              </nav>
              <span className={cn("hidden text-xs sm:inline", saveState === "error" ? "text-destructive" : "text-muted-foreground")}>{saveLabel}</span>
              <div className="flex items-center rounded-lg border p-0.5">
                {(
                  [
                    ["edit", Pencil, "Write"],
                    ["split", Columns2, "Split"],
                    ["preview", Eye, "Read"],
                  ] as const
                ).map(([m, Icon, label]) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={mode === m ? "secondary" : "ghost"}
                    className={cn("h-7 px-2", m === "split" && "hidden lg:inline-flex")}
                    onClick={() => setMode(m)}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => void updateNote(selected.noteId, { pinned: !selected.pinned })}
                title={selected.pinned ? "Unpin" : "Pin to top"}
                aria-label={selected.pinned ? "Unpin" : "Pin to top"}
              >
                {selected.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void duplicate(selected)} title="Duplicate" aria-label="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportMarkdown(selected)} title="Export as Markdown" aria-label="Export as Markdown">
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => void moveToTrash(selected)}
                title="Move to trash"
                aria-label="Move to trash"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className={cn("mx-auto px-4 pb-24 pt-8 md:px-10", mode === "split" ? "max-w-none" : "max-w-3xl")}>
                {/* Icon + title */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIconPickerOpen((v) => !v)}
                    className="rounded-lg p-1 text-5xl leading-none transition-colors hover:bg-muted"
                    title="Change icon"
                    aria-label="Change icon"
                  >
                    {selected.icon || "📄"}
                  </button>
                  {iconPickerOpen && (
                    <div className="absolute left-0 top-16 z-20 grid w-72 grid-cols-10 gap-1 rounded-lg border bg-popover p-2 shadow-lg">
                      {NOTE_ICONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => {
                            void updateNote(selected.noteId, { icon: ic })
                            setIconPickerOpen(false)
                          }}
                          className="rounded p-1 text-xl hover:bg-muted"
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  value={draftTitle}
                  onChange={(e) => {
                    setDraftTitle(e.target.value)
                    scheduleSave(e.target.value, draftContent)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      setMode((m) => (m === "preview" ? "edit" : m))
                      requestAnimationFrame(() => textareaRef.current?.focus())
                    }
                  }}
                  placeholder="Untitled"
                  className="mt-3 w-full bg-transparent font-serif text-3xl font-semibold outline-none placeholder:text-muted-foreground/50 md:text-4xl"
                />

                {/* Properties */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>Edited {relativeTime(selected.updatedAt) || "just now"}</span>
                  <span>
                    {words} word{words === 1 ? "" : "s"} · {Math.max(1, Math.round(words / 220))} min read
                  </span>
                  {checklistTotal > 0 && (
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${(checklistDone / checklistTotal) * 100}%` }} />
                      </span>
                      {checklistDone}/{checklistTotal} done
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {(selected.tags || []).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      #{t}
                      <button
                        type="button"
                        onClick={() => void updateNote(selected.noteId, { tags: (selected.tags || []).filter((x) => x !== t) })}
                        aria-label={`Remove tag ${t}`}
                        className="opacity-60 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        const t = tagInput.trim().replace(/^#/, "")
                        if (t && !(selected.tags || []).includes(t)) void updateNote(selected.noteId, { tags: [...(selected.tags || []), t] })
                        setTagInput("")
                      }
                    }}
                    placeholder="+ tag"
                    className="w-20 bg-transparent px-1 text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {/* Toolbar */}
                {mode !== "preview" && (
                  <div className="sticky top-0 z-10 -mx-2 mt-5 flex flex-wrap items-center gap-0.5 rounded-lg border bg-background/95 p-1 backdrop-blur">
                    {(
                      [
                        [Bold, "Bold (Ctrl+B)", () => wrapSelection("**")],
                        [Italic, "Italic (Ctrl+I)", () => wrapSelection("*")],
                        [Strikethrough, "Strikethrough", () => wrapSelection("~~")],
                        [Highlighter, "Highlight", () => wrapSelection("==")],
                        [Code, "Inline code (Ctrl+E)", () => wrapSelection("`", "code")],
                        [Heading1, "Heading", () => prefixLine("# ")],
                        [Heading2, "Subheading", () => prefixLine("## ")],
                        [List, "Bulleted list", () => prefixLine("- ")],
                        [ListOrdered, "Numbered list", () => prefixLine("1. ")],
                        [ListChecks, "To-do", () => prefixLine("- [ ] ")],
                        [Quote, "Quote", () => prefixLine("> ")],
                        [Minus, "Divider", () => insertAtCursor("\n---\n")],
                        [Link2, "Link to a page", () => insertAtCursor("[[]]", 2)],
                      ] as const
                    ).map(([Icon, label, fn]) => (
                      <button
                        key={label}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={fn}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={label}
                        aria-label={label}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                    <span className="mx-1 h-5 w-px bg-border" />
                    <button
                      type="button"
                      onClick={() => void checklistToTasks()}
                      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Create a task for every unchecked to-do on this page"
                    >
                      <ListTodo className="h-3.5 w-3.5" /> To-dos → Tasks
                    </button>
                  </div>
                )}

                {/* Body */}
                <div className={cn("mt-4", mode === "split" && "grid gap-6 lg:grid-cols-2")}>
                  {mode !== "preview" && (
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={draftContent}
                        onChange={(e) => {
                          setDraftContent(e.target.value)
                          scheduleSave(draftTitle, e.target.value)
                          detectSlash(e.target.value, e.target.selectionStart)
                        }}
                        onKeyDown={onEditorKeyDown}
                        onBlur={() => {
                          setTimeout(() => setSlash(null), 150)
                          void flushSave()
                        }}
                        placeholder={"Start writing… type / for blocks, [[ to link a page"}
                        className="w-full resize-none bg-transparent font-mono text-[15px] leading-7 outline-none placeholder:text-muted-foreground/60"
                        spellCheck
                      />
                      {slash && slashMatches.length > 0 && (
                        <div
                          className="absolute left-0 z-20 w-72 rounded-lg border bg-popover p-1 shadow-lg"
                          style={{ top: `${draftContent.slice(0, slash.lineStart).split("\n").length * 28 + 4}px` }}
                        >
                          <p className="px-2 py-1 text-xs text-muted-foreground">Blocks</p>
                          {slashMatches.map((c, i) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                applySlash(c)
                              }}
                              className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm", i === slashIndex ? "bg-muted" : "hover:bg-muted")}
                            >
                              <span className="font-medium">{c.label}</span>
                              <span className="text-xs text-muted-foreground">{c.hint}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {mode !== "edit" && (
                    <article className={cn("min-h-[320px] text-[15px]", mode === "split" && "rounded-lg border bg-background p-5")}>
                      {draftContent.trim() ? (
                        renderMarkdown(draftContent, {
                          onToggleCheckbox: (line) => setContent(toggleChecklistLine(draftContent, line)),
                          onWikiLink: (t) => void openWikiLink(t),
                          resolveWikiLink: (t) => titleSet.has(t.trim().toLowerCase()),
                        })
                      ) : (
                        <p className="text-muted-foreground">Nothing here yet.</p>
                      )}
                    </article>
                  )}
                </div>

                {/* Sub-pages */}
                <div className="mt-10 border-t pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Sub-pages</h3>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => void createPage({ parentId: selected.noteId })}>
                      <Plus className="h-3.5 w-3.5" /> Add sub-page
                    </Button>
                  </div>
                  {subPages.length > 0 ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {subPages.map((p) => (
                        <button
                          key={p.noteId}
                          type="button"
                          onClick={() => void openNote(p.noteId)}
                          className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left hover:bg-muted/50"
                        >
                          <span className="text-lg">{p.icon || "📄"}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{p.title || "Untitled"}</span>
                            <span className="block truncate text-xs text-muted-foreground">{markdownToPlain(p.content).slice(0, 60) || "Empty page"}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Nest pages here to build a wiki, a course, or a project space.</p>
                  )}
                </div>

                {/* Backlinks */}
                {backlinks.length > 0 && (
                  <div className="mt-6">
                    <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> Linked from {backlinks.length} page{backlinks.length === 1 ? "" : "s"}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {backlinks.map((b) => (
                        <button key={b.noteId} type="button" onClick={() => void openNote(b.noteId)} className="rounded-full border bg-background px-3 py-1 text-sm hover:bg-muted">
                          {b.icon || "📄"} {b.title || "Untitled"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {flash && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg" role="status">
          {flash}
        </div>
      )}
    </div>
  )
}
