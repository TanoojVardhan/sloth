import { SiteFooter } from "@/components/site-footer"

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg mb-6">
            Last Updated: January 15, 2023
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              At Sloth Planner ("we," "our," or "us"), we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and services (collectively, the "Services").
            </p>
            <p className="mb-4">
              Please read this Privacy Policy carefully. By using our Services, you agree to the practices described in this policy. If you do not agree with our policies and practices, do not use our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
            <p className="mb-4">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Profile picture (optional)</li>
              <li>Password (securely stored)</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-3">2.2 User Content</h3>
            <p className="mb-4">
              We collect and store content that you create, upload, or receive from others when using our Services, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Tasks and task details</li>
              <li>Calendar events and schedules</li>
              <li>Goals and progress tracking data</li>
              <li>Notes and personal reminders</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-3">2.3 Usage Information</h3>
            <p className="mb-4">
              We automatically collect certain information about your device and how you interact with our Services, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Device information (type, operating system, browser)</li>
              <li>IP address and location information</li>
              <li>Log data (features used, time spent on Services)</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process your account registration and authentication</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send important notifications about our Services</li>
              <li>Personalize your experience and provide AI-powered recommendations</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Detect, investigate, and prevent fraudulent transactions, abuse, and other illegal activities</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p className="mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Service Providers:</strong> We share information with third-party vendors who provide services on our behalf, such as hosting, data analysis, payment processing, and customer service. These providers are contractually obligated to use your information only to provide services to us.</li>
              <li><strong>Compliance with Laws:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.</li>
              <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your consent to do so.</li>
            </ul>
            <p className="mb-4">
              We do NOT sell your personal information to third parties for advertising or marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="mb-4">
              We have implemented appropriate technical and organizational measures to protect your personal information from accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.
            </p>
            <p className="mb-4">
              While we use commercially reasonable efforts to protect your information, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <p className="mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
              <li><strong>Correction:</strong> You can request that we correct inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> You can request that we delete your personal information.</li>
              <li><strong>Data Portability:</strong> You can request a copy of your data in a structured, commonly used, and machine-readable format.</li>
              <li><strong>Objection:</strong> You can object to our processing of your personal information.</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us at privacy@slothplanner.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p className="mb-4">
              Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us at privacy@slothplanner.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Our Privacy Policy</h2>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions or concerns about this Privacy Policy, please contact us at privacy@slothplanner.com.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}