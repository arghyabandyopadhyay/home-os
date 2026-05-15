import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-app bg-app-surface/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <MobileSidebar />
      </div>

      <div className="flex items-center gap-3">
        <kbd className="hidden rounded-lg border border-app bg-app-elevated px-2 py-1 text-xs text-app-muted sm:inline">
          ⌘K
        </kbd>
        <UserMenu />
      </div>
    </header>
  );
}
