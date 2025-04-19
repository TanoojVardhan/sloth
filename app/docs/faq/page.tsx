import { SiteFooter } from "@/components/site-footer"

export default function FAQPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
        <div className="prose max-w-none">
          <p className="text-xl mb-6">
            Find answers to the most common questions about Sloth Planner.
          </p>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">General Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Is Sloth Planner really free?</h3>
                  <p>Yes, the core features of Sloth Planner are completely free. We offer a premium tier with additional features for power users, but the free version contains everything you need for effective task and time management.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">How secure is my data?</h3>
                  <p>We take data security very seriously. All data is encrypted at rest and in transit. We use industry-standard security measures and never share your personal information with third parties without your explicit consent.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Can I export my data?</h3>
                  <p>Yes, you can export all your data in CSV or JSON format from the Settings page. This allows you to back up your information or migrate to another platform if needed.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Tasks & Planning</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">How many tasks can I create?</h3>
                  <p>There is no limit to the number of tasks you can create, even in the free version.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Can I set recurring tasks?</h3>
                  <p>Yes, you can set tasks to repeat at various intervals - daily, weekly, monthly, or on custom schedules.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Is there a way to prioritize tasks?</h3>
                  <p>Yes, you can set priority levels (High, Medium, Low) for tasks and also use labels and tags to organize them further.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">AI Assistant</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">How does the AI Assistant work?</h3>
                  <p>Our AI Assistant analyzes your tasks, goals, and schedule to provide intelligent suggestions. It can help prioritize tasks, optimize your schedule, and provide reminders based on your work patterns.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Is the voice recognition feature available on all devices?</h3>
                  <p>Yes, voice recognition works on all modern browsers and devices, including mobile phones, tablets, and desktop computers.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Can I turn off the AI features?</h3>
                  <p>Absolutely. All AI features can be disabled in the settings if you prefer a more traditional planning experience.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Account & Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">How do I change my password?</h3>
                  <p>Go to Settings > Account > Security and select "Change Password." You'll receive an email with instructions to complete the process.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Can I change my timezone?</h3>
                  <p>Yes, you can set your timezone in Settings > Preferences > Time & Date. The app will automatically adjust all task due dates and event times accordingly.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">How do I delete my account?</h3>
                  <p>You can delete your account from Settings > Account > Account Management. Please note that this action is irreversible and all your data will be permanently deleted.</p>
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