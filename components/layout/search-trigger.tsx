"use client";

import { Search } from "lucide-react";

export function SearchTrigger() {
  const handleClick = () => {
    window.dispatchEvent(new Event("open-command-menu"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Search"
      className="hidden items-center gap-2 rounded-xl border border-app bg-app-elevated px-3 py-1.5 text-sm text-app-muted transition-colors hover:bg-app-elevated/80 sm:inline-flex"
    >
      <Search className="size-4" aria-hidden="true" />
      <span>Search...</span>
      <kbd className="ml-2 rounded-md border border-app bg-app-surface px-1.5 py-0.5 text-xs">
        ⌘K
      </kbd>
    </button>
  );
}
