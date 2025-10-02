"use client"
import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useState, useEffect } from "react"
import GoalTracker from "@/components/goal-tracker"
import { NewItemDialog } from "@/components/new-item-dialog"
import { getGoals } from "@/lib/services/goal-service"
import { useAuth } from "@/contexts/auth-context"


export default function GoalsPage() {
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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <DashboardShell className="container py-6">
          <DashboardHeader heading="Goals" text="Track and manage your personal and professional goals">
            <NewItemDialog
              triggerText="Add Goal"
              dialogTitle="Create New"
              triggerVariant="default"
              triggerClassName="bg-slate-800 hover:bg-slate-700"
            />
          </DashboardHeader>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Goals</TabsTrigger>
                <TabsTrigger value="active">Active Goals</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="text-center py-6">Loading...</div>
              ) : goals.length === 0 ? (
                <div className="text-center py-6">No goals found.</div>
              ) : (
                <GoalTracker goals={goals} onGoalsChanged={refreshGoals} />
              )}
            </TabsContent>
            <TabsContent value="active" className="mt-0">
              {isLoading ? (
                <div className="text-center py-6">Loading...</div>
              ) : goals.filter(g => g.archived !== true && g.completed !== true).length === 0 ? (
                <div className="text-center py-6">No active goals found.</div>
              ) : (
                <GoalTracker goals={goals.filter(g => g.archived !== true && g.completed !== true)} onGoalsChanged={refreshGoals} />
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Goals</CardTitle>
                  <CardDescription>Goals you have successfully achieved</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-6">Loading...</div>
                  ) : goals.filter(g => g.archived !== true && g.completed === true).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-slate-500 mb-4">You haven't completed any goals yet.</p>
                      <p className="text-sm text-slate-400">Keep working on your active goals to see them here!</p>
                    </div>
                  ) : (
                    <GoalTracker goals={goals.filter(g => g.archived !== true && g.completed === true)} onGoalsChanged={refreshGoals} />
                  )}
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
                  {isLoading ? (
                    <div className="text-center py-6">Loading...</div>
                  ) : goals.filter(g => g.archived === true).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-slate-500">You don't have any archived goals.</p>
                    </div>
                  ) : (
                    <GoalTracker goals={goals.filter(g => g.archived === true)} onGoalsChanged={refreshGoals} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DashboardShell>
      </div>
      <SiteFooter />
    </div>
  )
}
