"use client"

import Link from "next/link"
import { Home } from "lucide-react"
import { useScrollPosition } from "@/components/landing/use-scroll-position"

export function LandingNavbar() {
  const scrollY = useScrollPosition()
  const scrolled = scrollY > 50

  return (
    <nav
      aria-label="Main"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b border-app bg-zinc-900/80 backdrop-blur-[12px]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo + Product Name */}
        <Link
          href="/"
          className="flex items-center gap-2 text-app min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-md"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">Home OS</span>
        </Link>

        {/* Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="link-muted min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=signup"
            className="btn-primary-app min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}
