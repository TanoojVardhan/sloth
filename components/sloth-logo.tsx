import Image from "next/image"
import { cn } from "@/lib/utils"

interface SlothLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function SlothLogo({ className, showText = false, size = "md" }: SlothLogoProps) {
  // Define sizes for different contexts
  const sizes = {
    sm: { container: "h-8 w-8", image: 32, text: "text-lg" },
    md: { container: "h-10 w-10", image: 40, text: "text-xl" },
    lg: { container: "h-16 w-16", image: 64, text: "text-2xl" },
  }

  const selectedSize = sizes[size]

  return (
    <div className={cn("relative flex items-center", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-md overflow-hidden bg-[#e0cdb7]",
          selectedSize.container,
        )}
      >
        <Image
          src="/images/sloth-planner-logo.png"
          alt="Sloth Planner Logo"
          width={selectedSize.image}
          height={selectedSize.image}
          className="object-contain"
          priority
        />
      </div>
      {showText && <span className={cn("ml-2 font-bold", selectedSize.text)}>Sloth Planner</span>}
    </div>
  )
}
