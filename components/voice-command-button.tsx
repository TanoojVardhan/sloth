"use client"

import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface VoiceCommandButtonProps {
  className?: string
  tooltip?: string
}

export function VoiceCommandButton({ className, tooltip = "Use voice commands" }: VoiceCommandButtonProps) {
  const { openAssistant, startListening } = useAIAssistant()

  const handleClick = () => {
    openAssistant()
    setTimeout(() => {
      startListening()
    }, 500)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleClick} variant="outline" size="icon" className={className}>
            <Mic className="h-4 w-4" />
            <span className="sr-only">Voice Command</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
