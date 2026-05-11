import { Search } from "lucide-react"
import { MobileSidebar } from "./mobile-sidebar"
import { UserMenu } from "./user-menu"

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-zinc-950/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <MobileSidebar />

        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800">
          <Search size={16} />
          Search...
          <span className="ml-6 text-xs text-zinc-500">
            ⌘K
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
          A
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
    
  )
}