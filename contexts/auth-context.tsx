"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { navigateTo } from "@/lib/navigation"
import { MOCK_USER, isMockAuthEnabled } from "@/lib/mock-auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  verifyEmail: () => Promise<void>
  updateUserEmail: (email: string) => Promise<void>
  updateUserPassword: (password: string) => Promise<void>
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Set up a safety timeout to prevent infinite loading state
    timeoutId = setTimeout(() => {
      if (isLoading) {
        console.error("Firebase auth state check timed out, setting loading to false");
        setIsLoading(false);
      }
    }, 10000); // 10 second safety timeout
    
    // If mock auth is enabled, use mock user
    if (isMockAuthEnabled()) {
      console.log("Using mock authentication with user:", MOCK_USER.uid)
      setUser(MOCK_USER as unknown as User)
      setIsLoading(false)
      if (timeoutId) clearTimeout(timeoutId);
      return () => {}
    }

    try {
      // Otherwise use real Firebase auth
      console.log("Setting up Firebase auth state listener");
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("Firebase auth state changed:", user ? `User: ${user.uid}` : "No user");
        setUser(user);
        setIsLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      }, (error) => {
        // Handle auth state observer errors
        console.error("Firebase auth state observer error:", error);
        setIsLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      });

      return () => {
        unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
      };
    } catch (error) {
      // Handle setup errors
      console.error("Error setting up Firebase auth:", error);
      setIsLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
      return () => {};
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      // If mock auth is enabled, use mock user
      if (isMockAuthEnabled()) {
        console.log("Mock Google sign in successful")
        setUser(MOCK_USER as unknown as User)
        navigateTo("/dashboard", router)
        return
      }

      setIsLoading(true)
      const provider = new GoogleAuthProvider()

      // Add login persistence
      provider.setCustomParameters({
        prompt: "select_account",
      })

      const result = await signInWithPopup(auth, provider)
      console.log("Google auth successful, user:", result.user.uid)

      // Try to update Firestore, but don't block authentication if it fails
      try {
        // Check if this is a new user
        const userRef = doc(db, "users", result.user.uid)
        const userSnap = await getDoc(userRef)
        if (!userSnap.exists()) {
          // Create a new user document
          await setDoc(userRef, {
            name: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          })
          console.log("Created new user document in Firestore")
        } else {
          // Update last login
          await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
          })
          console.log("Updated existing user's last login")
        }
      } catch (firestoreError) {
        console.error("Firestore operation failed, but authentication succeeded:", firestoreError)
      }

      console.log("Redirecting to dashboard...")

      // Using our updated navigation utility with router
      navigateTo("/dashboard", router)
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        console.error("Google sign-in was canceled by the user.")
        throw new Error("Sign-in canceled. Please try again.")
      } else if (error.code === "auth/network-request-failed") {
        console.error("Network error during Google sign-in.")
        throw new Error("Network error. Please check your connection and try again.")
      } else {
        console.error("Unexpected error during Google sign-in:", error)
        throw new Error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // If mock auth is enabled, use mock user
      if (isMockAuthEnabled()) {
        console.log("Mock email sign in successful")
        setUser(MOCK_USER as unknown as User)
        // Use both router and direct location for maximum reliability
        navigateTo("/dashboard", router)
        return
      }

      setIsLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("Email auth successful, user:", result.user.uid)

      // Try to update Firestore, but don't block authentication if it fails
      try {
        const userRef = doc(db, "users", result.user.uid)
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
        })
        console.log("Updated user's last login")
      } catch (firestoreError) {
        console.error("Firestore operation failed during email login, but authentication succeeded:", firestoreError)
      }

      console.log("Authentication successful, redirecting to dashboard...")
      // Use consistent navigation approach
      navigateTo("/dashboard", router)
      return result.user
    } catch (error) {
      console.error("Error signing in with email:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    try {
      // If mock auth is enabled, use mock user
      if (isMockAuthEnabled()) {
        console.log("Mock email sign up successful")
        setUser(MOCK_USER as unknown as User)
        navigateTo("/dashboard", router)
        return
      }

      setIsLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log("Email signup successful, user:", result.user.uid)

      // Update profile with name
      await updateProfile(result.user, {
        displayName: name,
      })

      // Try to create user document in Firestore, but don't block if it fails
      try {
        // Create a user document
        await setDoc(doc(db, "users", result.user.uid), {
          name,
          email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        })
        console.log("Created user document in Firestore")
      } catch (firestoreError) {
        console.error("Firestore operation failed during signup, but authentication succeeded:", firestoreError)
      }

      // Try to send email verification, but don't block if it fails
      try {
        await sendEmailVerification(result.user)
        console.log("Sent verification email")
      } catch (emailError) {
        console.error("Failed to send verification email, but signup succeeded:", emailError)
      }

      console.log("Redirecting to dashboard...")

      // Using our improved navigation utility with router
      navigateTo("/dashboard", router)
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.error("Error: Email already in use.")
        throw new Error("A user with this email already exists.")
      }
      console.error("Error signing up with email:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      // If using mock auth, just reset the user
      if (isMockAuthEnabled()) {
        setUser(null)
        router.push("/login")
        return
      }
      await signOut(auth)
      console.log("User logged out successfully")
      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    // Skip for mock auth
    if (isMockAuthEnabled()) {
      console.log("Mock password reset successful")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Error resetting password:", error)
      throw error
    }
  }

  const verifyEmail = async () => {
    // Skip for mock auth
    if (isMockAuthEnabled()) {
      console.log("Mock email verification successful")
      return
    }

    try {
      if (user) {
        await sendEmailVerification(user)
      }
    } catch (error) {
      console.error("Error sending verification email:", error)
      throw error
    }
  }

  const updateUserEmail = async (email: string) => {
    // Skip for mock auth
    if (isMockAuthEnabled()) {
      console.log("Mock email update successful")
      return
    }

    try {
      if (user) {
        await updateEmail(user, email)

        // Update Firestore
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, { email })
      }
    } catch (error) {
      console.error("Error updating email:", error)
      throw error
    }
  }

  const updateUserPassword = async (password: string) => {
    // Skip for mock auth
    if (isMockAuthEnabled()) {
      console.log("Mock password update successful")
      return
    }

    try {
      if (user) {
        await updatePassword(user, password)
      }
    } catch (error) {
      console.error("Error updating password:", error)
      throw error
    }
  }

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    // Skip for mock auth
    if (isMockAuthEnabled()) {
      console.log("Mock profile update successful")
      return
    }

    try {
      if (user) {
        await updateProfile(user, data)

        // Update Firestore
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          name: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL,
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        resetPassword,
        verifyEmail,
        updateUserEmail,
        updateUserPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
