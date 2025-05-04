"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarView } from "@/components/calendar-view"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import UpcomingEvents from "@/components/upcoming-events"

export function CalendarInterface() {
  const currentMonth = new Date().toLocaleString("default", { month: "long" })
  const currentYear = new Date().getFullYear()
  const [activeTab, setActiveTab] = useState("month")
  
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