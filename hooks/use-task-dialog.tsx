"use client"

import type React from "react"
import { useState, createContext, useContext } from "react"

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
  tags?: string[]
  description?: string
}

interface TaskDialogContextType {
  isOpen: boolean
  openTaskDialog: () => void
  closeTaskDialog: () => void
  taskToEdit: Task | null
  setTaskToEdit: (task: Task | null) => void
}

const TaskDialogContext = createContext<TaskDialogContextType | undefined>(undefined)

export function TaskDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  const openTaskDialog = () => setIsOpen(true)
  const closeTaskDialog = () => {
    setIsOpen(false)
    setTaskToEdit(null)
  }

  return (
    <TaskDialogContext.Provider
      value={{
        isOpen,
        openTaskDialog,
        closeTaskDialog,
        taskToEdit,
        setTaskToEdit,
      }}
    >
      {children}
    </TaskDialogContext.Provider>
  )
}

export function useTaskDialog() {
  const context = useContext(TaskDialogContext)
  if (context === undefined) {
    throw new Error("useTaskDialog must be used within a TaskDialogProvider")
  }
  return context
}
