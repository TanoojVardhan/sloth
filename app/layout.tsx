import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Bricolage_Grotesque } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Suspense } from "react"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AppChrome } from "@/components/app-chrome"
import { PwaRegister } from "@/components/pwa"
import { PageTracker } from "@/components/page-tracker"

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" })

export const metadata: Metadata = {
  title: "Sloth Planner - Your Smart Planning Assistant",
  description: "Organize your tasks, events, and goals with Sloth Planner",
  icons: {
    icon: [
      { url: "/sloth-planner-logo.png" },
      { url: "/sloth-planner-logo.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/sloth-planner-logo.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Sloth Planner", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#15231C" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${bricolage.variable} flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <AuthProvider>
              <AppChrome>{children}</AppChrome>
              <ChatbotWidget />
            </AuthProvider>
          </Suspense>
          <Analytics />
          <Suspense fallback={null}>
            <PageTracker />
          </Suspense>
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
