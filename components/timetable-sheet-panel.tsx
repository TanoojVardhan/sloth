"use client"

import { useEffect, useState } from "react"
import { deleteField } from "firebase/firestore"
import { AlertCircle, Copy, RefreshCw, Settings2, Sheet } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateUser } from "@/lib/firebase-db"
import { runTimetableSync, TIMETABLE_SYNCED_EVENT, type SyncResult } from "@/lib/timetable-sync"
import { resolveSource, templateAsTsv } from "@/lib/timetable-sheet"
import { timeAgo } from "@/lib/student"
import { cn } from "@/lib/utils"

// Firestore needs deleteField() to clear a value; the User type just calls it "string[]".
const CLEAR = deleteField() as unknown as string[]

export function TimetableSheetPanel() {
  const { user, refreshUser } = useAuth()
  const [last, setLast] = useState<SyncResult | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const [showPick, setShowPick] = useState(false)
  const [dismissedChanges, setDismissedChanges] = useState(false)

  const url = user?.timetableSheetUrl ?? ""
  const options = last?.specializations.length ? last.specializations : (user?.timetableOptions ?? [])
  const picked = user?.specializations
  const stalePick =
    picked !== undefined &&
    picked.length > 0 &&
    options.length > 0 &&
    !picked.some((x) => options.some((o) => o.toLowerCase() === x.toLowerCase()))
  const needsPick = !!url && (picked === undefined || stalePick) && options.length > 0

  useEffect(() => {
    const onSynced = (e: Event) => {
      setLast((e as CustomEvent<SyncResult>).detail)
      setDismissedChanges(false)
      setSyncing(false)
    }
    window.addEventListener(TIMETABLE_SYNCED_EVENT, onSynced)
    return () => window.removeEventListener(TIMETABLE_SYNCED_EVENT, onSynced)
  }, [])

  // Students have to choose before any classes appear, so ask straight away.
  useEffect(() => {
    if (needsPick) setShowPick(true)
  }, [needsPick])

  async function refresh() {
    if (!user) return
    setSyncing(true)
    await runTimetableSync(user)
    setSyncing(false)
  }

  if (!user) return null

  if (!url) {
    return (
      <>
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sheet className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Keep your timetable in sync with a Google Sheet or Excel file</h2>
              <p className="text-sm text-muted-foreground">
                Connect your college&apos;s sheet once. Weekly changes and last-minute edits show up here and in the phone widgets.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowConnect(true)}>Connect sheet</Button>
        </Card>
        <ConnectDialog open={showConnect} onClose={() => setShowConnect(false)} initialUrl="" onSaved={refreshUser} />
      </>
    )
  }

  const chosen = user.specializations ?? []
  const changes = last?.changes ?? []

  return (
    <>
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Sheet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Synced from your sheet</span>
          <span className="text-xs text-muted-foreground">
            checked {timeAgo(last?.at ?? user.timetableSyncedAt)}
            {user.timetableUntil ? ` · valid until ${user.timetableUntil}` : ""}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled={syncing} onClick={() => void refresh()}>
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowConnect(true)}>
              <Settings2 className="h-3.5 w-3.5" /> Source
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Your subjects:</span>
          {chosen.length ? (
            <>
              {chosen.slice(0, 6).map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {s}
                </span>
              ))}
              {chosen.length > 6 && <span className="text-xs text-muted-foreground">+{chosen.length - 6} more</span>}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">none chosen</span>
          )}
          {options.length > 0 && (
            <button type="button" onClick={() => setShowPick(true)} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
              {chosen.length ? "Change" : "Choose"}
            </button>
          )}
        </div>

        {last && !last.ok && last.error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{last.error}</span>
          </div>
        )}

        {last?.newSubjects && last.newSubjects.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-medium">
              {last.newSubjects.length} new subject{last.newSubjects.length === 1 ? "" : "s"} in your sheet
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {last.newSubjects.slice(0, 4).join(", ")}
              {last.newSubjects.length > 4 ? ` and ${last.newSubjects.length - 4} more` : ""}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await updateUser(user.userId, { specializations: [...chosen, ...(last.newSubjects ?? [])] })
                  await refreshUser()
                  setLast((l) => (l ? { ...l, newSubjects: [] } : l))
                }}
              >
                Add {last.newSubjects.length === 1 ? "it" : "them"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowPick(true)}>
                Review
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setLast((l) => (l ? { ...l, newSubjects: [] } : l))}>
                Not now
              </Button>
            </div>
          </div>
        )}

        {changes.length > 0 && !dismissedChanges && (
          <div className="rounded-lg bg-primary/10 p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">Your timetable changed</p>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setDismissedChanges(true)}>
                Dismiss
              </button>
            </div>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {changes.slice(0, 6).map((c) => (
                <li key={c}>{c}</li>
              ))}
              {changes.length > 6 && <li>and {changes.length - 6} more</li>}
            </ul>
          </div>
        )}

        {last && last.skipped.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {last.skipped.length} row{last.skipped.length === 1 ? "" : "s"} in the sheet couldn&apos;t be read (row {last.skipped[0].line}: {last.skipped[0].reason}
            {last.skipped.length > 1 ? ", ..." : ""}).
          </p>
        )}
      </Card>

      <ConnectDialog open={showConnect} onClose={() => setShowConnect(false)} initialUrl={url} onSaved={refreshUser} />
      <PickDialog
        open={showPick}
        options={options}
        groups={last?.groups ?? {}}
        initial={chosen}
        forced={needsPick}
        onClose={() => setShowPick(false)}
        onDisconnect={async () => {
          await updateUser(user.userId, { timetableSheetUrl: null, specializations: CLEAR })
          await refreshUser()
          setShowPick(false)
        }}
        onSave={async (list) => {
          await updateUser(user.userId, { specializations: list })
          await refreshUser()
          setShowPick(false)
        }}
      />
    </>
  )
}

function ConnectDialog({
  open,
  onClose,
  initialUrl,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initialUrl: string
  onSaved: () => Promise<void>
}) {
  const { user } = useAuth()
  const [value, setValue] = useState(initialUrl)
  const [until, setUntil] = useState(user?.timetableUntil ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(initialUrl)
      setUntil(user?.timetableUntil ?? "")
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUrl])

  async function save() {
    if (!user) return
    const check = resolveSource(value)
    if ("error" in check) return setError(check.error)
    setSaving(true)
    setError(null)
    try {
      const changed = value.trim() !== initialUrl
      // A different sheet has different subjects, so ask again.
      await updateUser(user.userId, {
        timetableSheetUrl: value.trim(),
        timetableUntil: (until || deleteField()) as unknown as string,
        ...(changed ? { specializations: CLEAR } : {}),
      })
      await onSaved()
      onClose()
    } catch {
      setError("Couldn't save. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(templateAsTsv())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy. Select the text in the example below instead.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect your timetable</DialogTitle>
          <DialogDescription>
            Works with a Google Sheet, or an Excel (.xlsx) file on Google Drive, OneDrive or SharePoint. Share it as &quot;Anyone with the link&quot; (Viewer), then paste the link here. No sign-in needed. It re-checks automatically, so edits show up within minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-url">Sheet or Excel file link</Label>
            <Input id="sheet-url" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
            <p className="text-xs text-muted-foreground">Link to the tab you want. Each class is one row.</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-xs">
            <p className="font-medium">Columns the first row should have</p>
            <p className="mt-1 text-muted-foreground">
              Day, Start, End, Subject, and optionally Room, Teacher, Date, Until, Status and a group column (Specialization). Any other layout is read by AI.
              A row with a Date changes only that day, and Status &quot;Cancelled&quot; cancels it.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-2 gap-2" onClick={() => void copyTemplate()}>
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied. Paste into cell A1" : "Copy example to paste into a sheet"}
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-until">Timetable valid until (optional)</Label>
            <Input id="sheet-until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Weekly classes stop showing after this day. A row can also have its own Until column, which wins over this date.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initialUrl ? (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={saving}
              onClick={async () => {
                if (!user) return
                setSaving(true)
                await updateUser(user.userId, { timetableSheetUrl: null, specializations: CLEAR }).catch(() => undefined)
                await onSaved()
                setSaving(false)
                onClose()
              }}
            >
              Disconnect
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={saving || !value.trim()} onClick={() => void save()}>
            {saving ? "Saving..." : "Save and sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PickDialog({
  open,
  options,
  groups,
  initial,
  forced,
  onClose,
  onSave,
  onDisconnect,
}: {
  open: boolean
  options: string[]
  groups: Record<string, string>
  initial: string[]
  forced: boolean
  onClose: () => void
  onSave: (list: string[]) => Promise<void>
  onDisconnect: () => Promise<void>
}) {
  const [picked, setPicked] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (open) {
      setPicked(initial)
      setQuery("")
    }
  }, [open, initial])

  const visible = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
  // Group headings only help when the sheet names more than one group.
  const groupNames = Array.from(new Set(visible.map((o) => groups[o] ?? "")))
  const useGroups = new Set(options.map((o) => groups[o] ?? "")).size > 1
  const sections = useGroups ? groupNames : [""]
  const inSection = (g: string) => (useGroups ? visible.filter((o) => (groups[o] ?? "") === g) : visible)
  const setMany = (list: string[], on: boolean) =>
    setPicked((p) => (on ? Array.from(new Set([...p, ...list])) : p.filter((x) => !list.includes(x))))
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !forced && onClose()}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => forced && e.preventDefault()}
        onEscapeKeyDown={(e) => forced && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Pick your subjects</DialogTitle>
          <DialogDescription>
            Tick every subject you attend. Only those classes show in your timetable and widgets.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subjects" aria-label="Search subjects" />
            <Button type="button" variant="outline" size="sm" onClick={() => setMany(visible, true)}>
              Select all
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPicked([])}>
              Clear
            </Button>
          </div>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {visible.length === 0 && <p className="text-sm text-muted-foreground">No subject matches that search.</p>}
            {sections.map((g) => {
              const list = inSection(g)
              if (!list.length) return null
              return (
                <div key={g || "all"} className="space-y-2">
                  {useGroups && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{g || "Common subjects"}</p>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => setMany(list, !list.every((o) => picked.includes(o)))}
                      >
                        {list.every((o) => picked.includes(o)) ? "Untick group" : "Tick group"}
                      </button>
                    </div>
                  )}
                  {list.map((o) => {
                    const on = picked.includes(o)
                    return (
                      <button
                        key={o}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(o)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition-colors",
                          on ? "border-primary bg-primary/10" : "hover:bg-muted/60",
                        )}
                      >
                        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs", on ? "border-primary bg-primary text-primary-foreground" : "")}>
                          {on ? "✓" : ""}
                        </span>
                        {o}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {forced ? (
            <Button variant="ghost" disabled={saving} onClick={() => void onDisconnect()}>
              Disconnect sheet
            </Button>
          ) : (
            <Button variant="ghost" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            disabled={saving || picked.length === 0}
            onClick={async () => {
              setSaving(true)
              setError(null)
              try {
                await onSave(picked)
              } catch {
                setError("Couldn't save. Try again?")
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? "Saving..." : `Show my timetable (${picked.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
