"use client"

import { ReactNode } from "react"
import { GoalDialogProvider as Provider } from "@/hooks/use-goal-dialog"

interface GoalDialogProviderProps {
  children: ReactNode
}

export function GoalDialogProvider({ children }: GoalDialogProviderProps) {
  return <Provider>{children}</Provider>
}