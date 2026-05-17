"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { OAUTH_PROVIDERS } from "@/lib/auth/oauth-providers";
import { OAuthButton } from "@/components/auth/oauth-button";
import type { Provider } from "@supabase/supabase-js";

type OAuthButtonGroupProps = {
  onError: (message: string) => void;
};

export function OAuthButtonGroup({ onError }: OAuthButtonGroupProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProviderClick = useCallback(
    async (providerId: string) => {
      setLoadingProvider(providerId);

      // Start 10-second timeout
      timeoutRef.current = setTimeout(() => {
        setLoadingProvider(null);
        onError("Connection timed out. Please try again.");
      }, 10_000);

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerId as Provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        clearTimeout(timeoutRef.current!);
        timeoutRef.current = null;
        setLoadingProvider(null);
        onError("Sign-in could not be started. Please try again.");
      }
    },
    [onError]
  );

  return (
    <div className="flex flex-col gap-3">
      {OAUTH_PROVIDERS.map((provider) => (
        <OAuthButton
          key={provider.id}
          provider={provider.name}
          label={provider.label}
          icon={<provider.icon className="h-5 w-5" />}
          disabled={loadingProvider !== null}
          loading={loadingProvider === provider.id}
          onClick={() => handleProviderClick(provider.id)}
        />
      ))}
    </div>
  );
}
