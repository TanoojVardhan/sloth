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
    <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1 pt-0.5">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
          {description && (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
          )}
        </div>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
