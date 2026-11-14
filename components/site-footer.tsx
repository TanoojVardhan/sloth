import Image from "next/image"
import Link from "next/link"
import { ANDROID_APK_URL } from "@/lib/site-config"

const groups = [
  {
    title: "Learn",
    links: [
      ["Documentation", "/docs"],
      ["User guides", "/guides"],
      ["Tutorials", "/tutorials"],
      ["FAQ", "/faq"],
      ["API", "/api"],
    ],
  },
  {
    title: "Sloth Planner",
    links: [
      ["About", "/about"],
      ["Mission", "/mission"],
      ["Blog", "/blog"],
      ["Support", "/support"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy policy", "/privacy"],
      ["Terms of service", "/terms"],
    ],
  },
]

// Same canopy surface as the app sidebar, so the site is bookended in green.
export function SiteFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs sm:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/sloth-planner-logo.png" alt="" width={36} height={36} className="rounded-xl" />
            <span className="font-display text-xl font-semibold">Sloth Planner</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/65">
            Tasks, notes, classes and goals in one unhurried place. Add a passphrase and only you can read it.
          </p>
          <a
            href={ANDROID_APK_URL}
            download
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4 hover:text-sidebar-primary"
          >
            Download the Android app
          </a>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <div className="text-sm font-semibold">{g.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-sidebar-foreground/65">
              {g.links.map(([label, href]) => (
                <li key={href}>
                  <Link className="transition-colors hover:text-sidebar-foreground" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  )
}
