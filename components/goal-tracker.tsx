"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Goal = {
  id: string
  title: string
  status: "active" | "completed" | "archived"
  // ...add other fields as needed
}

interface GoalTrackerProps {
  goals: Goal[]
}

export default function GoalTracker({ goals }: GoalTrackerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => (
        <Card key={goal.id} className={cn(
          "border shadow-sm",
          goal.status === "completed" && "bg-green-50 border-green-200",
          goal.status === "archived" && "bg-gray-50 border-gray-200"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{goal.title}</h3>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                goal.status === "active" && "bg-blue-100 text-blue-800",
                goal.status === "completed" && "bg-green-100 text-green-800",
                goal.status === "archived" && "bg-gray-100 text-gray-800"
              )}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </span>
            </div>
            {goal.status === "active" && (
              <Progress value={33} className="h-1.5 mt-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
