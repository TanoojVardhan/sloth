"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, CalendarPlus, Target, ListTodo, Briefcase } from "lucide-react"
import { useRouter } from "next/navigation"

interface NewItemDialogProps {
  triggerClassName?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  triggerSize?: "default" | "sm" | "lg" | "icon"
  dialogTitle?: string
  triggerText?: string
}

export function NewItemDialog({ 
  triggerClassName, 
  triggerVariant = "default", 
  triggerSize = "default",
  dialogTitle = "Create New",
  triggerText = "New"
}: NewItemDialogProps) {
  const router = useRouter()
  
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <Plus className="h-4 w-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Choose what you want to create
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={() => handleNavigation("/live/dashboard/tasks/new")}
          >
            <ListTodo className="h-8 w-8 mb-2 text-blue-500" />
            <span>Task</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={() => handleNavigation("/live/dashboard/calendar/new-event")}
          >
            <CalendarPlus className="h-8 w-8 mb-2 text-green-500" />
            <span>Event</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={() => handleNavigation("/live/dashboard/goals/new")}
          >
            <Target className="h-8 w-8 mb-2 text-purple-500" />
            <span>Goal</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={() => handleNavigation("/live/dashboard/projects/new")}
          >
            <Briefcase className="h-8 w-8 mb-2 text-amber-500" />
            <span>Project</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}