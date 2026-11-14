"use client"

import { useEffect, useState } from "react"

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

// Registers the service worker once and remembers the browser's install prompt.
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return
    navigator.serviceWorker.register("/sw.js").catch(() => {})
    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferred = e as InstallEvent
      notify()
    }
    const onInstalled = () => {
      deferred = null
      notify()
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])
  return null
}

export function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: window-controls-overlay)").matches
}

export function useInstall() {
  const [, force] = useState(0)
  const [installed, setInstalled] = useState(false)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    setInstalled(isStandalone())
    return () => {
      listeners.delete(l)
    }
  }, [])
  return {
    canInstall: !!deferred && !installed,
    installed,
    install: async () => {
      if (!deferred) return false
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      deferred = null
      notify()
      return outcome === "accepted"
    },
  }
}
