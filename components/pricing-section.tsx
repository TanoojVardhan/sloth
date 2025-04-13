import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

export function PricingSection() {
  return (
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm">
          <span className="text-slate-600">100% Free</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Free Forever, No Limits</h2>
          <p className="max-w-[900px] text-slate-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Sloth AI Planner is completely free with all features available to everyone
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl mt-12">
        <Card className="border-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Sloth AI Planner</CardTitle>
            <CardDescription>All features included, completely free</CardDescription>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold">$0</span>
              <span className="ml-1 text-sm text-slate-500">forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Unlimited tasks</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Advanced calendar</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Unlimited goal trackers</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">AI task prioritization</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Voice assistant</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Team collaboration</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Shared calendars</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-slate-800" />
                <span className="text-sm">Team analytics</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-slate-800 hover:bg-slate-700">
              <Link href="/login">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div className="mt-12 text-center">
        <p className="text-slate-500">No credit card required. No hidden fees. Just a completely free AI planner.</p>
      </div>
    </div>
  )
}
