import Link from "next/link"
import type { ReactNode } from "react"

export type Section = { id: string; title: string; body: ReactNode }

// Shared shell for the public content pages (docs, guides, policies...).
export function ContentPage({
  title,
  intro,
  updated,
  sections,
  toc = false,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  sections?: Section[]
  toc?: boolean
  children?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        {updated && <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>}
      </header>

      <div className={toc && sections ? "mt-10 grid gap-10 lg:grid-cols-[200px_1fr]" : "mt-10"}>
        {toc && sections && (
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-24 space-y-2 border-l pl-4 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a className="text-muted-foreground hover:text-foreground" href={`#${s.id}`}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="max-w-2xl space-y-10">
          {sections?.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-foreground/90 [&_a]:underline [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:space-y-1.5">
                {s.body}
              </div>
            </section>
          ))}
          {children}
        </div>
      </div>
    </div>
  )
}

export function CtaRow() {
  return (
    <div className="mt-12 flex flex-wrap gap-3 border-t pt-8 text-sm">
      <Link href="/signup" className="rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground">
        Create an account
      </Link>
      <Link href="/support" className="rounded-full border border-input bg-card px-5 py-2 font-medium">
        Get help
      </Link>
    </div>
  )
}
