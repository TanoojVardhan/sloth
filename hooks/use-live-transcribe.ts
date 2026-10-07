"use client"

import { useEffect, useRef, useState } from "react"

const GEMINI_LIVE_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained"

/**
 * Streams microphone audio straight to Gemini's Live API. The browser never
 * sees the real GEMINI_API_KEY: it first asks our own /api/ai/live-token
 * route (app/api/ai/live-token/route.ts) for a short-lived, single-use
 * ephemeral token, then opens the Live API WebSocket itself using that
 * token. This works on Vercel (minting a token is a normal quick serverless
 * call) unlike a relay server, which needs a connection Vercel can't hold
 * open.
 *
 * Usage: const { isRecording, error, start, stop } = useLiveTranscribe()
 * start(onChunk) begins capturing; onChunk(text) fires for each transcribed
 * chunk as it arrives, so the caller can append it to whatever input it's
 * building up.
 */
export function useLiveTranscribe() {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const silenceRef = useRef<GainNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onChunkRef = useRef<(text: string) => void>(() => {})
  const readyRef = useRef(false)

  function cleanup() {
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    silenceRef.current?.disconnect()
    audioCtxRef.current?.close().catch(() => {})
    streamRef.current?.getTracks().forEach((t) => t.stop())

    processorRef.current = null
    sourceRef.current = null
    silenceRef.current = null
    audioCtxRef.current = null
    streamRef.current = null
    readyRef.current = false

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }))
        }
        wsRef.current.close()
      } catch {
        // ignore
      }
      wsRef.current = null
    }

    setIsRecording(false)
  }

  async function start(onChunk: (text: string) => void) {
    onChunkRef.current = onChunk
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't access the microphone.")
      return
    }

    try {
      // 1. Get a short-lived token from our own server — the real API key
      // never leaves it.
      const tokenRes = await fetch("/api/ai/live-token", { method: "POST" })
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || !tokenData.token) {
        setError(tokenData.error || "Couldn't start live transcription.")
        return
      }
      const token: string = tokenData.token
      const model: string = tokenData.model

      // 2. Grab the mic.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 3. Connect straight to Gemini using the ephemeral token.
      const ws = new WebSocket(`${GEMINI_LIVE_URL}?access_token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              model,
              generationConfig: { responseModalities: ["TEXT"] },
              inputAudioTranscription: { languageCodes: [] },
            },
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.setupComplete) {
            readyRef.current = true
            return
          }
          const text = msg?.serverContent?.inputTranscription?.text
          if (text) onChunkRef.current(text)
        } catch {
          // ignore malformed frame
        }
      }
      ws.onerror = () => {
        setError("Couldn't connect to live transcription.")
        cleanup()
      }
      ws.onclose = () => {
        setIsRecording(false)
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 5000)
        const prevOnOpen = ws.onopen as (ev: Event) => void
        ws.onopen = (ev) => {
          clearTimeout(timeout)
          prevOnOpen.call(ws, ev)
          resolve()
        }
      })

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx: AudioContext = new AudioContextCtor()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      // ScriptProcessorNode is deprecated but remains the simplest way to get
      // raw PCM frames across all current browsers without shipping a
      // separate AudioWorklet module.
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        const input = e.inputBuffer.getChannelData(0)
        const downsampled = downsampleTo16k(input, audioCtx.sampleRate)
        const pcm16 = floatTo16BitPCM(downsampled)
        const base64 = arrayBufferToBase64(pcm16.buffer)
        wsRef.current.send(
          JSON.stringify({ realtimeInput: { audio: { data: base64, mimeType: "audio/pcm;rate=16000" } } }),
        )
      }

      // Route through a silent gain node — ScriptProcessorNode only fires
      // while connected into the graph, but we don't want the mic audio
      // actually played back out loud.
      const silence = audioCtx.createGain()
      silence.gain.value = 0
      silenceRef.current = silence

      source.connect(processor)
      processor.connect(silence)
      silence.connect(audioCtx.destination)

      setIsRecording(true)
    } catch (err) {
      console.error("Live transcribe start error:", err)
      setError("Couldn't access the microphone.")
      cleanup()
    }
  }

  function stop() {
    cleanup()
  }

  useEffect(() => cleanup, [])

  return { isRecording, error, start, stop }
}

function downsampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === 16000) return input
  const ratio = inputRate / 16000
  const newLength = Math.round(input.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    result[i] = input[Math.floor(i * ratio)]
  }
  return result
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
