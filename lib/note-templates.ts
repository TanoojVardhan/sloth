export interface NoteTemplate {
  id: string
  name: string
  icon: string
  description: string
  /** Builds the title and body at creation time, so dates are always current. */
  build: () => { title: string; content: string }
}

function today(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function weekLabel(): string {
  const d = new Date()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return monday.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    name: "Blank page",
    icon: "📄",
    description: "Start from nothing",
    build: () => ({ title: "", content: "" }),
  },
  {
    id: "journal",
    name: "Daily journal",
    icon: "📔",
    description: "Gratitude, focus and a quick reflection",
    build: () => ({
      title: today(),
      content: `## Today I'm grateful for\n- \n\n## Top 3 priorities\n- [ ] \n- [ ] \n- [ ] \n\n## Notes\n\n\n## End-of-day reflection\n> What went well? What would I change?\n`,
    }),
  },
  {
    id: "meeting",
    name: "Meeting notes",
    icon: "🗓️",
    description: "Agenda, decisions and action items",
    build: () => ({
      title: `Meeting — ${new Date().toLocaleDateString()}`,
      content: `**Attendees:** \n\n## Agenda\n1. \n\n## Discussion\n\n\n## Decisions\n- \n\n## Action items\n- [ ] \n`,
    }),
  },
  {
    id: "project",
    name: "Project brief",
    icon: "🚀",
    description: "Goal, scope, milestones and risks",
    build: () => ({
      title: "New project brief",
      content: `## Goal\nWhat does done look like?\n\n## Scope\n- In: \n- Out: \n\n## Milestones\n- [ ] \n\n## Risks & open questions\n- \n`,
    }),
  },
  {
    id: "study",
    name: "Lecture / study notes",
    icon: "🎓",
    description: "Cornell-style: notes, questions, summary",
    build: () => ({
      title: "Lecture notes",
      content: `**Course:** \n**Topic:** \n\n## Key points\n- \n\n## Questions to review\n- \n\n## Summary (in my own words)\n\n`,
    }),
  },
  {
    id: "weekly",
    name: "Weekly review",
    icon: "🔁",
    description: "Wins, misses and next week's plan",
    build: () => ({
      title: `Weekly review — week of ${weekLabel()}`,
      content: `## Wins\n- \n\n## What slipped\n- \n\n## Lessons\n\n\n## Next week's focus\n- [ ] \n- [ ] \n`,
    }),
  },
  {
    id: "reading",
    name: "Book / article notes",
    icon: "📚",
    description: "Quotes, takeaways and how to apply them",
    build: () => ({
      title: "Reading notes",
      content: `**Author:** \n**Link:** \n\n## Big idea\n\n\n## Highlights\n> \n\n## How I'll apply this\n- [ ] \n`,
    }),
  },
]

export const NOTE_ICONS = ["📄", "📝", "📔", "🗓️", "🚀", "🎓", "📚", "💡", "🎯", "✅", "🧠", "💼", "🏠", "✈️", "💰", "❤️", "🌱", "🔥", "⭐", "🦥"]
