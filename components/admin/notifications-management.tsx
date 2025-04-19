"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Bell, Info, AlertTriangle, CheckCircle, XCircle, Megaphone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  createNotification,
  getAllNotifications,
  createAnnouncement,
  type Notification,
} from "@/lib/services/notification-service"
import { getUsers, type UserListItem } from "@/lib/services/user-management-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function NotificationsManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<UserListItem[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Form states
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"info" | "warning" | "success" | "error" | "announcement">("info")
  const [link, setLink] = useState("")
  const [recipientId, setRecipientId] = useState<string>("all")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const [fetchedNotifications, { users: fetchedUsers }] = await Promise.all([
        getAllNotifications(),
        getUsers({ limit: 100 }),
      ])
      setNotifications(fetchedNotifications)
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setMessage("")
    setType("info")
    setLink("")
    setRecipientId("all")
    setExpiryDate(undefined)
  }

  const handleCreateNotification = async () => {
    if (!title || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      await createNotification(
        {
          title,
          message,
          type,
          link: link || undefined,
          recipientId,
          expiresAt: expiryDate,
        },
        user?.uid || "system",
      )

      toast({
        title: "Notification sent",
        description: "The notification has been sent successfully.",
      })

      resetForm()
      setIsCreateDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!title || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      await createAnnouncement(title, message, expiryDate, link || undefined)

      toast({
        title: "Announcement sent",
        description: "The announcement has been sent to all users.",
      })

      resetForm()
      setIsAnnouncementDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send announcement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-slate-500">Manage and send notifications to users.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
            <Megaphone className="mr-2 h-4 w-4" />
            Send Announcement
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            New Notification
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Notification History</CardTitle>
              <CardDescription>All notifications sent in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No notifications found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <NotificationTypeBadge type={notification.type} />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[300px]">{notification.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {notification.recipientId === "all" ? (
                              <Badge variant="outline">All Users</Badge>
                            ) : (
                              <span className="text-sm text-slate-500">
                                {users.find((u) => u.id === notification.recipientId)?.email ||
                                  notification.recipientId}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">
                              {notification.createdAt.toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">
                              {notification.expiresAt ? notification.expiresAt.toLocaleDateString() : "Never"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="announcements">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>System Announcements</CardTitle>
              <CardDescription>Announcements sent to all users</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications
                        .filter((n) => n.type === "announcement")
                        .map((notification) => (
                          <TableRow key={notification.id}>
                            <TableCell>
                              <p className="font-medium">{notification.title}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-slate-500 truncate max-w-[300px]">{notification.message}</p>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-500">
                                {notification.createdAt.toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-500">
                                {notification.expiresAt ? notification.expiresAt.toLocaleDateString() : "Never"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      {notifications.filter((n) => n.type === "announcement").length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                            No announcements found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>Send a notification to a specific user or all users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotification} disabled={isSending}>
              {isSending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Send an announcement to all users in the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Announcement message"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-link">Link (Optional)</Label>
              <Input
                id="announcement-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} disabled={isSending}>
              {isSending ? "Sending..." : "Send Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NotificationTypeBadge({ type }: { type: string }) {
  switch (type) {
    case "info":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
          <Info className="h-3 w-3" /> Info
        </Badge>
      )
    case "warning":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Warning
        </Badge>
      )
    case "success":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Success
        </Badge>
      )
    case "error":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Error
        </Badge>
      )
    case "announcement":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 flex items-center gap-1">
          <Megaphone className="h-3 w-3" /> Announcement
        </Badge>
      )
    default:
      return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">{type}</Badge>
  }
}
