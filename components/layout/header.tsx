import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#111118]/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <MobileSidebar />
      </div>

      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
