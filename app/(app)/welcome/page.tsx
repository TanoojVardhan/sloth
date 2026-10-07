import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WelcomePage() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">Welcome to Sloth Planner</h1>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        This is your calm space to organize tasks, events, goals, and schedules. Add items from the dashboard or each
        dedicated page. Voice input works anywhere you see the mic.
      </p>
      <div className="mt-4 flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/tasks">Add a Task</Link>
        </Button>
      </div>
    </div>
  )
}
