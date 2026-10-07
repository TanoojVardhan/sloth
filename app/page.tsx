"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Shield,
  ArrowRight,
  Loader2
} from "lucide-react"

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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Logo/Icon */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-6xl">
              🦥
            </div>
            
            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Sloth Planner
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground sm:text-2xl">
                AI-ready planning assistant that helps you manage tasks, schedule, and goals—calmly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild className="text-lg">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Trust Badge */}
            <p className="text-sm text-muted-foreground">
              🔒 Your data is secure • ☁️ Cloud synced • 🚀 No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to stay productive
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for calm, focused productivity
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Task Management</CardTitle>
                <CardDescription>
                  Organize tasks with Kanban boards, priorities, and due dates. Track progress effortlessly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Event Calendar</CardTitle>
                <CardDescription>
                  Visualize your schedule with full calendar views. Never miss important events again.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Goal Tracking</CardTitle>
                <CardDescription>
                  Set long-term goals with target dates and tags. Track your progress and celebrate wins.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Voice Input</CardTitle>
                <CardDescription>
                  Speak your tasks and events. AI-powered voice commands make planning effortless.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CloudIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Cloud Sync</CardTitle>
                <CardDescription>
                  Access your data from any device. Real-time synchronization with Firebase.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Schedule</CardTitle>
                <CardDescription>
                  See all your tasks, events, and goals in one unified timeline. Plan your day efficiently.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get started in minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple setup, powerful results
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Create Account</h3>
              <p className="text-muted-foreground">
                Sign up with email or Google in seconds. No credit card required.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Add Your Items</h3>
              <p className="text-muted-foreground">
                Create tasks, events, and goals. Use voice input or type them in.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Stay Organized</h3>
              <p className="text-muted-foreground">
                View your schedule, track progress, and achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-12">
              <Shield className="mx-auto mb-6 h-16 w-16 text-primary" />
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to plan calmly?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of users who manage their life with Sloth Planner.
                Start your journey to organized productivity today.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="text-lg">
                  <Link href="/signup">
                    Start Free Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Links */}
      <section className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">Resources</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/guides" className="hover:text-foreground">User Guides</Link></li>
                <li><Link href="/tutorials" className="hover:text-foreground">Tutorials</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/mission" className="hover:text-foreground">Our Mission</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Log In</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API Docs</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Sloth Planner. Built with ❤️ using Next.js and Firebase.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
