import { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="relative min-h-screen bg-app text-app">
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="panel-app mb-8 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-2 text-app-muted">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            )}
          </div>
        </header>
        <section>{children}</section>
      </div>
    </main>
  );
}
