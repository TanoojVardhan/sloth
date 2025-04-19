import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"

export interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxTasksPerUser: number
  maxGoalsPerUser: number
  maxEventsPerUser: number
  defaultTaskDueDays: number
  updatedAt: Date
  updatedBy: string
}

const DEFAULT_SETTINGS: Omit<SystemSettings, "updatedAt" | "updatedBy"> = {
  siteName: "Sloth AI Planner",
  siteDescription: "AI-powered planning assistant",
  maintenanceMode: false,
  registrationEnabled: true,
  maxTasksPerUser: 1000,
  maxGoalsPerUser: 100,
  maxEventsPerUser: 500,
  defaultTaskDueDays: 7,
}

// Get system settings
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const settingsRef = doc(db, "admin", "systemSettings")
    const settingsSnap = await getDoc(settingsRef)

    if (!settingsSnap.exists()) {
      // Initialize with default settings
      await setDoc(settingsRef, {
        ...DEFAULT_SETTINGS,
        updatedAt: serverTimestamp(),
        updatedBy: "system",
      })

      return {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date(),
        updatedBy: "system",
      }
    }

    const data = settingsSnap.data()

    return {
      siteName: data.siteName || DEFAULT_SETTINGS.siteName,
      siteDescription: data.siteDescription || DEFAULT_SETTINGS.siteDescription,
      maintenanceMode: data.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,
      registrationEnabled: data.registrationEnabled ?? DEFAULT_SETTINGS.registrationEnabled,
      maxTasksPerUser: data.maxTasksPerUser || DEFAULT_SETTINGS.maxTasksPerUser,
      maxGoalsPerUser: data.maxGoalsPerUser || DEFAULT_SETTINGS.maxGoalsPerUser,
      maxEventsPerUser: data.maxEventsPerUser || DEFAULT_SETTINGS.maxEventsPerUser,
      defaultTaskDueDays: data.defaultTaskDueDays || DEFAULT_SETTINGS.defaultTaskDueDays,
      updatedAt: data.updatedAt.toDate(),
      updatedBy: data.updatedBy,
    }
  } catch (error) {
    console.error("Error getting system settings:", error)
    return {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date(),
      updatedBy: "system",
    }
  }
}

// Update system settings
export async function updateSystemSettings(
  settings: Partial<Omit<SystemSettings, "updatedAt" | "updatedBy">>,
  userId: string,
): Promise<boolean> {
  try {
    const settingsRef = doc(db, "admin", "systemSettings")

    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    })

    return true
  } catch (error) {
    console.error("Error updating system settings:", error)
    return false
  }
}

// Check if system is in maintenance mode
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const settings = await getSystemSettings()
    return settings.maintenanceMode
  } catch (error) {
    console.error("Error checking maintenance mode:", error)
    return false
  }
}

// Check if registration is enabled
export async function isRegistrationEnabled(): Promise<boolean> {
  try {
    const settings = await getSystemSettings()
    return settings.registrationEnabled
  } catch (error) {
    console.error("Error checking if registration is enabled:", error)
    return true // Default to enabled
  }
}
