import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "./firebase"
import { createUser, getUser } from "./firebase-db"
import type { User } from "@/types/entities"

const googleProvider = new GoogleAuthProvider()

// ============= AUTH OPERATIONS =============

export async function signUpWithEmail(email: string, password: string, name?: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create user document in Firestore
    const userData: Omit<User, "userId"> = {
      email: firebaseUser.email || email,
      name: name || undefined,
    }

    await createUser(firebaseUser.uid, userData)

    return {
      userId: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: name,
    }
  } catch (error) {
    const err = error as { code?: string; message?: string }
    throw {
      code: err.code || "AUTH_ERROR",
      message: err.message || "Sign up failed",
    }
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user data from Firestore
    const userData = await getUser(firebaseUser.uid)

    return {
      userId: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: userData?.name || "User",
    }
  } catch (error) {
    const err = error as { code?: string; message?: string }
    throw {
      code: err.code || "AUTH_ERROR",
      message: err.message || "Sign in failed",
    }
  }
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    const firebaseUser = userCredential.user

    // Check if user exists in Firestore
    let userData = await getUser(firebaseUser.uid)

    if (!userData) {
      // Create user document in Firestore
      const newUserData: Omit<User, "userId"> = {
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || undefined,
      }

      await createUser(firebaseUser.uid, newUserData)

      userData = {
        userId: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || undefined,
      }
    }

    return userData
  } catch (error) {
    const err = error as { code?: string; message?: string }
    throw {
      code: err.code || "AUTH_ERROR",
      message: err.message || "Google sign in failed",
    }
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    const err = error as { code?: string; message?: string }
    throw {
      code: err.code || "AUTH_ERROR",
      message: err.message || "Sign out failed",
    }
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

export function hasPasswordProvider(): boolean {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) return false
  return firebaseUser.providerData.some((p) => p.providerId === "password")
}

// Adds an email/password credential to the CURRENT account (e.g. one that
// was created via Google Sign-In) without creating a second account. This
// lets the same account also sign in with email/password elsewhere, such as
// the Android app, which doesn't support Google Sign-In yet.
export async function addPasswordToAccount(password: string): Promise<void> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser || !firebaseUser.email) {
    throw { code: "AUTH_ERROR", message: "You need to be signed in to set a password." }
  }
  try {
    const credential = EmailAuthProvider.credential(firebaseUser.email, password)
    await linkWithCredential(firebaseUser, credential)
  } catch (error) {
    const err = error as { code?: string; message?: string }
    throw {
      code: err.code || "AUTH_ERROR",
      message: err.message || "Couldn't set a password",
    }
  }
}
