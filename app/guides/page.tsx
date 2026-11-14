import type { Metadata } from "next"
import { ContentPage } from "@/components/content-page"

export const metadata: Metadata = { title: "User guides · Sloth Planner" }

export default function Page() {
  return (
    <ContentPage
      title="User guides"
      intro="Practical ways to get more out of Sloth Planner."
      toc
      sections={[
        {
          id: "daily",
          title: "Plan your day in five minutes",
          body: <ol><li>Open the Dashboard and look at what is due.</li><li>Move the one or two tasks that matter most to today.</li><li>Check the Schedule for events and classes that clash.</li><li>Start a focus session on the first task.</li></ol>,
        },
        {
          id: "inbox",
          title: "Turn notes into tasks",
          body: <p>Write freely in Notes. Use the to-do format (<code>- [ ] item</code>) for actions, then send them to Tasks so nothing stays buried in text.</p>,
        },
        {
          id: "project",
          title: "Run a project",
          body: <ol><li>Create the project and give it a clear name.</li><li>Add tasks and nest subtasks.</li><li>Tag tasks so you can filter them later.</li><li>Review the kanban board weekly.</li></ol>,
        },
        {
          id: "goals",
          title: "Make a goal measurable",
          body: <p>Give the goal a target date and link the tasks that move it forward. Smaller, dated tasks beat a vague aim.</p>,
        },
        {
          id: "keys",
          title: "Keep your encrypted data safe",
          body: <ul><li>Save the recovery key in a password manager or print it.</li><li>Use a long passphrase you can remember.</li><li>Turn on &quot;remember on this device&quot; only on devices you trust.</li><li>Lock the app on shared computers.</li></ul>,
        },
        {
          id: "multi",
          title: "Use it on several devices",
          body: <p>Sign in with the same account on each device. If you added a passphrase, enter it once per device and your data syncs when it unlocks.</p>,
        },
      ]}
    />
  )
}
