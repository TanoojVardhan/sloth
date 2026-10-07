import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
        <div className="flex items-start gap-3">
          <Image src="/sloth-planner-logo.png" alt="" width={40} height={40} className="rounded" />
          <div>
            <div className="text-lg font-semibold">Sloth Planner</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-ready planning assistant that helps you manage tasks, schedule, and goals—calmly.
            </p>
            <div className="mt-3 text-sm">Your account and data are stored securely with Firebase, and only you can see them.</div>
          </div>
        </div>
        <div>
          <div className="font-medium">Resources</div>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link className="hover:underline" href="/docs">
                Documentation
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/guides">
                User Guides
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/tutorials">
                Tutorials
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/faq">
                FAQ
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/api">
                API Docs (coming)
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium">Company</div>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link className="hover:underline" href="/about">
                About Us
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/mission">
                Our Mission
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/blog">
                Blog
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/privacy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/terms">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/support">
                Support
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
