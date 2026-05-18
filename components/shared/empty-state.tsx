"use client";

import { ComponentType } from "react";

type EmptyStateProps = {
  module: string;
  icon: ComponentType<{ className?: string }>;
  heading: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({
  icon: Icon,
  heading,
  body,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-16">
      <div className="flex flex-col items-center text-center">
        <Icon className="mb-4 h-12 w-12 text-app-muted" />
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="mt-2 max-w-sm text-sm text-app-muted">{body}</p>
        <button
          type="button"
          onClick={onAction}
          className="btn-primary-app mt-6 px-5 py-2.5 text-sm"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
