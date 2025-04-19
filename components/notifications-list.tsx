"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  type: "task" | "event" | "goal" | "system"
}

interface NotificationsListProps {
  onHasUnreadChange?: (hasUnread: boolean) => void;
}

export function NotificationsList({ onHasUnreadChange }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const notificationsRef = collection(db, "notifications")
        const notificationsQuery = query(
          notificationsRef,
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        )

        const querySnapshot = await getDocs(notificationsQuery)
        const fetchedNotifications: Notification[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedNotifications.push({
            id: doc.id,
            title: data.title,
            message: data.message,
            timestamp: data.timestamp?.toDate() || new Date(),
            read: data.read || false,
            type: data.type || "system"
          })
        })

        setNotifications(fetchedNotifications)
        
        // Check if there are any unread notifications
        const hasUnread = fetchedNotifications.some(notification => !notification.read)
        
        // Notify parent component about unread notifications status
        if (onHasUnreadChange) {
          onHasUnreadChange(hasUnread)
        }
        
        // Create default notifications if none exist
        if (fetchedNotifications.length === 0) {
          await createDefaultNotifications(user.uid);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [user, onHasUnreadChange])

  // Function to create default notifications if none exist
  const createDefaultNotifications = async (userId: string) => {
    try {
      const notificationsRef = collection(db, "notifications");
      const defaultNotifications = [
        {
          userId,
          title: 'Welcome to Sloth!',
          message: 'Get started by creating your first task',
          timestamp: serverTimestamp(),
          read: false,
          type: 'system'
        },
        {
          userId,
          title: 'Try the AI Assistant',
          message: 'Click the chat icon to get help with your tasks',
          timestamp: serverTimestamp(),
          read: false,
          type: 'system'
        }
      ];
      
      // Add default notifications to Firestore
      const createdNotifications: Notification[] = [];
      
      for (const notification of defaultNotifications) {
        const docRef = await addDoc(notificationsRef, notification);
        createdNotifications.push({
          id: docRef.id,
          title: notification.title,
          message: notification.message,
          timestamp: new Date(),
          read: notification.read,
          type: notification.type as "task" | "event" | "goal" | "system"
        });
      }
      
      setNotifications(createdNotifications);
      
      // Notify parent about unread notifications
      if (onHasUnreadChange) {
        onHasUnreadChange(true);
      }
    } catch (error) {
      console.error("Error creating default notifications:", error);
    }
  };

  // Format dates according to Indian timezone
  const getRelativeTime = (date: Date) => {
    // Configure to display in Indian Standard Time (IST)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata'
    };
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    // Format date in India format (DD/MM/YYYY)
    return date.toLocaleDateString('en-IN', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No notifications yet
      </div>
    )
  }
  
  return (
    <div className="max-h-80 overflow-auto">
      {notifications.map((notification) => (
        <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-2">
          <div className="font-medium flex items-center gap-2">
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-destructive"></span>
            )}
            {notification.title}
          </div>
          <div className="text-sm text-muted-foreground">{notification.message}</div>
          <div className="mt-1 text-xs text-muted-foreground/70">{getRelativeTime(notification.timestamp)}</div>
        </DropdownMenuItem>
      ))}
    </div>
  )
}