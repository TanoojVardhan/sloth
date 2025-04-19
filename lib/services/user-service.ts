import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"

export interface UserProfile {
  id: string
  name: string
  email: string
  photoURL?: string
  bio?: string
  timezone?: string
  createdAt: Date
  lastLogin?: Date
  emailVerified: boolean
  preferences?: {
    theme?: "light" | "dark" | "system"
    notifications?: {
      email?: boolean
      push?: boolean
      tasks?: boolean
      events?: boolean
      goals?: boolean
    }
    defaultView?: "tasks" | "calendar" | "goals"
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    const userData = userSnap.data()

    return {
      id: userSnap.id,
      name: userData.name || "",
      email: userData.email || "",
      photoURL: userData.photoURL,
      bio: userData.bio,
      timezone: userData.timezone,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLogin: userData.lastLogin?.toDate(),
      emailVerified: userData.emailVerified || false,
      preferences: userData.preferences || {},
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<UserProfile, "id" | "createdAt" | "emailVerified">>,
): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)

    // Remove id from data if present
    const { id, createdAt, emailVerified, ...updateData } = data as any

    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    return false
  }
}

export async function createUserProfile(userId: string, data: Partial<Omit<UserProfile, "id">>): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)

    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error creating user profile:", error)
    return false
  }
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    return {
      id: userDoc.id,
      name: userData.name || "",
      email: userData.email || "",
      photoURL: userData.photoURL,
      bio: userData.bio,
      timezone: userData.timezone,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLogin: userData.lastLogin?.toDate(),
      emailVerified: userData.emailVerified || false,
      preferences: userData.preferences || {},
    }
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}
