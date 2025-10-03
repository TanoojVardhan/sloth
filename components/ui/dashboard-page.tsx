import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { cn } from "@/lib/utils"

interface DashboardPageProps {
  title: string
  description?: string
  children: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
}

export function DashboardPage({ 
  title, 
  description, 
  children, 
  headerActions, 
  className 
}: DashboardPageProps) {
  return (
    <DashboardShell className={cn("py-6", className)}>
      <DashboardHeader heading={title} text={description}>
        {headerActions}
      </DashboardHeader>
      <div className="space-y-6">
        {children}
      </div>
    </DashboardShell>
  )
}