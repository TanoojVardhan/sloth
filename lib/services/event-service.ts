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
  limit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  allDay: boolean
  color?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface EventFormData {
  title: string
  description?: string
  startTime?: string
  endTime?: string
  location?: string
  allDay?: boolean
  color?: string
  tags?: string[]
}

export interface EventsQueryOptions {
  startAfter?: Date
  endBefore?: Date
  tag?: string
  limit?: number
  startAfterDoc?: DocumentSnapshot
  orderByField?: "startTime" | "endTime" | "createdAt" | "updatedAt"
  orderDirection?: "asc" | "desc"
}

// Helper function to safely convert Firestore timestamp to Date
function safeTimestampToDate(timestamp: any): Date {
  try {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else if (typeof timestamp === 'string') {
      const parsedDate = new Date(timestamp);
      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date string');
      }
      return parsedDate;
    } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      // Handle raw Firestore timestamp object
      return new Date(timestamp.seconds * 1000);
    }
    
    // If we reach here, we don't have a valid timestamp
    throw new Error('Invalid timestamp format');
  } catch (error) {
    console.warn('Invalid timestamp format:', timestamp, error);
    // Return current date as fallback
    return new Date();
  }
}

export async function getEvents(userId: string, options: EventsQueryOptions = {}): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")
    let q = query(eventsRef, where("userId", "==", userId))

    // Apply filters
    if (options.startAfter) {
      q = query(q, where("startTime", ">=", Timestamp.fromDate(options.startAfter)))
    }
    if (options.endBefore) {
      q = query(q, where("endTime", "<=", Timestamp.fromDate(options.endBefore)))
    }
    if (options.tag) {
      q = query(q, where("tags", "array-contains", options.tag))
    }

    // Apply ordering
    const orderByField = options.orderByField || "startTime"
    const orderDirection = options.orderDirection || "asc"
    q = query(q, orderBy(orderByField, orderDirection))

    // Apply pagination
    if (options.limit) {
      q = query(q, limit(options.limit))
    }
    if (options.startAfterDoc) {
      q = query(q, startAfter(options.startAfterDoc))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      
      try {
        // Use the helper function to safely convert timestamps
        const startDate = safeTimestampToDate(data.startTime);
        const endDate = safeTimestampToDate(data.endTime);
        const createdDate = safeTimestampToDate(data.createdAt);
        const updatedDate = safeTimestampToDate(data.updatedAt);
        
        return {
          id: doc.id,
          title: data.title,
          description: data.description || undefined,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          location: data.location || undefined,
          allDay: data.allDay || false,
          color: data.color || undefined,
          tags: data.tags || [],
          createdAt: createdDate,
          updatedAt: updatedDate,
        }
      } catch (error) {
        console.error(`Error processing event ${doc.id}:`, error);
        // Skip this event by returning null, we'll filter these out below
        return null;
      }
    }).filter(event => event !== null) as Event[]; // Filter out any nulls
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

export async function getEventById(eventId: string, userId: string): Promise<Event | null> {
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
    
    try {
      // Use the helper function to safely convert timestamps
      const startDate = safeTimestampToDate(data.startTime);
      const endDate = safeTimestampToDate(data.endTime);
      const createdDate = safeTimestampToDate(data.createdAt);
      const updatedDate = safeTimestampToDate(data.updatedAt);

      return {
        id: eventSnap.id,
        title: data.title,
        description: data.description || undefined,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        location: data.location || undefined,
        allDay: data.allDay || false,
        color: data.color || undefined,
        tags: data.tags || [],
        createdAt: createdDate,
        updatedAt: updatedDate,
      }
    } catch (error) {
      console.error(`Error processing event ${eventId}:`, error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export async function createEvent(eventData: EventFormData, userId: string): Promise<Event> {
  try {
    console.log("Creating event with data:", JSON.stringify(eventData), "for user:", userId)

    // Enhanced validation for user authentication
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error("Invalid userId provided:", userId)
      throw new Error("Valid user ID is required to create an event")
    }

    // Strict validation of required fields
    if (!eventData.title || eventData.title.trim() === '') {
      throw new Error("Event title is required")
    }
    
    if (!eventData.startTime || !eventData.endTime) {
      throw new Error("Event start and end times are required")
    }

    // Initialize event reference
    const eventRef = collection(db, "events")
    
    // Handle date conversion
    let startTime, endTime
    try {
      startTime = Timestamp.fromDate(new Date(eventData.startTime))
      endTime = Timestamp.fromDate(new Date(eventData.endTime))
    } catch (dateError) {
      console.error("Error parsing dates:", dateError)
      throw new Error("Invalid date format")
    }

    // Create a complete event object with defaults for all fields
    const eventToAdd = {
      title: eventData.title.trim(),
      description: eventData.description || "",
      startTime: startTime,
      endTime: endTime,
      location: eventData.location || "",
      allDay: eventData.allDay === true ? true : false,
      color: eventData.color || "#3B82F6", // Default blue color
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    console.log("Final event data being sent to Firestore:", JSON.stringify({
      ...eventToAdd,
      userId: `${userId.substring(0, 3)}...${userId.substring(userId.length - 3)}` // Redact full userId in logs
    }))

    // Add the document with retries for network issues
    let attempts = 0
    const maxAttempts = 3
    let docRef

    // Use a more reliable approach for adding the document
    while (attempts < maxAttempts) {
      try {
        docRef = await addDoc(eventRef, eventToAdd)
        console.log("Event document added with ID:", docRef.id)
        break // Success, exit loop
      } catch (addError) {
        attempts++
        console.error(`Event creation attempt ${attempts} failed:`, addError)
        
        // Specific error handling for common issues
        if (addError instanceof Error) {
          if (addError.message.includes("permission-denied") || 
              addError.message.includes("Missing or insufficient permissions")) {
            console.error("Permission denied. User may not be properly authenticated.")
            throw new Error("Permission denied: Make sure you're logged in and have permission to create events")
          }
          
          if (addError.message.includes("network") && attempts < maxAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
            continue
          }
        }
        
        throw addError // Re-throw if it's not a network error or we've exceeded retries
      }
    }
    
    if (!docRef) {
      throw new Error("Failed to create event after multiple attempts")
    }
    
    const createdAt = new Date()
    
    // Return a properly formatted event object
    return {
      id: docRef.id,
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(eventData.startTime).toISOString(),
      endTime: new Date(eventData.endTime).toISOString(),
      location: eventData.location,
      allDay: eventData.allDay || false,
      color: eventData.color || "#3B82F6",
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      createdAt,
      updatedAt: createdAt,
    }
  } catch (error) {
    console.error("Error creating event:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    throw error
  }
}

export async function updateEvent(eventId: string, eventData: EventFormData, userId: string): Promise<Event> {
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

    // Process dates
    let startTime = data.startTime
    let endTime = data.endTime

    if (eventData.startTime) {
      try {
        startTime = Timestamp.fromDate(new Date(eventData.startTime))
      } catch (error) {
        console.error("Invalid start time:", error);
        throw new Error("Invalid start time format")
      }
    }
    
    if (eventData.endTime) {
      try {
        endTime = Timestamp.fromDate(new Date(eventData.endTime))
      } catch (error) {
        console.error("Invalid end time:", error);
        throw new Error("Invalid end time format")
      }
    }

    const eventToUpdate = {
      title: eventData.title !== undefined ? eventData.title : data.title,
      description: eventData.description !== undefined ? eventData.description : data.description,
      startTime: startTime,
      endTime: endTime,
      location: eventData.location !== undefined ? eventData.location : data.location,
      allDay: eventData.allDay !== undefined ? eventData.allDay : data.allDay,
      color: eventData.color !== undefined ? eventData.color : data.color,
      tags: eventData.tags !== undefined ? eventData.tags : data.tags,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(eventRef, eventToUpdate)
    const updatedAt = new Date()
    
    try {
      // Use the helper function for timestamps
      const startDate = safeTimestampToDate(eventToUpdate.startTime);
      const endDate = safeTimestampToDate(eventToUpdate.endTime);
      const createdDate = safeTimestampToDate(data.createdAt);

      return {
        id: eventId,
        title: eventToUpdate.title,
        description: eventToUpdate.description || undefined,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        location: eventToUpdate.location || undefined,
        allDay: eventToUpdate.allDay || false,
        color: eventToUpdate.color || undefined,
        tags: eventToUpdate.tags || [],
        createdAt: createdDate,
        updatedAt,
      }
    } catch (error) {
      console.error(`Error processing updated event ${eventId}:`, error);
      throw new Error("Failed to process event data after update")
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

export async function getUpcomingEventsCount(userId: string): Promise<number> {
  try {
    const eventsRef = collection(db, "events")
    const now = new Date()
    
    const upcomingQuery = query(
      eventsRef,
      where("userId", "==", userId),
      where("endTime", ">=", Timestamp.fromDate(now))
    )
    
    const upcomingSnapshot = await getDocs(upcomingQuery)
    return upcomingSnapshot.size
    
  } catch (error) {
    console.error("Error getting upcoming events count:", error)
    return 0
  }
}
