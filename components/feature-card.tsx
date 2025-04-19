import type { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="transition-all hover:shadow-md bg-white/90 backdrop-blur-sm border-primary/10">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {icon}
        <h3 className="text-lg font-bold text-primary">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/70">{description}</p>
      </CardContent>
    </Card>
  )
}
