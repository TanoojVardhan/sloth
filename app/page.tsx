"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  CheckCircle2,
  Calendar,
  Target,
  Mic,
  CloudIcon,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react"

const features = [
  {
    icon: CheckCircle2,
    title: "Smart task management",
    description: "Kanban boards, priorities, and due dates — organized without the busywork.",
  },
  {
    icon: Calendar,
    title: "Event calendar",
    description: "A full calendar view of what's ahead, so nothing important sneaks up on you.",
  },
  {
    icon: Target,
    title: "Goal tracking",
    description: "Set target dates and tags for the things that matter, and watch the progress add up.",
  },
  {
    icon: Mic,
    title: "Voice input",
    description: "Speak a task or event instead of typing it out when your hands are full.",
  },
  {
    icon: CloudIcon,
    title: "Cloud sync",
    description: "Everything follows you between devices in real time, backed by Firebase.",
  },
  {
    icon: Zap,
    title: "Unified schedule",
    description: "Tasks, events, and goals in one timeline, so planning the day takes one glance.",
  },
]

const steps = [
  {
    title: "Create your account",
    description: "Sign up with email or Google in seconds. No credit card required.",
  },
  {
    title: "Add your items",
    description: "Create tasks, events, and goals — by typing them in or just saying them out loud.",
  },
  {
    title: "Stay organized",
    description: "Check your schedule, track progress, and let the small wins add up.",
  },
]

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
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <main className="min-h-screen">
      {/* Hero — asymmetric, grounded in the product itself rather than a
          generic centered headline. The right-hand card is a small, honest
          mockup of what a day in Sloth Planner actually looks like. */}
      <section className="overflow-hidden border-b border-border/70 bg-gradient-to-b from-primary/5 to-background px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-accent-foreground/80">🦥 A calmer way to plan</p>
            <h1 className="mt-3 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Plan your days without the rush.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Sloth Planner keeps your tasks, events, and goals in one unhurried place —
              so you can move through the day at a pace that actually works for you.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="text-base">
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required · Cloud synced · Your data stays yours
            </p>
          </div>

          {/* A small, concrete mockup of the product instead of an emoji badge */}
          <Card className="border-border/70 shadow-lg">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg font-medium text-foreground">Today</p>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
                  3 of 5 done
                </span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-chart-1" />
                  <span className="text-muted-foreground line-through">Morning pages</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-chart-1" />
                  <span className="text-muted-foreground line-through">Reply to design review</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary/40" />
                  <span className="text-foreground">Walk + plan next week&apos;s goals</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary/40" />
                  <span className="text-foreground">Team sync, 3:00 PM</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features — a two-column list rather than a wall of identical cards */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for calm, focused productivity — not another dashboard to manage.
            </p>
          </div>

          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <feature.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — genuinely sequential, so numbering earns its place here */}
      <section className="border-y border-border/70 bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Get started in minutes
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title}>
                <span className="font-serif text-4xl font-medium text-primary/40">{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Ready to plan calmly?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join the people managing their days with Sloth Planner — organized, without the rush.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="text-base">
              <Link href="/signup">
                Start free now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
