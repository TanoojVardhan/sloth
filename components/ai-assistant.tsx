"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Send, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAIAssistant, type Message } from "@/hooks/use-ai-assistant"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SlothLogo } from "@/components/sloth-logo"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function AIAssistant() {
  const { isOpen, closeAssistant, isListening, startListening, stopListening, transcript, messages, addMessage } =
    useAIAssistant()

  const [input, setInput] = useState("")
  const [expanded, setExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    addMessage(newMessage)
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

    // Check for action responses
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.action) {
      handleActionResponse(lastMessage)
    }
  }, [messages])

  if (!isOpen) return null

  return (
    <Card
      className={cn(
        "fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden transition-all duration-200",
        expanded ? "w-[80vw] h-[80vh] max-w-4xl" : "w-80 h-96",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3 bg-slate-800 text-white">
        <div className="flex items-center gap-2">
          <SlothLogo className="h-6 w-6" />
          <span className="font-medium">Sloth AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={closeAssistant}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice feedback */}
      {isListening && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
            Schedule meeting
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
            Add task
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
            Set reminder
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
            Create goal
          </Badge>
        </div>
      </div>
    </Card>
  )
}
