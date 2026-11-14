import type { Metadata } from "next"
import { ContentPage } from "@/components/content-page"
import { LAST_UPDATED } from "@/lib/site-config"

export const metadata: Metadata = { title: "Terms of service · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="Terms of service"
      intro="The ground rules for using Sloth Planner. By creating an account or using the app, you agree to them."
      updated={LAST_UPDATED}
      toc
      sections={[
        { id: "using", title: "Using the service", body: <p>You must be able to form a binding agreement where you live. Keep your sign-in details safe and don&apos;t use the service for anything unlawful or to harm others or the service itself.</p> },
        {
          id: "content",
          title: "Your content",
          body: <p>What you store is yours. We don&apos;t claim any rights to it. You give us only the permission needed to store and sync it for you. If you add a passphrase, it is encrypted on your device and we can&apos;t read it or recover it for you.</p>,
        },
        {
          id: "keys",
          title: "Your passphrase and recovery key",
          body: (
            <p>
              You are responsible for your passphrase and recovery key. If you lose both, your encrypted data cannot be recovered by anyone, including us, and we can&apos;t reset it for you. Store the recovery key
              somewhere safe.
            </p>
          ),
        },
        {
          id: "ai",
          title: "AI features",
          body: <p>AI output can be wrong. Check imported timetables and suggestions before you rely on them. Anything you choose to share with the AI is processed as described in the <a href="/privacy">privacy policy</a>.</p>,
        },
        {
          id: "third",
          title: "Third-party services",
          body: <p>Sign-in, storage and Google Calendar run on third-party services with their own terms. If you connect one, you agree to its terms as well.</p>,
        },
        {
          id: "availability",
          title: "Availability and changes",
          body: <p>We work to keep the service running, but it is provided as is, without a guarantee that it will always be available or error-free. We may change or retire features, and we&apos;ll try to give notice for big changes. Export or back up anything you can&apos;t afford to lose.</p>,
        },
        {
          id: "liability",
          title: "Liability",
          body: <p>To the extent the law allows, we aren&apos;t liable for indirect or consequential losses, including lost data caused by a lost passphrase and recovery key.</p>,
        },
        {
          id: "ending",
          title: "Ending your account",
          body: <p>You can stop using the service at any time and ask for your account to be deleted from <a href="/support">Support</a>. We may suspend accounts that break these terms.</p>,
        },
        { id: "changes", title: "Changes to these terms", body: <p>If we change these terms, we&apos;ll update the date above. Using the service after a change means you accept it.</p> },
      ]}
    />
  )
}
