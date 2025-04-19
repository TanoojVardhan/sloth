"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  initials: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const { user: firebaseUser, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }

    if (firebaseUser) {
      // Generate initials from name
      const name = firebaseUser.displayName || "User"
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)

      setUser({
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || "",
        avatar: firebaseUser.photoURL || undefined,
        initials,
      })
    } else {
      setUser(null)
    }

    setIsLoading(false)
  }, [firebaseUser, authLoading])

  return <UserContext.Provider value={{ user, isLoading, setUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
