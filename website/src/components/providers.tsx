"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Create auth client directly for Better Auth UI
  const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8787",
  });

  return (
    <AuthUIProvider 
      authClient={authClient} 
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        // Clear router cache (protected routes)
        router.refresh()
      }}
      Link={Link}
    >
      {children}
    </AuthUIProvider>
  );
}
