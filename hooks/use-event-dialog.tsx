"use client"

import type React from "react"
import { useState, createContext, useContext } from "react"
import { type Event } from "@/lib/services/event-service"

interface EventDialogContextType {
  isOpen: boolean
  openEventDialog: () => void
  closeEventDialog: () => void
  eventToEdit: Event | null
  setEventToEdit: (event: Event | null) => void
}

const EventDialogContext = createContext<EventDialogContextType | undefined>(undefined)

export function EventDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)

  const openEventDialog = () => setIsOpen(true)
  const closeEventDialog = () => {
    setIsOpen(false)
    setEventToEdit(null)
  }

  return (
    <EventDialogContext.Provider
      value={{
        isOpen,
        openEventDialog,
        closeEventDialog,
        eventToEdit,
        setEventToEdit,
      }}
    >
      {children}
    </EventDialogContext.Provider>
  )
}

export function useEventDialog() {
  const context = useContext(EventDialogContext)
  if (context === undefined) {
    throw new Error("useEventDialog must be used within an EventDialogProvider")
  }
  return context
}