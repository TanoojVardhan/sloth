"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, TrendingUp, Award, MoreHorizontal, Plus, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAIAssistant } from "@/hooks/use-ai-assistant"

interface Goal {
  id: string
  title: string
  progress: number
  target: number
  unit: string
  category: "personal" | "work" | "health"
  lastUpdated: string
}

export default function GoalTracker() {
  const { openAssistant } = useAIAssistant()

  const goals: Goal[] = [
    {
      id: "1",
      title: "Complete Project Milestones",
      progress: 65,
      target: 100,
      unit: "%",
      category: "work",
      lastUpdated: "2 days ago",
    },
    {
      id: "2",
      title: "Reading Goal",
      progress: 12,
      target: 24,
      unit: "books",
      category: "personal",
      lastUpdated: "1 week ago",
    },
    {
      id: "3",
      title: "Exercise",
      progress: 18,
      target: 30,
      unit: "days",
      category: "health",
      lastUpdated: "Yesterday",
    },
  ]

  const getCategoryIcon = (category: Goal["category"]) => {
    switch (category) {
      case "work":
        return <TrendingUp className="h-4 w-4" />
      case "personal":
        return <Award className="h-4 w-4" />
      case "health":
        return <Target className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: Goal["category"]) => {
    switch (category) {
      case "work":
        return "text-blue-600 bg-blue-100"
      case "personal":
        return "text-purple-600 bg-purple-100"
      case "health":
        return "text-green-600 bg-green-100"
    }
  }

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100
    if (percentage >= 75) return "bg-green-500"
    if (percentage >= 50) return "bg-blue-500"
    if (percentage >= 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  const handleAddGoal = () => {
    openAssistant("I'd like to create a new goal")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Goals</CardTitle>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
          View all
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn("p-1.5 rounded-full", getCategoryColor(goal.category))}>
                    {getCategoryIcon(goal.category)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Update progress</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <span className="text-xs text-slate-500">Updated {goal.lastUpdated}</span>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {goal.progress}/{goal.target} {goal.unit}
                </span>
              </div>
              <div className="space-y-1">
                <Progress
                  value={(goal.progress / goal.target) * 100}
                  className="h-2"
                  indicatorClassName={getProgressColor(goal.progress, goal.target)}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0 {goal.unit}</span>
                  <span>
                    {goal.target} {goal.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-full mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleAddGoal}>
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
