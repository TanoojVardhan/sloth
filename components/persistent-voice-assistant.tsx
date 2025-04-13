"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, X, MessageSquare, Send, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SlothLogo } from "@/components/sloth-logo"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/types"

export function PersistentVoiceAssistant() {
  const { isListening, startListening, stopListening, transcript, messages, addMessage } = useAIAssistant()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [input, setInput] = useState("")
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const { toast } = useToast()

  // Simulate pulse animation every 10 seconds when minimized
  useEffect(() => {
    if (isMinimized) {
      const interval = setInterval(() => {
        setPulseAnimation(true)
        setTimeout(() => setPulseAnimation(false), 2000)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [isMinimized])

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  const toggleOpen = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    addMessage({
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    })
    setInput("")
  }

  const handleActionResponse = (message: Message) => {
    if (message.action && message.actionData) {
      switch (message.action) {
        case "add_task":
          // Task was already added by the server action
          break
        case "add_event":
          // In a real app, we would add the event to the calendar
          toast({
            title: "Event Added",
            description: `Added "${message.actionData.title}" to your calendar.`,
          })
          break
        case "set_reminder":
          // In a real app, we would set a reminder
          toast({
            title: "Reminder Set",
            description: `Set reminder: "${message.actionData.text}"`,
          })
          break
      }
    }
  }

  useEffect(() => {
    // Check for action responses
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.action) {
      handleActionResponse(lastMessage)
    }
  }, [messages])

  // Calculate bottom position to avoid overlapping with footer
  const bottomPosition = "1rem"

  return (
    <>
      {/* Minimized button */}
      {!isOpen && (
        <Button
          onClick={toggleOpen}
          className={cn(
            "fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all duration-200",
            pulseAnimation && "animate-pulse",
          )}
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      )}

      {/* Expanded assistant */}
      {isOpen && (
        <Card
          className={cn(
            "fixed right-4 z-50 w-80 shadow-lg transition-all duration-200",
            isMinimized ? "h-14" : "h-96",
            `bottom-[${bottomPosition}]`,
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b p-3 bg-slate-800 text-white cursor-pointer"
            onClick={toggleMinimize}
          >
            <div className="flex items-center gap-2">
              <SlothLogo className="h-6 w-6" />
              <span className="font-medium">Sloth AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMinimize()
                }}
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content (only visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 bg-slate-50 h-[calc(100%-7.5rem)]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg p-3 max-w-[80%]",
                          message.role === "user" ? "bg-slate-800 text-white" : "bg-white border border-slate-200",
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice feedback */}
              {isListening && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="bg-white rounded-lg p-6 max-w-md text-center">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                      <div className="relative flex items-center justify-center w-full h-full bg-blue-500 rounded-full">
                        <Mic className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Listening...</h3>
                    <p className="text-slate-500 mb-4">{transcript || "Speak now. I'm listening for your command."}</p>
                    <Button onClick={stopListening} variant="outline" className="mx-auto">
                      <MicOff className="h-4 w-4 mr-2" /> Stop Listening
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-3 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={isListening ? stopListening : startListening}
                    className={cn(isListening && "bg-blue-100 text-blue-600")}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button type="submit" size="icon" disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
                    Add task
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
                    Schedule meeting
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
                    Set reminder
                  </Badge>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  )
}
