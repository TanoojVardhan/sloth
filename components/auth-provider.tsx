"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { onAuthStateChange, signInWithEmail, signInWithGoogle, signOutUser, getCurrentUser } from "@/lib/firebase-auth"
import { getUser } from "@/lib/firebase-db"
import type { User } from "@/types/entities"

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; code: string; message: string }>
  loginWithGoogle: () => Promise<{ ok: true } | { ok: false; code: string; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000) // 3 second timeout

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      clearTimeout(timeout) // Clear timeout if auth state resolves
      
      if (firebaseUser) {
        // User is signed in, get user data from Firestore
        try {
          const userData = await getUser(firebaseUser.uid)
          setUser(userData)
        } catch {
          setUser(null)
        }
      } else {
        // User is signed out
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        try {
          const u = await signInWithEmail(email, password)
          setUser(u)
          return { ok: true as const }
        } catch (error) {
          const err = error as { code?: string; message?: string }
          const code = err?.code || "AUTH_ERROR"
          const message = err?.message || "Login failed"
          return { ok: false as const, code, message }
        }
      },
      async loginWithGoogle() {
        try {
          const u = await signInWithGoogle()
          setUser(u)
          return { ok: true as const }
        } catch (error) {
          const err = error as { code?: string; message?: string }
          const code = err?.code || "AUTH_ERROR"
          const message = err?.message || "Google login failed"
          return { ok: false as const, code, message }
        }
      },
      async logout() {
        try {
          await signOutUser()
          setUser(null)
        } catch {
          // Silent error handling
        }
      },
      async refreshUser() {
        const firebaseUser = getCurrentUser()
        if (!firebaseUser) return
        try {
          const userData = await getUser(firebaseUser.uid)
          setUser(userData)
        } catch {
          // Keep whatever we already had rather than wiping it on a transient error
        }
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
