"use client"
import type React from "react"
import { DashboardPage } from "@/components/ui/dashboard-page"
import { FilterBar } from "@/components/ui/filter-bar"
import { LoadingState, EmptyState } from "@/components/ui/states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Target } from "lucide-react"

import { useState, useEffect } from "react"
import GoalTracker from "@/components/goal-tracker"
import { NewItemDialog } from "@/components/new-item-dialog"
import { getGoals } from "@/lib/services/goal-service"
import { useAuth } from "@/contexts/auth-context"


export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()

  const tabs = [
    { value: "all", label: "All Goals" },
    { value: "active", label: "Active Goals" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" }
  ]

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

  // Handler to refresh goals from Firestore
  const refreshGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetchedGoals = await getGoals(user.uid);
      setGoals(fetchedGoals);
    } catch (error) {
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeGoals = goals.filter(g => g.archived !== true && g.completed !== true)
  const completedGoals = goals.filter(g => g.archived !== true && g.completed === true)
  const archivedGoals = goals.filter(g => g.archived === true)

  return (
    <DashboardPage 
      title="Goals" 
      description="Track and manage your personal and professional goals"
      headerActions={
        <NewItemDialog
          triggerText="Add Goal"
          dialogTitle="Create New"
          triggerVariant="default"
          triggerClassName="bg-slate-800 hover:bg-slate-700"
        />
      }
    >
      <Tabs defaultValue="all" className="w-full">
        <FilterBar 
          tabs={tabs}
          defaultTab="all"
          showFilters={false}
          showSort={false}
        />
        <TabsContent value="all">
          {isLoading ? (
            <LoadingState rows={3} />
          ) : goals.length === 0 ? (
            <EmptyState 
              title="No goals yet"
              description="Create your first goal to start tracking your progress"
              icon={<Target className="h-8 w-8" />}
              action={{
                label: "Create Goal",
                onClick: () => {} // This would trigger the goal dialog
              }}
            />
          ) : (
            <GoalTracker goals={goals} onGoalsChanged={refreshGoals} />
          )}
        </TabsContent>
        
        <TabsContent value="active">
          {isLoading ? (
            <LoadingState rows={3} />
          ) : activeGoals.length === 0 ? (
            <EmptyState 
              title="No active goals"
              description="Start working on some goals to see them here"
              icon={<Target className="h-8 w-8" />}
            />
          ) : (
            <GoalTracker goals={activeGoals} onGoalsChanged={refreshGoals} />
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Goals</CardTitle>
              <CardDescription>Goals you have successfully achieved</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState rows={2} />
              ) : completedGoals.length === 0 ? (
                <EmptyState 
                  title="No completed goals yet"
                  description="Keep working on your active goals to see them here!"
                  icon={<Target className="h-8 w-8" />}
                />
              ) : (
                <GoalTracker goals={completedGoals} onGoalsChanged={refreshGoals} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Goals</CardTitle>
              <CardDescription>Goals you have archived for reference</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState rows={2} />
              ) : archivedGoals.length === 0 ? (
                <EmptyState 
                  title="No archived goals"
                  description="Goals you archive will appear here"
                  icon={<Target className="h-8 w-8" />}
                />
              ) : (
                <GoalTracker goals={archivedGoals} onGoalsChanged={refreshGoals} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}
