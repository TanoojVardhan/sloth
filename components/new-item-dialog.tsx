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
import { useEventDialog } from "@/hooks/use-event-dialog"
import { useTaskDialog } from "@/hooks/use-task-dialog"

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
  const { openEventDialog } = useEventDialog()
  const { openTaskDialog } = useTaskDialog()
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  const handleEventCreate = () => {
    setIsOpen(false)
    openEventDialog()
  }

  const handleTaskCreate = () => {
    setIsOpen(false)
    openTaskDialog()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            onClick={handleTaskCreate}
          >
            <ListTodo className="h-8 w-8 mb-2 text-blue-500" />
            <span>Task</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={handleEventCreate}
          >
            <CalendarPlus className="h-8 w-8 mb-2 text-green-500" />
            <span>Event</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={() => handleNavigation("/dashboard/goals/new")}
          >
            <Target className="h-8 w-8 mb-2 text-purple-500" />
            <span>Goal</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-24 items-center justify-center"
            onClick={() => handleNavigation("/dashboard/projects/new")}
          >
            <Briefcase className="h-8 w-8 mb-2 text-amber-500" />
            <span>Project</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}