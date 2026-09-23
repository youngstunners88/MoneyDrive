import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "./backend";
import DisclaimerBanner from "./components/DisclaimerBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import BottomNav from "./components/layout/BottomNav";
import { AIAssistantPage } from "./features/hermes/AIAssistantPage";
import {
  TierUpgradeWizard,
  shouldShowTierWizard,
} from "./features/onboarding/TierUpgradeWizard";
import ProactiveHelpCard from "./features/proactive/ProactiveHelpCard";
import { useProactiveHelp } from "./features/proactive/useProactiveHelp";
import { VoiceAgentModal } from "./features/voice/VoiceAgentModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { usePilotMode } from "./hooks/usePilotMode";
import { TIER_NAMES } from "./lib/tiers";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminPilotModePage from "./pages/AdminPilotModePage";
import AdvertisingPage from "./pages/AdvertisingPage";
import Dashboard from "./pages/Dashboard";
import DriverWealthAcademyPage from "./pages/DriverWealthAcademyPage";
import EarningsIntelligencePage from "./pages/EarningsIntelligencePage";
import EarningsPage from "./pages/EarningsPage";
import EventsPage from "./pages/EventsPage";
import ExpenseTrackerPage from "./pages/ExpenseTrackerPage";
import FuelCalculatorPage from "./pages/FuelCalculatorPage";
import ICPStakingPage from "./pages/ICPStakingPage";
import LandingPage from "./pages/LandingPage";
import ManualPage from "./pages/ManualPage";
import NdunaMarketingHQ from "./pages/NdunaMarketingHQ";
import PassengerMenuPage from "./pages/PassengerMenuPage";
import PresentationViewPage from "./pages/PresentationViewPage";
import QRMenuPage from "./pages/QRMenuPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import SalesPage from "./pages/SalesPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import TermsPage from "./pages/TermsPage";
import { TierGate } from "./routing/TierGate";
import { type Tab, detectSpecialRoute } from "./routing/routes";
import { setAnalyticsActor } from "./services/analyticsService";
import NavBar from "./shared/components/NavBar";
import { useActor } from "./shared/hooks/useActor";
import { cleanupWebMCP, initWebMCP, initWebMCPEarly } from "./webmcp";

// Lazy-loaded feature pages
const ETavernPage = lazy(() => import("./pages/ETavernPage"));
const MessagingPage = lazy(() => import("./pages/MessagingPage"));
const VideoPage = lazy(() => import("./pages/VideoPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const HyperframesPage = lazy(() => import("./pages/HyperframesPage"));
const WebsiteBuilderPage = lazy(() => import("./pages/WebsiteBuilderPage"));
const DocumentVaultPage = lazy(() => import("./pages/DocumentVaultPage"));
const FleetDashboardPage = lazy(() => import("./pages/FleetDashboardPage"));
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"));

// Re-export Tab for backward compatibility with files that import from App
export type { Tab };

// Detect special public routes before any React hooks
const specialRoute = detectSpecialRoute();

// Register WebMCP tools early so AI agents can discover them before auth
initWebMCPEarly();

export default function App() {
  if (specialRoute?.type === "passenger") {
    return <PassengerMenuPage driverName={specialRoute.driverName} />;
  }
  if (specialRoute?.type === "passenger-token") {
    return <PassengerMenuPage token={specialRoute.token} />;
  }
  if (specialRoute?.type === "terms") {
    return <TermsPage />;
  }
  if (specialRoute?.type === "refund") {
    return <RefundPolicyPage />;
  }
  if (specialRoute?.type === "manual") {
    return <ManualPage onBack={() => window.history.back()} />;
  }
  if (specialRoute?.type === "presentation") {
    return <PresentationViewPage shareToken={specialRoute.shareToken} />;
  }
  return (
    <ErrorBoundary>
      <DriverApp />
    </ErrorBoundary>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function DriverApp() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { pilotMode } = usePilotMode();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [addTripOpen, setAddTripOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [hermesInitialQuery, setHermesInitialQuery] = useState<
    string | undefined
  >(undefined);
  const [wizardOpen, setWizardOpen] = useState(false);

  const isLoggedIn = !!identity;

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor || !isLoggedIn) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && isLoggedIn,
  });

  const { data: isAdmin = false } = useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor || !isLoggedIn) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && isLoggedIn,
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (p: UserProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(p);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const mutate = saveProfileMutation.mutate;

  // Handle payment return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const tier = params.get("tier");
    if (payment === "success") {
      const tierNum = tier ? Number(tier) : 1;
      const tierName = TIER_NAMES[tierNum] ?? TIER_NAMES[1];
      toast.success(`Payment successful! Welcome to ${tierName}.`);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancel") {
      toast.info("Payment cancelled.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [queryClient]);

  // Create default profile on first login
  useEffect(() => {
    if (isLoggedIn && actor && profile === null) {
      mutate({
        displayName: "Driver",
        subscriptionTier: BigInt(1),
        voiceEnabled: true,
        currencyCode: "ZAR",
        vehicleName: "",
        fuelConsumptionRate: 0,
      });
    }
  }, [isLoggedIn, actor, profile, mutate]);

  // Show Tier 2+ onboarding wizard on first load after upgrade
  const tier = Number(profile?.subscriptionTier ?? 1);
  const effectiveTier = isAdmin ? 3 : tier;

  // Proactive help — fires on earnings, leads, advertising pages after 90s idle
  const { triggers, hasTriggers, dismissTrigger } = useProactiveHelp(activeTab);

  const handleProactiveAskNduna = (message: string) => {
    setHermesInitialQuery(message);
    setActiveTab("ai-assistant");
  };

  useEffect(() => {
    if (profile !== undefined && profile !== null && effectiveTier >= 2) {
      if (shouldShowTierWizard(effectiveTier)) {
        const t = setTimeout(() => setWizardOpen(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, [profile, effectiveTier]);

  // WebMCP: register tools when actor + profile are ready; clean up on unmount
  useEffect(() => {
    if (!actor || !isLoggedIn || profile === null || profile === undefined)
      return;
    initWebMCP(actor, effectiveTier);
    return () => cleanupWebMCP();
  }, [actor, isLoggedIn, profile, effectiveTier]);

  // Analytics: bind actor so the service can flush events to the canister
  useEffect(() => {
    // Cast to unknown first since AnalyticsActor is a subset of backendInterface
    // logUserAction may not be on the canister yet — the service handles that gracefully
    setAnalyticsActor(
      actor as unknown as Parameters<typeof setAnalyticsActor>[0],
    );
  }, [actor]);

  if (isInitializing || actorFetching) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg font-display">Loading MoneyDrive...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LandingPage />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            profile={profile}
            tier={effectiveTier}
            onTabChange={setActiveTab}
            addTripOpen={addTripOpen}
            onAddTripOpenChange={setAddTripOpen}
          />
        );
      case "earnings":
        return <EarningsPage profile={profile} tier={effectiveTier} />;
      case "intelligence":
        return (
          <EarningsIntelligencePage profile={profile} tier={effectiveTier} />
        );
      case "ai-assistant":
        return (
          <AIAssistantPage
            tier={effectiveTier}
            initialQuery={hermesInitialQuery}
          />
        );
      case "events":
        return <EventsPage profile={profile} tier={effectiveTier} />;
      case "fuel":
        return <FuelCalculatorPage profile={profile} tier={effectiveTier} />;
      case "expenses":
        return <ExpenseTrackerPage profile={profile} tier={effectiveTier} />;
      case "staking":
        return <ICPStakingPage profile={profile} tier={effectiveTier} />;
      case "academy":
        return <DriverWealthAcademyPage onNavigate={setActiveTab} />;
      case "qr-menu":
        return (
          <TierGate
            feature="QR Code Menu"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <QRMenuPage profile={profile} tier={effectiveTier} />
          </TierGate>
        );
      case "sales":
        return (
          <TierGate
            feature="In-Car Sales"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <SalesPage profile={profile} tier={effectiveTier} />
          </TierGate>
        );
      case "schedule":
        return (
          <TierGate
            feature="Schedule"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <SchedulePage profile={profile} tier={effectiveTier} />
          </TierGate>
        );
      case "settings":
        return (
          <SettingsPage
            profile={profile}
            onSave={(p) => saveProfileMutation.mutate(p)}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
          />
        );
      case "advertising":
        return (
          <TierGate
            feature="Advertising Pipeline"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <AdvertisingPage
              profile={profile}
              tier={effectiveTier}
              isAdmin={isAdmin}
            />
          </TierGate>
        );
      case "messaging":
        return (
          <Suspense fallback={<PageLoader />}>
            <MessagingPage
              profile={profile}
              tier={effectiveTier}
              isAdmin={isAdmin}
            />
          </Suspense>
        );
      case "video":
        return (
          <TierGate
            feature="Content Creator"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <Suspense fallback={<PageLoader />}>
              <VideoPage
                profile={profile}
                tier={effectiveTier}
                isAdmin={isAdmin}
              />
            </Suspense>
          </TierGate>
        );
      case "referral":
        return (
          <Suspense fallback={<PageLoader />}>
            <ReferralPage />
          </Suspense>
        );
      case "hyperframes":
        return (
          <TierGate
            feature="AI Video Studio"
            requiredTier={3}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <Suspense fallback={<PageLoader />}>
              <HyperframesPage
                profile={profile}
                tier={effectiveTier}
                isAdmin={isAdmin}
              />
            </Suspense>
          </TierGate>
        );
      case "website-builder":
        return (
          <TierGate
            feature="Website Builder"
            requiredTier={3}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <Suspense fallback={<PageLoader />}>
              <WebsiteBuilderPage />
            </Suspense>
          </TierGate>
        );
      case "documents":
        return (
          <TierGate
            feature="Document Vault"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <Suspense fallback={<PageLoader />}>
              <DocumentVaultPage
                profile={profile}
                tier={effectiveTier}
                onAskNduna={(message) => {
                  setHermesInitialQuery(message);
                  setActiveTab("ai-assistant");
                }}
              />
            </Suspense>
          </TierGate>
        );
      case "fleet":
        return (
          <TierGate
            feature="Fleet Dashboard"
            requiredTier={2}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <Suspense fallback={<PageLoader />}>
              <FleetDashboardPage profile={profile} tier={effectiveTier} />
            </Suspense>
          </TierGate>
        );
      case "opportunities":
        return (
          <TierGate
            feature="Opportunity Hunter"
            requiredTier={3}
            tier={effectiveTier}
            isAdmin={isAdmin}
            onSettings={() => setActiveTab("settings")}
          >
            <Suspense fallback={<PageLoader />}>
              <OpportunitiesPage
                profile={profile}
                tier={effectiveTier}
                isAdmin={isAdmin}
              />
            </Suspense>
          </TierGate>
        );
      case "admin-analytics":
        return (
          <AdminAnalyticsPage
            isAdmin={isAdmin}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
          />
        );
      case "etavern":
        return (
          <Suspense fallback={<PageLoader />}>
            <ETavernPage />
          </Suspense>
        );
      case "admin-marketing":
        return <NdunaMarketingHQ isAdmin={isAdmin} />;
      case "admin-pilot-mode":
        return <AdminPilotModePage isAdmin={isAdmin} />;
      default:
        return (
          <Dashboard
            profile={profile}
            tier={effectiveTier}
            onTabChange={setActiveTab}
            addTripOpen={addTripOpen}
            onAddTripOpenChange={setAddTripOpen}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <OfflineBanner />
      <NavBar
        profile={profile}
        tier={effectiveTier}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pilotMode={pilotMode}
      />
      <main className="flex-1 pb-40 md:pb-6">
        <div key={activeTab} className="page-slide-in">
          {renderPage()}
        </div>
      </main>
      <DisclaimerBanner />
      {/* VoiceAgentModal — only accessible via Quick Actions, never floating */}
      <VoiceAgentModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        tier={effectiveTier}
        isAdmin={isAdmin}
      />
      {/* ProactiveHelpCard — floating overlay on high-value pages */}
      {hasTriggers && (
        <ProactiveHelpCard
          triggers={triggers}
          onAskNduna={handleProactiveAskNduna}
          onDismiss={dismissTrigger}
          currentPage={activeTab}
        />
      )}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogTrip={() => setAddTripOpen(true)}
        onVoiceCommand={() => setVoiceModalOpen(true)}
        onNavigateToEarnings={() => setActiveTab("earnings")}
        onOpenHermes={(query) => {
          setHermesInitialQuery(query);
          setActiveTab("ai-assistant");
        }}
        tier={effectiveTier}
        pilotMode={pilotMode}
      />
      {/* Tier 2+ onboarding wizard */}
      <TierUpgradeWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onNavigate={(tab) => setActiveTab(tab as Tab)}
      />
      <Toaster position="top-right" />
    </div>
  );
}
