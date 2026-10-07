"use client"

import { useState } from "react"

export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your assistant. No AI yet. Try: “task: buy milk priority high tags: home”. I work locally only.",
    },
  ])
  const [input, setInput] = useState("")

  function send() {
    if (!input.trim()) return
    const text = input.trim()
    setMessages((m) => [...m, { role: "user", content: text }])
    let reply = "Noted. You can add items using the form on any page."
    if (/help|what can you do/i.test(text)) reply = "I can explain features and parse very simple commands locally."
    setMessages((m) => [...m, { role: "assistant", content: reply }])
    setInput("")
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      {/* Floating round button */}
      <button
        aria-label="Open assistant"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
        title="Assistant"
      >
        ?
      </button>

      {/* Panel */}
      {open && (
        <div className="pointer-events-auto w-[320px] overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="font-medium">Assistant</div>
            <button className="text-sm underline" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="flex max-h-96 flex-col">
            <div className="space-y-3 overflow-auto p-3 text-sm">
              {messages.map((m, i) => (
                <div key={i} className={`rounded-md p-2 ${m.role === "assistant" ? "bg-secondary" : "border"}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t p-2">
              <input
                className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button className="rounded-md bg-primary px-3 py-1 text-primary-foreground text-sm" onClick={send}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
