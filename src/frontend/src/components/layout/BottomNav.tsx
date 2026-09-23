import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TIER_NAMES } from "@/lib/tiers";
import {
  BookOpen,
  Bot,
  Calendar,
  CalendarDays,
  Clapperboard,
  DollarSign,
  Film,
  Fuel,
  Home,
  Lock,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Mic,
  PiggyBank,
  Plus,
  QrCode,
  Receipt,
  Settings,
  ShoppingBag,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Tab } from "../../routing/routes";
interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onLogTrip: () => void;
  onVoiceCommand?: () => void;
  onNavigateToEarnings?: () => void;
  onOpenHermes?: (query?: string) => void;
  tier: number;
  pilotMode?: boolean;
}

const MORE_ITEMS: {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  minTier: number;
}[] = [
  {
    id: "intelligence",
    label: "Intelligence",
    icon: <Zap className="w-5 h-5" />,
    minTier: 3,
  },
  {
    id: "ai-assistant",
    label: "Nduna",
    icon: <Bot className="w-5 h-5" />,
    minTier: 3,
  },
  {
    id: "advertising",
    label: "Advertising",
    icon: <Megaphone className="w-5 h-5" />,
    minTier: 2,
  },
  {
    id: "messaging",
    label: "Messages",
    icon: <MessageCircle className="w-5 h-5" />,
    minTier: 1,
  },
  {
    id: "video",
    label: "Content",
    icon: <Clapperboard className="w-5 h-5" />,
    minTier: 2,
  },
  {
    id: "hyperframes",
    label: "AI Video",
    icon: <Film className="w-5 h-5" />,
    minTier: 3,
  },
  {
    id: "staking",
    label: "Save & Earn",
    icon: <PiggyBank className="w-5 h-5" />,
    minTier: 1,
  },
  {
    id: "academy",
    label: "Wealth Academy",
    icon: <BookOpen className="w-5 h-5" />,
    minTier: 1,
  },
  {
    id: "events",
    label: "Events",
    icon: <CalendarDays className="w-5 h-5" />,
    minTier: 1,
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: <Receipt className="w-5 h-5" />,
    minTier: 1,
  },
  {
    id: "fuel",
    label: "Fuel Calc",
    icon: <Fuel className="w-5 h-5" />,
    minTier: 1,
  },
  {
    id: "qr-menu",
    label: "QR Menu",
    icon: <QrCode className="w-5 h-5" />,
    minTier: 2,
  },
  {
    id: "sales",
    label: "Sales",
    icon: <ShoppingBag className="w-5 h-5" />,
    minTier: 2,
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: <Calendar className="w-5 h-5" />,
    minTier: 2,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
    minTier: 1,
  },
];

/** Tabs hidden in pilot mode (expensive/complex Tier 3 features) */
const PILOT_HIDDEN_TABS = new Set<Tab>([
  "advertising",
  "messaging",
  "video",
  "hyperframes",
  "website-builder",
  "opportunities",
  "intelligence",
  "admin-marketing",
]);

type NavItem = { id: Tab; label: string };

const MAIN_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Home" },
  { id: "earnings", label: "Earnings" },
];

const MAIN_ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  dashboard: (active) => (
    <Home
      className={`w-5 h-5 transition-all duration-200 ${active ? "scale-110" : ""}`}
    />
  ),
  earnings: (active) => (
    <TrendingUp
      className={`w-5 h-5 transition-all duration-200 ${active ? "scale-110" : ""}`}
    />
  ),
};

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  locked?: boolean;
  onClick: () => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onLogTrip,
  onVoiceCommand,
  onNavigateToEarnings,
  onOpenHermes,
  tier,
  pilotMode = false,
}: BottomNavProps) {
  const aiActive = activeTab === "ai-assistant";
  const etavernActive = activeTab === "etavern";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const aiLocked = tier < 3;

  // Close quick actions when clicking outside
  useEffect(() => {
    if (!quickActionsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(e.target as Node)
      ) {
        setQuickActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [quickActionsOpen]);

  const handleMoreItemClick = (item: {
    id: Tab;
    label: string;
    minTier: number;
  }) => {
    setSheetOpen(false);
    if (item.minTier > tier) {
      toast.error(
        `Upgrade to ${TIER_NAMES[item.minTier]} to unlock ${item.label}`,
      );
      onTabChange("settings");
    } else {
      onTabChange(item.id);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "log-trip",
      label: "Log Trip",
      sublabel: "Record a completed trip",
      icon: (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.75 0.12 85 / 0.2)" }}
        >
          <Plus className="w-5 h-5 text-primary" />
        </div>
      ),
      onClick: () => {
        setQuickActionsOpen(false);
        onLogTrip();
      },
    },
    {
      id: "voice",
      label: "Voice Insight",
      sublabel: "Ask MoneyDrive anything",
      icon: (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.55 0.14 145 / 0.2)" }}
        >
          <Mic className="w-5 h-5" style={{ color: "oklch(0.55 0.14 145)" }} />
        </div>
      ),
      onClick: () => {
        setQuickActionsOpen(false);
        if (onVoiceCommand) {
          onVoiceCommand();
        }
      },
    },
    {
      id: "earnings",
      label: "Log Earnings",
      sublabel: "View your earnings dashboard",
      icon: (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.60 0.22 35 / 0.2)" }}
        >
          <DollarSign
            className="w-5 h-5"
            style={{ color: "oklch(0.78 0.14 40)" }}
          />
        </div>
      ),
      onClick: () => {
        setQuickActionsOpen(false);
        if (onNavigateToEarnings) {
          onNavigateToEarnings();
        } else {
          onTabChange("earnings");
        }
      },
    },
    {
      id: "find-surge",
      label: "Find Surge",
      sublabel: tier >= 3 ? "Ask Nduna for surge spots" : "Requires Tier 3",
      locked: tier < 3,
      icon: (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background:
              tier >= 3
                ? "oklch(0.65 0.18 270 / 0.2)"
                : "oklch(0.30 0.01 80 / 0.3)",
          }}
        >
          <MapPin
            className="w-5 h-5"
            style={{
              color: tier >= 3 ? "oklch(0.65 0.18 270)" : "oklch(0.45 0.02 80)",
            }}
          />
        </div>
      ),
      onClick: () => {
        setQuickActionsOpen(false);
        if (tier < 3) {
          toast.error("Upgrade to Tier 3 to unlock Nduna AI surge detection");
          onTabChange("settings");
          return;
        }
        if (onOpenHermes) {
          onOpenHermes("What are the current surge areas near me?");
        } else {
          onTabChange("ai-assistant");
        }
      },
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 flex items-stretch shadow-[0_-4px_24px_rgba(6,27,43,0.1)]"
      style={{ height: 64 }}
      data-ocid="bottom_nav.panel"
    >
      {/* Home / Earnings */}
      {MAIN_ITEMS.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all min-h-[48px] relative ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`bottom_nav.${item.id}.link`}
            aria-label={item.label}
          >
            {active && (
              <span className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/10 blur-sm pointer-events-none" />
            )}
            <span
              className={`relative z-10 transition-all ${active ? "scale-110" : ""}`}
            >
              {MAIN_ICONS[item.id](active)}
            </span>
            <span
              className={`relative z-10 transition-all duration-200 ${
                active ? "font-bold" : ""
              }`}
              style={
                active ? { animation: "labelScale 0.2s ease-out forwards" } : {}
              }
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Center: Quick Actions CTA */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative"
        ref={quickActionsRef}
      >
        {/* Quick Actions Panel */}
        {quickActionsOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={() => setQuickActionsOpen(false)}
              onKeyDown={(e) =>
                e.key === "Escape" && setQuickActionsOpen(false)
              }
              role="presentation"
            />
            {/* Panel */}
            <div
              className="absolute z-50 rounded-2xl border overflow-hidden shadow-2xl"
              style={{
                bottom: "calc(100% + 12px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: 220,
                background: "oklch(0.13 0.015 78)",
                borderColor: "oklch(0.25 0.025 80)",
                animation: "quickActionsSlideUp 0.18s ease-out forwards",
              }}
              data-ocid="bottom_nav.quick_actions.panel"
            >
              <div
                className="px-3 py-2 border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ borderColor: "oklch(0.22 0.02 80)" }}
              >
                Quick Actions
              </div>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all hover:bg-white/5 active:scale-[0.98] ${
                    action.locked ? "opacity-60" : ""
                  }`}
                  data-ocid={`bottom_nav.quick_action.${action.id}`}
                  aria-label={action.label}
                >
                  {action.icon}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground leading-tight">
                      {action.label}
                      {action.locked && (
                        <Lock
                          className="w-3 h-3 inline ml-1 text-muted-foreground"
                          aria-label="Locked"
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight truncate">
                      {action.sublabel}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Glow ring */}
        {!quickActionsOpen && (
          <span className="absolute w-[58px] h-[58px] rounded-full bg-primary/20 animate-pulse-ring -mt-5 pointer-events-none" />
        )}

        {/* Center button */}
        <button
          type="button"
          onClick={() => setQuickActionsOpen((prev) => !prev)}
          className={`relative w-[52px] h-[52px] rounded-full text-primary-foreground flex items-center justify-center shadow-voice -mt-5 btn-press transition-all z-10 ${
            quickActionsOpen
              ? "bg-foreground/90 scale-95"
              : "bg-primary hover:opacity-90"
          }`}
          aria-label="Quick Actions"
          aria-expanded={quickActionsOpen}
          data-ocid="bottom_nav.quick_actions.button"
        >
          {quickActionsOpen ? (
            <X className="w-5 h-5" style={{ color: "oklch(0.08 0.01 80)" }} />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
        <span
          className="text-[9px] font-semibold mt-0.5 relative z-10 leading-none"
          style={{
            color: quickActionsOpen
              ? "oklch(0.75 0.12 85)"
              : "oklch(0.55 0.05 80)",
          }}
        >
          {quickActionsOpen ? "Close" : "Quick Actions"}
        </span>
      </div>

      {/* Nduna AI tab — Tier 3 exclusive */}
      <button
        type="button"
        onClick={() => {
          if (aiLocked) {
            toast.error("Upgrade to Premium (R800/mo) to unlock Nduna AI");
            onTabChange("settings");
          } else {
            onTabChange("ai-assistant");
          }
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all min-h-[48px] relative ${
          aiActive
            ? "text-burnt-orange"
            : aiLocked
              ? "text-muted-foreground/50"
              : "text-muted-foreground hover:text-burnt-orange"
        }`}
        aria-label="Nduna AI"
        data-ocid="bottom_nav.ai_assistant.tab"
      >
        {aiActive && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-burnt-orange/10 blur-sm pointer-events-none" />
        )}
        <span
          className={`relative z-10 transition-all ${aiActive ? "scale-110" : ""}`}
        >
          {aiLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            <Bot
              className={`w-5 h-5 transition-all duration-200 ${aiActive ? "scale-110" : ""}`}
            />
          )}
        </span>
        <span
          className={`relative z-10 transition-all duration-200 ${
            aiActive ? "font-bold" : ""
          }`}
          style={
            aiActive ? { animation: "labelScale 0.2s ease-out forwards" } : {}
          }
        >
          {aiLocked ? "T3 AI" : "Nduna"}
        </span>
      </button>

      {/* eTavern — community tab, accessible to all tiers */}
      <button
        type="button"
        onClick={() => onTabChange("etavern")}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all min-h-[48px] relative ${
          etavernActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="eTavern Community"
        data-ocid="bottom_nav.etavern.tab"
      >
        {etavernActive && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/10 blur-sm pointer-events-none" />
        )}
        <span
          className={`relative z-10 transition-all ${etavernActive ? "scale-110" : ""}`}
        >
          <MessageCircle
            className={`w-5 h-5 transition-all duration-200 ${etavernActive ? "scale-110" : ""}`}
          />
        </span>
        <span
          className={`relative z-10 transition-all duration-200 ${
            etavernActive ? "font-bold" : ""
          }`}
          style={
            etavernActive
              ? { animation: "labelScale 0.2s ease-out forwards" }
              : {}
          }
        >
          eTavern
        </span>
      </button>

      {/* More — sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-muted-foreground transition-colors min-h-[48px] hover:text-primary"
            aria-label="More options"
            data-ocid="bottom_nav.more.button"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-left text-base">
              All Features
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3">
            {MORE_ITEMS.filter(
              (item) => !pilotMode || !PILOT_HIDDEN_TABS.has(item.id),
            ).map((item) => {
              const locked = item.minTier > tier;
              const active = activeTab === item.id;
              const isAI = item.id === "ai-assistant";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMoreItemClick(item)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-[11px] font-semibold transition-colors min-h-[64px] ${
                    active
                      ? isAI
                        ? "bg-burnt-orange/15 text-burnt-orange"
                        : "bg-primary/10 text-primary"
                      : isAI
                        ? "bg-burnt-orange/5 text-burnt-orange/70 hover:bg-burnt-orange/10 hover:text-burnt-orange"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${locked ? "opacity-60" : ""}`}
                  data-ocid={`bottom_nav.${item.id}.link`}
                >
                  {item.icon}
                  <span className="leading-tight text-center">
                    {item.label}
                  </span>
                  {locked && (
                    <Badge className="text-[8px] px-1 py-0 bg-accent text-accent-foreground font-bold">
                      {TIER_NAMES[item.minTier]}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick actions slide-up animation */}
      <style>{`
        @keyframes quickActionsSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </nav>
  );
}
