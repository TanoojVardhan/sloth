import type { Metadata } from "next"
import { ContentPage, CtaRow } from "@/components/content-page"

export const metadata: Metadata = { title: "About · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="About Sloth Planner"
      intro="A calm place to plan your tasks, events, projects, goals and notes, where what you write stays yours."
      sections={[
        {
          id: "why",
          title: "Why we built it",
          body: (
            <>
              <p>
                Most planners ask you to give up two things: your attention, to a screen full of options, and your data, to a server that can read it.
                Sloth Planner was built to give both back.
              </p>
              <p>
                It keeps the essentials in one place. Tasks, events, projects, goals, notes, a schedule and a focus timer all live together, so planning the day takes one glance.
              </p>
            </>
          ),
        },
        {
          id: "private",
          title: "Private by design",
          body: (
            <>
              <p>
                Your planner data is encrypted in transit and on our servers. If you add a passphrase in Settings, it is also end-to-end encrypted on your device before it is saved: it is stored as ciphertext, so the developer cannot read it, and neither can anyone looking at the database.
              </p>
              <p>
                The passphrase is optional because its trade-off is real: if you lose both your passphrase and your recovery key, nobody can recover your data.{" "}
                <a href="/privacy">Read exactly what is and isn&apos;t protected.</a>
              </p>
            </>
          ),
        },
        {
          id: "ai",
          title: "AI that helps, on your terms",
          body: (
            <p>
              The assistant can read a messy timetable or schedule from a link and turn it into classes you can pick from. It sees your tasks and events only if you switch sharing on in Settings.
            </p>
          ),
        },
        {
          id: "who",
          title: "Who it's for",
          body: <p>Anyone juggling a lot: students, professionals, freelancers and people running a team of one. It works on the web and on Android.</p>,
        },
      ]}
    >
      <CtaRow />
    </ContentPage>
  )
}
