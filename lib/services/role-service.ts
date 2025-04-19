import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"

export type UserRole = "user" | "admin" | "super_admin"

export interface RolePermissions {
  canManageUsers: boolean
  canManageContent: boolean
  canManageSettings: boolean
  canSendNotifications: boolean
  canManageRoles: boolean
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  user: {
    canManageUsers: false,
    canManageContent: false,
    canManageSettings: false,
    canSendNotifications: false,
    canManageRoles: false,
  },
  admin: {
    canManageUsers: true,
    canManageContent: true,
    canManageSettings: true,
    canSendNotifications: true,
    canManageRoles: false,
  },
  super_admin: {
    canManageUsers: true,
    canManageContent: true,
    canManageSettings: true,
    canSendNotifications: true,
    canManageRoles: true,
  },
}

// Initialize super admins
export async function initializeSuperAdmins() {
  const superAdminEmails = ["tanoojvardhanstudent@gmail.com", "tanoojvardhangantasala@gmail.com"]

  try {
    // Get the admin settings document
    const adminSettingsRef = doc(db, "admin", "settings")
    const adminSettingsSnap = await getDoc(adminSettingsRef)

    if (!adminSettingsSnap.exists()) {
      // Create the admin settings document if it doesn't exist
      await setDoc(adminSettingsRef, {
        superAdminEmails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else {
      // Update the super admin emails if the document exists
      const data = adminSettingsSnap.data()
      const existingSuperAdmins = data.superAdminEmails || []

      // Add any missing super admins
      const newSuperAdmins = superAdminEmails.filter((email) => !existingSuperAdmins.includes(email))

      if (newSuperAdmins.length > 0) {
        await updateDoc(adminSettingsRef, {
          superAdminEmails: [...existingSuperAdmins, ...newSuperAdmins],
          updatedAt: serverTimestamp(),
        })
      }
    }
  } catch (error) {
    console.error("Error initializing super admins:", error)
    throw error
  }
}

// Check if a user is a super admin
export async function isSuperAdmin(email: string): Promise<boolean> {
  try {
    const adminSettingsRef = doc(db, "admin", "settings")
    const adminSettingsSnap = await getDoc(adminSettingsRef)

    if (!adminSettingsSnap.exists()) {
      await initializeSuperAdmins()
      return ["tanoojvardhanstudent@gmail.com", "tanoojvardhangantasala@gmail.com"].includes(email)
    }

    const data = adminSettingsSnap.data()
    return data.superAdminEmails?.includes(email) || false
  } catch (error) {
    console.error("Error checking super admin status:", error)
    return false
  }
}

// Get user role
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const userRoleRef = doc(db, "userRoles", userId)
    const userRoleSnap = await getDoc(userRoleRef)

    if (!userRoleSnap.exists()) {
      return "user" // Default role
    }

    return userRoleSnap.data().role as UserRole
  } catch (error) {
    console.error("Error getting user role:", error)
    return "user" // Default to user role on error
  }
}

// Set user role
export async function setUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const userRoleRef = doc(db, "userRoles", userId)

    await setDoc(
      userRoleRef,
      {
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error("Error setting user role:", error)
    return false
  }
}

// Get all users with admin roles
export async function getAdminUsers(): Promise<Array<{ id: string; email: string; role: UserRole }>> {
  try {
    const userRolesRef = collection(db, "userRoles")
    const q = query(userRolesRef, where("role", "in", ["admin", "super_admin"]))
    const querySnapshot = await getDocs(q)

    const adminUsers = []

    for (const docSnap of querySnapshot.docs) {
      const userRef = doc(db, "users", docSnap.id)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        adminUsers.push({
          id: docSnap.id,
          email: userSnap.data().email,
          role: docSnap.data().role,
        })
      }
    }

    return adminUsers
  } catch (error) {
    console.error("Error getting admin users:", error)
    return []
  }
}

// Add a super admin
export async function addSuperAdmin(email: string): Promise<boolean> {
  try {
    const adminSettingsRef = doc(db, "admin", "settings")

    await updateDoc(adminSettingsRef, {
      superAdminEmails: arrayUnion(email),
      updatedAt: serverTimestamp(),
    })

    // Find the user with this email and update their role
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      await setUserRole(userDoc.id, "super_admin")
    }

    return true
  } catch (error) {
    console.error("Error adding super admin:", error)
    return false
  }
}

// Remove a super admin
export async function removeSuperAdmin(email: string): Promise<boolean> {
  try {
    // Don't allow removing the initial super admins
    const initialSuperAdmins = ["tanoojvardhanstudent@gmail.com", "tanoojvardhangantasala@gmail.com"]

    if (initialSuperAdmins.includes(email)) {
      return false
    }

    const adminSettingsRef = doc(db, "admin", "settings")

    await updateDoc(adminSettingsRef, {
      superAdminEmails: arrayRemove(email),
      updatedAt: serverTimestamp(),
    })

    // Find the user with this email and update their role
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      await setUserRole(userDoc.id, "admin")
    }

    return true
  } catch (error) {
    console.error("Error removing super admin:", error)
    return false
  }
}

// Check if user has specific permission
export async function hasPermission(userId: string, permission: keyof RolePermissions): Promise<boolean> {
  try {
    const userRoleRef = doc(db, "userRoles", userId)
    const userRoleSnap = await getDoc(userRoleRef)

    if (!userRoleSnap.exists()) {
      return false
    }

    const data = userRoleSnap.data()
    return data.permissions?.[permission] || false
  } catch (error) {
    console.error(`Error checking permission ${permission}:`, error)
    return false
  }
}
