import type { Metadata } from "next"
import DashboardLayout from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Settings | Sloth AI Planner",
  description: "Manage your account settings with Sloth AI Planner",
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <DashboardShell className="container py-6">
            <DashboardHeader heading="Settings" text="Manage your account settings and preferences" />

            <Tabs defaultValue="profile" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your public profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col gap-6 sm:flex-row">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                          <AvatarFallback className="text-lg">JD</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" defaultValue="Jane Doe" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" defaultValue="janedoe" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" placeholder="Tell us about yourself" className="min-h-[120px]" />
                      <p className="text-xs text-slate-500">Brief description for your profile.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="jane@example.com" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="america-new_york">
                          <SelectTrigger id="timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="america-new_york">Eastern Time (ET)</SelectItem>
                            <SelectItem value="america-chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="america-denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="america-los_angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="etc-utc">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-slate-800 hover:bg-slate-700">Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Email Address</h3>
                      <div className="grid gap-2">
                        <Label htmlFor="current-email">Current Email</Label>
                        <Input id="current-email" type="email" defaultValue="jane@example.com" disabled />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-email">New Email</Label>
                        <Input id="new-email" type="email" placeholder="Enter new email address" />
                      </div>
                      <Button variant="outline" size="sm">
                        Change Email
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Password</h3>
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Delete Account</h3>
                      <p className="text-sm text-slate-500">
                        Permanently delete your account and all of your data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Email Notifications</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-tasks">Task Reminders</Label>
                          <p className="text-sm text-slate-500">Receive email reminders for upcoming tasks</p>
                        </div>
                        <Switch id="email-tasks" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-events">Calendar Events</Label>
                          <p className="text-sm text-slate-500">Receive email notifications for upcoming events</p>
                        </div>
                        <Switch id="email-events" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-goals">Goal Updates</Label>
                          <p className="text-sm text-slate-500">Receive weekly updates on your goal progress</p>
                        </div>
                        <Switch id="email-goals" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">In-App Notifications</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="app-tasks">Task Reminders</Label>
                          <p className="text-sm text-slate-500">Show notifications for upcoming tasks</p>
                        </div>
                        <Switch id="app-tasks" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="app-events">Calendar Events</Label>
                          <p className="text-sm text-slate-500">Show notifications for upcoming events</p>
                        </div>
                        <Switch id="app-events" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="app-goals">Goal Updates</Label>
                          <p className="text-sm text-slate-500">Show notifications for goal progress</p>
                        </div>
                        <Switch id="app-goals" defaultChecked />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-slate-800 hover:bg-slate-700">Save Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize how Sloth looks and feels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Theme</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="border border-slate-200 rounded-md p-2 w-full aspect-square flex items-center justify-center bg-white">
                            <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="theme-light" name="theme" className="form-radio" defaultChecked />
                            <Label htmlFor="theme-light">Light</Label>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="border border-slate-200 rounded-md p-2 w-full aspect-square flex items-center justify-center bg-slate-900">
                            <div className="w-8 h-8 rounded-full bg-white"></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="theme-dark" name="theme" className="form-radio" />
                            <Label htmlFor="theme-dark">Dark</Label>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="border border-slate-200 rounded-md p-2 w-full aspect-square flex items-center justify-center bg-gradient-to-b from-white to-slate-900">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-slate-900 to-white"></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="theme-system" name="theme" className="form-radio" />
                            <Label htmlFor="theme-system">System</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Dashboard Layout</h3>
                      <div className="grid gap-2">
                        <Label htmlFor="layout">Default View</Label>
                        <Select defaultValue="tasks">
                          <SelectTrigger id="layout">
                            <SelectValue placeholder="Select default view" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tasks">Tasks</SelectItem>
                            <SelectItem value="calendar">Calendar</SelectItem>
                            <SelectItem value="goals">Goals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-slate-800 hover:bg-slate-700">Save Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DashboardShell>
        </div>
        <SiteFooter />
      </div>
    </DashboardLayout>
  )
}
