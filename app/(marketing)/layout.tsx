import type { Metadata } from "next"
import Script from "next/script"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "Home OS — A personal operating system for the mind",
  description:
    "Home OS brings your notes, tasks, contacts, and reading into one calm, unified space. A quiet digital home for focused thinking.",
  openGraph: {
    title: "Home OS — A personal operating system for the mind",
    description:
      "Home OS brings your notes, tasks, contacts, and reading into one calm, unified space. A quiet digital home for focused thinking.",
    type: "website",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="marketing-force-dark"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark');document.documentElement.classList.add('font-mono');`,
        }}
      />
      {children}
    </>
  )
}
