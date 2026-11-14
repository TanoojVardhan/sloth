export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const styles =
    priority === "high"
      ? "bg-destructive/10 text-destructive"
      : priority === "medium"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-accent/15 text-accent-foreground"
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}>{priority}</span>
}
