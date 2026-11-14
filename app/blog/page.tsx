import type { Metadata } from "next"
import Link from "next/link"
import { posts } from "@/lib/blog"

export const metadata: Metadata = { title: "Blog · Sloth Planner" }

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Blog</h1>
      <p className="mt-4 text-lg text-muted-foreground">Notes on planning, privacy and how Sloth Planner works.</p>
      <ul className="mt-10 divide-y border-y">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="block py-6 hover:bg-secondary/50">
              <time className="text-sm text-muted-foreground" dateTime={p.date}>
                {new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
              </time>
              <h2 className="mt-1 text-xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-muted-foreground">{p.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
