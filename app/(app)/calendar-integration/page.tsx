import GoogleCalendarScheduler from "@/components/google-calendar-scheduler"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarCheck, Sparkles, Zap, Shield } from "lucide-react"

export default function CalendarIntegrationPage() {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <PageHeader
        icon={CalendarCheck}
        title="Google Calendar"
        description="Seamlessly connect your Google Calendar and create events directly from Sloth Planner with AI-powered scheduling"
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      {/* Main Scheduler Component */}
      <GoogleCalendarScheduler />

      {/* Features Section */}
      <div className="mx-auto grid max-w-4xl gap-6 pt-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CalendarCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Quick Sync</h3>
            <p className="text-sm text-muted-foreground">
              Create calendar events instantly without switching apps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">AI Ready</h3>
            <p className="text-sm text-muted-foreground">
              Perfect for AI-powered task scheduling and automation
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
              <strong className="text-foreground">Create Events:</strong> Fill in the event details (title,
              description, date/time) and submit.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              4
            </span>
            <span>
              <strong className="text-foreground">Instant Sync:</strong> The event is created in your Google
              Calendar and you&apos;ll receive a confirmation with a link to view it.
            </span>
          </li>
        </ol>
      </div>

      {/* Setup Instructions */}
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-900 dark:bg-orange-950/20">
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
