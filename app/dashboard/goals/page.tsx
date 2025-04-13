import type React from "react"
import type { Metadata } from "next"
import DashboardLayout from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, TrendingUp, Award, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export const metadata: Metadata = {
  title: "Goals | Sloth AI Planner",
  description: "Track and manage your goals with Sloth AI Planner",
}

export default function GoalsPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <DashboardShell className="container py-6">
            <DashboardHeader heading="Goals" text="Track and manage your personal and professional goals">
              <Button className="bg-slate-800 hover:bg-slate-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </DashboardHeader>

            <Tabs defaultValue="active" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="active">Active Goals</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="mt-0 space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <GoalSummaryCard
                    title="Work Goals"
                    count={3}
                    progress={65}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="blue"
                  />
                  <GoalSummaryCard
                    title="Personal Goals"
                    count={2}
                    progress={50}
                    icon={<Award className="h-5 w-5" />}
                    color="purple"
                  />
                  <GoalSummaryCard
                    title="Health Goals"
                    count={1}
                    progress={30}
                    icon={<Target className="h-5 w-5" />}
                    color="green"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>All Active Goals</CardTitle>
                    <CardDescription>Track the progress of all your active goals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <GoalItem
                        title="Complete Project Milestones"
                        progress={65}
                        target={100}
                        unit="%"
                        category="work"
                        lastUpdated="2 days ago"
                      />
                      <GoalItem
                        title="Reading Goal"
                        progress={12}
                        target={24}
                        unit="books"
                        category="personal"
                        lastUpdated="1 week ago"
                      />
                      <GoalItem
                        title="Exercise"
                        progress={18}
                        target={30}
                        unit="days"
                        category="health"
                        lastUpdated="Yesterday"
                      />
                      <GoalItem
                        title="Learn New Programming Language"
                        progress={3}
                        target={10}
                        unit="modules"
                        category="personal"
                        lastUpdated="3 days ago"
                      />
                      <GoalItem
                        title="Client Acquisition"
                        progress={2}
                        target={5}
                        unit="clients"
                        category="work"
                        lastUpdated="1 day ago"
                      />
                      <GoalItem
                        title="Team Management Improvement"
                        progress={40}
                        target={100}
                        unit="%"
                        category="work"
                        lastUpdated="4 days ago"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Goals</CardTitle>
                    <CardDescription>Goals you have successfully achieved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-slate-500 mb-4">You haven't completed any goals yet.</p>
                      <p className="text-sm text-slate-400">Keep working on your active goals to see them here!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="archived" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Archived Goals</CardTitle>
                    <CardDescription>Goals you have archived for reference</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-slate-500">You don't have any archived goals.</p>
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

function GoalSummaryCard({
  title,
  count,
  progress,
  icon,
  color,
}: {
  title: string
  count: number
  progress: number
  icon: React.ReactNode
  color: "blue" | "purple" | "green"
}) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-800"
      case "purple":
        return "bg-purple-100 text-purple-800"
      case "green":
        return "bg-green-100 text-green-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getProgressColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500"
      case "purple":
        return "bg-purple-500"
      case "green":
        return "bg-green-500"
      default:
        return "bg-slate-500"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-full", getColorClasses(color))}>{icon}</div>
          <span className="text-2xl font-bold">{count}</span>
        </div>
        <h3 className="font-medium mb-2">{title}</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName={getProgressColor(color)} />
        </div>
      </CardContent>
    </Card>
  )
}

function GoalItem({
  title,
  progress,
  target,
  unit,
  category,
  lastUpdated,
}: {
  title: string
  progress: number
  target: number
  unit: string
  category: "work" | "personal" | "health"
  lastUpdated: string
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work":
        return <TrendingUp className="h-4 w-4" />
      case "personal":
        return <Award className="h-4 w-4" />
      case "health":
        return <Target className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "work":
        return "text-blue-600 bg-blue-100"
      case "personal":
        return "text-purple-600 bg-purple-100"
      case "health":
        return "text-green-600 bg-green-100"
      default:
        return "text-slate-600 bg-slate-100"
    }
  }

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100
    if (percentage >= 75) return "bg-green-500"
    if (percentage >= 50) return "bg-blue-500"
    if (percentage >= 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={cn("p-1.5 rounded-full", getCategoryColor(category))}>{getCategoryIcon(category)}</div>
          <div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{title}</span>
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
            <span className="text-xs text-slate-500">Updated {lastUpdated}</span>
          </div>
        </div>
        <span className="text-sm font-medium">
          {progress}/{target} {unit}
        </span>
      </div>
      <div className="space-y-1">
        <Progress
          value={(progress / target) * 100}
          className="h-2"
          indicatorClassName={getProgressColor(progress, target)}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>0 {unit}</span>
          <span>
            {target} {unit}
          </span>
        </div>
      </div>
    </div>
  )
}
