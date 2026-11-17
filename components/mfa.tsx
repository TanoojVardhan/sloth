"use client"

import { useEffect, useState } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { mfa } from "@/lib/mfa-client"

function CodeForm({ label, onSubmit }: { label: string; onSubmit: (code: string) => Promise<string | null> }) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(await onSubmit(code))
        setCode("")
        setBusy(false)
      }}
    >
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        autoFocus
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
      </Button>
    </form>
  )
}

/** Replaces the app after login until the authenticator code is entered. */
export function MfaGate() {
  const { passMfa, logout } = useAuth()
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full space-y-4 p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Two-step verification</h1>
        </div>
        <p className="text-sm text-muted-foreground">Open your authenticator app and enter the 6-digit code for Sloth Planner.</p>
        <CodeForm
          label="Verify"
          onSubmit={async (code) => {
            const r = await mfa("verify", code)
            if (r.ok) passMfa()
            return r.ok ? null : r.error || "Couldn't verify. Try again."
          }}
        />
        <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => void logout()}>
          Sign out
        </button>
      </Card>
    </div>
  )
}

/** Settings card: turn the authenticator step on or off. */
export function MfaSettingsCard() {
  const { user, passMfa } = useAuth()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null)
  const [disabling, setDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void mfa("status").then((r) => setEnabled(!!r.enabled))
  }, [])

  if (!user || enabled === null) return null

  async function start() {
    setError(null)
    const r = await mfa("setup")
    if (!r.ok || !r.secret) return setError(r.error || "Couldn't start setup.")
    const uri = `otpauth://totp/Sloth%20Planner:${encodeURIComponent(user!.email)}?secret=${r.secret}&issuer=Sloth%20Planner`
    const QRCode = (await import("qrcode")).default
    setSetup({ secret: r.secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 192 }) })
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Two-step verification</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Ask for a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password) each time you open the planner in a new browser session.
      </p>

      {setup ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="Authenticator QR code" width={192} height={192} className="rounded-lg border bg-white" />
          <p className="text-xs text-muted-foreground">
            Scan this, or type the key by hand: <span className="select-all break-all font-mono">{setup.secret}</span>
          </p>
          <CodeForm
            label="Turn on"
            onSubmit={async (code) => {
              const r = await mfa("enable", code)
              if (!r.ok) return r.error || "Couldn't turn it on."
              passMfa()
              setEnabled(true)
              setSetup(null)
              return null
            }}
          />
        </div>
      ) : enabled ? (
        disabling ? (
          <CodeForm
            label="Turn off"
            onSubmit={async (code) => {
              const r = await mfa("disable", code)
              if (!r.ok) return r.error || "Couldn't turn it off."
              setEnabled(false)
              setDisabling(false)
              return null
            }}
          />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setDisabling(true)}>
            Turn off (needs a code)
          </Button>
        )
      ) : (
        <Button variant="outline" size="sm" onClick={start}>
          Set up
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  )
}
