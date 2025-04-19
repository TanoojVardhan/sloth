import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  startTime?: string
  endDate?: string
  endTime?: string
  allDay: boolean
  location?: string
  color?: string
  reminder?: number // minutes before event
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval: number
    endDate?: string
    count?: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface EventFormData {
  title: string
  description?: string
  startDate: string
  startTime?: string
  endDate?: string
  endTime?: string
  allDay?: boolean
  location?: string
  color?: string
  reminder?: number
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval: number
    endDate?: string
    count?: number
  }
}

export async function getEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
  try {
    const eventsRef = collection(db, "events")
    let q = query(eventsRef, where("userId", "==", userId), orderBy("startDate", "asc"))

    // Filter by date range if provided
    if (startDate) {
      q = query(q, where("startDate", ">=", Timestamp.fromDate(startDate)))
    }

    if (endDate) {
      q = query(q, where("startDate", "<=", Timestamp.fromDate(endDate)))
    }

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        startDate: data.startDate.toDate().toISOString().split("T")[0],
        startTime: data.startTime,
        endDate: data.endDate ? data.endDate.toDate().toISOString().split("T")[0] : undefined,
        endTime: data.endTime,
        allDay: data.allDay,
        location: data.location,
        color: data.color,
        reminder: data.reminder,
        recurrence: data.recurrence,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      }
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

export async function getEventById(eventId: string, userId: string): Promise<CalendarEvent | null> {
  try {
    const eventRef = doc(db, "events", eventId)
    const eventSnap = await getDoc(eventRef)

    if (!eventSnap.exists()) {
      return null
    }

    const data = eventSnap.data()

    // Verify that the event belongs to the user
    if (data.userId !== userId) {
      return null
    }

    return {
      id: eventSnap.id,
      title: data.title,
      description: data.description,
      startDate: data.startDate.toDate().toISOString().split("T")[0],
      startTime: data.startTime,
      endDate: data.endDate ? data.endDate.toDate().toISOString().split("T")[0] : undefined,
      endTime: data.endTime,
      allDay: data.allDay,
      location: data.location,
      color: data.color,
      reminder: data.reminder,
      recurrence: data.recurrence,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export async function createEvent(eventData: EventFormData, userId: string): Promise<CalendarEvent> {
  try {
    const eventRef = collection(db, "events")

    const now = serverTimestamp()
    const eventToAdd = {
      title: eventData.title,
      description: eventData.description || null,
      startDate: Timestamp.fromDate(new Date(eventData.startDate)),
      startTime: eventData.startTime || null,
      endDate: eventData.endDate ? Timestamp.fromDate(new Date(eventData.endDate)) : null,
      endTime: eventData.endTime || null,
      allDay: eventData.allDay || false,
      location: eventData.location || null,
      color: eventData.color || "#3b82f6", // Default blue
      reminder: eventData.reminder || null,
      recurrence: eventData.recurrence || null,
      userId,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDoc(eventRef, eventToAdd)
    const createdAt = new Date()

    return {
      id: docRef.id,
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime,
      allDay: eventData.allDay || false,
      location: eventData.location,
      color: eventData.color || "#3b82f6",
      reminder: eventData.reminder,
      recurrence: eventData.recurrence,
      createdAt,
      updatedAt: createdAt,
    }
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export async function updateEvent(
  eventId: string,
  eventData: Partial<EventFormData>,
  userId: string,
): Promise<CalendarEvent> {
  try {
    const eventRef = doc(db, "events", eventId)
    const eventSnap = await getDoc(eventRef)

    if (!eventSnap.exists()) {
      throw new Error("Event not found")
    }

    const data = eventSnap.data()

    // Verify that the event belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const eventToUpdate: any = {
      updatedAt: serverTimestamp(),
    }

    // Only update fields that are provided
    if (eventData.title !== undefined) eventToUpdate.title = eventData.title
    if (eventData.description !== undefined) eventToUpdate.description = eventData.description
    if (eventData.startDate !== undefined) {
      eventToUpdate.startDate = Timestamp.fromDate(new Date(eventData.startDate))
    }
    if (eventData.startTime !== undefined) eventToUpdate.startTime = eventData.startTime
    if (eventData.endDate !== undefined) {
      eventToUpdate.endDate = eventData.endDate ? Timestamp.fromDate(new Date(eventData.endDate)) : null
    }
    if (eventData.endTime !== undefined) eventToUpdate.endTime = eventData.endTime
    if (eventData.allDay !== undefined) eventToUpdate.allDay = eventData.allDay
    if (eventData.location !== undefined) eventToUpdate.location = eventData.location
    if (eventData.color !== undefined) eventToUpdate.color = eventData.color
    if (eventData.reminder !== undefined) eventToUpdate.reminder = eventData.reminder
    if (eventData.recurrence !== undefined) eventToUpdate.recurrence = eventData.recurrence

    await updateDoc(eventRef, eventToUpdate)

    // Get the updated document
    const updatedEventSnap = await getDoc(eventRef)
    const updatedData = updatedEventSnap.data()

    return {
      id: eventId,
      title: updatedData.title,
      description: updatedData.description,
      startDate: updatedData.startDate.toDate().toISOString().split("T")[0],
      startTime: updatedData.startTime,
      endDate: updatedData.endDate ? updatedData.endDate.toDate().toISOString().split("T")[0] : undefined,
      endTime: updatedData.endTime,
      allDay: updatedData.allDay,
      location: updatedData.location,
      color: updatedData.color,
      reminder: updatedData.reminder,
      recurrence: updatedData.recurrence,
      createdAt: updatedData.createdAt.toDate(),
      updatedAt: updatedData.updatedAt.toDate(),
    }
  } catch (error) {
    console.error("Error updating event:", error)
    throw error
  }
}

export async function deleteEvent(eventId: string, userId: string): Promise<void> {
  try {
    const eventRef = doc(db, "events", eventId)
    const eventSnap = await getDoc(eventRef)

    if (!eventSnap.exists()) {
      throw new Error("Event not found")
    }

    const data = eventSnap.data()

    // Verify that the event belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }

    await deleteDoc(eventRef)
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}
