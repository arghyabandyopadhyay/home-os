import { ReactNode } from "react";

type PageShellProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  panel?: boolean;
};

export function PageShell({
  title,
  description,
  children,
  panel = true,
}: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-app text-app">
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {title && (
          <div className="panel-app mb-8 p-6">
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-app-muted">{description}</p>
            )}
          </div>
        )}
        {panel ? (
          <div className="panel-app p-6">{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
