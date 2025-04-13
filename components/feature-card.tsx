import type { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {icon}
        <h3 className="text-lg font-bold">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}
