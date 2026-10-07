export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const styles =
    priority === "high"
      ? "bg-destructive/10 text-destructive"
      : priority === "medium"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-accent/15 text-accent-foreground"
  return <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${styles}`}>{priority}</span>
}
