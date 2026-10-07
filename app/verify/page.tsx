"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  const router = useRouter()
  const [code, setCode] = useState("")

  useEffect(() => {
    // no-op: could preload masked destination here
  }, [])

  function completeAuth() {
    // demo: accept 123456 or any 6 digits
    if (code.length !== 6) return

    const pendingSignup = localStorage.getItem("sp:pendingSignup")
    const pendingLogin = localStorage.getItem("sp:pendingLogin")

    if (pendingSignup) {
      const { name, email, phone } = JSON.parse(pendingSignup)
      localStorage.removeItem("sp:pendingSignup")
      localStorage.setItem("sp:isLoggedIn", "true")
      localStorage.setItem("sp:name", name || "")
      localStorage.setItem("sp:userEmail", email || "")
      localStorage.setItem("sp:phone", phone || "")
      localStorage.setItem("sp:provider", "email")
    } else if (pendingLogin) {
      const { email, provider } = JSON.parse(pendingLogin)
      localStorage.removeItem("sp:pendingLogin")
      localStorage.setItem("sp:isLoggedIn", "true")
      localStorage.setItem("sp:userEmail", email || "")
      localStorage.setItem("sp:provider", provider || "email")
    }
    router.push("/welcome")
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <div className="rounded-xl border bg-card p-6">
        <h1 className="mb-1 text-2xl font-semibold">Verify it’s you</h1>
        <p className="mb-6 text-muted-foreground">
          Enter the 6‑digit code sent to your email or phone (demo: any 6 numbers).
        </p>
        <div className="grid gap-4">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button onClick={completeAuth} disabled={code.length !== 6}>
            Verify and continue
          </Button>
        </div>
      </div>
    </div>
  )
}
