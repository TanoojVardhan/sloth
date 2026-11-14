import type { Metadata } from "next"
import Link from "next/link"
import { ContentPage } from "@/components/content-page"

export const metadata: Metadata = { title: "FAQ · Sloth Planner" }

const groups: { title: string; items: [string, string][] }[] = [
  {
    title: "Privacy and security",
    items: [
      ["Can the developer read my notes and tasks?", "Not if you add a passphrase in Settings. Your content is then encrypted on your device before it is saved, the key never leaves your devices, and the database holds ciphertext. Without a passphrase your content is encrypted on our servers, but it is technically readable by whoever runs the database."],
      ["Do I need a passphrase?", "No. It is optional, and you can add or remove one in Settings at any time."],
      ["What happens if I forget my passphrase?", "Use your recovery key to unlock and set a new passphrase. If you've lost both the passphrase and the recovery key, your data can't be recovered by anyone."],
      ["What isn't end-to-end encrypted?", "Your name, email, profile photo, user ID and timestamps, plus Google Calendar tokens if you connect it. The privacy policy has the full list."],
      ["Does the AI see my data?", "Only if you turn on AI sharing in Settings, and only the data needed for your question. It is off by default."],
    ],
  },
  {
    title: "Using the app",
    items: [
      ["Is Sloth Planner free?", "Yes. You can create an account with email or Google and use it without a credit card."],
      ["Does it work on my phone?", "There is an Android app, and the website works in any modern mobile browser."],
      ["How do I add a task quickly?", "Press Ctrl+K (⌘K on Mac) to open the command palette, or use the microphone button to say it instead of typing."],
      ["Can I use it with other people?", "Not yet. Sloth Planner is a personal planner, so each account's data is private to that account."],
    ],
  },
  {
    title: "Timetable and AI",
    items: [
      ["Which timetable files work?", "Link a Google Sheet or an Excel file in almost any layout. The AI works out the structure, then you pick the subjects that are yours."],
      ["Some of my subjects are missing.", "Open the timetable's subject picker. Sections of the same subject appear separately, so choose the section you attend."],
      ["How do I remove an imported timetable?", "Open the timetable page and choose Disconnect. This also removes the classes it created."],
    ],
  },
]

export default function Page() {
  return (
    <ContentPage title="Frequently asked questions" intro="Short answers to the questions people ask most.">
      {groups.map((g) => (
        <section key={g.title} className="space-y-3">
          <h2 className="text-xl font-semibold">{g.title}</h2>
          {g.items.map(([q, a]) => (
            <details key={q} className="rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </section>
      ))}
      <p className="text-sm text-muted-foreground">
        Didn&apos;t find it? Try <Link className="underline" href="/support">Support</Link>.
      </p>
    </ContentPage>
  )
}
