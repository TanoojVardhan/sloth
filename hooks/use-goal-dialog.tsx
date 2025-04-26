"use client"

import type React from "react"
import { useState, createContext, useContext } from "react"
import { type Goal } from "@/lib/services/goal-service"

interface GoalDialogContextType {
  isOpen: boolean
  openGoalDialog: () => void
  closeGoalDialog: () => void
  goalToEdit: Goal | null
  setGoalToEdit: (goal: Goal | null) => void
}

const GoalDialogContext = createContext<GoalDialogContextType | undefined>(undefined)

export function GoalDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null)

  const openGoalDialog = () => setIsOpen(true)
  const closeGoalDialog = () => {
    setIsOpen(false)
    setGoalToEdit(null)
  }

  return (
    <GoalDialogContext.Provider
      value={{
        isOpen,
        openGoalDialog,
        closeGoalDialog,
        goalToEdit,
        setGoalToEdit,
      }}
    >
      {children}
    </GoalDialogContext.Provider>
  )
}

export function useGoalDialog() {
  const context = useContext(GoalDialogContext)
  if (context === undefined) {
    throw new Error("useGoalDialog must be used within a GoalDialogProvider")
  }
  return context
}