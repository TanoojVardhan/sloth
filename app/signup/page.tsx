'use client'

import { useEffect } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { SignupForm } from "@/components/signup-form"
import { SlothLogo } from "@/components/sloth-logo"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !isLoading) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-foreground/70">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If already logged in, we'll redirect in the useEffect
  if (user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-foreground/70">Already logged in, redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <SlothLogo className="h-24 w-24" size="lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Create an account</h1>
            <p className="text-foreground/70">Sign up to get started with Sloth Planner</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary/10 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
          <SignupForm />
          <div className="mt-6 text-center text-sm">
            <p className="text-foreground/70">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary/90 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        <div className="text-center text-xs text-foreground/60">
          <p>
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
