"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAIAssistant } from "@/hooks/use-ai-assistant"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string
}

export function DashboardHeader({ heading, text, children, className }: DashboardHeaderProps) {
  const { startListening } = useAIAssistant()

  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-2xl">{heading}</h1>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={startListening}>
            <Mic className="h-4 w-4" />
            <span className="sr-only">Voice command</span>
          </Button>
        </div>
        {text && <p className="text-sm text-slate-500">{text}</p>}
      </div>
      {children}
    </div>
  )
}
