import Link from "next/link"
import type { Metadata } from "next"
import { SignupForm } from "@/components/signup-form"
import { SlothLogo } from "@/components/sloth-logo"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Sign Up | Sloth AI Planner",
  description: "Create your Sloth AI Planner account",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-2 text-center">
            <SlothLogo className="h-16 w-16" />
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-slate-500">Sign up for your Sloth AI Planner account</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SignupForm />

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-slate-800 hover:text-slate-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
