import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
              <p className="text-gray-600 mb-6">
                Have questions, feedback, or need help? We're here for you. Fill out the form or contact us directly.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-primary" />
                  <span>support@slothplanner.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-primary" />
                  <span>123 Productivity Street, San Francisco, CA 94107</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Office Hours</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
              <p className="text-gray-600 mt-4">
                Our support team typically responds within 24 business hours.
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
            
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your Name" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" required />
              </div>
              
              <div className="space-y-2">
                <Label>What can we help you with?</Label>
                <RadioGroup defaultValue="support">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="support" id="support" />
                    <Label htmlFor="support">Technical Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feedback" id="feedback" />
                    <Label htmlFor="feedback">Feedback & Suggestions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="billing" id="billing" />
                    <Label htmlFor="billing">Billing & Account</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Please describe your issue or question in detail" rows={5} required />
              </div>
              
              <Button type="submit" className="w-full">Send Message</Button>
              
              <p className="text-xs text-gray-500 text-center">
                By submitting this form, you agree to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and 
                consent to us storing your information for the purpose of responding to your inquiry.
              </p>
            </form>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}