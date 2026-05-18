import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandMenu } from "@/components/layout/command-menu";
import { FloatingSearchBar } from "@/components/layout/floating-search-bar";
import { AppProviders } from "@/components/layout/app-providers";
import { Toaster } from "sonner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-125 w-125 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute bottom-[-20%] right-[-10%] h-125 w-125 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/10" />
      </div>

      <div className="relative min-h-screen safe-area-shell">
        <div className="fixed inset-y-0 left-0 z-40 hidden md:block safe-area-sidebar">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col md:ml-[272px]">
          <Header />
          <CommandMenu />
          <FloatingSearchBar />
          <div className="flex-1 bg-app">{children}</div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </AppProviders>
  );
}
