// Shared date/time formatting for anything that shows an event's start/end.
// Always explicit 12-hour AM/PM, regardless of the browser/OS locale (some
// locales, e.g. en-IN, default toLocaleString to a 24-hour clock).

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function formatEventDateTime(iso: string): string {
  return `${formatEventDate(iso)}, ${formatEventTime(iso)}`
}

// Minutes-before-start reminder options, shared between the Events page's
// "Remind me" picker and anywhere else that needs to render the chosen value.
export const REMINDER_OPTIONS: { value: string; label: string; minutes: number | null }[] = [
  { value: "none", label: "No reminder", minutes: null },
  { value: "0", label: "At start time", minutes: 0 },
  { value: "5", label: "5 minutes before", minutes: 5 },
  { value: "15", label: "15 minutes before", minutes: 15 },
  { value: "30", label: "30 minutes before", minutes: 30 },
  { value: "60", label: "1 hour before", minutes: 60 },
  { value: "1440", label: "1 day before", minutes: 1440 },
]

export function reminderLabel(minutes?: number | null): string {
  if (minutes === null || minutes === undefined) return "No reminder"
  const match = REMINDER_OPTIONS.find((o) => o.minutes === minutes)
  return match ? match.label : `${minutes} minutes before`
}
