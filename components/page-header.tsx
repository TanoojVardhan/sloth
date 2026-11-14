import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
}

// A single, calm treatment shared by every page: Sloth Planner's own voice
// is "stay organized, calmly," so headers stay quiet and consistent rather
// than each page getting its own bright gradient.
export function PageHeader({ icon: Icon, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="flex items-center gap-3 font-display text-3xl font-semibold text-foreground text-balance sm:text-4xl">
          <Icon className="h-6 w-6 shrink-0 text-primary/70 sm:h-7 sm:w-7" aria-hidden />
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
        )}
      </div>

      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
