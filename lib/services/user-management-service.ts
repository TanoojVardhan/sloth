import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type DocumentSnapshot,
} from "firebase/firestore"
import { getUserRole, setUserRole, type UserRole } from "./role-service"

export interface UserListItem {
  id: string
  name: string
  email: string
  photoURL?: string
  createdAt: Date
  lastLogin?: Date
  role: UserRole
}

// Get users with pagination
export async function getUsers(
  options: {
    limit?: number
    startAfter?: DocumentSnapshot
    role?: UserRole
    searchTerm?: string
  } = {},
): Promise<{ users: UserListItem[]; lastDoc: DocumentSnapshot | null }> {
  try {
    const usersRef = collection(db, "users")

    // Start with base query
    let q = query(usersRef, orderBy("createdAt", "desc"))

    // Apply filters
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter))
    }

    if (options.limit) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { users: [], lastDoc: null }
    }

    // Get user data with roles
    const users = []
    for (const docSnapshot of querySnapshot.docs) {
      const userData = docSnapshot.data()

      // Apply search filter if provided
      if (options.searchTerm) {
        const searchLower = options.searchTerm.toLowerCase()
        const nameMatch = userData.name?.toLowerCase().includes(searchLower)
        const emailMatch = userData.email?.toLowerCase().includes(searchLower)

        if (!nameMatch && !emailMatch) {
          continue
        }
      }

      // Get user role
      const role = await getUserRole(docSnapshot.id)

      // Filter by role if provided
      if (options.role && role !== options.role) {
        continue
      }

      users.push({
        id: docSnapshot.id,
        name: userData.name || "",
        email: userData.email || "",
        photoURL: userData.photoURL,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLogin: userData.lastLogin?.toDate(),
        role,
      })
    }

    const lastDoc = users.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null

    return { users, lastDoc }
  } catch (error) {
    console.error("Error getting users:", error)
    return { users: [], lastDoc: null }
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserListItem | null> {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    const userData = userSnap.data()
    const role = await getUserRole(userId)

    return {
      id: userId,
      name: userData.name || "",
      email: userData.email || "",
      photoURL: userData.photoURL,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLogin: userData.lastLogin?.toDate(),
      role,
    }
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Update user role
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    return await setUserRole(userId, role)
  } catch (error) {
    console.error("Error updating user role:", error)
    return false
  }
}

// Disable user account
export async function disableUser(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)

    await updateDoc(userRef, {
      disabled: true,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error disabling user:", error)
    return false
  }
}

// Enable user account
export async function enableUser(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)

    await updateDoc(userRef, {
      disabled: false,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error enabling user:", error)
    return false
  }
}

// Get user count by role
export async function getUserCountByRole(): Promise<Record<UserRole, number>> {
  try {
    const userRolesRef = collection(db, "userRoles")
    const querySnapshot = await getDocs(userRolesRef)

    const counts: Record<UserRole, number> = {
      user: 0,
      admin: 0,
      super_admin: 0,
    }

    querySnapshot.docs.forEach((doc) => {
      const role = doc.data().role as UserRole
      counts[role] = (counts[role] || 0) + 1
    })

    // Count users without explicit roles
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)
    const totalUsers = usersSnapshot.size
    const usersWithRoles = querySnapshot.size

    counts.user += totalUsers - usersWithRoles

    return counts
  } catch (error) {
    console.error("Error getting user count by role:", error)
    return { user: 0, admin: 0, super_admin: 0 }
  }
}
