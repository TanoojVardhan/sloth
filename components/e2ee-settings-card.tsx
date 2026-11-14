"use client"

import { useState } from "react"
import { Copy, Lock, ShieldCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassphrase, renewRecoveryKey, unlockKey } from "@/lib/e2ee-core"
import { dropActiveKey, forgetCachedKey, markReady, rememberOnDevice, requestSetup, setRememberOnDevice } from "@/lib/e2ee"
import { updateUser } from "@/lib/firebase-db"

const MIN_LENGTH = 10

function readShare(): boolean {
  try {
    return localStorage.getItem("sloth.ai.share") === "1"
  } catch {
    return false
  }
}

export function E2eeSettingsCard() {
  const { user, refreshUser } = useAuth()
  const [open, setOpen] = useState<"pass" | "recovery" | "off" | null>(null)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [newRecovery, setNewRecovery] = useState<string | null>(null)
  const [remember, setRemember] = useState(rememberOnDevice())
  const [share, setShare] = useState(readShare())

  if (!user) return null

  const shareToggle = (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        className="mt-1"
        checked={share}
        onChange={(e) => {
          setShare(e.target.checked)
          try {
            localStorage.setItem("sloth.ai.share", e.target.checked ? "1" : "0")
          } catch {
            /* ignore */
          }
        }}
      />
      <span>
        Let the AI assistant see my tasks and events
        <span className="block text-xs text-muted-foreground">
          Off by default. When on, your task and event titles are sent to Google Gemini with each chat message so it can answer questions about them. What you type to the assistant is always sent.
        </span>
      </span>
    </label>
  )

  // No passphrase on this account: offer one, nothing else to manage.
  if (!user.e2ee) {
    return (
      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your data is encrypted on its way to our servers and while it is stored there. For more privacy you can add a passphrase: your tasks, notes,
          goals and timetable are then locked on your device first, so nobody else can read them, including us. The trade-off is that a lost
          passphrase can&apos;t be reset.
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => requestSetup(true)}>
          <Lock className="h-3.5 w-3.5" /> Add a passphrase
        </Button>
        <div className="border-t pt-4">{shareToggle}</div>
      </Card>
    )
  }
  const meta = user.e2ee

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !meta) return
    setBusy(true)
    setMessage(null)
    try {
      const proof = { kind: "passphrase", value: current } as const
      await unlockKey(meta, proof) // proves the current passphrase
      if (open === "off") {
        // Flag first, then hand over to the gate, which rewrites the data and removes the key last.
        await updateUser(user.userId, { e2eeDisabling: true })
        markReady(false)
        await refreshUser()
        return
      }
      if (open === "pass") {
        if (next.length < MIN_LENGTH) throw new RangeError(`Use at least ${MIN_LENGTH} characters.`)
        await updateUser(user.userId, { e2ee: await changePassphrase(meta, proof, next) })
        setMessage({ ok: true, text: "Passphrase changed. Your other devices will ask for the new one." })
      } else {
        const r = await renewRecoveryKey(meta, proof)
        await updateUser(user.userId, { e2ee: r.meta })
        setNewRecovery(r.recoveryKey)
        setMessage({ ok: true, text: "New recovery key made. The old one no longer works. Save this one now." })
      }
      await refreshUser()
      setOpen(null)
      setCurrent("")
      setNext("")
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof RangeError ? err.message : "That passphrase isn't right, or the change couldn't be saved.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Encryption</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Your tasks, notes, goals, projects, events and timetable are encrypted on your device before they are saved. Nobody else can read them, including
        us. Only your name, email and the times things were saved stay readable.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => { setOpen("pass"); setMessage(null) }}>
          Change passphrase
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setOpen("recovery"); setMessage(null) }}>
          Make a new recovery key
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={async () => {
            await forgetCachedKey(user.userId)
            dropActiveKey()
          }}
        >
          <Lock className="h-3.5 w-3.5" /> Lock now
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setOpen("off"); setMessage(null) }}>
          Remove passphrase
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border p-3">
          {open === "off" && (
            <p className="text-sm text-muted-foreground">
              Your data will be stored without the passphrase lock. It stays encrypted on our servers, but it is no longer unreadable to us, and you
              won&apos;t be asked for a passphrase on new devices. You can add one again later.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="enc-current">Current passphrase</Label>
            <Input id="enc-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          {open === "pass" && (
            <div className="space-y-1.5">
              <Label htmlFor="enc-next">New passphrase</Label>
              <Input id="enc-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !current || (open === "pass" && !next)}>
              {busy ? "Working..." : open === "pass" ? "Change passphrase" : open === "off" ? "Remove passphrase" : "Make new key"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {newRecovery && (
        <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
          <p className="select-all break-all text-center font-mono tracking-wider">{newRecovery}</p>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => void navigator.clipboard.writeText(newRecovery).catch(() => undefined)}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      )}
      {message && <p className={message.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>{message.text}</p>}

      <div className="space-y-3 border-t pt-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={remember}
            onChange={(e) => {
              setRemember(e.target.checked)
              setRememberOnDevice(e.target.checked)
              if (!e.target.checked) void forgetCachedKey(user.userId)
            }}
          />
          <span>
            Remember on this device
            <span className="block text-xs text-muted-foreground">Off means you type your passphrase every time you open the app.</span>
          </span>
        </label>
        {shareToggle}
      </div>
    </Card>
  )
}
