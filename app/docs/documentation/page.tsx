import { SiteFooter } from "@/components/site-footer"

export default function DocumentationPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>
        
        <div className="prose max-w-none">
          <p className="text-xl mb-6">
            Welcome to the comprehensive documentation for Sloth Planner. Here you'll find detailed information about all features and functionalities.
          </p>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="mb-4">
              New to Sloth Planner? Start here to learn the basics and set up your account for success.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><a href="#account-setup" className="text-primary hover:underline">Creating your account</a></li>
              <li><a href="#dashboard-overview" className="text-primary hover:underline">Dashboard overview</a></li>
              <li><a href="#initial-setup" className="text-primary hover:underline">Initial setup and configuration</a></li>
              <li><a href="#mobile-access" className="text-primary hover:underline">Accessing Sloth Planner on mobile devices</a></li>
            </ul>
          </div>

          <div id="account-setup" className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Account Setup</h2>
            <p className="mb-4">
              Learn how to create and configure your Sloth Planner account.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">Creating Your Account</h3>
            <p>
              You can sign up for Sloth Planner using your email address or by connecting your Google account. 
              Here's how to create an account:
            </p>
            <ol className="list-decimal pl-5 mt-2 mb-4 space-y-2">
              <li>Visit the <a href="/signup" className="text-primary hover:underline">signup page</a></li>
              <li>Enter your name, email address, and choose a secure password</li>
              <li>Alternatively, click "Sign Up with Google" to use your Google account</li>
              <li>Check your email inbox for a verification email</li>
              <li>Click the verification link to confirm your account</li>
            </ol>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">Profile Settings</h3>
            <p>
              After creating your account, you should complete your profile:
            </p>
            <ol className="list-decimal pl-5 mt-2 mb-4 space-y-2">
              <li>Navigate to Settings > Profile</li>
              <li>Upload a profile picture (optional)</li>
              <li>Verify your display name is correct</li>
              <li>Add additional contact information if desired</li>
              <li>Save your changes</li>
            </ol>
          </div>

          <div id="dashboard-overview" className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
            <p className="mb-4">
              Your dashboard is the central hub for all your planning activities. Here's a breakdown of its components:
            </p>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-xl font-semibold">Navigation Sidebar</h3>
                <p>
                  Located on the left side of your screen, the sidebar provides quick access to all main sections:
                  Dashboard, Tasks, Calendar, Goals, and Settings.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">Quick Actions Bar</h3>
                <p>
                  At the top of your dashboard, you'll find buttons for common actions like adding a new task,
                  creating a calendar event, or setting a new goal.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">Widgets</h3>
                <p>
                  Your dashboard displays customizable widgets showing your upcoming tasks, calendar events,
                  goal progress, and productivity statistics.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">AI Assistant</h3>
                <p>
                  The AI assistant button is located in the bottom right corner. Click it to activate
                  voice commands or type queries for planning assistance.
                </p>
              </div>
            </div>
          </div>
          
          <div id="mobile-access" className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Mobile Access</h2>
            <p className="mb-4">
              Sloth Planner is fully responsive and works on all mobile devices.
            </p>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-xl font-semibold">Web App</h3>
                <p>
                  Access Sloth Planner through your mobile browser at app.slothplanner.com. 
                  The interface will automatically adapt to your screen size.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">Mobile Apps</h3>
                <p>
                  Native mobile apps are available for both iOS and Android devices:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Download from the <a href="#" className="text-primary hover:underline">App Store</a> for iOS</li>
                  <li>Download from the <a href="#" className="text-primary hover:underline">Google Play Store</a> for Android</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">Offline Mode</h3>
                <p>
                  Our mobile apps support offline mode, allowing you to view and edit your tasks even without an internet connection.
                  Changes will sync automatically when you reconnect.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
            <p className="mb-4">
              Explore these additional resources to get the most out of Sloth Planner:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <a href="/docs/tutorials" className="p-4 border rounded hover:bg-primary/5 transition-colors">
                <h3 className="font-semibold">Video Tutorials</h3>
                <p className="text-sm text-muted-foreground">Step-by-step video guides for all features</p>
              </a>
              
              <a href="/docs/faq" className="p-4 border rounded hover:bg-primary/5 transition-colors">
                <h3 className="font-semibold">FAQ</h3>
                <p className="text-sm text-muted-foreground">Answers to common questions</p>
              </a>
              
              <a href="/docs/api" className="p-4 border rounded hover:bg-primary/5 transition-colors">
                <h3 className="font-semibold">API Documentation</h3>
                <p className="text-sm text-muted-foreground">Integrate with our API</p>
              </a>
              
              <a href="/support" className="p-4 border rounded hover:bg-primary/5 transition-colors">
                <h3 className="font-semibold">Support Center</h3>
                <p className="text-sm text-muted-foreground">Get help with specific issues</p>
              </a>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}