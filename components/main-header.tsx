"use client"

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { SlothLogo } from '@/components/sloth-logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function MainHeader() {
  const { user, logout } = useAuth()
  
  return (
    <header className="bg-card shadow-sm">
      <nav className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center gap-2">
          <SlothLogo className="h-8 w-8" />
          <span className="font-bold text-primary text-xl">Sloth Planner</span>
        </Link>
        
        <div className="flex space-x-4 items-center">
          <Link href="/" className="font-medium hover:underline">
            Home
          </Link>
          <Link href="/about" className="font-medium hover:underline">
            About
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="font-medium hover:underline">
                Dashboard
              </Link>
              <button 
                onClick={logout} 
                className="font-medium text-destructive hover:underline"
              >
                Logout
              </button>
              <div className="flex items-center ml-4 pl-4 border-l">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.displayName ? user.displayName[0] : user.email?.[0] || 'U'}
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
              <Link href="/signup" className="ml-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                Sign Up
              </Link>
            </>
          )}
          
          <div className="ml-2 border-l pl-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  )
}