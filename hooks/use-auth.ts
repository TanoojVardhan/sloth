"use client"

import useSWR from "swr"

type AuthState = {
  isLoggedIn: boolean
  email?: string
  name?: string
  phone?: string
  provider?: "email" | "google" | "mobile"
}

const AUTH_KEY = "sp:auth"

function loadAuth(): AuthState {
  if (typeof window === "undefined") return { isLoggedIn: false }
  try {
    const isLoggedIn = localStorage.getItem("sp:isLoggedIn") === "true"
    const email = localStorage.getItem("sp:userEmail") || undefined
    const name = localStorage.getItem("sp:name") || undefined
    const phone = localStorage.getItem("sp:phone") || undefined
    const provider = (localStorage.getItem("sp:provider") as AuthState["provider"]) || undefined
    return { isLoggedIn, email, name, phone, provider }
  } catch {
    return { isLoggedIn: false }
  }
}

function saveAuth(state: Partial<AuthState>) {
  if (typeof window === "undefined") return
  if (state.isLoggedIn !== undefined) localStorage.setItem("sp:isLoggedIn", state.isLoggedIn ? "true" : "false")
  if (state.email !== undefined) localStorage.setItem("sp:userEmail", state.email || "")
  if (state.name !== undefined) localStorage.setItem("sp:name", state.name || "")
  if (state.phone !== undefined) localStorage.setItem("sp:phone", state.phone || "")
  if (state.provider !== undefined) localStorage.setItem("sp:provider", state.provider || "")
}

export function useAuth() {
  const { data, mutate } = useSWR<AuthState>(AUTH_KEY, () => loadAuth(), { fallbackData: loadAuth() })
  const state = data!

  function logout() {
    saveAuth({ isLoggedIn: false, email: "", name: "", phone: "", provider: undefined })
    mutate(loadAuth(), false)
  }

  return {
    ...state,
    refresh: () => mutate(loadAuth(), false),
    setAuth: (partial: Partial<AuthState>) => {
      saveAuth(partial)
      mutate(loadAuth(), false)
    },
    logout,
  }
}
