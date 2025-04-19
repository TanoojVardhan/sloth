"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Mic } from "lucide-react"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { useAuth } from "@/contexts/auth-context"

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const { startListening } = useAIAssistant()
  const { user } = useAuth()

  if (!isVisible) {
    return null
  }

  const handleVoiceAssistant = () => {
    startListening()
  }

  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">
              {user?.displayName ? `Welcome, ${user.displayName.split(" ")[0]}!` : "Welcome to your Planner"}
            </h2>
            <p className="text-primary-foreground/90">
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
                className="bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Watch tutorial
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
