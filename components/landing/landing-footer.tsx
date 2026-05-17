import Link from "next/link"
import { Home } from "lucide-react"

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
]

const linkClasses =
  "text-app-muted hover:text-app transition-colors min-h-[44px] inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

export function LandingFooter() {
  const currentYear = new Date().getFullYear()
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL
  const roadmapUrl = process.env.NEXT_PUBLIC_ROADMAP_URL

  return (
    <footer className="border-t border-app py-10 px-6 md:px-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Logo + Copyright */}
        <div className="flex items-center gap-2 text-app-muted">
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm">© {currentYear} Home OS</span>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClasses}>
                  {link.label}
                </Link>
              </li>
            ))}

            {githubUrl && (
              <li>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClasses}
                >
                  GitHub
                </a>
              </li>
            )}

            {roadmapUrl && (
              <li>
                <a
                  href={roadmapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClasses}
                >
                  Roadmap
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
