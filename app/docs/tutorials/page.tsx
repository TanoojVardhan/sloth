import { SiteFooter } from "@/components/site-footer"

export default function TutorialsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Tutorials</h1>
        <div className="prose max-w-none">
          <p className="text-xl mb-6">
            Step-by-step tutorials to help you master Sloth Planner.
          </p>

          <div className="space-y-10">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Getting Started with Sloth Planner</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Step 1: Create Your Account</h3>
                  <p>Sign up with your email or Google account. Complete your profile by adding your name and optional profile picture.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 2: Set Up Your Dashboard</h3>
                  <p>Customize your dashboard view by selecting which widgets to display. Choose from tasks, calendar, goals, and more.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 3: Create Your First Task</h3>
                  <p>Click the "Add Task" button, enter task details including title, description, due date, and priority.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 4: Set Up Your First Goal</h3>
                  <p>Navigate to the Goals section and create a new goal with specific milestones and target dates.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Using the AI Assistant</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Step 1: Activate the Assistant</h3>
                  <p>Click the chat icon in the top navigation bar or use the voice command button to activate the AI assistant.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 2: Ask for Help</h3>
                  <p>Type your query or use voice commands to ask for assistance with tasks, scheduling, or goal planning.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 3: Implement Suggestions</h3>
                  <p>Review the AI's suggestions and click "Apply" to automatically implement them in your schedule.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 4: Customize AI Preferences</h3>
                  <p>Adjust the AI's behavior in settings to match your planning style and preferences.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Advanced Calendar Management</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Step 1: Sync External Calendars</h3>
                  <p>Connect your Google, Outlook, or Apple calendars to view all your events in one place.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 2: Set Up Recurring Events</h3>
                  <p>Create patterns for recurring meetings, tasks, or personal events with customizable frequency.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 3: Use Time Blocking</h3>
                  <p>Allocate specific time blocks for focused work, meetings, and personal activities.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Step 4: Set Up Notifications</h3>
                  <p>Customize when and how you receive reminders about upcoming events and tasks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}