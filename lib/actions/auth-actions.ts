"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { createUserProfile } from "@/lib/services/user-service"

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export type UserFormData = z.infer<typeof userSchema>

export async function createUser(userData: UserFormData) {
  try {
    // Validate the data
    const validatedData = userSchema.parse(userData)

    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password)

    const user = userCredential.user

    // Create the user profile in Firestore
    await createUserProfile(user.uid, {
      name: validatedData.name,
      email: validatedData.email,
      emailVerified: user.emailVerified,
    })

    revalidatePath("/login")

    return {
      success: true,
      message: "User created successfully",
      userId: user.uid,
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      }
    }

    // Handle Firebase-specific errors
    if (error.code === "auth/email-already-in-use") {
      return {
        success: false,
        message: "A user with this email already exists.",
      }
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function loginUser(credentials: { email: string; password: string }) {
  try {
    // Attempt to sign in with Firebase
    const result = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
    console.log("Login successful for user:", result.user.uid)
    return {
      success: true,
    }
  } catch (error: any) {
    // Handle Firebase-specific errors
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      console.error("Login failed: Invalid email or password.")
      return {
        success: false,
        message: "Invalid email or password.",
      }
    }
    console.error("Unexpected login error:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function logoutUser() {
  try {
    // Sign out from Firebase
    await auth.signOut()

    // Delete the session cookie
    cookies().delete("next-auth.session-token")
    cookies().delete("__Secure-next-auth.session-token")

    // Revalidate all pages that might depend on authentication state
    revalidatePath("/")

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}
