"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "@/lib/services/event-service";
import { useAuth } from "@/contexts/auth-context";

export type Event = {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  color?: string;
  location?: string;
  [key: string]: any;
};

type EventsContextType = {
  events: Event[];
  isLoading: boolean;
  refreshEvents: () => Promise<void>;
  addEvent: (event: Partial<Event>) => Promise<void>;
  updateEventById: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEventById: (id: string) => Promise<void>;
};

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshEvents = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetched = await getEvents(user.uid);
      setEvents(fetched);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshEvents();
    else setEvents([]);
  }, [user, refreshEvents]);


  const addEvent = async (event: Partial<Event>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Event", ...rest } = event;
    await createEvent({ title, ...rest }, user.uid);
    await refreshEvents();
    setIsLoading(false);
  };


  const updateEventById = async (id: string, updates: Partial<Event>) => {
    if (!user) return;
    setIsLoading(true);
    const { title = "Untitled Event", ...rest } = updates;
    await updateEvent(id, { title, ...rest }, user.uid);
    await refreshEvents();
    setIsLoading(false);
  };

  const deleteEventById = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    await deleteEvent(id, user.uid);
    await refreshEvents();
    setIsLoading(false);
  };

  return (
    <EventsContext.Provider value={{ events, isLoading, refreshEvents, addEvent, updateEventById, deleteEventById }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within an EventsProvider");
  return ctx;
}
