import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: 'Sign up | Sloth Planner',
  description: 'Create your Sloth Planner account',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}