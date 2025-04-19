"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function VerificationBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { user, verifyEmail } = useAuth()
  const { toast } = useToast()

  // Don't show if user is verified or no user
  if (!isVisible || !user || user.emailVerified) {
    return null
  }

  const handleSendVerification = async () => {
    setIsSending(true)
    try {
      await verifyEmail()
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and follow the link to verify your email.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-medium text-yellow-800">Verify your email address</h3>
              <p className="text-sm text-yellow-700">
                Please verify your email address to ensure you can recover your account if needed.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendVerification}
                disabled={isSending}
                className="mt-1 bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                {isSending ? "Sending..." : "Send verification email"}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 -mt-1 -mr-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
