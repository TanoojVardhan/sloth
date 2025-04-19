"use client"

import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"

export function AuthStatus() {
  const { status, data: session } = useSession()

  if (status === "loading") {
    return <Skeleton className="h-6 w-24" />
  }

  if (status === "authenticated") {
    return <div className="text-sm text-foreground/70">Signed in as {session.user.email}</div>
  }

  return <div className="text-sm text-foreground/70">Not signed in</div>
}
