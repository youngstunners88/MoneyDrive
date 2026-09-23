import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import LandingPage from "../../pages/LandingPage";
import { useAuth } from "./useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
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
