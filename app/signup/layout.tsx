import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up | Sloth Planner',
  description: 'Create your Sloth Planner account',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}