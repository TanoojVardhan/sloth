"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  CheckCircle2,
  Calendar,
  Target,
  Mic,
  Lock,
  NotebookPen,
  Sparkles,
  MonitorSmartphone,
  Loader2,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ANDROID_APK_URL } from "@/lib/site-config"

const features = [
  {
    icon: CheckCircle2,
    title: "Tasks and projects",
    description: "Kanban boards, subtasks, priorities, tags and due dates, grouped into projects you can track.",
  },
  {
    icon: NotebookPen,
    title: "Notes",
    description: "Nested pages in markdown, with checklists you can turn into tasks in one click.",
  },
  {
    icon: Calendar,
    title: "Calendar and schedule",
    description: "Events, tasks and classes on one timeline, with Google Calendar alongside if you want it.",
  },
  {
    icon: Sparkles,
    title: "Import any timetable",
    description: "Paste a link to a sheet in any layout. The AI reads it and you pick the classes that are yours.",
  },
  {
    icon: Target,
    title: "Goals and insights",
    description: "Set targets, run focus sessions, and see how your weeks are actually going.",
  },
  {
    icon: Mic,
    title: "Voice input",
    description: "Say a task or event instead of typing it when your hands are full.",
  },
  {
    icon: MonitorSmartphone,
    title: "Web, Android and desktop",
    description: "Install it on Windows or Mac from your browser, or use the Android app. Your planner follows your account.",
  },
]

const steps = [
  {
    title: "Create your account",
    description: "Sign up with email or Google. That is all it takes to start.",
  },
  {
    title: "Add what's on your plate",
    description: "Tasks, events, classes and goals. Type them in or say them out loud.",
  },
  {
    title: "Take the week one day at a time",
    description: "Open today, do what's there, and let the small wins add up.",
  },
]

// The hero's sample week. Kinds map to the three things a day holds.
type Kind = "class" | "task" | "event"
const week: { day: string; date: number; today?: boolean; items: { label: string; time?: string; kind: Kind; done?: boolean }[] }[] = [
  {
    day: "Mon",
    date: 9,
    items: [
      { label: "Linear algebra", time: "9:00", kind: "class", done: true },
      { label: "Return library books", kind: "task", done: true },
    ],
  },
  {
    day: "Tue",
    date: 10,
    items: [
      { label: "Physics lab", time: "11:00", kind: "class", done: true },
      { label: "Lab report draft", kind: "task", done: true },
      { label: "Study group", time: "17:30", kind: "event", done: true },
    ],
  },
  {
    day: "Wed",
    date: 11,
    today: true,
    items: [
      { label: "Data structures", time: "10:00", kind: "class", done: true },
      { label: "Problem set 4", kind: "task" },
      { label: "Call home", time: "19:00", kind: "event" },
      { label: "Read chapter 6", kind: "task" },
    ],
  },
  {
    day: "Thu",
    date: 12,
    items: [{ label: "Essay outline", kind: "task" }],
  },
  {
    day: "Fri",
    date: 13,
    items: [
      { label: "Linear algebra", time: "9:00", kind: "class" },
      { label: "Film club", time: "18:00", kind: "event" },
    ],
  },
]

const kindDot: Record<Kind, string> = {
  class: "bg-chart-2",
  task: "bg-primary",
  event: "bg-chart-3",
}

function HangingWeek() {
  return (
    <div aria-hidden className="relative">
      {/* the branch */}
      <div className="h-2 rounded-full bg-bark" />
      <div className="grid grid-cols-3 gap-3 px-2 sm:grid-cols-5 sm:gap-4 sm:px-6">
        {week.map((d, i) => (
          <div
            key={d.day}
            className={cn(
              "animate-hang flex flex-col items-center",
              // phones show the three days around today
              (i === 0 || i === 4) && "hidden sm:flex"
            )}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className={cn("-mt-2 h-10 w-px", d.today ? "bg-bloom" : "bg-bark/40")} />
            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                d.today ? "bg-bloom text-bloom-foreground" : "bg-secondary text-muted-foreground"
              )}
            >
              {d.day} {d.date}
            </div>
            {d.items.map((it) => (
              <div key={it.label} className="flex w-full flex-col items-center">
                <div className="h-3 w-px bg-bark/30" />
                <div
                  className={cn(
                    "w-full rounded-xl border bg-card px-3 py-2 text-left text-xs leading-snug sm:text-sm",
                    it.done && "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", kindDot[it.kind], it.done && "opacity-40")} />
                    <span className={cn("min-w-0 sm:truncate", it.done && "line-through")}>{it.label}</span>
                  </div>
                  {it.time && <div className="mt-0.5 pl-4 text-[11px] tabular-nums text-muted-foreground">{it.time}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div>
      {/* Hero: the week hangs from a branch, the way the planner's namesake does. */}
      <section className="overflow-hidden px-6 pb-20 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end">
            <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-tight text-foreground text-balance sm:text-7xl lg:text-[5.5rem]">
              Plan your week without the rush.
            </h1>
            <div className="lg:pb-3">
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
                Classes, tasks, notes and goals in one unhurried place. Add a passphrase and not even we can read
                them.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/signup">Create a free account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-16">
            <HangingWeek />
          </div>
        </div>
      </section>

      {/* Privacy is the one promise worth a band of its own. */}
      <section className="bg-sidebar px-6 py-16 text-sidebar-foreground sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
          <Lock className="h-12 w-12 text-sidebar-primary" aria-hidden />
          <div>
            <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
              Private by default. Unreadable if you choose.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-sidebar-foreground/70">
              Your planner is encrypted in transit and on our servers from the start. Add a passphrase in Settings and
              it is locked on your device first, so we store it and sync it without being able to read a word.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-xl font-display text-3xl font-semibold text-foreground text-balance sm:text-4xl">
            Everything a week needs, nothing it doesn&apos;t
          </h2>

          <div className="mt-12 grid gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title}>
                <feature.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-3 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Genuinely sequential, so numbering earns its place here */}
      <section className="border-t px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Up and running in minutes</h2>

          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-lg font-semibold text-accent-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-accent px-8 py-10 text-accent-foreground sm:flex-row sm:items-center">
            <p className="font-display text-2xl font-semibold text-balance sm:text-3xl">No rush. It&apos;s free whenever you&apos;re ready.</p>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">Create a free account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={ANDROID_APK_URL} download>
                  <Download className="h-4 w-4" aria-hidden />
                  Download for Android
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
