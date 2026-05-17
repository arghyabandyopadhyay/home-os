import { ReactNode } from "react";
import { FooterNav } from "@/components/legal/footer-nav";

type LegalPageShellProps = {
  children: ReactNode;
};

export function LegalPageShell({ children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-app text-app">
      <header className="mx-auto max-w-3xl px-4 pt-8 md:px-6">
        <a
          href="/"
          aria-label="Navigate to Home OS home page"
          className="text-lg font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Home OS
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <article className="space-y-8 leading-relaxed">
          {children}
        </article>
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 md:px-6">
        <FooterNav />
      </footer>
    </div>
  );
}
