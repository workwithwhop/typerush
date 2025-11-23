"use client";

import { useEffect, useState } from 'react';

interface WhopProviderProps {
  children: React.ReactNode;
}

export default function WhopProvider({ children }: WhopProviderProps) {
  const [WhopApp, setWhopApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically import WhopApp on the client side
    const loadWhopApp = async () => {
      try {
        const { WhopApp: WhopAppComponent } = await import("@whop/react/components");
        setWhopApp(() => WhopAppComponent);
      } catch (error) {
        // Even if WhopApp fails to load, we still need to provide the iframe SDK context
        // Let's try to create a minimal provider
        try {
          const { WhopIframeSdkProvider } = await import("@whop/react");
          setWhopApp(() => ({ children }: any) => (
            <WhopIframeSdkProvider>{children}</WhopIframeSdkProvider>
          ));
        } catch (fallbackError) {
          // Silent error handling
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWhopApp();
  }, []);

  // Show loading state or fallback
  if (isLoading) {
    return <>{children}</>;
  }

  // If WhopApp loaded successfully, wrap children with it
  if (WhopApp) {
    return <WhopApp>{children}</WhopApp>;
  }

  // Fallback: return children without WhopApp wrapper
  return <>{children}</>;
}
