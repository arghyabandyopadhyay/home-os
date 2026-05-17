"use client";

import { Loader2 } from "lucide-react";

type OAuthButtonProps = {
  provider: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function OAuthButton({
  provider,
  label,
  icon,
  disabled = false,
  loading = false,
  onClick,
}: OAuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Sign in with ${provider}`}
      className={`
        relative flex w-full items-center rounded-xl border border-app
        bg-app-elevated px-4 text-app transition-opacity duration-150
        min-h-[48px]
        hover:opacity-80
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${isDisabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <span className="h-5 w-5" aria-hidden="true">
            {icon}
          </span>
        )}
      </span>
      <span className="flex-1 text-center text-sm font-medium">
        {loading ? "Connecting..." : label}
      </span>
    </button>
  );
}
