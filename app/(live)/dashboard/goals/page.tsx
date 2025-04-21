"use client"
import type React from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import GoalTracker from "@/components/goal-tracker"
import { Plus } from "lucide-react"

type Goal = {
  id: string
  title: string
  status: "active" | "completed" | "archived"
  // ...add other fields as needed
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        // Simulate fetching goals from an API or database
        const fetchedGoals: Goal[] = [
          { id: "1", title: "Read 10 books", status: "active" },
          { id: "2", title: "Run a marathon", status: "completed" },
          { id: "3", title: "Learn TypeScript", status: "archived" },
        ]
        setGoals(fetchedGoals)
      } catch (error) {
        console.error("Failed to fetch goals", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [])

  return (
    
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
              <TabsContent value="active" className="mt-0">
                {isLoading ? (
                  <div className="text-center py-6">Loading...</div>
                ) : goals.filter(g => g.status === "active").length === 0 ? (
                  <div className="text-center py-6">No active goals found.</div>
                ) : (
                  <GoalTracker goals={goals.filter(g => g.status === "active")} />
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
                    ) : goals.filter(g => g.status === "completed").length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-slate-500 mb-4">You haven't completed any goals yet.</p>
                        <p className="text-sm text-slate-400">Keep working on your active goals to see them here!</p>
                      </div>
                    ) : (
                      <GoalTracker goals={goals.filter(g => g.status === "completed")} />
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
                    ) : goals.filter(g => g.status === "archived").length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-slate-500">You don't have any archived goals.</p>
                      </div>
                    ) : (
                      <GoalTracker goals={goals.filter(g => g.status === "archived")} />
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
