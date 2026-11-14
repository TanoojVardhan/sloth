"use client"

import { useEffect, useState } from "react"
import { Copy, Download, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassphrase, createKeys, unlockKey } from "@/lib/e2ee-core"
import {
  cacheKeyOnDevice,
  dropActiveKey,
  forgetCachedKey,
  isUnlocked,
  markReady,
  requestSetup,
  useSetupRequested,
  rememberOnDevice,
  restoreCachedKey,
  setActiveKey,
  setRememberOnDevice,
  useUnlocked,
} from "@/lib/e2ee"
import { migrateToEncrypted, migrateToPlain, updateUser } from "@/lib/firebase-db"

const MIN_LENGTH = 10

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full space-y-4 p-6">{children}</Card>
    </div>
  )
}

/**
 * The passphrase is optional, so most accounts never see this. It replaces the app when:
 *  - the user chose "Add a passphrase" in Settings: choose one and save the recovery key,
 *  - the account has a passphrase and this device has no key yet: unlock,
 *  - the passphrase is being added or removed: wait while the data is rewritten.
 */
export function E2eeGate() {
  const { user, refreshUser, logout } = useAuth()
  const unlocked = useUnlocked()
  const settingUp = useSetupRequested()
  const [checked, setChecked] = useState(false)
  const [sealing, setSealing] = useState(false)
  const [recoveryToShow, setRecoveryToShow] = useState<string | null>(null)

  // Returning visitors on a remembered device unlock silently.
  useEffect(() => {
    if (!user) return
    if (!user.e2ee || unlocked) {
      setChecked(true)
      return
    }
    let live = true
    void restoreCachedKey(user.userId).finally(() => live && setChecked(true))
    return () => {
      live = false
    }
  }, [user, unlocked])

  // Key is in hand: seal anything saved without it (or, when the passphrase is being
  // removed, open everything and drop the key), then let the app load.
  useEffect(() => {
    if (!user?.e2ee || !unlocked || recoveryToShow || sealing) return
    const uid = user.userId
    setSealing(true)
    const work = user.e2eeDisabling
      ? migrateToPlain(uid).then(async () => {
          await forgetCachedKey(uid)
          dropActiveKey()
        })
      : migrateToEncrypted(uid).then(() => undefined)
    work
      // ponytail: a failed rewrite is silent. The app still opens (both document forms are readable) and
      // the rewrite runs again on the next unlock; surface an error here if that ever proves confusing.
      .catch(() => undefined)
      .then(async () => {
        await refreshUser()
        if (isUnlocked()) markReady(true)
        requestSetup(false)
      })
      .finally(() => setSealing(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.e2ee, user?.e2eeDisabling, unlocked, recoveryToShow])

  if (!user) return null
  if (sealing) return <Spinner label={user.e2eeDisabling ? "Removing the passphrase from your data..." : "Securing your data..."} />
  if (!checked) return <Spinner label="Checking your encryption key..." />
  if (recoveryToShow) return <RecoveryScreen recoveryKey={recoveryToShow} onDone={() => setRecoveryToShow(null)} />
  if (!user.e2ee) {
    if (!settingUp) return null
    return (
      <SetupForm
        userId={user.userId}
        onCancel={() => requestSetup(false)}
        onCreated={async (recovery) => {
          await refreshUser()
          setRecoveryToShow(recovery)
        }}
      />
    )
  }
  if (!unlocked || !isUnlocked()) {
    return <UnlockForm userId={user.userId} meta={user.e2ee} onSignOut={logout} onUnlocked={() => undefined} onChanged={refreshUser} />
  }
  return <Spinner label="Securing your data..." />
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  )
}

function SetupForm({
  userId,
  onCreated,
  onCancel,
}: {
  userId: string
  onCreated: (recoveryKey: string) => Promise<void>
  onCancel: () => void
}) {
  const [pass, setPass] = useState("")
  const [again, setAgain] = useState("")
  const [remember, setRemember] = useState(rememberOnDevice())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pass.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters. A few random words works well.`)
    if (pass !== again) return setError("The two passphrases don't match.")
    setBusy(true)
    setError(null)
    try {
      setRememberOnDevice(remember)
      const { meta, key, recoveryKey } = await createKeys(pass)
      await updateUser(userId, { e2ee: meta })
      setActiveKey(userId, key)
      await cacheKeyOnDevice(userId, key)
      await onCreated(recoveryKey)
    } catch {
      setError("Couldn't set up encryption. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">Lock your data with a passphrase</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        This is optional. With a passphrase, your tasks, notes, goals and timetable are encrypted on this device before they are saved, so nobody
        can read them, including the people who run Sloth Planner. Because of that, <strong>we can&apos;t reset your passphrase</strong>. You get a
        recovery key on the next screen as a backup, and you&apos;ll enter the passphrase once on each new device.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="e2ee-pass">Encryption passphrase</Label>
          <Input id="e2ee-pass" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e2ee-again">Type it again</Label>
          <Input id="e2ee-again" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember on this device
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Encrypting..." : "Add passphrase"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={onCancel}>
          Not now
        </Button>
      </form>
    </Shell>
  )
}

function RecoveryScreen({ recoveryKey, onDone }: { recoveryKey: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function download() {
    const blob = new Blob(
      [`Sloth Planner recovery key\n\n${recoveryKey}\n\nKeep this somewhere safe. Anyone with it and your account can read your data. If you forget your passphrase, this key is the only way back in.\n`],
      { type: "text/plain" },
    )
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "sloth-planner-recovery-key.txt"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <KeyRound className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">Save your recovery key</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        If you forget your passphrase, this key is the only way to get your data back. Store it in a password manager or print it. It is shown once.
      </p>
      <p className="select-all break-all rounded-lg border bg-muted/50 p-3 text-center font-mono text-base tracking-wider">{recoveryKey}</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(recoveryKey)
              setCopied(true)
            } catch {
              /* user can still select the text */
            }
          }}
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={download}>
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />I saved my recovery key somewhere safe
      </label>
      <Button className="w-full" disabled={!saved} onClick={onDone}>
        Continue
      </Button>
    </Shell>
  )
}

function UnlockForm({
  userId,
  meta,
  onSignOut,
  onChanged,
}: {
  userId: string
  meta: NonNullable<ReturnType<typeof useAuth>["user"]>["e2ee"]
  onSignOut: () => Promise<void>
  onUnlocked: () => void
  onChanged: () => Promise<void>
}) {
  const [mode, setMode] = useState<"passphrase" | "recovery">("passphrase")
  const [secret, setSecret] = useState("")
  const [fresh, setFresh] = useState("")
  const [remember, setRemember] = useState(rememberOnDevice())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!meta) return
    setBusy(true)
    setError(null)
    try {
      setRememberOnDevice(remember)
      if (!remember) await forgetCachedKey(userId)
      if (mode === "passphrase") {
        const key = await unlockKey(meta, { kind: "passphrase", value: secret })
        setActiveKey(userId, key)
        await cacheKeyOnDevice(userId, key)
      } else {
        if (fresh.length < MIN_LENGTH) throw new RangeError(`Choose a new passphrase of at least ${MIN_LENGTH} characters.`)
        const proof = { kind: "recovery", value: secret } as const
        const key = await unlockKey(meta, proof)
        const next = await changePassphrase(meta, proof, fresh)
        setActiveKey(userId, key)
        await updateUser(userId, { e2ee: next })
        await cacheKeyOnDevice(userId, key)
        await onChanged()
      }
    } catch (err) {
      setError(
        err instanceof RangeError
          ? err.message
          : mode === "passphrase"
            ? "That passphrase didn't unlock your data. Check it and try again."
            : "That recovery key didn't work. Check every character.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <KeyRound className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">{mode === "passphrase" ? "Unlock your data" : "Use your recovery key"}</h1>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="unlock-secret">{mode === "passphrase" ? "Encryption passphrase" : "Recovery key"}</Label>
          <Input
            id="unlock-secret"
            type={mode === "passphrase" ? "password" : "text"}
            autoComplete={mode === "passphrase" ? "current-password" : "off"}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={mode === "recovery" ? "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" : undefined}
            autoFocus
          />
        </div>
        {mode === "recovery" && (
          <div className="space-y-1.5">
            <Label htmlFor="unlock-new">New passphrase</Label>
            <Input id="unlock-new" type="password" autoComplete="new-password" value={fresh} onChange={(e) => setFresh(e.target.value)} />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember on this device
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !secret}>
          {busy ? "Unlocking..." : mode === "passphrase" ? "Unlock" : "Unlock and set new passphrase"}
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "passphrase" ? "recovery" : "passphrase")
            setSecret("")
            setError(null)
          }}
        >
          {mode === "passphrase" ? "Forgot passphrase? Use recovery key" : "Back to passphrase"}
        </button>
        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => void onSignOut()}>
          Sign out
        </button>
      </div>
    </Shell>
  )
}
