"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { updateUser } from "@/lib/firebase-db"
import { OCCUPATIONS } from "@/lib/student"
import { cn } from "@/lib/utils"
import type { Occupation } from "@/types/entities"

export function OccupationOptions({ value, onChange }: { value?: Occupation | null; onChange: (o: Occupation) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Occupation">
      {OCCUPATIONS.map((o) => {
        const selected = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
              selected ? "border-primary bg-primary/10" : "hover:bg-muted/60",
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {o.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{o.blurb}</span>
            </span>
            {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}

/** First-run question. Shown once; "Skip" stores "other" so it never nags. */
export function OccupationOnboarding() {
  const { user, refreshUser } = useAuth()
  const [choice, setChoice] = useState<Occupation | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || user.occupation !== undefined) return null

  async function save(o: Occupation) {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await updateUser(user.userId, { occupation: o })
      await refreshUser()
    } catch {
      setError("Couldn't save that. Check your connection and try again.")
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="max-w-xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">What do you do?</DialogTitle>
          <DialogDescription>
            Sloth Planner adds the tools that fit your day. You can change this any time in Settings.
          </DialogDescription>
        </DialogHeader>
        <OccupationOptions value={choice} onChange={setChoice} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" disabled={saving} onClick={() => void save("other")}>
            Skip for now
          </Button>
          <Button disabled={!choice || saving} onClick={() => choice && void save(choice)}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
