"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Target, Calendar, MessageSquare, FolderOpen } from "lucide-react"
import { useState, useEffect } from "react"

export function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Simulate fetching activities from an API or database
        const fetchedActivities = [] // Replace with actual API call
        setActivities(fetchedActivities)
      } catch (error) {
        console.error("Failed to fetch activities", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <MessageSquare className="h-8 w-8 animate-spin text-foreground/40" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
            <FolderOpen className="h-12 w-12 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">No recent activity yet.</p>
            <p className="text-xs text-slate-500">Your recent actions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="mt-0.5">{activity.icon}</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
