import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandMenu } from "@/components/layout/command-menu";
import { MobileShell } from "@/components/layout/mobile-shell";
import { MobileSidebarWrapper } from "@/components/layout/mobile-sidebar-wrapper";
import { VoiceAssistantFab } from "@/components/layout/voice-assistant-fab";
import { BottomNav } from "@/components/layout/bottom-nav";
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
          <MobileShell>
            <Header />
            <CommandMenu />
            <main
              className="flex-1 bg-app overflow-y-auto pt-10 pb-[var(--bottom-nav-height,0px)] md:pt-0 md:pb-0"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {children}
            </main>
            <BottomNav />
            <VoiceAssistantFab />
          </MobileShell>
        </div>
      </div>
      <Toaster richColors position="top-right" />
      <MobileSidebarWrapper />
    </AppProviders>
  );
}
