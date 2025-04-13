"use client"

import type React from "react"
import { useState, createContext, useContext } from "react"
import { processAICommand } from "@/lib/ai-processing"

interface AIAssistantContextType {
  isListening: boolean
  startListening: () => void
  stopListening: () => void
  transcript: string
  messages: Message[]
  addMessage: (message: Message) => void
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isTyping?: boolean
  action?: string
  actionData?: any
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! I'm your AI assistant. How can I help you with your tasks and planning today?",
      timestamp: new Date(),
    },
  ])

  const startListening = () => {
    setIsListening(true)
    setTranscript("")
    // In a real implementation, this would connect to the Web Speech API
    // For this UI demo, we'll simulate voice recognition
    setTimeout(() => {
      setTranscript("Add a meeting with the design team tomorrow at 2pm")
      stopListening()
    }, 3000)
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const addMessage = async (message: Message) => {
    setMessages((prev) => [...prev, message])

    // Process user messages with AI
    if (message.role === "user") {
      try {
        // Show typing indicator
        const typingMessage: Message = {
          id: "typing",
          role: "assistant",
          content: "Thinking...",
          timestamp: new Date(),
          isTyping: true,
        }
        setMessages((prev) => [...prev, typingMessage])

        // Process the command
        const aiResponse = await processAICommand(message.content)

        // Remove typing indicator and add AI response
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== "typing")
            .concat({
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: aiResponse.message,
              timestamp: new Date(),
              action: aiResponse.action,
              actionData: aiResponse.data,
            }),
        )
      } catch (error) {
        // Remove typing indicator and add error message
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== "typing")
            .concat({
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "I'm sorry, I encountered an error processing your request.",
              timestamp: new Date(),
            }),
        )
      }
    }
  }

  return (
    <AIAssistantContext.Provider
      value={{
        isListening,
        startListening,
        stopListening,
        transcript,
        messages,
        addMessage,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider")
  }
  return context
}
