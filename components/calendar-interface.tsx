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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs defaultValue="month" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium">
              {currentMonth} {currentYear}
            </h3>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm">
            Today
          </Button>
        </div>
        
        <div>
          {activeTab === "month" && <CalendarView />}
          {activeTab === "week" && <div className="h-96 flex items-center justify-center text-slate-500">Weekly view coming soon</div>}
          {activeTab === "day" && <div className="h-96 flex items-center justify-center text-slate-500">Daily view coming soon</div>}
        </div>
        
        <div className="mt-6">
          <UpcomingEvents />
        </div>
      </CardContent>
    </Card>
  )
}