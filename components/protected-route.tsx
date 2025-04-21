"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Auth check taking too long, forcing timeout")
        setLoadingTimeout(true)
      }
    }, 5000) // 5 second timeout for authentication check
    
    return () => clearTimeout(timer)
  }, [isLoading])

  useEffect(() => {
    // Force redirect to login if loading times out
    if (loadingTimeout && !user) {
      console.log("Auth loading timed out without user, redirecting to login")
      router.push('/login')
    }
  }, [loadingTimeout, user, router])

  useEffect(() => {
    // Only proceed when we've confirmed auth state is loaded (not in loading state)
    if (!isLoading) {
      console.log("Auth state loaded, user:", user ? `Authenticated as ${user.uid}` : "Not authenticated")
      
      if (!user) {
        console.log("No authenticated user found, redirecting to login page")
        // Add a small delay to ensure state is properly checked
        const redirectTimer = setTimeout(() => {
          router.push('/login')
        }, 100)
        return () => clearTimeout(redirectTimer)
      } else {
        // We have confirmed authentication
        setAuthChecked(true)
      }
    }
  }, [user, isLoading, router])

  // If loading timed out, show a more informative message
  if (loadingTimeout) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-foreground/70">Authentication taking longer than expected...</p>
          <button 
            className="mt-4 text-sm text-primary underline" 
            onClick={() => router.push('/login')}
          >
            Return to login
          </button>
        </div>
      </div>
    )
  }

  // Normal loading state
  if (isLoading || (!authChecked && !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-foreground/70">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Only render children when we've confirmed authentication
  if (user && authChecked) {
    return <>{children}</>
  }
  
  // Show nothing while redirecting
  return null
}
