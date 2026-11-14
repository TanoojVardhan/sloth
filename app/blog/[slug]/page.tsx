import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { posts } from "@/lib/blog"

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = posts.find((x) => x.slug === slug)
  return { title: p ? `${p.title} · Sloth Planner` : "Blog · Sloth Planner", description: p?.summary }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = posts.find((x) => x.slug === slug)
  if (!p) notFound()
  return (
    <article className="mx-auto max-w-2xl px-6 py-12 lg:px-8">
      <Link href="/blog" className="text-sm text-muted-foreground hover:underline">
        Back to the blog
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-balance sm:text-4xl">{p.title}</h1>
      <time className="mt-2 block text-sm text-muted-foreground" dateTime={p.date}>
        {new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
      </time>
      <div className="mt-8 space-y-4 text-lg leading-relaxed">
        {p.body.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
    </article>
  )
}
