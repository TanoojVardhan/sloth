"use client"

import { useState } from "react"

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days = []
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i))
  const prefix = Array(first.getDay()).fill(null)
  return [...prefix, ...days]
}

export function MiniCalendar() {
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const days = getMonthDays(cursor.getFullYear(), cursor.getMonth())

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          aria-label="Prev"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-md bg-secondary px-2 py-1"
        >
          {"<"}
        </button>
        <div className="text-sm font-medium">
          {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </div>
        <button
          aria-label="Next"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-md bg-secondary px-2 py-1"
        >
          {">"}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => (
          <div
            key={i}
            className={`rounded-md px-2 py-1 ${d && d.toDateString() === new Date().toDateString() ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {d ? d.getDate() : ""}
          </div>
        ))}
      </div>
    </div>
  )
}
