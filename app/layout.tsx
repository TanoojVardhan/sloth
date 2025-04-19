import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskDialogProvider } from "@/hooks/use-task-dialog"
import { AIAssistantProvider } from "@/hooks/use-ai-assistant"
import { PersistentVoiceAssistant } from "@/components/persistent-voice-assistant"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { AuthProvider } from "@/contexts/auth-context"
import { MainHeader } from "@/components/main-header"
import { SiteFooter } from "@/components/site-footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sloth Planner - AI Planning Assistant",
  description: "Plan smarter, not harder with Sloth Planner",
  generator: 'v0.dev',
  icons: {
    icon: '/images/sloth-planner-logo.png',
    apple: '/images/sloth-planner-logo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-[#e0cdb7]`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <UserProvider>
              <AIAssistantProvider>
                <TaskDialogProvider>
                  <div className="flex min-h-screen flex-col">
                    <MainHeader />
                    <div className="flex-1">{children}</div>
                    <SiteFooter />
                  </div>
                  <PersistentVoiceAssistant />
                  <Toaster />
                </TaskDialogProvider>
              </AIAssistantProvider>
            </UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}