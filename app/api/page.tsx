import type { Metadata } from "next"
import { ContentPage } from "@/components/content-page"

export const metadata: Metadata = { title: "API · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="API"
      intro="There is no public API yet."
      sections={[
        {
          id: "status",
          title: "Where things stand",
          body: <p>Sloth Planner keeps your data end-to-end encrypted, so a server-side API can't read or write your items. Any public API has to be designed around that, so it isn't available yet.</p>,
        },
        {
          id: "next",
          title: "What we're considering",
          body: <ul><li>Exporting your data in open formats.</li><li>Calendar feeds you can subscribe to.</li><li>A client library that encrypts and decrypts on your side.</li></ul>,
        },
        {
          id: "ask",
          title: "Tell us what you need",
          body: <p>If you would build something on Sloth Planner, tell us through <a href="/support">Support</a> and what you&apos;d use it for.</p>,
        },
      ]}
    />
  )
}
