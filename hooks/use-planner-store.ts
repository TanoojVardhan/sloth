"use client"

import useSWR from "swr"

export type Priority = "low" | "medium" | "high"

export type BaseItem = {
  id: string
  title: string
  tags: string[]
  priority: Priority
  date?: string // ISO
  done?: boolean
}

export type PlannerState = {
  tasks: BaseItem[]
  events: BaseItem[]
  goals: BaseItem[]
}

const KEY = "sp:planner"

function load(): PlannerState {
  if (typeof window === "undefined") return { tasks: [], events: [], goals: [] }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PlannerState) : { tasks: [], events: [], goals: [] }
  } catch {
    return { tasks: [], events: [], goals: [] }
  }
}

function save(state: PlannerState) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function usePlanner() {
  const { data, mutate } = useSWR<PlannerState>(KEY, () => load(), { fallbackData: load() })
  const state = data!

  function addItem(
    type: "task" | "event" | "goal",
    payload: Omit<BaseItem, "id" | "tags" | "priority"> & {
      title: string
      tags?: string[]
      priority?: Priority
      date?: string
    },
  ) {
    const item: BaseItem = {
      id: crypto.randomUUID(),
      title: payload.title,
      tags: payload.tags ?? [],
      priority: payload.priority ?? "medium",
      date: payload.date,
      done: false,
    }
    const key = (type + "s") as keyof PlannerState
    const next: PlannerState = { ...state, [key]: [...state[key], item] }
    save(next)
    mutate(next, false)
  }

  function toggleDone(type: "task" | "goal", id: string) {
    const key = (type + "s") as "tasks" | "goals"
    const next: PlannerState = {
      ...state,
      [key]: state[key].map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }
    save(next)
    mutate(next, false)
  }

  function removeItem(type: "task" | "event" | "goal", id: string) {
    const key = (type + "s") as keyof PlannerState
    const next: PlannerState = { ...state, [key]: (state[key] as BaseItem[]).filter((i) => i.id !== id) }
    save(next)
    mutate(next, false)
  }

  const scheduled = [
    ...state.tasks.filter((t) => t.date),
    ...state.events.filter((e) => e.date),
    ...state.goals.filter((g) => g.date),
  ].map((i) => ({
    type: state.tasks.includes(i) ? "task" : state.events.includes(i) ? "event" : "goal",
    ...i,
  }))

  return {
    ...state,
    addItem,
    toggleDone,
    removeItem,
    scheduled,
  }
}
