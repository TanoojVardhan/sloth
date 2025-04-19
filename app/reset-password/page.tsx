import Link from "next/link"
import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/reset-password-form"
import { SlothLogo } from "@/components/sloth-logo"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Reset Password | Sloth Planner",
  description: "Reset your Sloth Planner password",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <SlothLogo className="h-24 w-24" size="lg" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Reset your password</h1>
              <p className="text-foreground/70">Enter your email to receive a password reset link</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/10 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
            <ResetPasswordForm />

            <div className="mt-6 text-center text-sm">
              <Button variant="link" asChild className="p-0">
                <Link href="/login" className="inline-flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
