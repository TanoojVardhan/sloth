import type { Metadata } from "next"
import { ContentPage, CtaRow } from "@/components/content-page"

export const metadata: Metadata = { title: "Our mission · Sloth Planner" }

const principles = [
  ["Calm over clutter", "Every screen should show what matters now and nothing else. Planning is supposed to lower stress, not add to it."],
  ["Your data is yours", "Add a passphrase and we encrypt on your device, so we never hold the key. If we can't read it, it can't leak from us."],
  ["Honest limits", "We say plainly what is protected and what isn't, including that a lost passphrase and recovery key can't be recovered."],
  ["Help, not nagging", "AI is optional and off by default for your personal data. It earns its place by saving you real time."],
  ["One planner, every device", "The same tasks, notes and schedule on the web and on your phone."],
]

export default function Page() {
  return (
    <ContentPage
      title="Our mission"
      intro="Make planning feel calm, and make privacy the default instead of a premium feature."
      sections={principles.map(([t, d], i) => ({ id: `p${i}`, title: t, body: <p>{d}</p> }))}
    >
      <CtaRow />
    </ContentPage>
  )
}
