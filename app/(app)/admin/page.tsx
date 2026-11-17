"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { auth } from "@/lib/firebase"

type Overview = {
  totals: { users: number; new7: number; new30: number; encrypted: number; twoStep: number; messagesToday: number }
  days: { day: string; signups: number; messages: number; aiUsers: number }[]
  top: { email: string; used: number }[]
  traffic: { days: { day: string; views: number; visitors: number }[]; sections: { name: string; views: number }[] }
  flags: { email: string; count: number; lastDay: string }[]
  settings: {
    dailyLimit: number | null
    effectiveLimit: number
    unlimited: string[]
    blocked: string[]
    unlimitedFromEnv: string[]
    admins: string[]
  }
}

export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState("")
  const [email, setEmail] = useState("")
  const [blockEmail, setBlockEmail] = useState("")
  const [busy, setBusy] = useState(false)

  const call = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401 || res.status === 403) return setDenied(true)
      if (!res.ok) return setError(json.error || "Something went wrong.")
      setData(json)
      setLimit(json.settings.dailyLimit === null ? "" : String(json.settings.dailyLimit))
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void call({ action: "overview" })
  }, [call])

  if (denied) return <p className="py-20 text-center text-sm text-muted-foreground">This page is for admins only.</p>
  if (!data) return <div className="flex justify-center py-20">{error ? <p className="text-sm text-destructive">{error}</p> : <Loader2 className="h-5 w-5 animate-spin" />}</div>

  const t = data.totals
  const viewsToday = data.traffic.days[0]
  const stats: [string, number][] = [
    ["Page views today", viewsToday.views],
    ["Visitors today", viewsToday.visitors],
    ["Users", t.users],
    ["New in 7 days", t.new7],
    ["New in 30 days", t.new30],
    ["Passphrase on", t.encrypted],
    ["Two-step on", t.twoStep],
    ["AI messages today", t.messagesToday],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">Only visible to emails in ADMIN_EMAILS.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data.flags.length > 0 && (
        <Card className="space-y-2 border-destructive/50 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" /> Abusive language in AI messages (last 14 days)
          </h2>
          <p className="text-xs text-muted-foreground">Only the account and count are recorded, never the message itself. A word list can be wrong, so check before blocking.</p>
          <ul className="space-y-1 text-sm">
            {data.flags.map((f) => (
              <li key={f.email} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {f.email} <span className="text-muted-foreground">· {f.count} message{f.count === 1 ? "" : "s"}, last on {f.lastDay}</span>
                </span>
                {data.settings.blocked.includes(f.email.toLowerCase()) ? (
                  <span className="text-xs text-muted-foreground">AI already off</span>
                ) : (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => void call({ action: "block", email: f.email })}>
                    Turn AI off for this account
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <Card key={label} className="p-4">
            <div className="text-2xl font-semibold">{n}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Last 14 days</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-4">Day (IST)</th>
                <th className="pr-4">Page views</th>
                <th className="pr-4">Visitors</th>
                <th className="pr-4">New users</th>
                <th className="pr-4">AI messages</th>
                <th>AI users</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((d, i) => (
                <tr key={d.day} className="border-t">
                  <td className="py-1 pr-4">{d.day}</td>
                  <td className="pr-4">{data.traffic.days[i].views}</td>
                  <td className="pr-4">{data.traffic.days[i].visitors}</td>
                  <td className="pr-4">{d.signups}</td>
                  <td className="pr-4">{d.messages}</td>
                  <td>{d.aiUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Visitors are counted per browser per day, with no IP or account stored. Counting started when this was deployed. Your admin visits aren&apos;t counted.
        </p>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Busiest pages (last 7 days)</h2>
        {data.traffic.sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No page views yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.traffic.sections.map((p) => (
              <li key={p.name} className="flex justify-between">
                <span>/{p.name === "home" ? "" : p.name}</span>
                <span className="text-muted-foreground">{p.views}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Top AI users today</h2>
        {data.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI messages yet today.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.top.map((u) => (
              <li key={u.email} className="flex justify-between">
                <span>{u.email}</span>
                <span className="text-muted-foreground">{u.used}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">AI daily limit</h2>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void call({ action: "setLimit", value: limit.trim() === "" ? null : Number(limit) })
          }}
        >
          <Input className="w-32" inputMode="numeric" placeholder={`${data.settings.effectiveLimit}`} value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} />
          <Button type="submit" size="sm" disabled={busy}>
            Save
          </Button>
          <span className="text-xs text-muted-foreground">
            Messages per person per day. Empty = the default ({data.settings.dailyLimit === null ? data.settings.effectiveLimit : "AI_DAILY_LIMIT or 30"}).
          </span>
        </form>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Unlimited AI access</h2>
        <p className="text-sm text-muted-foreground">These accounts have no daily limit. Their email must be verified (Google, Apple and GitHub sign-ins are).</p>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            await call({ action: "addUnlimited", email })
            setEmail("")
          }}
        >
          <Input className="max-w-xs" type="email" placeholder="friend@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" size="sm" disabled={busy}>
            Add
          </Button>
        </form>
        <ul className="space-y-1 text-sm">
          {data.settings.unlimited.map((m) => (
            <li key={m} className="flex items-center justify-between">
              <span>{m}</span>
              <Button variant="ghost" size="icon" disabled={busy} onClick={() => void call({ action: "removeUnlimited", email: m })} aria-label={`Remove ${m}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {data.settings.unlimitedFromEnv
            .filter((m) => !data.settings.unlimited.includes(m))
            .map((m) => (
              <li key={m} className="flex justify-between text-muted-foreground">
                <span>{m}</span>
                <span className="text-xs">set in Vercel (AI_UNLIMITED_EMAILS)</span>
              </li>
            ))}
          {data.settings.unlimited.length + data.settings.unlimitedFromEnv.length === 0 && <li className="text-muted-foreground">No one yet.</li>}
        </ul>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">AI turned off</h2>
        <p className="text-sm text-muted-foreground">These accounts can't use the AI assistant. The rest of the planner still works for them.</p>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            await call({ action: "block", email: blockEmail })
            setBlockEmail("")
          }}
        >
          <Input className="max-w-xs" type="email" placeholder="someone@example.com" value={blockEmail} onChange={(e) => setBlockEmail(e.target.value)} required />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>
            Turn off
          </Button>
        </form>
        <ul className="space-y-1 text-sm">
          {data.settings.blocked.map((m) => (
            <li key={m} className="flex items-center justify-between">
              <span>{m}</span>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => void call({ action: "unblock", email: m })}>
                Turn back on
              </Button>
            </li>
          ))}
          {data.settings.blocked.length === 0 && <li className="text-muted-foreground">No one.</li>}
        </ul>
      </Card>
    </div>
  )
}
