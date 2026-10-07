"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function MobileLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [sent, setSent] = useState(false)

  function sendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!phone) return
    // stage and simulate send
    localStorage.setItem("sp:pendingLogin", JSON.stringify({ email: "", provider: "mobile", phone }))
    setSent(true)
  }

  function verify() {
    if (code.length !== 6) return
    const pending = JSON.parse(localStorage.getItem("sp:pendingLogin") || "{}")
    localStorage.removeItem("sp:pendingLogin")
    localStorage.setItem("sp:isLoggedIn", "true")
    localStorage.setItem("sp:phone", pending.phone || phone)
    localStorage.setItem("sp:provider", "mobile")
    router.push("/welcome")
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <div className="rounded-xl border bg-card p-6">
        <h1 className="mb-1 text-2xl font-semibold">Mobile login</h1>
        <p className="mb-6 text-muted-foreground">Sign in with a 6‑digit SMS code (demo).</p>

        {!sent ? (
          <form onSubmit={sendCode} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Mobile number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <Button type="submit">Send code</Button>
          </form>
        ) : (
          <div className="grid gap-4">
            <Label>Enter code</Label>
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
            <Button onClick={verify} disabled={code.length !== 6}>
              Verify and continue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
