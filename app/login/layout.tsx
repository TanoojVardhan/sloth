import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Sloth Planner',
  description: 'Sign in to your Sloth Planner account',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}