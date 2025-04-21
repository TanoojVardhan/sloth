import { SiteFooter } from "@/components/site-footer"

export default function GuidesPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">User Guides</h1>
        <div className="prose max-w-none">
          <p className="text-xl mb-4">
            Comprehensive guides to help you make the most of Sloth Planner.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Task Management Guide</h2>
              <p className="mb-4">Learn how to effectively create, organize, and complete tasks.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Creating and editing tasks</li>
                <li>Setting priorities and deadlines</li>
                <li>Organizing with labels and categories</li>
                <li>Tracking progress and completion</li>
                <li>Managing recurring tasks</li>
                <li>Batch operations for multiple tasks</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Calendar Management</h2>
              <p className="mb-4">Master your schedule with our calendar features.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Different calendar views (day, week, month)</li>
                <li>Adding and managing events</li>
                <li>Setting reminders and notifications</li>
                <li>Creating recurring events</li>
                <li>Integrating with external calendars</li>
                <li>Time blocking techniques</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Goal Setting & Tracking</h2>
              <p className="mb-4">Achieve your goals with our robust goal tracking system.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Creating SMART goals</li>
                <li>Breaking down goals into milestones</li>
                <li>Tracking progress visually</li>
                <li>Setting up goal reminders</li>
                <li>Connecting tasks to goals</li>
                <li>Goal reflection and adjustments</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">AI Assistant Guide</h2>
              <p className="mb-4">Get the most from our AI planning assistant.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Voice commands and queries</li>
                <li>Smart suggestions and recommendations</li>
                <li>Task prioritization assistance</li>
                <li>Schedule optimization</li>
                <li>Natural language processing for tasks</li>
                <li>Customizing AI preferences</li>
              </ul>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Advanced Settings Guide</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4" id="account-setup">Account Settings</h3>
              <p className="mb-4">Configure your account settings for a personalized experience.</p>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium">Profile Settings</h4>
                  <p>Update your display name, profile picture, and contact information to personalize your Sloth Planner experience.</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium">Time & Date Preferences</h4>
                  <p>Customize how dates and times appear in your planner by selecting your preferred timezone, date format, and time format (12-hour or 24-hour).</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium">Notification Preferences</h4>
                  <p>Control when and how you receive notifications about tasks, events, and goals. Choose between email notifications, push notifications, or both.</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium">Integration Settings</h4>
                  <p>Connect your Sloth Planner account with other services like Google Calendar, Microsoft Outlook, or other productivity tools.</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium">Security Settings</h4>
                  <p>Update your password, enable two-factor authentication, and review your account login history to keep your account secure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}