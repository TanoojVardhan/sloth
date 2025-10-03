import Calendar31 from "@/components/calendar/calendar-31"
import { Card } from "@/components/ui/card"

export default function CalendarPage() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <Card className="mb-6 p-6">
        <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
        <p className="text-muted-foreground text-sm">
          Browse months, click a day to add quick notes or view scheduled items.
        </p>
      </Card>
      <Calendar31 />
    </div>
  )
}
