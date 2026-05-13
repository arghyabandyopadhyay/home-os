import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandMenu } from "@/components/layout/command-menu";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Home OS",
  description: "Your digital home",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#09090b] text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-10%] h-125 w-125 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] h-125 w-125 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative flex min-h-screen">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex flex-1 flex-col">
            <Header />
            <CommandMenu />
            <main className="flex-1 bg-[#09090b]">{children}</main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
