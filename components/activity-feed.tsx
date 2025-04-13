import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Target, Calendar, MessageSquare } from "lucide-react"

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "task_completed",
      title: "Completed task: Review quarterly goals",
      time: "2 hours ago",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      id: 2,
      type: "task_added",
      title: "Added task: Complete project proposal",
      time: "3 hours ago",
      icon: <CheckCircle className="h-4 w-4 text-slate-500" />,
    },
    {
      id: 3,
      type: "event_added",
      title: "Added event: Team Meeting",
      time: "Yesterday",
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
    },
    {
      id: 4,
      type: "goal_progress",
      title: "Updated goal: Reading Goal (50% complete)",
      time: "Yesterday",
      icon: <Target className="h-4 w-4 text-purple-500" />,
    },
    {
      id: 5,
      type: "ai_assistant",
      title: "Used AI Assistant to schedule a meeting",
      time: "2 days ago",
      icon: <MessageSquare className="h-4 w-4 text-slate-800" />,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
