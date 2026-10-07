"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send, Loader2, Mic, Square } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useTasks, useEvents, useGoals, useProjects } from "@/hooks/use-firebase-data"
import { useLiveTranscribe } from "@/hooks/use-live-transcribe"
import { cn } from "@/lib/utils"

type ChatMessage = { role: "user" | "assistant"; content: string }

type ParsedAction =
  | { action: "create_task"; reply: string; task: { title: string; priority?: "low" | "medium" | "high"; dueDate?: string; projectName?: string } }
  | { action: "create_event"; reply: string; event: { title: string; start: string; end?: string; location?: string; projectName?: string } }
  | { action: "create_goal"; reply: string; goal: { title: string; description?: string; targetDate?: string; tags?: string[] } }
  | { action: "create_project"; reply: string; project: { name: string; description?: string } }
  | { action: "chat"; reply: string }

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm your Sloth Planner assistant. Tell me what's on your mind — \"remind me to call the bank tomorrow\" or \"add a goal to run a 5k by December\" — and I'll add it for you.",
}

export function ChatbotWidget() {
  const { user } = useAuth()
  const { tasks, createTask } = useTasks()
  const { events, createEvent } = useEvents()
  const { createGoal } = useGoals()
  const { projects, createProject } = useProjects()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isRecording, error: micError, start: startMic, stop: stopMic } = useLiveTranscribe()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  function findProjectId(name?: string): string | undefined {
    if (!name) return undefined
    const match = projects.find((p) => p.name.toLowerCase() === name.toLowerCase())
    return match?.projectId
  }

  async function applyAction(parsed: ParsedAction): Promise<string> {
    if (!user) {
      return parsed.action === "chat"
        ? parsed.reply
        : `${parsed.reply} (Sign in first so I can actually save that for you.)`
    }

    switch (parsed.action) {
      case "create_task": {
        await createTask({
          title: parsed.task.title,
          status: "todo",
          priority: parsed.task.priority || "medium",
          dueDate: parsed.task.dueDate || null,
          projectId: findProjectId(parsed.task.projectName) || null,
        })
        return parsed.reply
      }
      case "create_event": {
        await createEvent({
          title: parsed.event.title,
          start: parsed.event.start,
          end: parsed.event.end || null,
          location: parsed.event.location || null,
          projectId: findProjectId(parsed.event.projectName) || null,
        })
        return parsed.reply
      }
      case "create_goal": {
        await createGoal({
          title: parsed.goal.title,
          status: "active",
          description: parsed.goal.description || null,
          targetDate: parsed.goal.targetDate || null,
          tags: parsed.goal.tags || [],
        })
        return parsed.reply
      }
      case "create_project": {
        await createProject({
          name: parsed.project.name,
          description: parsed.project.description || null,
        })
        return parsed.reply
      }
      case "chat":
      default:
        return parsed.reply
    }
  }

  function toggleMic() {
    if (isRecording) {
      stopMic()
      return
    }
    startMic((chunk) => {
      setInput((prev) => (prev ? `${prev} ${chunk}` : chunk))
    })
  }

  async function send() {
    const text = input.trim()
    if (!text || isSending) return

    const history = messages
    setMessages((m) => [...m, { role: "user", content: text }])
    setInput("")
    setIsSending(true)

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          projects: projects.map((p) => ({ projectId: p.projectId, name: p.name })),
          tasks: tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })),
          events: events.map((e) => ({ title: e.title, start: e.start, location: e.location })),
          history: history.map((h) => ({ role: h.role, content: h.content })),
        }),
      })
      const parsed = (await res.json()) as ParsedAction
      const reply = await applyAction(parsed)
      setMessages((m) => [...m, { role: "assistant", content: reply }])
    } catch (error) {
      console.error("Assistant error:", error)
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Couldn't save that — something went wrong. Mind trying again?" },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <button
        aria-label={open ? "Close assistant" : "Open assistant"}
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        title="Sloth Planner assistant"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <div className="pointer-events-auto flex w-[340px] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
          <div className="flex items-center gap-2 border-b bg-primary/5 px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="font-medium">Sloth Assistant</div>
          </div>

          <div ref={scrollRef} className="flex max-h-96 min-h-[220px] flex-col gap-3 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed",
                  m.role === "assistant"
                    ? "self-start rounded-bl-sm bg-secondary text-secondary-foreground"
                    : "self-end rounded-br-sm bg-primary text-primary-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          {(isRecording || micError) && (
            <div
              className={cn(
                "flex items-center gap-2 border-t px-3 py-1.5 text-xs",
                micError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {isRecording && !micError && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
              {micError ?? "Listening — tap the mic again to stop."}
            </div>
          )}

          <div className="flex items-center gap-2 border-t p-2">
            <button
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-50",
                isRecording ? "bg-red-500 text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
              onClick={toggleMic}
              disabled={isSending}
              aria-label={isRecording ? "Stop recording" : "Speak instead of typing"}
              title={isRecording ? "Stop recording" : "Speak instead of typing"}
            >
              {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              className="flex-1 rounded-full border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Add a task, event, or goal..."
              disabled={isSending}
            />
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              onClick={send}
              disabled={isSending || !input.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
