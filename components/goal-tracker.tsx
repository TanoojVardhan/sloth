"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { createGoal, getGoals, updateGoal, deleteGoal } from "@/lib/services/goal-service"

type Goal = {
  id: string
  title: string
  description?: string
  status: "active" | "completed" | "archived"
  targetDate?: string
  progress?: number
  category?: string
  // ...add other fields as needed
}


interface GoalTrackerProps {
  goals?: any[]
  onGoalsChanged?: () => void
}

// Map Firestore goals to local Goal type
const mapGoal = (g: any): Goal => {
  let status: "active" | "completed" | "archived" = "active";
  if (g.archived === true) {
    status = "archived";
  } else if (g.completed === true) {
    status = "completed";
  }
  return {
    ...g,
    status,
    targetDate: g.dueDate || g.targetDate || undefined,
  };
};

export default function GoalTracker({ goals: initialGoals = [], onGoalsChanged }: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals.map(mapGoal))
  // If parent provides onGoalsChanged, call it after any create/update/delete
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Form state
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    status: "active",
    targetDate: "",
    category: "",
    progress: 0
  })
  
  const handleCreateGoal = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create goals",
        variant: "destructive",
      })
      return
    }
    if (!newGoal.title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      // Save to Firestore
      await createGoal({
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        dueDate: newGoal.targetDate,
        completed: newGoal.status === "completed",
        archived: newGoal.status === "archived",
        // Add other fields as needed
      }, user.uid)
      // Refresh goals from Firestore
        if (typeof onGoalsChanged === 'function') {
          onGoalsChanged();
        } else {
          const updatedGoals = await getGoals(user.uid)
          setGoals(updatedGoals.map(mapGoal))
        }
      toast({
        title: "Goal created",
        description: "Your goal has been created successfully",
      })
      setNewGoal({
        title: "",
        description: "",
        status: "active",
        targetDate: "",
        category: "",
        progress: 0
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Goals</CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {goals.length === 0 ? (
              <Card className="border shadow-sm col-span-2">
                <CardContent className="p-4 flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-lg mb-2">No Goals Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create your first goal to start tracking your progress. Goals help you stay focused and motivated.
                  </p>
                  <Button 
                    className="mt-4 bg-primary hover:bg-primary/90" 
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              goals.map((goal) => (
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
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    )}
                    {goal.targetDate && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Select
                        value={goal.status}
                        onValueChange={async (value) => {
                          if (!user) return;
                          try {
                            await updateGoal(goal.id, {
                              title: goal.title,
                              description: goal.description,
                              category: goal.category,
                              dueDate: goal.targetDate,
                              completed: value === "completed",
                              archived: value === "archived",
                            }, user.uid);
                            if (typeof onGoalsChanged === 'function') {
                              onGoalsChanged();
                            } else {
                              const updatedGoals = await getGoals(user.uid);
                              setGoals(updatedGoals.map(mapGoal));
                            }
                            toast({ title: "Goal updated", description: `Status set to ${value}` });
                          } catch (err) {
                            toast({ title: "Error", description: "Failed to update goal", variant: "destructive" });
                          }
                        }}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      {goal.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!user) return;
                            try {
                              await updateGoal(goal.id, {
                                title: goal.title,
                                description: goal.description,
                                category: goal.category,
                                dueDate: goal.targetDate,
                                completed: true,
                              }, user.uid);
                              if (typeof onGoalsChanged === 'function') {
                                onGoalsChanged();
                              } else {
                                const updatedGoals = await getGoals(user.uid);
                                setGoals(updatedGoals.map(mapGoal));
                              }
                              toast({ title: "Goal marked as done" });
                            } catch (err) {
                              toast({ title: "Error", description: "Failed to mark as done", variant: "destructive" });
                            }
                          }}
                        >
                          Mark as Done
                        </Button>
                      )}
                      {goal.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!user) return;
                            try {
                              await updateGoal(goal.id, {
                                title: goal.title,
                                description: goal.description,
                                category: goal.category,
                                dueDate: goal.targetDate,
                                completed: false,
                              }, user.uid);
                              if (typeof onGoalsChanged === 'function') {
                                onGoalsChanged();
                              } else {
                                const updatedGoals = await getGoals(user.uid);
                                setGoals(updatedGoals.map(mapGoal));
                              }
                              toast({ title: "Goal marked as active again" });
                            } catch (err) {
                              toast({ title: "Error", description: "Failed to undo complete", variant: "destructive" });
                            }
                          }}
                        >
                          Undo
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!user) return;
                          if (!window.confirm("Are you sure you want to delete this goal?")) return;
                          try {
                            await deleteGoal(goal.id, user.uid);
                            if (typeof onGoalsChanged === 'function') {
                              onGoalsChanged();
                            } else {
                              const updatedGoals = await getGoals(user.uid);
                              setGoals(updatedGoals.map(mapGoal));
                            }
                            toast({ title: "Goal deleted" });
                          } catch (err) {
                            toast({ title: "Error", description: "Failed to delete goal", variant: "destructive" });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    {goal.status === "active" && (
                      <Progress value={goal.progress || 0} className="h-1.5 mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Create Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Goal Title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Goal Description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Category (e.g. Personal, Work, Health)"
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newGoal.status} 
                onValueChange={(value) => setNewGoal({ ...newGoal, status: value as "active" | "completed" | "archived" })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Goal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
