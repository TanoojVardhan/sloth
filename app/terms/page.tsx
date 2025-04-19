import { SiteFooter } from "@/components/site-footer"

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg mb-6">
            Last Updated: January 15, 2023
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Sloth Planner ("we," "our," or "us"). By accessing or using our website, mobile applications, and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms").
            </p>
            <p className="mb-4">
              Please read these Terms carefully. If you do not agree with these Terms, please do not access or use our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Using Sloth Planner</h2>
            <h3 className="text-xl font-medium mb-3">2.1 Account Registration</h3>
            <p className="mb-4">
              To use certain features of our Services, you may need to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            
            <h3 className="text-xl font-medium mb-3">2.2 Account Security</h3>
            <p className="mb-4">
              You are responsible for safeguarding the password that you use to access the Services and for any activities or actions under your account. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your account.
            </p>
            
            <h3 className="text-xl font-medium mb-3">2.3 Prohibited Activities</h3>
            <p className="mb-4">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Using the Services for any illegal purpose or in violation of any laws</li>
              <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Services</li>
              <li>Uploading invalid data, viruses, worms, or other software agents through the Services</li>
              <li>Using or attempting to use another user's account without authorization</li>
              <li>Impersonating another person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
            <p className="mb-4">
              Our Services allow you to create, upload, store, and share content, including tasks, calendar events, goals, and personal information ("User Content"). You retain all rights to your User Content. By using our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, modify, and display your User Content in connection with providing and improving our Services.
            </p>
            <p className="mb-4">
              You are solely responsible for your User Content and the consequences of sharing it through our Services. You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You own or have the necessary rights to use and authorize us to use your User Content</li>
              <li>Your User Content does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Privacy</h2>
            <p className="mb-4">
              Please review our Privacy Policy at <a href="/privacy" className="text-primary">Privacy Policy</a> for information about how we collect, use, and share your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Services at any time, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p className="mb-4">
              Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, you may simply discontinue using the Services or contact us at support@slothplanner.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Disclaimers and Limitations of Liability</h2>
            <p className="mb-4">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4">
              IN NO EVENT WILL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES</li>
              <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES</li>
              <li>ANY CONTENT OBTAINED FROM THE SERVICES</li>
              <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="mb-4">
              We may modify these Terms at any time. When we do, we will provide notice to you by publishing the most current version and revising the date at the top of this page. If we make any material change to these Terms, we will provide additional notice to you, such as by sending you an email or displaying a prominent notice on our Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at legal@slothplanner.com.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}