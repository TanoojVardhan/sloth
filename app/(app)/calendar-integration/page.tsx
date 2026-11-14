"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import GoogleCalendarScheduler from "@/components/google-calendar-scheduler"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarCheck, CheckCircle2, AlertCircle } from "lucide-react"

function OAuthCallbackBanner() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const message = searchParams.get("message")

  if (!status) return null

  return (
    <Alert variant={status === "error" ? "destructive" : "default"}>
      {status === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      <AlertDescription>
        {status === "error"
          ? message || "Something went wrong connecting your Google Calendar."
          : "Google Calendar connected successfully."}
      </AlertDescription>
    </Alert>
  )
}

export default function CalendarIntegrationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={CalendarCheck}
        title="Google Calendar"
        description="Send the tasks and events you create here to your Google Calendar automatically."
      />

      <Suspense fallback={null}>
        <OAuthCallbackBanner />
      </Suspense>

      {/* Main Connection Component */}
      <GoogleCalendarScheduler />

      <section className="mx-auto max-w-2xl">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
          {[
            ["Connect your Google account", "Sign in with Google and allow Sloth Planner to manage calendar events."],
            ["Add tasks and events as usual", "Anything with a date, from Quick add or the Tasks and Events pages."],
            ["Find them in Google Calendar", "They appear there right after you create them. Nothing to copy across."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {i + 1}
              </span>
              <span>
                <strong className="block font-medium text-foreground">{title}</strong>
                {body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Only matters to whoever hosts the app, so it stays folded away. */}
      <details className="mx-auto max-w-2xl rounded-xl border bg-card px-5 py-4 text-sm">
        <summary className="cursor-pointer font-medium">Running your own copy? Set up Google OAuth first</summary>
        <div className="mt-4 space-y-3">
          <p>
            To use this feature, you need to configure Google OAuth credentials:
          </p>
          <ol className="ml-4 list-decimal space-y-2 text-muted-foreground">
            <li>
              Go to{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </li>
            <li>Create a new OAuth 2.0 Client ID (or use existing)</li>
            <li>Add authorized redirect URIs (e.g., http://localhost:3001)</li>
            <li>Copy Client ID and Client Secret</li>
            <li>Add them to your <code className="rounded bg-muted px-1 py-0.5">.env.local</code> file:
              <pre className="mt-2 rounded-md bg-muted p-3 text-xs">
                {`GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here`}
              </pre>
            </li>
            <li>
              Download Firebase Service Account JSON from{" "}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Firebase Console
              </a>{" "}
              (Project Settings → Service Accounts)
            </li>
            <li>Save it as <code className="rounded bg-muted px-1 py-0.5">serviceAccountKey.json</code> in project root</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </details>
    </div>
  )
}
