import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskDialogProvider } from "@/hooks/use-task-dialog"
import { AIAssistantProvider } from "@/hooks/use-ai-assistant"
import { PersistentVoiceAssistant } from "@/components/persistent-voice-assistant"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sloth - AI Planning Assistant",
  description: "Plan smarter, not harder with Sloth AI Planning Assistant",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          enableColorScheme={false}
        >
          <AIAssistantProvider>
            <TaskDialogProvider>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <PersistentVoiceAssistant />
              <Toaster />
            </TaskDialogProvider>
          </AIAssistantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}