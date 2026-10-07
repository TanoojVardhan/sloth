"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  onCommand: (transcript: string) => void
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: (event: SpeechRecognitionEvent) => void
  onend: () => void
  start: () => void
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
    }
  }
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition
    SpeechRecognition?: new () => SpeechRecognition
  }
}

export function MicInput({ onCommand }: Props) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = "en-US"
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript as string
      onCommand(text)
      setListening(false)
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
  }, [onCommand])

  function start() {
    if (!recRef.current) {
      alert("Speech Recognition not supported in this browser.")
      return
    }
    setListening(true)
    recRef.current.start()
  }

  return (
    <button
      type="button"
      onClick={start}
      className={`rounded-md px-3 py-2 text-sm ${listening ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
      aria-pressed={listening}
      aria-label="Start voice input"
      title="Start voice input"
    >
      🎤
    </button>
  )
}
