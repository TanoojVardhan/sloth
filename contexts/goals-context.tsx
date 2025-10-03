"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/services/goal-service";
import { useAuth } from "@/contexts/auth-context";

export type Goal = {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "archived";
  targetDate?: string;
  progress?: number;
  category?: string;
  [key: string]: any;
};

type GoalsContextType = {
  goals: Goal[];
  isLoading: boolean;
  refreshGoals: () => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  updateGoalById: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoalById: (id: string) => Promise<void>;
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshGoals = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetched = await getGoals(user.uid);
      setGoals(fetched.map((g: any) => ({
        ...g,
        status: g.archived ? "archived" : g.completed ? "completed" : "active",
        targetDate: g.dueDate || g.targetDate || undefined,
      })));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshGoals();
    else setGoals([]);
  }, [user, refreshGoals]);

  const addGoal = async (goal: Partial<Goal>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Goal", ...rest } = goal;
    await createGoal({ title, ...rest }, user.uid);
    await refreshGoals();
    setIsLoading(false);
  };

  const updateGoalById = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Goal", ...rest } = updates;
    await updateGoal(id, { title, ...rest }, user.uid);
    await refreshGoals();
    setIsLoading(false);
  };

  const deleteGoalById = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    await deleteGoal(id, user.uid);
    await refreshGoals();
    setIsLoading(false);
  };

  return (
    <GoalsContext.Provider value={{ goals, isLoading, refreshGoals, addGoal, updateGoalById, deleteGoalById }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within a GoalsProvider");
  return ctx;
}
