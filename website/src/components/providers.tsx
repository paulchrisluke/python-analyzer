"use client";

import type { ReactNode } from "react";
import { useMemo, useCallback } from "react";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Production-safe base URL helper
function getBaseURL(): string {
  const envURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  
  if (envURL) {
    return envURL;
  }
  
  // In production, fail fast if environment variable is not set
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_BETTER_AUTH_URL environment variable is required in production. " +
      "Please set this variable to your production auth URL."
    );
  }
  
  // Development fallback
  return "http://localhost:8787";
}

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Memoize auth client to prevent recreation on every render
  const authClient = useMemo(() => {
    return createAuthClient({
      baseURL: getBaseURL(),
    });
  }, []);

  // Stable navigation handlers
  const handleNavigate = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  const handleReplace = useCallback((href: string) => {
    router.replace(href);
  }, [router]);

  const handleSessionChange = useCallback(() => {
    // Clear router cache (protected routes)
    router.refresh();
  }, [router]);

  return (
    <AuthUIProvider 
      authClient={authClient} 
      navigate={handleNavigate}
      replace={handleReplace}
      onSessionChange={handleSessionChange}
      Link={Link}
    >
      {children}
    </AuthUIProvider>
  );
}
