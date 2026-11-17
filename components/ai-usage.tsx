"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { auth } from "@/lib/firebase"

/** Settings card: today's AI assistant usage. */
export function AiUsageCard() {
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ai/usage", {
          method: "POST",
          headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
        })
        if (res.ok) setUsage(await res.json())
      } catch {
        /* shows nothing */
      }
    })()
  }, [])

  if (!usage) return null
  return (
    <Card className="flex items-center gap-3 p-6">
      <Sparkles className="h-5 w-5 text-primary" />
      <div className="text-sm">
        <h2 className="font-display text-lg font-semibold">AI assistant usage</h2>
        <p className="text-muted-foreground">
          {usage.limit === null
            ? `${usage.used} messages today. No daily limit on your account.`
            : `${usage.used} of ${usage.limit} messages used today. Resets at midnight IST.`}
        </p>
      </div>
    </Card>
  )
}
