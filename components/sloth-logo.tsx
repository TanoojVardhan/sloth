import { cn } from "@/lib/utils"

interface SlothLogoProps {
  className?: string
}

export function SlothLogo({ className }: SlothLogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 shadow-md"></div>
      <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white p-2">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            fill="#F8FAFC"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          <path
            d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
            fill="#0F172A"
          />
          <path
            d="M16 10C17.1046 10 18 9.10457 18 8C18 6.89543 17.1046 6 16 6C14.8954 6 14 6.89543 14 8C14 9.10457 14.8954 10 16 10Z"
            fill="#0F172A"
          />
          <path d="M8 14C8 14 9 16 12 16C15 16 16 14 16 14" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M7 12C7 12 7.5 13 9 13C10.5 13 11 12 11 12"
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13 12C13 12 13.5 13 15 13C16.5 13 17 12 17 12"
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
