"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Mic } from "lucide-react"
import { useAIAssistant } from "@/hooks/use-ai-assistant"

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const { startListening } = useAIAssistant()

  if (!isVisible) {
    return null
  }

  const handleVoiceAssistant = () => {
    startListening()
  }

  return (
    <Card className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Welcome to your AI Planner</h2>
            <p className="text-slate-200">
              Get started by adding your first task or exploring the dashboard. Our AI will help you prioritize and
              manage your time effectively.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={handleVoiceAssistant}>
                <Mic className="mr-2 h-4 w-4" />
                Try Voice Assistant
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Watch tutorial
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
