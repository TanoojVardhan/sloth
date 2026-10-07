import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Free-tier Gemini models, ordered by daily-quota headroom (highest first,
// per Google AI Studio's own "Rate limits by model" dashboard). Each model
// has its own independent RPM/TPM/RPD quota, so when one is exhausted we
// fall through to the next instead of failing the request. Pro/preview
// models that showed 0 free-tier quota are left out.
const DEFAULT_MODEL_CHAIN = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
]

// If GEMINI_MODEL is set, try it first, then fall back through the rest of
// the chain (skipping a duplicate if it's already in the default list).
const MODEL_CHAIN = (() => {
  const envModel = process.env.GEMINI_MODEL
  if (!envModel) return DEFAULT_MODEL_CHAIN
  return [envModel, ...DEFAULT_MODEL_CHAIN.filter((m) => m !== envModel)]
})()

type ProjectHint = { projectId: string; name: string }
type TaskHint = { title: string; status: string; priority: string; dueDate?: string | null }
type EventHint = { title: string; start: string; location?: string | null }

type ParsedAction =
  | { action: "create_task"; reply: string; task: { title: string; priority?: "low" | "medium" | "high"; dueDate?: string; projectName?: string } }
  | { action: "create_event"; reply: string; event: { title: string; start: string; end?: string; location?: string; projectName?: string } }
  | { action: "create_goal"; reply: string; goal: { title: string; description?: string; targetDate?: string; tags?: string[] } }
  | { action: "create_project"; reply: string; project: { name: string; description?: string } }
  | { action: "chat"; reply: string }

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    action: {
      type: "STRING",
      enum: ["create_task", "create_event", "create_goal", "create_project", "chat"],
    },
    reply: {
      type: "STRING",
      description:
        "A short, friendly message. For a creation action: confirm what you did, past tense, 1-2 sentences. For \"chat\": your full answer — if it's a question about their tasks/events/schedule, answer directly using the data you were given (list the relevant items), don't just acknowledge the question.",
    },
    task: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        priority: { type: "STRING", enum: ["low", "medium", "high"] },
        dueDate: { type: "STRING", description: "ISO date YYYY-MM-DD, resolved from relative dates like 'tomorrow'." },
        projectName: { type: "STRING", description: "Name of an existing project this belongs to, if mentioned or obviously implied." },
      },
      required: ["title"],
    },
    event: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        start: { type: "STRING", description: "ISO 8601 datetime, resolved from relative phrases using today's date and a sensible default time if none given." },
        end: { type: "STRING", description: "ISO 8601 datetime, optional." },
        location: { type: "STRING" },
        projectName: { type: "STRING" },
      },
      required: ["title", "start"],
    },
    goal: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        targetDate: { type: "STRING", description: "ISO date YYYY-MM-DD, optional." },
        tags: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title"],
    },
    project: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        description: { type: "STRING" },
      },
      required: ["name"],
    },
  },
  required: ["action", "reply"],
}

function buildPrompt(
  message: string,
  projects: ProjectHint[],
  tasks: TaskHint[],
  events: EventHint[],
  history: { role: string; content: string }[],
) {
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const projectList = projects.length ? projects.map((p) => `- ${p.name}`).join("\n") : "(no projects yet)"

  const openTasks = tasks.filter((t) => t.status !== "done")
  const taskList = openTasks.length
    ? openTasks
        .map((t) => `- "${t.title}" [${t.priority} priority${t.dueDate ? `, due ${t.dueDate}` : ", no due date"}]`)
        .join("\n")
    : "(no open tasks)"

  const upcomingEvents = [...events]
    .filter((e) => e.start)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const eventList = upcomingEvents.length
    ? upcomingEvents.map((e) => `- "${e.title}" at ${e.start}${e.location ? ` (${e.location})` : ""}`).join("\n")
    : "(no events scheduled)"

  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n")

  return `You are the assistant built into Sloth Planner, a personal task/event/goal/project planner app. \
Your job: read the user's message and decide whether it's asking you to CREATE something in their planner \
(a task, event, goal, or project) or ASK about what's already there (their schedule, tasks, workload, etc.) \
or just chit-chat. Creation requests get the matching create_* action. Everything else — questions, \
look-ups, small talk — gets action "chat", and your "reply" should directly and specifically answer using \
the real data below (e.g. list today's events by name and time) rather than a vague acknowledgement.

Today's date is ${todayIso}. Resolve any relative dates ("tomorrow", "next Friday", "in 2 weeks") against that.

The user's existing projects (match "projectName" against these by name when creating something that clearly \
belongs to one; otherwise omit projectName):
${projectList}

The user's current open (not-done) tasks:
${taskList}

The user's upcoming events (ISO datetimes):
${eventList}

Recent conversation (for context only, the new message is what you should act on):
${historyText || "(none)"}

New message from the user:
"""
${message}
"""

Decide exactly one action: create_task, create_event, create_goal, create_project, or chat. Only fill in \
the object matching that action.`
}

async function callGeminiWithModel(apiKey: string, model: string, prompt: string): Promise<Response> {
  const maxAttempts = 2
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.2,
          },
        }),
      },
    )

    // 429 (rate limited) and 503 (overloaded) are transient — worth one short
    // retry on the same model before giving up on it and moving to the next
    // model in the fallback chain. Anything else, fail fast (not worth
    // retrying on another model — it's a real request error).
    if (res.ok || (res.status !== 429 && res.status !== 503)) {
      return res
    }

    lastResponse = res
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }

  return lastResponse as Response
}

/**
 * Tries each model in MODEL_CHAIN in order, falling through to the next
 * whenever the current one comes back rate-limited (429) or overloaded
 * (503) — each free-tier model has its own separate daily/per-minute quota,
 * so this lets the assistant keep working well past any single model's
 * limit. Returns the first successful response, or the last failure if
 * every model in the chain is exhausted.
 */
async function callGemini(apiKey: string, prompt: string): Promise<{ res: Response; model: string }> {
  let lastResult: { res: Response; model: string } | null = null

  for (const model of MODEL_CHAIN) {
    const res = await callGeminiWithModel(apiKey, model, prompt)

    if (res.ok || (res.status !== 429 && res.status !== 503)) {
      return { res, model }
    }

    console.warn(`Gemini model ${model} unavailable (${res.status}) — falling back to next model`)
    lastResult = { res, model }
  }

  return lastResult as { res: Response; model: string }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { action: "chat", reply: "AI isn't set up yet — add a GEMINI_API_KEY to .env.local and restart the server." },
      { status: 200 },
    )
  }

  let body: {
    message?: string
    projects?: ProjectHint[]
    tasks?: TaskHint[]
    events?: EventHint[]
    history?: { role: string; content: string }[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ action: "chat", reply: "Didn't catch that — try again?" }, { status: 200 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ action: "chat", reply: "Say something and I'll take it from there." }, { status: 200 })
  }

  const prompt = buildPrompt(message, body.projects ?? [], body.tasks ?? [], body.events ?? [], body.history ?? [])

  try {
    const { res, model } = await callGemini(apiKey, prompt)

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Gemini API error (model ${model}):`, res.status, errText)
      const reply =
        res.status === 503 || res.status === 429
          ? "The AI is busy right now — give it a few seconds and try again."
          : "The AI service hiccuped on that one — mind trying again?"
      return NextResponse.json({ action: "chat", reply }, { status: 200 })
    }

    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json(
        { action: "chat", reply: "I didn't get a usable response — try rephrasing that?" },
        { status: 200 },
      )
    }

    const parsed = JSON.parse(text) as ParsedAction
    return NextResponse.json(parsed, { status: 200 })
  } catch (error) {
    console.error("AI parse error:", error)
    return NextResponse.json(
      { action: "chat", reply: "Something went wrong talking to the AI. Try again in a moment?" },
      { status: 200 },
    )
  }
}
