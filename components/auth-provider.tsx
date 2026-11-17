"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { onAuthStateChange, signInWithEmail, signInWithGoogle, signInWithApple, signInWithGithub, signOutUser, getCurrentUser } from "@/lib/firebase-auth"
import { getUser } from "@/lib/firebase-db"
import { mfa, mfaPassedFor, rememberMfaPass } from "@/lib/mfa-client"
import { dropActiveKey, forgetCachedKey, rememberOnDevice, setPlainMode, useDataReady, useSetupRequested } from "@/lib/e2ee"
import type { User } from "@/types/entities"

type AuthContextValue = {
  user: User | null
  loading: boolean
  /** Signed in AND data can be read: no passphrase on the account, or its key is loaded. */
  dataReady: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; code: string; message: string }>
  loginWithGoogle: () => Promise<{ ok: true } | { ok: false; code: string; message: string }>
  loginWithApple: () => Promise<{ ok: true } | { ok: false; code: string; message: string }>
  loginWithGithub: () => Promise<{ ok: true } | { ok: false; code: string; message: string }>
  /** "pending" = the account has two-step verification on and the code hasn't been entered yet. */
  mfa: "unknown" | "pending" | "ok"
  passMfa: () => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaState, setMfaState] = useState<"unknown" | "pending" | "ok">("unknown")
  const keyReady = useDataReady()
  const settingUp = useSetupRequested()

  // The storage mode is set before the user state, so nothing can write in the wrong form.
  const setUser = (u: User | null) => {
    setPlainMode(!!u && !u.e2ee)
    setUserState(u)
  }

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
          // ponytail: if the status call fails we let the user in. This gate is client-side only anyway
          // (see /api/mfa); a real server-enforced second factor needs Identity Platform.
          const enabled = mfaPassedFor(firebaseUser.uid) ? false : await mfa("status").then((r) => !!r.enabled, () => false)
          setMfaState(enabled ? "pending" : "ok")
          setUser(userData)
        } catch {
          setUser(null)
        }
      } else {
        // User is signed out: the key must not outlive the session in memory.
        setMfaState("unknown")
        dropActiveKey()
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
      dataReady: !!user && mfaState === "ok" && !settingUp && (user.e2ee ? keyReady : true),
      mfa: mfaState,
      passMfa() {
        const uid = getCurrentUser()?.uid
        if (uid) rememberMfaPass(uid)
        setMfaState("ok")
      },
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
      async loginWithApple() {
        try {
          setUser(await signInWithApple())
          return { ok: true as const }
        } catch (error) {
          const err = error as { code?: string; message?: string }
          return { ok: false as const, code: err?.code || "AUTH_ERROR", message: err?.message || "Apple login failed" }
        }
      },
      async loginWithGithub() {
        try {
          setUser(await signInWithGithub())
          return { ok: true as const }
        } catch (error) {
          const err = error as { code?: string; message?: string }
          return { ok: false as const, code: err?.code || "AUTH_ERROR", message: err?.message || "GitHub login failed" }
        }
      },
      async logout() {
        try {
          const uid = getCurrentUser()?.uid
          if (uid && !rememberOnDevice()) await forgetCachedKey(uid)
          dropActiveKey()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setUser only wraps a stable state setter
    [user, loading, keyReady, settingUp, mfaState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
