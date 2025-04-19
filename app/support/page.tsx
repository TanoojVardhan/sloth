import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, HelpCircle, FileText, MessageSquare } from "lucide-react"

export default function SupportPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Support Center</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              className="pl-10" 
              placeholder="Search for help with tasks, calendar, settings, etc." 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start mb-4">
              <HelpCircle className="h-8 w-8 text-primary mr-4" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">Frequently Asked Questions</h2>
                <p className="text-gray-600 mb-4">Find quick answers to common questions about using Sloth Planner.</p>
                <Button asChild variant="outline" className="mt-2">
                  <a href="/docs/faq">Browse FAQ</a>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start mb-4">
              <FileText className="h-8 w-8 text-primary mr-4" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">Documentation & Guides</h2>
                <p className="text-gray-600 mb-4">Step-by-step guides and detailed documentation.</p>
                <Button asChild variant="outline" className="mt-2">
                  <a href="/docs/documentation">View Guides</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-2xl font-semibold mb-6">Common Support Topics</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a href="/docs/guides#account-setup" className="p-4 border rounded-md hover:bg-primary/5 transition-colors">
              <h3 className="font-medium mb-1">Account Setup & Login</h3>
              <p className="text-sm text-muted-foreground">Manage your account, password reset, profile settings</p>
            </a>
            
            <a href="/docs/guides#task-management" className="p-4 border rounded-md hover:bg-primary/5 transition-colors">
              <h3 className="font-medium mb-1">Task Management</h3>
              <p className="text-sm text-muted-foreground">Creating tasks, setting priorities, recurring tasks</p>
            </a>
            
            <a href="/docs/guides#calendar" className="p-4 border rounded-md hover:bg-primary/5 transition-colors">
              <h3 className="font-medium mb-1">Calendar Features</h3>
              <p className="text-sm text-muted-foreground">Managing events, calendar views, integrations</p>
            </a>
            
            <a href="/docs/guides#goals" className="p-4 border rounded-md hover:bg-primary/5 transition-colors">
              <h3 className="font-medium mb-1">Goal Tracking</h3>
              <p className="text-sm text-muted-foreground">Setting goals, tracking progress, milestones</p>
            </a>
            
            <a href="/docs/guides#ai-assistant" className="p-4 border rounded-md hover:bg-primary/5 transition-colors">
              <h3 className="font-medium mb-1">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Voice commands, suggestions, smart planning</p>
            </a>
            
            <a href="/docs/guides#notifications" className="p-4 border rounded-md hover:bg-primary/5 transition-colors">
              <h3 className="font-medium mb-1">Notifications & Reminders</h3>
              <p className="text-sm text-muted-foreground">Setting reminders, notification preferences</p>
            </a>
          </div>
        </div>
        
        <div className="bg-primary/10 rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-6">
              <div className="flex items-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-2xl font-semibold">Need Further Help?</h2>
              </div>
              <p className="text-gray-600 mb-4 max-w-lg">
                Our support team is available to assist you with any questions or issues not covered in our documentation.
              </p>
              <p className="text-gray-600 mb-6">
                Typical response time: <span className="font-semibold">Within 24 hours</span>
              </p>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[350px]">
              <form className="space-y-4">
                <div>
                  <Input placeholder="Your email address" type="email" required />
                </div>
                <div>
                  <Textarea placeholder="Describe your issue or question" rows={4} required />
                </div>
                <Button type="submit" className="w-full">Submit Support Request</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}