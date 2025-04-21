import { SlothLogo } from "@/components/sloth-logo";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="animate-pulse">
        <SlothLogo size="lg" />
      </div>
    </div>
  )
}
