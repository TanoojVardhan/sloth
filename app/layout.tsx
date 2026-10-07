import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Suspense } from "react"
import { AuthProvider } from "@/components/auth-provider"

export const metadata: Metadata = {
  title: "Sloth Planner - Your Smart Planning Assistant",
  description: "Organize your tasks, events, and goals with Sloth Planner",
  icons: {
    icon: [
      { url: "/sloth-planner-logo.png" },
      { url: "/sloth-planner-logo.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/sloth-planner-logo.png",
    apple: "/sloth-planner-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <SiteHeader />
            <main className="min-h-[70vh]">{children}</main>
            <SiteFooter />
            <ChatbotWidget />
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
