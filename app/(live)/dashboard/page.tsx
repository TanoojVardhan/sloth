"use client"
import TaskList from "@/components/task-list"
import Calendar from "@/components/calendar"
import GoalTracker from "@/components/goal-tracker"
import { ProjectIdeas } from "@/components/project-ideas"
import { DashboardPage } from "@/components/ui/dashboard-page"
import { WelcomeBanner } from "@/components/welcome-banner"
import { VerificationBanner } from "@/components/verification-banner"
import { ActivityFeed } from "@/components/activity-feed"
import { QuickActions } from "@/components/quick-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingState } from "@/components/ui/states"

// Set dynamic rendering for this page


import { useState, useEffect } from "react"
import { getGoals } from "@/lib/services/goal-service"
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard() {
  const [goals, setGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!user) {
      setGoals([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getGoals(user.uid)
      .then((fetchedGoals) => {
        setGoals(fetchedGoals)
      })
      .catch((error) => {
        console.error("Failed to fetch goals", error)
        setGoals([])
      })
      .finally(() => setIsLoading(false))
  }, [user])

  return (
    <DashboardPage 
      title="Dashboard" 
      description="Manage your tasks, schedule, and goals"
      headerActions={<QuickActions />}
    >
      <WelcomeBanner />
      <VerificationBanner />
      
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-5 space-y-6">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="projects">Project Ideas</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-6">
              <TaskList />
            </TabsContent>
            <TabsContent value="goals" className="mt-6">
              {isLoading ? (
                <LoadingState rows={2} />
              ) : (
                <GoalTracker goals={goals} />
              )}
            </TabsContent>
            <TabsContent value="projects" className="mt-6">
              <ProjectIdeas />
            </TabsContent>
          </Tabs>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityFeed />
            <div className="lg:block hidden">
              {/* Additional dashboard widget could go here */}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <Calendar />
        </div>
      </div>
    </DashboardPage>
  )
}
