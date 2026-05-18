import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";
import { SearchTrigger } from "./search-trigger";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-app bg-app-surface/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <MobileSidebar />
      </div>

      <div className="flex items-center gap-3">
        <SearchTrigger />
        <UserMenu />
      </div>
    </header>
  );
}
