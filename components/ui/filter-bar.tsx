import type React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  tabs?: Array<{
    value: string
    label: string
  }>
  defaultTab?: string
  onTabChange?: (value: string) => void
  showFilters?: boolean
  showSort?: boolean
  className?: string
  children?: React.ReactNode
}

export function FilterBar({ 
  tabs, 
  defaultTab, 
  onTabChange, 
  showFilters = true, 
  showSort = true, 
  className,
  children 
}: FilterBarProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center space-x-4">
        {tabs && (
          <Tabs defaultValue={defaultTab || tabs[0]?.value} onValueChange={onTabChange}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        {children}
      </div>
      
      {(showFilters || showSort) && (
        <div className="flex gap-2">
          {showFilters && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          )}
          {showSort && (
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
          )}
        </div>
      )}
    </div>
  )
}