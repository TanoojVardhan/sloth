"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/services/task-service";
import { useAuth } from "@/contexts/auth-context";

export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  category?: string;
  [key: string]: any;
};

type TasksContextType = {
  tasks: Task[];
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTaskById: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTaskById: (id: string) => Promise<void>;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetched = await getTasks(user.uid);
      setTasks(fetched);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshTasks();
    else setTasks([]);
  }, [user, refreshTasks]);

  const addTask = async (task: Partial<Task>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Task", ...rest } = task;
    await createTask({ title, ...rest }, user.uid);
    await refreshTasks();
    setIsLoading(false);
  };

  const updateTaskById = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Task", ...rest } = updates;
    await updateTask(id, { title, ...rest }, user.uid);
    await refreshTasks();
    setIsLoading(false);
  };

  const deleteTaskById = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    await deleteTask(id, user.uid);
    await refreshTasks();
    setIsLoading(false);
  };

  return (
    <TasksContext.Provider value={{ tasks, isLoading, refreshTasks, addTask, updateTaskById, deleteTaskById }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider");
  return ctx;
}
