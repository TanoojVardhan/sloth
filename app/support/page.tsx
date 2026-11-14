import type { Metadata } from "next"
import Link from "next/link"
import { ContentPage } from "@/components/content-page"
import { SUPPORT_EMAIL } from "@/lib/site-config"

export const metadata: Metadata = { title: "Support · Sloth Planner" }

const fixes = [
  ["I forgot my passphrase", "Open the unlock screen and choose the recovery key option. Paste your recovery key and set a new passphrase. Without the passphrase or the recovery key, data can't be recovered."],
  ["My timetable didn't import", "Check that the sheet is shared as \"Anyone with the link can view\", then paste the link again. If some subjects are missing, open the timetable and use the subject picker."],
  ["The AI assistant doesn't see my tasks", "Turn on AI sharing under Settings → Security. It's off by default."],
  ["Google Calendar won't connect", "Disconnect it on the Calendar integration page, then connect again and accept all the permissions."],
  ["My data isn't on my other device", "Sign in with the same account. If you added a passphrase, enter it too: each device needs to be unlocked once."],
]

export default function Page() {
  return (
    <ContentPage title="Support" intro="Quick fixes for common problems, and where to go if they don't help.">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Common fixes</h2>
        {fixes.map(([q, a]) => (
          <details key={q} className="group rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">{q}</summary>
            <p className="mt-2 leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-semibold">Still stuck?</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Check the <Link className="underline" href="/faq">FAQ</Link> and the <Link className="underline" href="/guides">guides</Link>.
          {SUPPORT_EMAIL ? (
            <>
              {" "}Otherwise email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with what you did, what you expected and what happened. Never send your passphrase or recovery key. We will never ask for them.
            </>
          ) : (
            <> Include what you did, what you expected and what happened. Never share your passphrase or recovery key. We will never ask for them.</>
          )}
        </p>
      </section>
    </ContentPage>
  )
}
