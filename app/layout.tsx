import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
