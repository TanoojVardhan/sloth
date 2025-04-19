"use client"

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { SlothLogo } from '@/components/sloth-logo'

export function MainHeader() {
  const { user, logout } = useAuth()
  
  return (
    <header className="bg-white shadow-sm">
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
                className="font-medium text-red-600 hover:underline"
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
              <Link href="/signup" className="ml-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}