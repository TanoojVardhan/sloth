"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { User, Mail, Settings2, Bell, Layout, Loader2, CalendarCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [name, setName] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      // TODO: Update user profile in Firebase
      // await updateUserProfile(user.uid, { displayName: name })
      alert("Profile saved successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings2}
        title="Settings"
        description="Customize your experience and manage account preferences"
        gradient="from-violet-600 to-purple-600"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Image 
                src="/sloth-planner-logo.png" 
                alt="Avatar" 
                width={40} 
                height={40} 
                className="rounded-full" 
              />
            </div>
            <div>
              <div className="font-medium">{user?.name || "User"}</div>
              <div className="text-sm text-muted-foreground">Profile Avatar</div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name
              </Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
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

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <Layout className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Compact Sidebar</div>
                  <div className="text-sm text-muted-foreground">Minimize sidebar calendar</div>
                </div>
                <div className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  On
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Daily Email Summary</div>
                  <div className="text-sm text-muted-foreground">Receive daily task updates</div>
                </div>
                <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  Off
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Browser Notifications</div>
                  <div className="text-sm text-muted-foreground">Get reminders in browser</div>
                </div>
                <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  Off
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background p-6">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Google Calendar</h2>
                <p className="text-sm text-muted-foreground">Connect & sync events</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Integrate your Google Calendar to create events directly from Sloth Planner. 
              Sync your schedule seamlessly across platforms.
            </p>
            <Link href="/calendar-integration">
              <Button className="w-full">
                Connect Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
