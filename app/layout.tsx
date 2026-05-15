import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandMenu } from "@/components/layout/command-menu";
import { AppProviders } from "@/components/layout/app-providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Home OS",
  description: "Your calm personal dashboard for mind, tasks, people, and media",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="home-os-theme"
          src="/theme-init.js"
          strategy="beforeInteractive"
        />
        <AppProviders>
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute left-[-10%] top-[-10%] h-125 w-125 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute bottom-[-20%] right-[-10%] h-125 w-125 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/10" />
          </div>

          <div className="relative flex min-h-screen">
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div className="flex flex-1 flex-col">
              <Header />
              <CommandMenu />
              <main className="flex-1 bg-app">{children}</main>
            </div>
          </div>
          <Toaster richColors position="top-right" />
        </AppProviders>
      </body>
    </html>
  );
}
