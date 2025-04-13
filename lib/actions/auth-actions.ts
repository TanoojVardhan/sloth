"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface UserData {
  name: string
  email: string
  password: string
}

interface AuthResult {
  success: boolean
  message?: string
  userId?: string
}

// Sign up a new user
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in an existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign out the current user
export const logOut = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_id");
    await signOut(auth);
  } catch (error) {
    throw error;
  }
}

// Google login
export const signInWithGoogle = async () => {
  'use client';
  
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Set a session cookie
    const cookieStore = await cookies();
    const sessionId = Math.random().toString(36).substring(2);
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    revalidatePath("/");
    
    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// This is a mock implementation. In a real app, you would connect to a database
export async function createUser(userData: UserData): Promise<AuthResult> {
  try {
    // Simulate server delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, you would:
    // 1. Check if user already exists
    // 2. Hash the password
    // 3. Store user in database
    // 4. Create a session

    // For demo purposes, we'll just check if the email contains "error" to simulate an error
    if (userData.email.includes("error")) {
      return {
        success: false,
        message: "A user with this email already exists.",
      }
    }

    // Set a mock session cookie
    const cookieStore = await cookies();
    const sessionId = Math.random().toString(36).substring(2);
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return {
      success: true,
      userId: "user_" + Math.random().toString(36).substring(2),
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Simulate server delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, you would:
    // 1. Find the user by email
    // 2. Verify the password
    // 3. Create a session

    // For demo purposes, we'll just check if the email contains "error" to simulate an error
    if (email.includes("error")) {
      return {
        success: false,
        message: "Invalid email or password.",
      }
    }

    // Set a mock session cookie
    const cookieStore = await cookies();
    const sessionId = Math.random().toString(36).substring(2);
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return {
      success: true,
      userId: "user_" + Math.random().toString(36).substring(2),
    }
  } catch (error) {
    console.error("Error logging in:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function logoutUser(): Promise<AuthResult> {
  try {
    // Delete the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("session_id");
    
    // Call Firebase signOut
    await signOut(auth);
    
    // Revalidate all pages that might depend on authentication state
    revalidatePath("/");
    
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error logging out:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}
