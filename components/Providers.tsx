"use client";

import type { User } from "@auth0/nextjs-auth0/types";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";

interface ProvidersProps {
  children: React.ReactNode;
  user?: User;
}

export function Providers({ children, user }: ProvidersProps) {
  return <Auth0Provider user={user}>{children}</Auth0Provider>;
}
