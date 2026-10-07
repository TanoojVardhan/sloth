"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth-provider"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"
import { hasPasswordProvider, addPasswordToAccount } from "@/lib/firebase-auth"
import { updateUser } from "@/lib/firebase-db"
import { uploadAvatar, deleteAvatarByUrl } from "@/lib/firebase-storage"
import { requestNotificationPermission } from "@/lib/notifications"
import { OccupationOptions } from "@/components/occupation-picker"
import type { Occupation } from "@/types/entities"
import type { User } from "@/types/entities"
import {
  User as UserIcon,
  Mail,
  Settings2,
  Bell,
  Layout,
  Loader2,
  CalendarCheck,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Sun,
  Moon,
  MonitorSmartphone,
  Camera,
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Keyed by uid so a freshly loaded (or switched) user gets a fresh
  // instance of the form, letting useState pick up the right initial name
  // without reaching for an effect to sync external state into state.
  return <SettingsForm key={user?.userId ?? "anonymous"} user={user} />
}

function SettingsForm({ user }: { user: User | null }) {
  const { isConnected } = useGoogleCalendar()
  const { refreshUser } = useAuth()
  const [name, setName] = useState(user?.name ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [hasPassword, setHasPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false)

  useEffect(() => {
    setHasPassword(hasPasswordProvider())
  }, [])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.")
      return
    }

    setIsSettingPassword(true)
    try {
      await addPasswordToAccount(newPassword)
      setHasPassword(true)
      setPasswordSetSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      const err = error as { message?: string }
      setPasswordError(err.message || "Couldn't set a password. Try signing out and back in, then try again.")
    } finally {
      setIsSettingPassword(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file later
    if (!file || !user) return

    setAvatarError(null)
    setIsUploadingAvatar(true)
    try {
      const previousPhotoURL = user.photoURL
      const photoURL = await uploadAvatar(user.userId, file)
      await updateUser(user.userId, { photoURL })
      await refreshUser()
      if (previousPhotoURL) {
        void deleteAvatarByUrl(previousPhotoURL)
      }
    } catch (error) {
      const err = error as { message?: string }
      setAvatarError(err.message || "Couldn't upload that image. Try again?")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await updateUser(user.userId, { name: name.trim() || undefined })
      await refreshUser()
      setSaveSuccess(true)
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings2}
        title="Settings"
        description="Customize your experience and manage account preferences"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 transition-opacity hover:opacity-90 disabled:cursor-wait"
              aria-label="Change profile picture"
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Your avatar"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src="/sloth-planner-logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div>
              <div className="font-medium">{user?.name || "User"}</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="text-sm text-primary hover:underline disabled:pointer-events-none disabled:opacity-60"
              >
                {isUploadingAvatar ? "Uploading..." : "Change photo"}
              </button>
              {avatarError && <p className="mt-1 text-xs text-destructive">{avatarError}</p>}
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Display Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaveSuccess(false)
                }}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                disabled
                value={user?.email || ""}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {saveSuccess && <p className="text-sm text-chart-1">Profile saved.</p>}

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Password</h2>
          </div>

          {hasPassword ? (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-chart-1" />
              <div>
                <div className="font-medium">A password is set on this account</div>
                <p className="text-sm text-muted-foreground">
                  You can sign in with your email and this password anywhere, including the Android app.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This account signed in with Google, so it has no password yet. Set one to also sign in with
                email + password &mdash; useful for the Android app, which doesn&apos;t support Google
                Sign-In yet.
              </p>

              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter the password"
                />
              </div>

              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {passwordSetSuccess && (
                <p className="text-sm text-chart-1">Password set. You can now sign in with email + password.</p>
              )}

              <Button type="submit" disabled={isSettingPassword} className="w-full">
                {isSettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  "Set password"
                )}
              </Button>
            </form>
          )}
        </Card>

        <div className="space-y-6">
          <OccupationCard user={user} onUserUpdated={refreshUser} />

          <AppearanceCard />

          <NotificationsCard user={user} onUserUpdated={refreshUser} />

          {isConnected ? (
            <Card className="border-accent/30 bg-accent/10 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                  <CheckCircle2 className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Google Calendar Connected</h2>
                  <p className="text-sm text-chart-1">Auto-sync active ✓</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Your Google Calendar is connected. All tasks and events with dates are automatically synced.
              </p>
              <Link href="/calendar-integration">
                <Button variant="outline" className="w-full border-accent/40 hover:bg-accent/15">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Manage Connection
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="border-border p-6">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Google Calendar Integration</h2>
                  <p className="text-sm text-muted-foreground">Auto-sync tasks & events</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Connect your Google Calendar to automatically sync all tasks and events you create.
                Once connected, everything with a date will appear in your Google Calendar instantly.
              </p>
              <Link href="/calendar-integration">
                <Button className="w-full">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Connect Calendar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function OccupationCard({ user, onUserUpdated }: { user: User | null; onUserUpdated: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function choose(o: Occupation) {
    if (!user || o === user.occupation) return
    setSaving(true)
    setError(null)
    try {
      await updateUser(user.userId, { occupation: o })
      await onUserUpdated()
    } catch {
      setError("Couldn't save that. Try again?")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-serif text-lg font-semibold">What you do</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Changes which tools appear in the sidebar. Your data is never removed when you switch.
      </p>
      <div className={saving ? "pointer-events-none opacity-60" : undefined}>
        <OccupationOptions value={user?.occupation} onChange={(o) => void choose(o)} />
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </Card>
  )
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  const options: { value: string; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: MonitorSmartphone },
  ]

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Layout className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Appearance</h2>
      </div>
      <div className="rounded-lg border p-4">
        <div className="mb-3 font-medium">Theme</div>
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-1.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                theme === value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

function NotificationsCard({ user, onUserUpdated }: { user: User | null; onUserUpdated: () => Promise<void> }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [permissionBlocked, setPermissionBlocked] = useState(false)
  const enabled = Boolean(user?.browserNotificationsEnabled)

  async function handleToggle(next: boolean) {
    if (!user) return
    setPermissionBlocked(false)

    if (next) {
      const permission = await requestNotificationPermission()
      if (permission !== "granted") {
        setPermissionBlocked(true)
        return
      }
    }

    setIsUpdating(true)
    try {
      await updateUser(user.userId, { browserNotificationsEnabled: next })
      await onUserUpdated()
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Notifications</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium">Browser Notifications</div>
            <div className="text-sm text-muted-foreground">
              Get a reminder here for tasks due today and events starting soon, while a tab is open.
            </div>
          </div>
          <Switch checked={enabled} disabled={isUpdating} onCheckedChange={handleToggle} />
        </div>
        {permissionBlocked && (
          <p className="text-xs text-destructive">
            Your browser blocked the notification permission. Allow notifications for this site in your browser
            settings, then try again.
          </p>
        )}

        <div className="flex items-center justify-between rounded-lg border p-4 opacity-60">
          <div>
            <div className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4" />
              Daily Email Summary
            </div>
            <div className="text-sm text-muted-foreground">Receive daily task updates by email</div>
          </div>
          <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">Coming soon</div>
        </div>
      </div>
    </Card>
  )
}
