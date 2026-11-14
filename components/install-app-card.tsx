"use client"

import { useState } from "react"
import { Download, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useInstall } from "@/components/pwa"

// Lets people install Sloth as an app (Windows, macOS, ChromeOS, Android) from Edge or Chrome.
export function InstallAppCard() {
  const { canInstall, installed, install } = useInstall()
  const [done, setDone] = useState(false)

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Install the app</h2>
          {installed || done ? (
            <p className="text-sm text-muted-foreground">Sloth Planner is installed on this device. Open it from your Start menu, dock or home screen.</p>
          ) : canInstall ? (
            <>
              <p className="text-sm text-muted-foreground">
                Get Sloth in its own window with a Start menu and taskbar icon. Your passphrase and encryption work exactly the same.
              </p>
              <Button onClick={async () => setDone(await install())}>
                <Download className="mr-2 h-4 w-4" />
                Install Sloth Planner
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              In Edge or Chrome, open the browser menu and choose <b>Apps → Install Sloth Planner</b> (or the install icon in the address bar). On iPhone or iPad, tap Share, then{" "}
              <b>Add to Home Screen</b>.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
