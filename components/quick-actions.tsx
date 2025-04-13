"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusCircle, Mic } from "lucide-react"
import { useTaskDialog } from "@/hooks/use-task-dialog"
import { useAIAssistant } from "@/hooks/use-ai-assistant"

export function QuickActions() {
  const { openTaskDialog } = useTaskDialog()
  const { startListening } = useAIAssistant()

  const handleVoiceCommand = () => {
    startListening()
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="text-slate-700" onClick={handleVoiceCommand}>
        <Mic className="mr-2 h-4 w-4" />
        Voice Command
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-slate-800 hover:bg-slate-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openTaskDialog()}>New Task</DropdownMenuItem>
          <DropdownMenuItem>New Event</DropdownMenuItem>
          <DropdownMenuItem>New Goal</DropdownMenuItem>
          <DropdownMenuItem>New Project</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
