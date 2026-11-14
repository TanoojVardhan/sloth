import type { Metadata } from "next"
import { ContentPage } from "@/components/content-page"
import { LAST_UPDATED, SUPPORT_EMAIL } from "@/lib/site-config"

export const metadata: Metadata = { title: "Privacy policy · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="Privacy policy"
      intro="What Sloth Planner stores, what it can and can't read, and who else touches your data."
      updated={LAST_UPDATED}
      toc
      sections={[
        {
          id: "summary",
          title: "The short version",
          body: (
            <ul>
              <li>Your tasks, events, projects, goals, notes, classes and assignments are encrypted in transit and on our servers.</li>
              <li>A passphrase is optional. If you add one in Settings, these items are also encrypted on your device before they are saved, and we cannot read them. Without one, they are stored in a form we are technically able to read.</li>
              <li>If you add a passphrase and then lose both it and your recovery key, your data cannot be recovered by anyone, including us.</li>
              <li>Some account details and metadata are never end-to-end encrypted. They are listed below.</li>
              <li>We don&apos;t sell your data or show ads.</li>
            </ul>
          ),
        },
        {
          id: "encrypted",
          title: "What is end-to-end encrypted when you add a passphrase",
          body: (
            <>
              <p>
                The content of your tasks, events, projects, goals, notes, classes and assignments is sealed with AES-256-GCM using a key that only your devices hold. The key itself is
                protected by your passphrase and by a recovery key you save when you set up encryption.
              </p>
              <p>What is stored on our servers for these items is ciphertext plus your user ID and created/updated times.</p>
              <p>If you have not added a passphrase, or you remove it, these items are stored readable instead. They are still protected by encryption in transit and by the database&apos;s encryption at rest, and only your account can access them through the app.</p>
            </>
          ),
        },
        {
          id: "not-encrypted",
          title: "What is not encrypted",
          body: (
            <ul>
              <li>Account details: your name, email address, profile photo and sign-in provider.</li>
              <li>Metadata: your user ID, when items were created or changed, and how many items you have.</li>
              <li>Your device notification token, if you allow notifications.</li>
              <li>Profile pictures stored in file storage.</li>
              <li>If you connect Google Calendar, the access tokens that let the app talk to Google on your behalf.</li>
            </ul>
          ),
        },
        {
          id: "ai",
          title: "AI features",
          body: (
            <>
              <p>
                The AI assistant can only see your tasks, events and projects if you turn on sharing in Settings, and only the data needed for the question you ask is sent. It is off by
                default.
              </p>
              <p>
                When you import a timetable from a link, the file is fetched by our server and read by an AI model to extract the classes. The file is processed for that request and
                is not stored as readable text in your account. Anything you share with the AI is sent in readable form to our server and to the AI provider for that request.
              </p>
            </>
          ),
        },
        {
          id: "providers",
          title: "Services we use",
          body: (
            <ul>
              <li>Google Firebase for sign-in, the database, file storage and notifications.</li>
              <li>Vercel for hosting the website and its server functions.</li>
              <li>A third-party AI model provider for the assistant and timetable import.</li>
              <li>Google Calendar, only if you connect it.</li>
            </ul>
          ),
        },
        {
          id: "control",
          title: "Your choices",
          body: (
            <ul>
              <li>Change your passphrase, create a new recovery key or lock the app at any time in Settings.</li>
              <li>Turn AI sharing off in Settings whenever you like.</li>
              <li>Disconnect Google Calendar to stop it being used.</li>
              <li>Delete any item in the app. Deleting an item removes it from the database.</li>
              <li>Ask us to delete your account and the data tied to it through Support.</li>
            </ul>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and local storage",
          body: <p>We use browser storage to keep you signed in and to remember settings such as your theme. If you choose &quot;remember on this device&quot;, an encrypted copy of your key is kept on that device. We don&apos;t use advertising cookies.</p>,
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Questions about this policy? Visit <a href="/support">Support</a>
              {SUPPORT_EMAIL ? (
                <>
                  {" "}
                  or write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </>
              ) : null}
              . We&apos;ll update this page and its date when anything changes.
            </p>
          ),
        },
      ]}
    />
  )
}
