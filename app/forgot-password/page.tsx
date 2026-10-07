"use client"

import type React from "react"
import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Loader2 } from "lucide-react"

function friendlyResetError(code: string) {
  if (code === "auth/user-not-found") return "No account found with that email."
  if (code === "auth/invalid-email") return "That doesn't look like a valid email address."
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait a bit and try again."
  return "Couldn't send the reset email. Please try again."
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch (err) {
      const code = (err as { code?: string }).code || ""
      setError(friendlyResetError(code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Image src="/sloth-planner-logo.png" alt="Sloth Planner" width={64} height={64} className="rounded-lg" />
            <h1 className="font-serif text-2xl font-semibold">Reset your password</h1>
            <p className="text-sm text-muted-foreground">We&apos;ll email you a link to choose a new one</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Forgot password</CardTitle>
              <CardDescription>Enter the email on your account</CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-chart-1" />
                  <AlertDescription>
                    If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox
                    (and spam folder).
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </form>
              )}

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Back to login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
