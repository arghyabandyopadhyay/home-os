import { GoogleIcon } from "@/components/auth/oauth-icons";

export type OAuthProviderConfig = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  { id: "google", name: "Google", icon: GoogleIcon, label: "Continue with Google" },
];
