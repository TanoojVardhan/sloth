export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const styles =
    priority === "high"
      ? "bg-red-100 text-red-700"
      : priority === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-green-100 text-green-700"
  return <span className={`rounded px-2 py-1 text-xs ${styles}`}>{priority}</span>
}
