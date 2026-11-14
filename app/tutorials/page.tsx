import type { Metadata } from "next"
import { ContentPage } from "@/components/content-page"

export const metadata: Metadata = { title: "Tutorials · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="Tutorials"
      intro="Follow along step by step."
      toc
      sections={[
        {
          id: "setup",
          title: "Add a passphrase (optional)",
          body: <ol><li>Open Settings and choose Add a passphrase.</li><li>Choose one of at least 10 characters and confirm it.</li><li>Copy or download your recovery key and tick the box confirming you saved it.</li><li>Your existing items are sealed. This takes a moment.</li></ol>,
        },
        {
          id: "timetable",
          title: "Import your timetable",
          body: <ol><li>Share your sheet as &quot;Anyone with the link can view&quot;.</li><li>Open Timetable and paste the link.</li><li>Wait for the AI to read the file.</li><li>Tick the subjects you attend. Use search or Select all.</li><li>Save. Your classes appear on the schedule.</li></ol>,
        },
        {
          id: "calendar",
          title: "Connect Google Calendar",
          body: <ol><li>Open Calendar integration.</li><li>Choose Connect and sign in to Google.</li><li>Accept the permissions.</li><li>Pick which calendars to show.</li></ol>,
        },
        {
          id: "ai",
          title: "Let the assistant see your data",
          body: <ol><li>Open Settings and find Security.</li><li>Turn on AI sharing.</li><li>Ask the assistant about your day. Turn it off again any time.</li></ol>,
        },
        {
          id: "phone",
          title: "Move to a new phone",
          body: <ol><li>Install the app and sign in.</li><li>Enter your passphrase, or your recovery key if you forgot it.</li><li>Your data appears once it unlocks.</li></ol>,
        },
      ]}
    />
  )
}
