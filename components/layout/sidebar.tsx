"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  NotebookPen,
  CheckSquare,
  Library,
  Users,
  Settings,
  CalendarDays,
  FileText,
} from "lucide-react";

const items = [
  {
    title: "Today",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Notes",
    href: "/notes",
    icon: NotebookPen,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Library",
    href: "/library",
    icon: Library,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-[272px] flex-col"
      style={{
        backgroundColor: "color-mix(in srgb, var(--home-surface) 90%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="p-6">
        <h1 className="font-mono text-[1.25rem] font-semibold text-app">
          Home OS
        </h1>
        <p className="mt-1 text-sm text-app-muted">
          Mind · tasks · people · media
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-4" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                active
                  ? "border-l-2 border-current bg-app-elevated text-app"
                  : "border-l-2 border-transparent text-app-muted hover:bg-app-elevated hover:text-app"
              }`}
              style={{
                transitionDuration: "150ms",
                transitionTimingFunction: "ease",
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/privacy" className="text-xs link-muted">
            Privacy
          </Link>
          <Link href="/terms" className="text-xs link-muted">
            Terms
          </Link>
          <Link href="/contact" className="text-xs link-muted">
            Contact
          </Link>
        </div>
      </div>
    </aside>
  );
}
