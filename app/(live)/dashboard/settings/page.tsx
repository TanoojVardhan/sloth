"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { doc, updateDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { DashboardPage } from "@/components/ui/dashboard-page"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Upload, User } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  // User context and state
  const { user, isLoading: authLoading, updateUserProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // User settings state
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [timeFormat, setTimeFormat] = useState("12h")
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    eventReminders: true,
    goalUpdates: true,
    weeklyDigest: true
  })

  // Fetch user settings
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      setEmail(user.email || "")
      
      // Get user settings from user metadata/preferences
      // For now using mock data until we implement actual settings storage
      setLoading(true)
      
      // Simulate fetching settings (would be an actual fetch in production)
      setTimeout(() => {
        // Mock additional profile data
        setPhone("555-123-4567")
        setBio("Productivity enthusiast and task management aficionado.")
        setJobTitle("Product Manager")
        setCompany("Tech Innovations Inc.")
        setProfileImage(user.photoURL || "")
        
        // Default timezone based on browser
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        setTimezone(userTimezone)
        setLoading(false)
      }, 500)
    }
  }, [user])

  // Save profile settings
  const saveProfileSettings = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Update user profile in firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { 
        displayName,
        phone,
        bio,
        jobTitle,
        company,
        profileImage
      })
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to update profile settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Save preferences
  const savePreferences = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Update user preferences in firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { 
        preferences: {
          timezone,
          dateFormat,
          timeFormat,
        }
      })
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully."
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Update notification settings in firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { 
        notificationSettings: notifications
      })
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved."
      })
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle profile image upload
  const handleImageUpload = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Process file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }
    
    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }
    
    setUploadingImage(true)
    
    try {
      // Create a reference to the Firebase Storage location
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`)
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Update the profile image state
      setProfileImage(downloadURL)
      
      // Update the user's profile in Firebase Auth and Firestore
      await updateUserProfile({ photoURL: downloadURL })
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully."
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // List of timezones for the timezone selector
  const timezones = [
    "UTC",
    "Africa/Cairo",
    "America/Anchorage",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/New_York",
    "America/Mexico_City",
    "Asia/Kolkata", // Indian Standard Time
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Jerusalem",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Europe/Berlin",
    "Europe/London",
    "Europe/Moscow",
    "Europe/Paris",
    "Pacific/Auckland",
    "Pacific/Honolulu"
  ]

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DashboardPage 
      title="Settings" 
      description="Manage your account settings and preferences"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information and how others see you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hidden file input for profile image upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImage || ""} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Profile Photo</h3>
                  <p className="text-sm text-muted-foreground">Your profile photo will be visible to others using the platform</p>
                  <Button 
                    onClick={handleImageUpload} 
                    type="button" 
                    size="sm" 
                    className="mt-2"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled={true} // Email changes require verification
                      readOnly
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed directly. Contact support for assistance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      disabled={loading}
                      placeholder="Your job title"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={loading}
                    placeholder="Your company or organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={loading}
                    placeholder="Write a short bio about yourself"
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Brief description that appears on your profile
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveProfileSettings} disabled={saving || loading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Profile
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Connect your accounts to sync calendar events and tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#4285F4]"><path d="M2 12C2 6.48 6.48 2 12 2c5.53 0 10 4.47 10 10 0 5.52-4.47 10-10 10-5.52 0-10-4.48-10-10z"></path><circle cx="12" cy="12" r="5"></circle></svg>
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">Calendar, Tasks, Contacts</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#0078D4]"><rect x="2" y="2" width="20" height="20" rx="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line></svg>
                  </div>
                  <div>
                    <p className="font-medium">Microsoft</p>
                    <p className="text-sm text-muted-foreground">Outlook Calendar, To Do</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Preferences Settings */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date and Time</CardTitle>
              <CardDescription>Configure how dates and times are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={timezone}
                  onValueChange={setTimezone}
                  disabled={loading}
                >
                  <SelectTrigger id="timezone" className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Your current local time: {new Date().toLocaleTimeString([], {timeZone: timezone})}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={dateFormat}
                  onValueChange={setDateFormat}
                  disabled={loading}
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select
                  value={timeFormat}
                  onValueChange={setTimeFormat}
                  disabled={loading}
                >
                  <SelectTrigger id="timeFormat">
                    <SelectValue placeholder="Select time format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={savePreferences} disabled={saving || loading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of Sloth Planner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startScreen">Default Dashboard View</Label>
                <Select defaultValue="day">
                  <SelectTrigger id="startScreen">
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today View</SelectItem>
                    <SelectItem value="week">Week View</SelectItem>
                    <SelectItem value="month">Month View</SelectItem>
                    <SelectItem value="tasks">Tasks View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled={saving || loading}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taskReminders">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded about upcoming and due tasks</p>
                </div>
                <Switch
                  id="taskReminders"
                  checked={notifications.taskReminders}
                  onCheckedChange={(checked) => setNotifications({...notifications, taskReminders: checked})}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="eventReminders">Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded about upcoming calendar events</p>
                </div>
                <Switch
                  id="eventReminders"
                  checked={notifications.eventReminders}
                  onCheckedChange={(checked) => setNotifications({...notifications, eventReminders: checked})}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goalUpdates">Goal Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive progress updates on your goals</p>
                </div>
                <Switch
                  id="goalUpdates"
                  checked={notifications.goalUpdates}
                  onCheckedChange={(checked) => setNotifications({...notifications, goalUpdates: checked})}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of your productivity</p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) => setNotifications({...notifications, weeklyDigest: checked})}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNotificationSettings} disabled={saving || loading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Login History
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}
