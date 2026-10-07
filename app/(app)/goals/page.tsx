"use client"

import { useState } from "react"
import { useGoals } from "@/hooks/use-firebase-data"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Target, Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon } from "lucide-react"
import type { GoalStatus } from "@/types/entities"

export default function GoalsPage() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals()
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [tags, setTags] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || null,
        status: "active",
        targetDate: targetDate || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      })
      setTitle("")
      setDescription("")
      setTargetDate("")
      setTags("")
      setIsAdding(false)
    } catch (error) {
      console.error("Failed to create goal:", error)
      alert("Failed to create goal. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (goalId: string, currentStatus: GoalStatus) => {
    const nextStatus: GoalStatus = currentStatus === "completed" ? "active" : "completed"
    try {
      await updateGoal(goalId, { status: nextStatus })
    } catch (error) {
      console.error("Failed to update goal:", error)
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return
    try {
      await deleteGoal(goalId)
    } catch (error) {
      console.error("Failed to delete goal:", error)
    }
  }

  const activeGoals = goals.filter((g) => g.status === "active")
  const completedGoals = goals.filter((g) => g.status === "completed")

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="Goals"
        description="Set and track your long-term ambitions across personal, career, health, and life objectives"
        gradient="from-orange-600 to-red-600"
      >
        {!isAdding && !isLoading && (
          <Button onClick={() => setIsAdding(true)} size="lg" className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : (
        <>
          {isAdding && (
            <Card className="p-6">
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your goal..."
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details about your goal..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetDate" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Target Date
                    </Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="personal, career, health..."
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!title.trim() || isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Goal
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-6">
            {/* Active Goals */}
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Target className="h-5 w-5 text-primary" />
                Active Goals
                <span className="ml-auto text-sm font-normal text-muted-foreground">{activeGoals.length}</span>
              </h2>
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <div
                    key={goal.goalId}
                    className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{goal.title}</h3>
                        {goal.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {goal.tags && goal.tags.length > 0 && (
                            <div className="flex gap-1">
                              {goal.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {goal.targetDate && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(goal.goalId, goal.status)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(goal.goalId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {activeGoals.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No active goals. Start by adding your first goal!
                  </div>
                )}
              </div>
            </Card>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed Goals
                  <span className="ml-auto text-sm font-normal text-muted-foreground">{completedGoals.length}</span>
                </h2>
                <div className="space-y-3">
                  {completedGoals.map((goal) => (
                    <div
                      key={goal.goalId}
                      className="group rounded-lg border bg-card p-4 opacity-60 transition-all hover:opacity-100"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold line-through">{goal.title}</h3>
                          {goal.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-through">{goal.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {goal.tags && goal.tags.length > 0 && (
                              <div className="flex gap-1">
                                {goal.tags.map((tag) => (
                                  <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {goal.targetDate && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(goal.goalId, goal.status)}
                          >
                            <Circle className="mr-1 h-4 w-4" />
                            Reopen
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(goal.goalId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
