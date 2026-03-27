"use client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Phase 2: wrap with Auth0Provider when AUTH0_DOMAIN is set
  return <>{children}</>;
}
