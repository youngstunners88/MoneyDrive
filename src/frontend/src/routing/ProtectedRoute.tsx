import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../features/auth/useAuth";
import LandingPage from "../pages/LandingPage";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute — wraps authenticated content.
 * Shows loading spinner during auth init, LandingPage if not logged in.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg font-display">Loading MoneyDrive...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <>{children}</>;
}
