import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description?: string
  gradient?: string
  children?: ReactNode
}

const gradientStyles: Record<string, { bg: string; text: string }> = {
  "from-blue-600 via-purple-600 to-pink-600": {
    bg: "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600",
    text: "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600",
  },
  "from-emerald-600 to-teal-600": {
    bg: "bg-gradient-to-br from-emerald-600 to-teal-600",
    text: "bg-gradient-to-br from-emerald-600 to-teal-600",
  },
  "from-blue-600 to-cyan-600": {
    bg: "bg-gradient-to-br from-blue-600 to-cyan-600",
    text: "bg-gradient-to-br from-blue-600 to-cyan-600",
  },
  "from-orange-600 to-red-600": {
    bg: "bg-gradient-to-br from-orange-600 to-red-600",
    text: "bg-gradient-to-br from-orange-600 to-red-600",
  },
  "from-violet-600 to-purple-600": {
    bg: "bg-gradient-to-br from-violet-600 to-purple-600",
    text: "bg-gradient-to-br from-violet-600 to-purple-600",
  },
  "from-amber-600 to-orange-600": {
    bg: "bg-gradient-to-br from-amber-600 to-orange-600",
    text: "bg-gradient-to-br from-amber-600 to-orange-600",
  },
  "from-cyan-600 to-blue-600": {
    bg: "bg-gradient-to-br from-cyan-600 to-blue-600",
    text: "bg-gradient-to-br from-cyan-600 to-blue-600",
  },
  "from-blue-600 via-indigo-600 to-purple-600": {
    bg: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600",
    text: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600",
  },
  "from-purple-600 to-pink-600": {
    bg: "bg-gradient-to-br from-purple-600 to-pink-600",
    text: "bg-gradient-to-br from-purple-600 to-pink-600",
  },
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  gradient = "from-purple-600 to-pink-600",
  children,
}: PageHeaderProps) {
  const styles = gradientStyles[gradient] || gradientStyles["from-purple-600 to-pink-600"]
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background/95 to-muted/30 p-8 backdrop-blur-sm">
      {/* Background decoration */}
      <div className={cn("absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-10 blur-3xl", styles.bg)}></div>
      <div className={cn("absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-10 blur-3xl", styles.bg)}></div>
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-5">
          {/* Icon with gradient border */}
          <div className="relative">
            <div className={cn("absolute -inset-1 rounded-2xl opacity-75 blur-lg", styles.bg)}></div>
            <div className={cn("relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 shadow-2xl", styles.bg)}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Title and description */}
          <div className="space-y-2 pt-1">
            <h1 className={cn("text-4xl font-bold tracking-tight bg-clip-text text-transparent", styles.text)}>
              {title}
            </h1>
            {description && (
              <p className="max-w-2xl text-base text-muted-foreground/90">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
