import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CommandMenu } from "@/components/layout/command-menu"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Home OS",
  description: "Your digital home",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="flex min-h-screen">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex flex-1 flex-col">
            <Header />
            <CommandMenu />
            <main className="flex-1 bg-zinc-950">
              {children}
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}