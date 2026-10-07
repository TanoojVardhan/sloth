"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { auth } from "@/lib/firebase"

export function useGoogleCalendar() {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkConnection() {
      if (!user) {
        setIsConnected(false)
        setIsChecking(false)
        return
      }

      try {
        const firebaseUser = auth.currentUser
        if (!firebaseUser) {
          setIsConnected(false)
          setIsChecking(false)
          return
        }

        const idToken = await firebaseUser.getIdToken()

        // Check if user has tokens stored
        const response = await fetch("/api/check-token", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsConnected(data.hasToken || false)
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Error checking calendar connection:", error)
        setIsConnected(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkConnection()
  }, [user])

  return { isConnected, isChecking, setIsConnected }
}
