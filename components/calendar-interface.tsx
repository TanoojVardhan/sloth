"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarView } from "@/components/calendar-view"
import UpcomingEvents from "@/components/upcoming-events"

export function CalendarInterface() {
  const [activeTab, setActiveTab] = useState("month")
  
  // Use useCallback to maintain consistent reference of this component
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  
  return (
    <Card>
      <CardContent>
        <div className="p-10">
          {activeTab === "month" && <CalendarView />}
          {activeTab === "week" && (
            <div className="h-96 flex items-center justify-center text-slate-500">
              Weekly view coming soon
            </div>
          )}
          {activeTab === "day" && (
            <div className="h-96 flex items-center justify-center text-slate-500">
              Daily view coming soon
            </div>
          )}
        </div>

        <div className="mt-6">
          <UpcomingEvents />
        </div>
      </CardContent>
    </Card>
  );
}