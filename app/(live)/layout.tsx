"use client"

import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskDialogProvider } from "@/hooks/use-task-dialog"
import { EventDialogProvider } from "@/hooks/use-event-dialog"
import { GoalDialogProvider } from "@/components/providers/goal-dialog-provider"
import { AIAssistantProvider } from "@/hooks/use-ai-assistant"
import { PersistentVoiceAssistant } from "@/components/persistent-voice-assistant"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { AuthProvider } from "@/contexts/auth-context"
import { MainHeader } from "@/components/main-header"
import { SiteFooter } from "@/components/site-footer"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem 
            disableTransitionOnChange
          >
            <UserProvider>
              <AIAssistantProvider>
                <TaskDialogProvider>
                  <EventDialogProvider>
                    <GoalDialogProvider>
                      <div className="flex min-h-screen flex-col">
                        <div className="flex-1">{children}</div>
                      </div>
                      <PersistentVoiceAssistant />
                      <Toaster />
                    </GoalDialogProvider>
                  </EventDialogProvider>
                </TaskDialogProvider>
              </AIAssistantProvider>
            </UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}