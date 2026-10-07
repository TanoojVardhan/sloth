"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Sparkles } from "lucide-react"

export function SiteHeader() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-3 transition-all">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <Image 
              src="/sloth-planner-logo.png" 
              alt="Sloth Planner" 
              width={40} 
              height={40} 
              className="relative rounded-lg ring-1 ring-border/50"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Sloth Planner
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              Stay Organized
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-sm font-medium text-foreground/90">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    onClick={async () => {
                      await logout()
                      router.push("/login")
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                  <Link href="/settings">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="hover:bg-foreground/5 transition-colors"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all"
                    >
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
