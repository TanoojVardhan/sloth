export type Post = { slug: string; title: string; date: string; summary: string; body: string[] }

export const posts: Post[] = [
  {
    slug: "why-your-planner-should-be-private",
    title: "Why your planner should be private",
    date: "2026-10-08",
    summary: "Your to-do list says more about you than most documents. Here is why you can encrypt it before it leaves your device.",
    body: [
      "A planner holds your plans, your worries, your deadlines and half-formed ideas. Few places hold a more honest picture of your life.",
      "Most planners store that in a form the company can read. That makes the data useful to the company, and exposed if anything goes wrong.",
      "Add a passphrase and Sloth Planner encrypts your tasks, events, projects, goals, notes, classes and assignments on your device before they are saved. The server then only ever holds ciphertext.",
      "The trade-off is that we can't reset your passphrase for you. You get a recovery key at setup. If you lose both, the data is gone for good. That is the honest cost of privacy that really holds, and it is why the passphrase is your choice rather than a requirement.",
    ],
  },
  {
    slug: "import-any-timetable",
    title: "Import any timetable with one link",
    date: "2026-10-08",
    summary: "Paste a link to a sheet in any layout and pick the subjects that are yours.",
    body: [
      "Timetables come in every shape: merged cells, one block per specialization, subject codes in one column and names in another.",
      "Instead of asking you to reformat the file, Sloth Planner reads it the way a person would. It works out how the file is laid out, extracts every class, then checks its own work against the source.",
      "You then pick the subjects you actually attend, including the right section of each. Your classes land on your schedule.",
      "If your timetable changes, new subjects show up so you can add them in a tap.",
    ],
  },
  {
    slug: "a-calmer-way-to-plan",
    title: "A calmer way to plan your day",
    date: "2026-10-08",
    summary: "A five-minute routine using the dashboard, schedule and focus timer.",
    body: [
      "Start on the dashboard and look at what is due. Pick the one or two tasks that matter most and leave the rest.",
      "Open the schedule to see events and classes next to your tasks. Clashes are easier to fix before the day begins.",
      "Then start a focus session on the first task. One block of uninterrupted time beats a day of switching.",
      "At night, move whatever didn't happen. Planning stays calm when it is small.",
    ],
  },
]
