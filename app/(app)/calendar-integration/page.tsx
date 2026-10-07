"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import GoogleCalendarScheduler from "@/components/google-calendar-scheduler"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarCheck, Sparkles, Zap, Shield, CheckCircle2, AlertCircle } from "lucide-react"

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
        description="Connect your Google Calendar to automatically sync tasks and events from Sloth Planner"
      />

      <Suspense fallback={null}>
        <OAuthCallbackBanner />
      </Suspense>

      {/* Main Connection Component */}
      <GoogleCalendarScheduler />

      {/* Features Section */}
      <div className="mx-auto grid max-w-4xl gap-6 pt-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CalendarCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Auto-Sync</h3>
            <p className="text-sm text-muted-foreground">
              Tasks and events automatically sync to your Google Calendar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Seamless</h3>
            <p className="text-sm text-muted-foreground">
              No manual event creation needed - it happens automatically
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Real-time</h3>
            <p className="text-sm text-muted-foreground">
              Events appear in your calendar immediately after creation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Your tokens are encrypted and stored securely in Firebase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works Section */}
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg border bg-muted/30 p-6">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span>
              <strong className="text-foreground">Connect Google Calendar:</strong> Sign in with your Google
              account and grant permission to manage calendar events.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span>
              <strong className="text-foreground">Secure Token Storage:</strong> Your OAuth tokens are encrypted
              and stored in Firebase Firestore for future use.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <span>
              <strong className="text-foreground">Create Tasks & Events:</strong> Use the Quick Add panel on the dashboard
              to create tasks and events with dates.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              4
            </span>
            <span>
              <strong className="text-foreground">Automatic Sync:</strong> They automatically appear in your Google
              Calendar - no manual event creation needed!
            </span>
          </li>
        </ol>
      </div>

      {/* Setup Instructions */}
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg border border-warning/30 bg-warning/10 p-6">
        <h2 className="text-2xl font-bold">Setup Required</h2>
        <div className="space-y-3 text-sm">
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
      </div>
    </div>
  )
}
