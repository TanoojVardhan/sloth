"use client"

import { useRef } from "react"
import { useLiveTranscribe } from "@/hooks/use-live-transcribe"

type Props = {
  onCommand: (transcript: string) => void
}

/** Tap, speak, tap again: Gemini Live transcribes as you talk, and the full sentence goes to onCommand when you stop. */
export function MicInput({ onCommand }: Props) {
  const { isRecording, error, start, stop } = useLiveTranscribe()
  const heard = useRef("")
  const label = isRecording ? "Stop voice input" : "Start voice input"

  return (
    <button
      type="button"
      onClick={() => {
        if (isRecording) {
          stop()
          if (heard.current.trim()) onCommand(heard.current.trim())
        } else {
          heard.current = ""
          void start((chunk) => (heard.current += chunk))
        }
      }}
      className={`rounded-md px-3 py-2 text-sm ${isRecording ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
      aria-pressed={isRecording}
      aria-label={label}
      title={error ?? label}
    >
      🎤
    </button>
  )
}
