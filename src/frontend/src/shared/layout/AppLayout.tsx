import type { ReactNode } from "react";
import type { UserProfile } from "../../backend";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import NavBar from "../../components/NavBar";
import type { Tab } from "../../routing/routes";

interface AppLayoutProps {
  children: ReactNode;
  profile: UserProfile | null | undefined;
  tier: number;
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  bottomNav?: ReactNode;
}

/**
 * AppLayout — wraps all authenticated pages with:
 * - NavBar (desktop + mobile header)
 * - Main content area
 * - DisclaimerBanner
 * - Optional BottomNav slot (rendered externally to preserve existing logic)
 */
export function AppLayout({
  children,
  profile,
  tier,
  activeTab,
  onTabChange,
  bottomNav,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <NavBar
        profile={profile}
        tier={tier}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <main className="flex-1 pb-40 md:pb-6">
        <div key={activeTab} className="page-slide-in">
          {children}
        </div>
      </main>
      <DisclaimerBanner />
      {bottomNav}
    </div>
  );
}
