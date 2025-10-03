"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, CheckCircle, Clock, Layout, Target } from "lucide-react"
import FeatureCard from "@/components/feature-card"
import { HeroIllustration } from "@/components/hero-illustration"
import { SlothLogo } from "@/components/sloth-logo"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Optionally, you can show a loading spinner while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-sm">
                <span className="mr-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">Free</span>
                <span className="text-foreground/70">AI-powered task prioritization</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                  Meet Sloth, Your AI Planning Assistant
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Plan smarter, not harder. Let Sloth handle your scheduling, tasks, and goals with AI-powered
                  efficiency. Completely free, forever.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 bg-white/80">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-background/50 px-3 py-1 text-sm">
              <span className="text-muted-foreground/70">Powerful Features</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
                AI-Powered Planning Features
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Sloth combines AI intelligence with intuitive design to make planning effortless
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10 text-primary" />}
              title="Smart Task Management"
              description="Organize tasks with AI-powered prioritization and intelligent reminders that adapt to your work style."
            />
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-primary" />}
              title="Intuitive Scheduling"
              description="Effortlessly plan your calendar with AI suggestions that optimize your time and energy levels."
            />
            <FeatureCard
              icon={<Target className="h-10 w-10 text-primary" />}
              title="Goal Setting & Tracking"
              description="Set meaningful goals with AI guidance and track your progress with visual analytics."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-primary" />}
              title="Time Optimization"
              description="Reclaim your time with AI analysis that identifies inefficiencies in your schedule."
            />
            <FeatureCard
              icon={<Layout className="h-10 w-10 text-primary" />}
              title="Customizable Dashboard"
              description="Personalize your planning experience with widgets and views that match your workflow."
            />
            <FeatureCard
              icon={<ArrowRight className="h-10 w-10 text-primary" />}
              title="Voice Assistant"
              description="Control your planner hands-free with our advanced voice assistant that understands natural language."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
                Ready to Plan Smarter?
              </h2>
              <p className="max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users who have transformed their productivity with Sloth
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
                <Link href="/dashboard">Get Started for Free</Link>
              </Button>
              <p className="text-xs text-foreground/60">No credit card required. Always free.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
