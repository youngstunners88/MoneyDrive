import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Globe,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Twitter,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { ExaAdminSection } from "../components/admin/AdminSettings";
import { ZeroXWorkPanel } from "../features/0xwork/ZeroXWorkPanel";
import { BrowserbasePanel } from "../features/intelligence/BrowserbasePanel";
import { OrbisPublisherPanel } from "../features/intelligence/OrbisPublisherPanel";
import { XPostingPanel } from "../features/x-posting/XPostingPanel";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePilotMode } from "../hooks/usePilotMode";
import {
  TIER_NAMES,
  TIER_PRICES,
  getTierAmountCents,
  getTierPrice,
} from "../lib/tiers";
import {
  ORBIS_FALLBACK_MODELS,
  type OrbisFallbackModelId,
  useOrbisStore,
} from "../stores/orbisStore";

// ── Nduna Intelligence Skills Panel ──────────────────────────────────────────

const NDUNA_SKILLS = [
  {
    id: "deep-recall",
    name: "Infinite Memory",
    description: "Recursive memory search across all driver history files",
    icon: <Brain className="w-4 h-4" />,
    color: "bg-primary/10 border-primary/20 text-primary",
    dotColor: "bg-primary",
    statusLabel: "deep-recall skill",
  },
  {
    id: "learn-from-mistakes",
    name: "Learning Loop",
    description: "Tracks failed recommendations and avoids repeating them",
    icon: <RefreshCw className="w-4 h-4" />,
    color: "bg-gold/10 border-gold/30 text-gold",
    dotColor: "bg-gold",
    statusLabel: "learn-from-mistakes skill",
  },
  {
    id: "project-memory",
    name: "Session Memory",
    description: "Persistent memory across sessions — Nduna never forgets you",
    icon: <Cloud className="w-4 h-4" />,
    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    dotColor: "bg-emerald-500",
    statusLabel: "project-memory skill",
  },
] as const;

function NdunaSkillsPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
      data-ocid="settings.nduna_skills.panel"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
        style={{ backgroundColor: "oklch(0.97 0.04 85 / 0.5)" }}
        onClick={() => setExpanded((v) => !v)}
        data-ocid="settings.nduna_skills.toggle"
        aria-expanded={expanded}
      >
        <span
          className="flex items-center gap-2"
          style={{ color: "oklch(0.30 0.10 35)" }}
        >
          <Brain className="w-4 h-4" style={{ color: "oklch(0.60 0.22 35)" }} />
          Nduna Intelligence Skills
          <Badge
            className="bg-gold/20 border text-[10px]"
            style={{
              color: "oklch(0.30 0.10 35)",
              borderColor: "oklch(0.75 0.12 85 / 0.5)",
            }}
          >
            ADMIN
          </Badge>
        </span>
        {expanded ? (
          <ChevronUp
            className="w-4 h-4"
            style={{ color: "oklch(0.50 0.10 35)" }}
          />
        ) : (
          <ChevronDown
            className="w-4 h-4"
            style={{ color: "oklch(0.50 0.10 35)" }}
          />
        )}
      </button>

      {expanded && (
        <div
          className="p-4 space-y-3"
          style={{ backgroundColor: "oklch(0.97 0.04 85 / 0.2)" }}
        >
          <p className="text-xs text-muted-foreground">
            3 intelligence skills installed in{" "}
            <code className="font-mono text-[11px] bg-muted px-1 rounded">
              .claude/skills/
            </code>
            . These make Nduna smarter over time — better memory, learns from
            failures, persists context across sessions.
          </p>

          <div className="space-y-2">
            {NDUNA_SKILLS.map((skill) => (
              <div
                key={skill.id}
                className={`rounded-xl border p-3 flex items-start gap-3 ${skill.color}`}
                data-ocid={`settings.nduna_skills.${skill.id}.card`}
              >
                <div className="w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center shrink-0 opacity-80">
                  {skill.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{skill.name}</p>
                    <span className="flex items-center gap-1 text-[10px] font-semibold opacity-70">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${skill.dotColor} animate-pulse`}
                      />
                      Active
                    </span>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5 leading-snug">
                    {skill.description}
                  </p>
                  <p className="text-[10px] font-mono opacity-50 mt-1">
                    {skill.statusLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{
              backgroundColor: "oklch(0.94 0.06 85 / 0.4)",
              color: "oklch(0.40 0.10 35)",
            }}
          >
            <Info className="w-3.5 h-3.5 inline mr-1 shrink-0" />
            Skills are SKILL.md documentation files — they guide how Nduna
            reasons, not runtime code. No API calls needed.
          </div>
        </div>
      )}
    </div>
  );
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const CURATED_MODELS = [
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)" },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free)" },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)" },
  { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B (Free)" },
];

interface SettingsPageProps {
  profile: UserProfile | null | undefined;
  onSave: (p: UserProfile) => void;
  onTabChange?: (tab: string) => void;
}

const CURRENCIES = [
  "ZAR",
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "KES",
  "GHS",
  "EGP",
  "TZS",
  "UGX",
];

const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? "AM" : "PM";
  const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return { value: String(i), label: `${displayHour}:00 ${period}` };
});

const TIER_FEATURES: Record<number, string[]> = {
  1: [
    "Dashboard command center",
    "Full earnings tracker",
    "Expense & fuel logging",
    "Voice commands (trial)",
    "Event calendar",
  ],
  2: [
    "Everything in Hustler",
    "In-Car Sales tracker",
    "QR code passenger menu",
    "Shift scheduling",
    "Full AI voice (unlimited)",
    "Weekly charts",
  ],
  3: [
    "Everything in Pro Driver",
    "Nduna (exclusive)",
    "AI insights & predictions",
    "Advanced analytics",
    "Priority AI voice",
    "Gold Elite badge",
    "Priority support",
    "All future features",
  ],
};

const TIER_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: "Hustler", className: "border text-muted-foreground" },
  2: { label: "PRO", className: "bg-primary text-white" },
  3: { label: "ELITE", className: "bg-gold text-foreground" },
};

export default function SettingsPage({
  profile,
  onSave,
  onTabChange,
}: SettingsPageProps) {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // Profile fields
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [currencyCode, setCurrencyCode] = useState(
    profile?.currencyCode ?? "ZAR",
  );
  const [voiceEnabled, setVoiceEnabled] = useState(
    profile?.voiceEnabled !== false,
  );
  const [saving, setSaving] = useState(false);

  // ElevenLabs
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // OpenRouter / Hermes config
  const [openRouterKey, setOpenRouterKey] = useState("");
  const openRouterUrl = OPENROUTER_API_URL;
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(CURATED_MODELS[0].id);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelId, setCustomModelId] = useState("");

  // Tavily
  const [tavilyKey, setTavilyKey] = useState("");
  const [showTavilyKey, setShowTavilyKey] = useState(false);

  // Geolocation API keys (admin only)
  const [googleMapsKey, setGoogleMapsKey] = useState("");
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [tomTomKey, setTomTomKey] = useState("");
  const [showTomTomKey, setShowTomTomKey] = useState(false);

  // Camofox lead research (admin only)
  const [camofoxUrl, setCamofoxUrl] = useState("");
  const [showCamofoxUrl, setShowCamofoxUrl] = useState(false);
  const [schedulerDay, setSchedulerDay] = useState<string>("1");
  const [schedulerHour, setSchedulerHour] = useState<string>("8");
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);

  // SnapScan Payment Gateway (admin only)
  const [snapScanApiKey, setSnapScanApiKey] = useState("");
  const [snapScanWebhookSecret, setSnapScanWebhookSecret] = useState("");
  const [snapScanMerchantId, setSnapScanMerchantId] = useState("");
  const [showSnapScanApiKey, setShowSnapScanApiKey] = useState(false);
  const [showSnapScanWebhookSecret, setShowSnapScanWebhookSecret] =
    useState(false);
  const [snapScanWebhookCopied, setSnapScanWebhookCopied] = useState(false);

  // Reset memory confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // SnapScan upgrade sheet state
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [upgradeConfirmSent, setUpgradeConfirmSent] = useState(false);

  // Weekly Briefing state
  const [briefingSendResult, setBriefingSendResult] = useState<string | null>(
    null,
  );
  const [showNdunaPromptDialog, setShowNdunaPromptDialog] = useState(false);
  const [showResetEvolutionConfirm, setShowResetEvolutionConfirm] =
    useState(false);

  // AgentMail state
  const [agentMailKey, setAgentMailKey] = useState("");
  const [showAgentMailKey, setShowAgentMailKey] = useState(false);

  // Opportunity Hunter VPS state
  const [opportunityHunterUrl, setOpportunityHunterUrl] = useState("");
  const [opportunityHunterKey, setOpportunityHunterKey] = useState("");
  const [showOpportunityHunterKey, setShowOpportunityHunterKey] =
    useState(false);
  const [opportunityHunterExpanded, setOpportunityHunterExpanded] =
    useState(false);

  // Hyperframes Video Studio VPS state
  const [hyperframesUrl, setHyperframesUrl] = useState("");
  const [hyperframesKey, setHyperframesKey] = useState("");
  const [showHyperframesKey, setShowHyperframesKey] = useState(false);
  const [hyperframesExpanded, setHyperframesExpanded] = useState(false);

  // Document Vault state
  const [docVaultExpanded, setDocVaultExpanded] = useState(false);
  const [docVaultNotesEnabled, setDocVaultNotesEnabled] = useState(false);

  // Orbis Intelligence state
  const [orbisKey, setOrbisKey] = useState("");
  const [showOrbisKey, setShowOrbisKey] = useState(false);
  const [orbisExpanded, setOrbisExpanded] = useState(false);
  const [showOrbisRegistration, setShowOrbisRegistration] = useState(false);
  const [orbisRegEmail, setOrbisRegEmail] = useState("");
  const [orbisRegPassword, setOrbisRegPassword] = useState("");
  const [orbisRegUsername, setOrbisRegUsername] = useState("");
  const {
    pqsEnabled,
    selectedFallbackModel,
    setPqsEnabled,
    setSelectedFallbackModel,
  } = useOrbisStore();

  // Browserbase / Orbis Publisher / 0xWork expanded state
  const [browserbaseExpanded, setBrowserbaseExpanded] = useState(false);
  const [orbisPublisherExpanded, setOrbisPublisherExpanded] = useState(false);
  const [zeroXWorkExpanded, setZeroXWorkExpanded] = useState(false);
  const [xPostingExpanded, setXPostingExpanded] = useState(false);

  // Crypto Intelligence state
  const [cryptoExpanded, setCryptoExpanded] = useState(false);
  const [cmcKey, setCmcKey] = useState("");
  const [showCmcKey, setShowCmcKey] = useState(false);
  const [brianKey, setBrianKey] = useState("");
  const [showBrianKey, setShowBrianKey] = useState(false);

  const tier = Number(profile?.subscriptionTier ?? 1);
  const { pilotMode } = usePilotMode();

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor,
  });

  const { data: isElevenLabsConfigured, refetch: refetchElevenLabs } = useQuery(
    {
      queryKey: ["isElevenLabsConfigured"],
      queryFn: () => actor!.isElevenLabsConfigured(),
      enabled: !!actor && !!isAdmin,
    },
  );

  const { data: isHermesConfigured, refetch: refetchHermes } = useQuery({
    queryKey: ["isOpenClawConfigured"],
    queryFn: () => actor!.isOpenClawConfigured(),
    enabled: !!actor && !!isAdmin,
  });

  const { data: isTavilyConfigured, refetch: refetchTavily } = useQuery({
    queryKey: ["isTavilyConfigured"],
    queryFn: () => actor!.isTavilyConfigured(),
    enabled: !!actor && !!isAdmin,
  });

  const { data: tavilyUsage } = useQuery({
    queryKey: ["tavilyUsage"],
    queryFn: () => actor!.getTavilyUsageEstimate(),
    enabled: !!actor && !!isAdmin,
  });

  const setElevenLabsKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      await actor.setElevenLabsApiKey(key);
    },
    onSuccess: () => {
      toast.success("ElevenLabs API key saved securely.");
      setElevenLabsKey("");
      refetchElevenLabs();
    },
    onError: () => toast.error("Failed to save API key."),
  });

  const setHermesConfigMut = useMutation({
    mutationFn: async ({
      openRouterKeyVal,
      tavilyKeyVal,
      model,
    }: { openRouterKeyVal: string; tavilyKeyVal: string; model: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.setHermesConfig(
        openRouterKeyVal,
        tavilyKeyVal,
        model,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Hermes config saved securely.");
      setOpenRouterKey("");
      refetchHermes();
      refetchTavily();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Hermes config."),
  });

  const setTavilyKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      await actor.setTavilyApiKey(key);
    },
    onSuccess: () => {
      toast.success("Tavily API key saved.");
      setTavilyKey("");
      refetchTavily();
    },
    onError: () => toast.error("Failed to save Tavily key."),
  });

  // Geolocation key mutations (admin only, stored securely in backend)
  type GeoKeyMutActorExt = {
    setGoogleMapsApiKey?: (key: string) => Promise<void>;
    setTomTomApiKey?: (key: string) => Promise<void>;
  };

  const setGoogleMapsKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & GeoKeyMutActorExt;
      if (ext.setGoogleMapsApiKey) {
        await ext.setGoogleMapsApiKey(key);
      } else {
        throw new Error("setGoogleMapsApiKey not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("Google Maps API key saved securely.");
      setGoogleMapsKey("");
    },
    onError: () => toast.error("Failed to save Google Maps API key."),
  });

  const setTomTomKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & GeoKeyMutActorExt;
      if (ext.setTomTomApiKey) {
        await ext.setTomTomApiKey(key);
      } else {
        throw new Error("setTomTomApiKey not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("TomTom API key saved securely.");
      setTomTomKey("");
    },
    onError: () => toast.error("Failed to save TomTom API key."),
  });

  const resetMemoryMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.resetAllDriverMemory();
    },
    onSuccess: () => {
      toast.success("All driver memory cleared.");
      setShowResetConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["driverMemory"] });
      queryClient.invalidateQueries({ queryKey: ["driverMemoryEntries"] });
    },
    onError: () => toast.error("Failed to reset memory."),
  });

  // Legacy compat — also call setOpenClawApiKey for backward compat
  const setOpenClawKeyMut = useMutation({
    mutationFn: async ({
      key,
      url,
      model,
    }: { key: string; url: string; model: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.setOpenClawApiKey(key, url, model);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
  });

  // Camofox mutations (admin only, stored securely in backend)
  type CamofoxActorExt = {
    setCamofoxBaseUrl?: (
      url: string,
    ) => Promise<{ ok: null } | { err: string }>;
    isCamofoxConfigured?: () => Promise<boolean>;
    getSchedulerConfig?: () => Promise<{
      dayOfWeek: bigint;
      hour: bigint;
      enabled: boolean;
    }>;
    setSchedulerConfig?: (config: {
      dayOfWeek: bigint;
      hour: bigint;
      enabled: boolean;
    }) => Promise<{ ok: null } | { err: string }>;
  };

  const { data: isCamofoxConfigured, refetch: refetchCamofox } = useQuery({
    queryKey: ["isCamofoxConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & CamofoxActorExt;
      if (ext.isCamofoxConfigured) return ext.isCamofoxConfigured();
      return false;
    },
    enabled: !!actor && !!isAdmin,
  });

  const { data: schedulerConfig } = useQuery({
    queryKey: ["schedulerConfig"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & CamofoxActorExt;
      if (ext.getSchedulerConfig) return ext.getSchedulerConfig();
      return null;
    },
    enabled: !!actor && !!isAdmin,
  });

  // Sync scheduler config from backend on load
  useEffect(() => {
    if (schedulerConfig) {
      setSchedulerDay(String(Number(schedulerConfig.dayOfWeek)));
      setSchedulerHour(String(Number(schedulerConfig.hour)));
      setSchedulerEnabled(schedulerConfig.enabled);
    }
  }, [schedulerConfig]);

  const setCamofoxUrlMut = useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & CamofoxActorExt;
      if (ext.setCamofoxBaseUrl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await ext.setCamofoxBaseUrl(url);
        if (result != null && typeof result === "object" && "err" in result)
          throw new Error(String(result.err));
      } else {
        throw new Error("setCamofoxBaseUrl not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("Camofox URL saved securely.");
      setCamofoxUrl("");
      refetchCamofox();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Camofox URL."),
  });

  const setSchedulerConfigMut = useMutation({
    mutationFn: async ({
      day,
      hour,
      enabled,
    }: { day: string; hour: string; enabled: boolean }) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & CamofoxActorExt;
      if (ext.setSchedulerConfig) {
        const result = await ext.setSchedulerConfig({
          dayOfWeek: BigInt(day),
          hour: BigInt(hour),
          enabled,
        });
        if ("err" in result) throw new Error(result.err);
      } else {
        throw new Error("setSchedulerConfig not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("Scheduler config saved.");
      queryClient.invalidateQueries({ queryKey: ["schedulerConfig"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save scheduler config."),
  });

  // SnapScan Payment Gateway (admin only, stored securely in backend)
  type SnapScanActorExt = {
    setSnapScanConfig?: (
      merchantApiKey: string,
      webhookSecret: string,
      merchantId: string,
    ) => Promise<{ ok: null } | { err: string }>;
    isSnapScanConfigured?: () => Promise<boolean>;
  };

  const { data: isSnapScanConfigured, refetch: refetchSnapScan } = useQuery({
    queryKey: ["isSnapScanConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & SnapScanActorExt;
      if (ext.isSnapScanConfigured) return ext.isSnapScanConfigured();
      return false;
    },
    enabled: !!actor && !!isAdmin,
  });

  // Fetch the live merchant ID from backend for QR code generation
  const { data: snapScanMerchantIdFromBackend } = useQuery({
    queryKey: ["snapScanMerchantId"],
    queryFn: () => actor!.getSnapScanMerchantId(),
    enabled: !!actor,
  });

  const setSnapScanConfigMut = useMutation({
    mutationFn: async ({
      apiKey,
      webhookSecret,
      merchantId,
    }: { apiKey: string; webhookSecret: string; merchantId: string }) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & SnapScanActorExt;
      if (ext.setSnapScanConfig) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await ext.setSnapScanConfig(
          apiKey,
          webhookSecret,
          merchantId,
        );
        if (result != null && typeof result === "object" && "err" in result)
          throw new Error(String(result.err));
      } else {
        throw new Error("setSnapScanConfig not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("SnapScan credentials saved securely.");
      setSnapScanApiKey("");
      setSnapScanWebhookSecret("");
      setSnapScanMerchantId("");
      refetchSnapScan();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save SnapScan config."),
  });

  const snapScanWebhookUrl = `${window.location.origin}/snapscan/webhook`;

  // Resolved merchant ID: prefer backend value, fall back to empty string
  const resolvedMerchantId = snapScanMerchantIdFromBackend ?? "";

  const handleCopySnapScanWebhook = () => {
    navigator.clipboard.writeText(snapScanWebhookUrl).then(() => {
      setSnapScanWebhookCopied(true);
      setTimeout(() => setSnapScanWebhookCopied(false), 2000);
    });
  };

  // Weekly Briefing types and queries
  type WeeklyBriefingActorExt = {
    getWeeklyBriefingState?: () => Promise<{
      enabled: boolean;
      lastSentAt: bigint[];
      briefingDayOfWeek: bigint;
      briefingHour: bigint;
    }>;
    setWeeklyBriefingEnabled?: (enabled: boolean) => Promise<void>;
    triggerWeeklyBriefings?: () => Promise<{ sent: bigint; failed: bigint }>;
    getNdunaPromptState?: () => Promise<{
      basePrompt: string;
      evolutionDelta: string;
      lastEvolved: bigint[];
      evolutionCount: bigint;
    }>;
    resetNdunaEvolution?: () => Promise<void>;
  };

  const { data: weeklyBriefingState, refetch: refetchBriefingState } = useQuery(
    {
      queryKey: ["weeklyBriefingState"],
      queryFn: async () => {
        if (!actor) return null;
        const ext = actor as typeof actor & WeeklyBriefingActorExt;
        if (ext.getWeeklyBriefingState) return ext.getWeeklyBriefingState();
        return null;
      },
      enabled: !!actor && !!isAdmin,
    },
  );

  const { data: ndunaPromptState, refetch: refetchNdunaPrompt } = useQuery({
    queryKey: ["ndunaPromptState"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & WeeklyBriefingActorExt;
      if (ext.getNdunaPromptState) return ext.getNdunaPromptState();
      return null;
    },
    enabled: !!actor && !!isAdmin,
  });

  const { data: cohortStats } = useQuery({
    queryKey: ["cohortStats"],
    queryFn: () => actor!.getCohortStats(),
    enabled: !!actor && !!isAdmin,
  });

  const toggleBriefingMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & WeeklyBriefingActorExt;
      if (ext.setWeeklyBriefingEnabled)
        await ext.setWeeklyBriefingEnabled(enabled);
    },
    onSuccess: () => refetchBriefingState(),
    onError: () => toast.error("Failed to update briefing setting."),
  });

  const triggerBriefingMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & WeeklyBriefingActorExt;
      if (ext.triggerWeeklyBriefings) return ext.triggerWeeklyBriefings();
      return { sent: BigInt(0), failed: BigInt(0) };
    },
    onSuccess: (data) => {
      const msg = data
        ? `Sent to ${Number(data.sent)} drivers (${Number(data.failed)} failed)`
        : "Done";
      setBriefingSendResult(msg);
      toast.success(msg);
    },
    onError: () => toast.error("Failed to trigger briefings."),
  });

  const resetEvolutionMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & WeeklyBriefingActorExt;
      if (ext.resetNdunaEvolution) await ext.resetNdunaEvolution();
    },
    onSuccess: () => {
      toast.success("Nduna evolution reset.");
      setShowResetEvolutionConfirm(false);
      refetchNdunaPrompt();
    },
    onError: () => toast.error("Failed to reset evolution."),
  });

  // ── AgentMail ─────────────────────────────────────────────────────────────

  type AgentMailActorExt = {
    setAgentMailApiKey?: (key: string) => Promise<void>;
    getNdunaInboxId?: () => Promise<string[]>; // opt text returns array in candid
    provisionNdunaInbox?: () => Promise<
      { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
    >;
    setOnboardingEmailEnabled?: (enabled: boolean) => Promise<void>;
    setWeeklyBriefingEmailEnabled?: (enabled: boolean) => Promise<void>;
    setLeadFollowupEmailEnabled?: (enabled: boolean) => Promise<void>;
    getEmailConfig?: () => Promise<{
      onboardingEnabled: boolean;
      weeklyBriefingEnabled: boolean;
      leadFollowupEnabled: boolean;
    }>;
  };

  const { data: agentMailInboxId, refetch: refetchInboxId } = useQuery<
    string | null
  >({
    queryKey: ["ndunaInboxId"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.getNdunaInboxId) return null;
      const result = await ext.getNdunaInboxId();
      // opt text is Array<string> in JS
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    },
    enabled: !!actor && !!isAdmin,
  });

  const { data: emailConfig, refetch: refetchEmailConfig } = useQuery({
    queryKey: ["emailConfig"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.getEmailConfig) return null;
      return ext.getEmailConfig();
    },
    enabled: !!actor && !!isAdmin,
  });

  const setAgentMailKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.setAgentMailApiKey) throw new Error("Not available");
      await ext.setAgentMailApiKey(key);
    },
    onSuccess: () => {
      toast.success("AgentMail API key saved securely.");
      setAgentMailKey("");
    },
    onError: () => toast.error("Failed to save AgentMail API key."),
  });

  const provisionInboxMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.provisionNdunaInbox) throw new Error("Not available");
      const result = await ext.provisionNdunaInbox();
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: (inboxAddress) => {
      toast.success(`Nduna's inbox provisioned: ${inboxAddress}`);
      refetchInboxId();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to provision inbox."),
  });

  const setOnboardingEmailMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.setOnboardingEmailEnabled) throw new Error("Not available");
      await ext.setOnboardingEmailEnabled(enabled);
    },
    onSuccess: () => refetchEmailConfig(),
    onError: () => toast.error("Failed to update onboarding email setting."),
  });

  const setWeeklyBriefingEmailMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.setWeeklyBriefingEmailEnabled) throw new Error("Not available");
      await ext.setWeeklyBriefingEmailEnabled(enabled);
    },
    onSuccess: () => refetchEmailConfig(),
    onError: () =>
      toast.error("Failed to update weekly briefing email setting."),
  });

  const setLeadFollowupEmailMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & AgentMailActorExt;
      if (!ext.setLeadFollowupEmailEnabled) throw new Error("Not available");
      await ext.setLeadFollowupEmailEnabled(enabled);
    },
    onSuccess: () => refetchEmailConfig(),
    onError: () =>
      toast.error("Failed to update lead follow-up email setting."),
  });

  // ── Opportunity Hunter VPS ─────────────────────────────────────────────────

  type OpportunityHunterActorExt = {
    setOpportunityHunterConfig?: (
      url: string,
      key: string,
    ) => Promise<
      { __kind__: "ok"; ok: boolean } | { __kind__: "err"; err: string }
    >;
    isOpportunityHunterConfigured?: () => Promise<boolean>;
    getOpportunityHunterStatus?: () => Promise<{
      configured: boolean;
      lastRun: bigint;
      lastError: string;
    }>;
  };

  const { data: opportunityHunterStatus, refetch: refetchOpportunityHunter } =
    useQuery({
      queryKey: ["opportunityHunterStatus"],
      queryFn: async () => {
        if (!actor) return null;
        const ext = actor as typeof actor & OpportunityHunterActorExt;
        if (ext.getOpportunityHunterStatus)
          return ext.getOpportunityHunterStatus();
        return null;
      },
      enabled: !!actor && !!isAdmin,
    });

  const setOpportunityHunterConfigMut = useMutation({
    mutationFn: async ({ url, key }: { url: string; key: string }) => {
      if (!actor) throw new Error("No actor");
      if (!url.startsWith("https://"))
        throw new Error("VPS Endpoint URL must start with https://");
      const ext = actor as typeof actor & OpportunityHunterActorExt;
      if (ext.setOpportunityHunterConfig) {
        const result = await ext.setOpportunityHunterConfig(url, key);
        if (result.__kind__ === "err")
          throw new Error((result as { __kind__: "err"; err: string }).err);
      } else {
        throw new Error("setOpportunityHunterConfig not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("Opportunity Hunter VPS configured.");
      setOpportunityHunterUrl("");
      setOpportunityHunterKey("");
      refetchOpportunityHunter();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Opportunity Hunter config."),
  });

  // ── Hyperframes Video Studio VPS ──────────────────────────────────────────

  type HyperframesActorExt = {
    setHyperframesVpsUrl?: (url: string) => Promise<void>;
    setHyperframesVpsKey?: (key: string) => Promise<void>;
    getHyperframesConfig?: () => Promise<{ configured: boolean }>;
  };

  const { data: hyperframesConfig, refetch: refetchHyperframesConfig } =
    useQuery({
      queryKey: ["hyperframesConfig"],
      queryFn: async () => {
        if (!actor) return null;
        const ext = actor as typeof actor & HyperframesActorExt;
        if (ext.getHyperframesConfig) return ext.getHyperframesConfig();
        return null;
      },
      enabled: !!actor && !!isAdmin,
    });

  const setHyperframesConfigMut = useMutation({
    mutationFn: async ({ url, key }: { url: string; key: string }) => {
      if (!actor) throw new Error("No actor");
      if (!url.startsWith("https://"))
        throw new Error("Render Server URL must start with https://");
      const ext = actor as typeof actor & HyperframesActorExt;
      if (ext.setHyperframesVpsUrl) await ext.setHyperframesVpsUrl(url);
      else throw new Error("setHyperframesVpsUrl not available on actor");
      if (ext.setHyperframesVpsKey) await ext.setHyperframesVpsKey(key);
      else throw new Error("setHyperframesVpsKey not available on actor");
    },
    onSuccess: () => {
      toast.success("Hyperframes render server configured.");
      setHyperframesUrl("");
      setHyperframesKey("");
      refetchHyperframesConfig();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Hyperframes config."),
  });

  // ── Document Vault ─────────────────────────────────────────────────────────

  type DocVaultActorExt = {
    getDocVaultConfig?: () => Promise<{
      notesEnabled: boolean;
    }>;
    setDocVaultNotesEnabled?: (
      enabled: boolean,
    ) => Promise<{ __kind__: string; ok?: boolean; err?: string }>;
  };

  const { data: docVaultConfig, refetch: refetchDocVaultConfig } = useQuery({
    queryKey: ["docVaultConfig"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & DocVaultActorExt;
      if (ext.getDocVaultConfig) return ext.getDocVaultConfig();
      return null;
    },
    enabled: !!actor && !!isAdmin,
  });

  // Sync docVaultNotesEnabled from backend
  useEffect(() => {
    if (docVaultConfig?.notesEnabled !== undefined) {
      setDocVaultNotesEnabled(docVaultConfig.notesEnabled);
    }
  }, [docVaultConfig]);

  const setDocVaultNotesMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & DocVaultActorExt;
      if (!ext.setDocVaultNotesEnabled) throw new Error("Not available");
      await ext.setDocVaultNotesEnabled(enabled);
    },
    onSuccess: () => {
      refetchDocVaultConfig();
      toast.success("Document Vault setting saved.");
    },
    onError: () => toast.error("Failed to update Document Vault setting."),
  });

  // ── Orbis Intelligence ────────────────────────────────────────────────────

  type OrbisActorExt = {
    setOrbisApiKey?: (key: string) => Promise<void>;
    getOrbisApiKeyStatus?: () => Promise<boolean>;
    triggerOrbisRegistration?: (
      email: string,
      password: string,
      username: string,
    ) => Promise<
      { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
    >;
  };

  const { data: isOrbisConfigured, refetch: refetchOrbisStatus } = useQuery({
    queryKey: ["isOrbisConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & OrbisActorExt;
      if (ext.getOrbisApiKeyStatus) return ext.getOrbisApiKeyStatus();
      return false;
    },
    enabled: !!actor && !!isAdmin,
  });

  const setOrbisKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & OrbisActorExt;
      if (!ext.setOrbisApiKey) throw new Error("setOrbisApiKey not available");
      await ext.setOrbisApiKey(key);
    },
    onSuccess: () => {
      toast.success("Orbis API key saved securely.");
      setOrbisKey("");
      refetchOrbisStatus();
    },
    onError: () => toast.error("Failed to save Orbis API key."),
  });

  const orbisRegisterMut = useMutation({
    mutationFn: async ({
      email,
      password,
      username,
    }: { email: string; password: string; username: string }) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & OrbisActorExt;
      if (!ext.triggerOrbisRegistration)
        throw new Error("triggerOrbisRegistration not available");
      const result = await ext.triggerOrbisRegistration(
        email,
        password,
        username,
      );
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      toast.success("Nduna registered on Orbis! API key saved automatically.");
      setOrbisRegEmail("");
      setOrbisRegPassword("");
      setOrbisRegUsername("");
      setShowOrbisRegistration(false);
      refetchOrbisStatus();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Orbis registration failed."),
  });

  // ── Crypto Intelligence queries & mutations ───────────────────────────────

  type CryptoActorExt = {
    setCMCApiKey?: (key: string) => Promise<void>;
    getCMCApiKeyStatus?: () => Promise<boolean>;
    setBrianApiKey?: (key: string) => Promise<void>;
    getBrianApiKeyStatus?: () => Promise<boolean>;
    getUSDCZARRate?: () => Promise<string>;
  };

  const { data: isCMCConfigured, refetch: refetchCMCStatus } = useQuery({
    queryKey: ["isCMCConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & CryptoActorExt;
      if (ext.getCMCApiKeyStatus) return ext.getCMCApiKeyStatus();
      return false;
    },
    enabled: !!actor && !!isAdmin,
  });

  const { data: isBrianConfigured, refetch: refetchBrianStatus } = useQuery({
    queryKey: ["isBrianConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & CryptoActorExt;
      if (ext.getBrianApiKeyStatus) return ext.getBrianApiKeyStatus();
      return false;
    },
    enabled: !!actor && !!isAdmin,
  });

  const { data: liveUSDCRate, refetch: refetchUSDCRate } = useQuery({
    queryKey: ["liveUSDCRate"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & CryptoActorExt;
      if (ext.getUSDCZARRate) {
        const raw = await ext.getUSDCZARRate();
        try {
          const parsed = JSON.parse(raw);
          return (parsed["usd-coin"]?.zar as number) ?? null;
        } catch {
          return null;
        }
      }
      return null;
    },
    enabled: !!actor && !!isAdmin,
    staleTime: 10 * 60 * 1000,
  });

  const setCMCKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & CryptoActorExt;
      if (!ext.setCMCApiKey) throw new Error("setCMCApiKey not available");
      await ext.setCMCApiKey(key);
    },
    onSuccess: () => {
      toast.success("CoinMarketCap API key saved.");
      setCmcKey("");
      refetchCMCStatus();
    },
    onError: () => toast.error("Failed to save CoinMarketCap API key."),
  });

  const setBrianKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      const ext = actor as typeof actor & CryptoActorExt;
      if (!ext.setBrianApiKey) throw new Error("setBrianApiKey not available");
      await ext.setBrianApiKey(key);
    },
    onSuccess: () => {
      toast.success("Brian API key saved.");
      setBrianKey("");
      refetchBrianStatus();
    },
    onError: () => toast.error("Failed to save Brian API key."),
  });

  const handleSaveHermesConfig = () => {
    const model = useCustomModel
      ? customModelId.trim() || CURATED_MODELS[0].id
      : selectedModel;

    // Save via setHermesConfig (combined call)
    setHermesConfigMut.mutate({
      openRouterKeyVal: openRouterKey,
      tavilyKeyVal: tavilyKey,
      model,
    });

    // Also save via legacy setOpenClawApiKey for backward compat
    if (openRouterKey.trim()) {
      setOpenClawKeyMut.mutate({
        key: openRouterKey,
        url: openRouterUrl,
        model,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    onSave({
      displayName: displayName || "Driver",
      currencyCode,
      voiceEnabled,
      subscriptionTier: BigInt(tier),
      vehicleName: profile?.vehicleName ?? "",
      fuelConsumptionRate: profile?.fuelConsumptionRate ?? 0,
    });
    toast.success("Settings saved");
    setSaving(false);
  };

  const allFeatureKeys = Array.from(
    new Set(Object.values(TIER_FEATURES).flat()),
  );

  const tierHasFeature = (tierNum: number, feature: string): boolean => {
    const features = TIER_FEATURES[tierNum] ?? [];
    if (tierNum === 3) return true;
    if (tierNum === 2) {
      return (
        TIER_FEATURES[2].includes(feature) || TIER_FEATURES[1].includes(feature)
      );
    }
    return features.includes(feature);
  };

  const badge = TIER_BADGE[tier] ?? TIER_BADGE[1];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile card */}
      <Card className="shadow-card" data-ocid="settings.profile.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-1"
              data-ocid="settings.display_name.input"
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={currencyCode} onValueChange={setCurrencyCode}>
              <SelectTrigger
                className="mt-1"
                data-ocid="settings.currency.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-2">
                <Mic className="w-4 h-4" /> Voice Commands
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable hands-free voice operation
              </p>
            </div>
            <Switch
              checked={voiceEnabled}
              onCheckedChange={setVoiceEnabled}
              data-ocid="settings.voice.switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status + Upgrade */}
      <Card className="shadow-card" data-ocid="settings.subscription.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Subscription Plans
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Your current plan:{" "}
            <span className="font-bold text-foreground">
              {TIER_NAMES[tier]}
            </span>
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-0">
          {/* Subscription Status Banner */}
          {pilotMode ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  Free 90-day pilot — no card required.
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  We'll ask for feedback in exchange.
                </p>
              </div>
            </div>
          ) : tier === 1 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  Trial Active — 14-day free trial
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  After your trial ends, upgrade to keep your leads, pitch
                  tools, and voice commands.
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setUpgradeSheetOpen(true)}
                data-ocid="settings.trial_upgrade.button"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade Now
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  {TIER_NAMES[tier]} — Active
                </p>
                <p className="text-xs text-emerald-700">
                  {TIER_PRICES[tier]}/month
                </p>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                Active
              </Badge>
            </div>
          )}

          {/* What's included — expandable */}
          <div className="mb-4 rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-foreground bg-muted/40 hover:bg-muted/60 transition-colors"
              onClick={() => setFeaturesExpanded((v) => !v)}
              data-ocid="settings.features_expand.toggle"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                What's included in your plan
              </span>
              {featuresExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {featuresExpanded && (
              <div className="px-3 py-3 space-y-2 bg-background">
                {tier >= 2 ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">
                      ✓ Unlimited ElevenLabs voice commands
                    </span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] ml-auto">
                      Tier 2+
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      ✓ Voice commands (500 chars/month — upgrade for unlimited)
                    </span>
                  </div>
                )}
                {(TIER_FEATURES[tier] ?? [])
                  .filter(
                    (f) =>
                      !f.startsWith("Everything") &&
                      !f.toLowerCase().includes("voice"),
                  )
                  .map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                {tier < 3 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setUpgradeSheetOpen(true)}
                      className="text-xs font-semibold text-primary underline"
                      data-ocid="settings.upgrade_from_features.button"
                    >
                      Upgrade to unlock more →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-1/2">Feature</TableHead>
                {[1, 2, 3].map((t) => (
                  <TableHead
                    key={t}
                    className={`text-center text-xs ${t === tier ? "text-primary font-bold" : ""}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{TIER_NAMES[t]}</span>
                      <span
                        className={`text-[10px] font-normal ${t === tier ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {t === 3
                          ? TIER_PRICES[3]
                          : pilotMode
                            ? "Free (Pilot)"
                            : TIER_PRICES[t]}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFeatureKeys
                .filter((f) => !f.startsWith("Everything"))
                .map((feature) => (
                  <TableRow key={feature}>
                    <TableCell className="text-xs py-2">{feature}</TableCell>
                    {[1, 2, 3].map((t) => (
                      <TableCell
                        key={t}
                        className={`text-center py-2 ${t === tier ? "bg-primary/5" : ""}`}
                      >
                        {tierHasFeature(t, feature) ? (
                          <Check className="w-4 h-4 text-success mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Current tier highlight */}
          <div
            className={`my-4 p-3 rounded-xl flex items-center justify-between ${
              tier === 3
                ? "bg-gold/10 border border-gold/30"
                : tier === 2
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-muted"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-foreground">
                Current:{" "}
                <span
                  className={`${tier === 3 ? "text-gold" : tier === 2 ? "text-primary" : ""}`}
                >
                  {TIER_NAMES[tier]} Plan
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {pilotMode && tier < 3
                  ? "Free 90-day pilot — no card required"
                  : tier === 1
                    ? "14-day free trial, then R350/month"
                    : TIER_PRICES[tier]}
              </p>
            </div>
            <Badge
              className={badge.className}
              variant={tier === 1 ? "outline" : "default"}
            >
              {badge.label}
            </Badge>
          </div>

          {/* Upgrade via SnapScan */}
          {tier < 3 && (
            <div className="mb-4">
              <Button
                className="w-full gap-2"
                onClick={() => setUpgradeSheetOpen(true)}
                data-ocid="settings.upgrade_snapscan.button"
              >
                <QrCode className="w-4 h-4" />
                Upgrade with SnapScan
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground pb-4">
            Pay via SnapScan QR — your tier activates automatically within a few
            minutes of payment.
          </p>
        </CardContent>
      </Card>

      {/* SnapScan Upgrade Sheet */}
      <Sheet open={upgradeSheetOpen} onOpenChange={setUpgradeSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="settings.upgrade.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-lg">
              Upgrade Your Plan
            </SheetTitle>
            <SheetDescription className="text-sm">
              Scan the QR code with your SnapScan app to upgrade instantly.
            </SheetDescription>
          </SheetHeader>

          {!upgradeConfirmSent ? (
            <div className="space-y-4">
              {/* No merchant ID notice */}
              {!resolvedMerchantId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Set your SnapScan Merchant ID in Settings → Admin Panel to
                    activate payment QR codes.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {tier < 2 && (
                  <div
                    className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-3"
                    data-ocid="settings.upgrade.tier2.card"
                  >
                    <div>
                      <p className="font-display font-bold text-center text-sm">
                        Pro Driver
                      </p>
                      <p className="text-2xl font-bold text-primary text-center">
                        {pilotMode ? "R0.00" : "R530"}
                      </p>
                      <p className="text-[10px] text-muted-foreground text-center">
                        {pilotMode ? "Free Pilot" : "/month"}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-2 shadow-sm">
                      {resolvedMerchantId ? (
                        <img
                          src={`https://chart.googleapis.com/chart?chs=140x140&cht=qr&chl=${encodeURIComponent(`https://pos.snapscan.io/qr/${resolvedMerchantId}?amount=${getTierAmountCents(2, pilotMode)}&strict=true`)}&choe=UTF-8`}
                          alt="SnapScan QR for Pro Driver upgrade"
                          width={140}
                          height={140}
                          className="rounded"
                        />
                      ) : (
                        <div className="w-[140px] h-[140px] rounded flex items-center justify-center bg-muted text-center">
                          <p className="text-[10px] text-muted-foreground px-2">
                            QR unavailable — set Merchant ID in admin settings
                          </p>
                        </div>
                      )}
                    </div>
                    <a
                      href={
                        resolvedMerchantId
                          ? `https://pos.snapscan.io/qr/${resolvedMerchantId}?amount=${getTierAmountCents(2, pilotMode)}&strict=true`
                          : "#"
                      }
                      target={resolvedMerchantId ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`w-full text-center text-xs py-2 rounded-xl font-semibold text-white ${!resolvedMerchantId ? "opacity-50 pointer-events-none" : ""}`}
                      style={{ background: "oklch(0.52 0.20 35)" }}
                      data-ocid="settings.upgrade.tier2.pay_button"
                    >
                      {pilotMode ? "Activate Free — R0.00" : "Tap to Pay R530"}
                    </a>
                    <p className="text-[10px] text-muted-foreground text-center">
                      {pilotMode
                        ? "Free pilot — no payment needed"
                        : "Scan with SnapScan app"}
                    </p>
                  </div>
                )}

                {tier < 3 && (
                  <div
                    className={`rounded-2xl border-2 border-gold/40 bg-gold/5 p-4 flex flex-col items-center gap-3 ${tier < 2 ? "" : "col-span-2"}`}
                    data-ocid="settings.upgrade.tier3.card"
                  >
                    <div>
                      <p className="font-display font-bold text-center text-sm">
                        Elite Driver
                      </p>
                      <p className="text-2xl font-bold text-gold text-center">
                        R800
                      </p>
                      <p className="text-[10px] text-muted-foreground text-center">
                        /month
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-2 shadow-sm">
                      {resolvedMerchantId ? (
                        <img
                          src={`https://chart.googleapis.com/chart?chs=140x140&cht=qr&chl=${encodeURIComponent(`https://pos.snapscan.io/qr/${resolvedMerchantId}?amount=${getTierAmountCents(3, pilotMode)}&strict=true`)}&choe=UTF-8`}
                          alt="SnapScan QR for Elite Driver upgrade"
                          width={140}
                          height={140}
                          className="rounded"
                        />
                      ) : (
                        <div className="w-[140px] h-[140px] rounded flex items-center justify-center bg-muted text-center">
                          <p className="text-[10px] text-muted-foreground px-2">
                            QR unavailable — set Merchant ID in admin settings
                          </p>
                        </div>
                      )}
                    </div>
                    <a
                      href={
                        resolvedMerchantId
                          ? `https://pos.snapscan.io/qr/${resolvedMerchantId}?amount=${getTierAmountCents(3, pilotMode)}&strict=true`
                          : "#"
                      }
                      target={resolvedMerchantId ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`w-full text-center text-xs py-2 rounded-xl font-semibold ${!resolvedMerchantId ? "opacity-50 pointer-events-none" : ""}`}
                      style={{
                        background: "oklch(0.75 0.12 85)",
                        color: "oklch(0.20 0.05 60)",
                      }}
                      data-ocid="settings.upgrade.tier3.pay_button"
                    >
                      Tap to Pay R800
                    </a>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Scan with SnapScan app
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setUpgradeConfirmSent(true)}
                data-ocid="settings.upgrade.paid_confirm.button"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                I've paid — activate my tier
              </Button>
            </div>
          ) : (
            <div
              className="text-center py-6 space-y-3"
              data-ocid="settings.upgrade.success_state"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">Payment Received!</p>
              <p className="text-sm text-muted-foreground">
                Payment is being verified. Your tier will activate automatically
                within a few minutes.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUpgradeConfirmSent(false);
                  setUpgradeSheetOpen(false);
                }}
                data-ocid="settings.upgrade.done.button"
              >
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 text-base font-bold min-h-[52px] btn-press"
        data-ocid="settings.save.button"
      >
        {saving ? "Saving..." : "Save Settings"}
      </Button>

      {/* Admin Panel */}
      {isAdmin && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid oklch(0.75 0.12 85 / 0.5)" }}
          data-ocid="settings.admin.panel"
        >
          <div
            className="px-4 py-3 flex items-center gap-2 border-b"
            style={{
              backgroundColor: "oklch(0.97 0.04 85)",
              borderColor: "oklch(0.75 0.12 85 / 0.4)",
            }}
          >
            <Shield
              className="w-4 h-4"
              style={{ color: "oklch(0.60 0.22 35)" }}
            />
            <span
              className="font-display font-bold text-sm"
              style={{ color: "oklch(0.30 0.10 35)" }}
            >
              Admin Panel
            </span>
            <span
              className="ml-auto text-[10px] rounded-full px-2 py-0.5 font-semibold"
              style={{
                backgroundColor: "oklch(0.75 0.12 85 / 0.3)",
                color: "oklch(0.30 0.10 35)",
              }}
            >
              ADMIN ONLY
            </span>
          </div>
          <div
            className="p-4 space-y-5"
            style={{ backgroundColor: "oklch(0.97 0.04 85 / 0.3)" }}
          >
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <div
                className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${isElevenLabsConfigured ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
              >
                {isElevenLabsConfigured ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                ElevenLabs:{" "}
                {isElevenLabsConfigured ? "Configured" : "Not configured"}
              </div>
              <div
                className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${isHermesConfigured ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
              >
                {isHermesConfigured ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Nduna: {isHermesConfigured ? "Configured" : "Not configured"}
              </div>
              <div
                className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${isTavilyConfigured ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
              >
                {isTavilyConfigured ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Tavily:{" "}
                {isTavilyConfigured ? "Web search active" : "Not configured"}
              </div>
              <div
                className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${isCamofoxConfigured ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
              >
                {isCamofoxConfigured ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Camofox: {isCamofoxConfigured ? "Configured" : "Not configured"}
              </div>
              <div
                className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${isSnapScanConfigured ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
              >
                {isSnapScanConfigured ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                SnapScan:{" "}
                {isSnapScanConfigured ? "Payments active" : "Not configured"}
              </div>
            </div>

            {/* ElevenLabs key */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Set ElevenLabs API Key
              </Label>
              <p className="text-xs text-muted-foreground">
                Powers AI voice for all Tier 2 and 3 subscribers. Stored
                securely on-chain.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk_..."
                    value={elevenLabsKey}
                    onChange={(e) => setElevenLabsKey(e.target.value)}
                    className="pr-10"
                    data-ocid="settings.admin.elevenlabs_key.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={() => setElevenLabsKeyMut.mutate(elevenLabsKey)}
                  disabled={
                    !elevenLabsKey.trim() || setElevenLabsKeyMut.isPending
                  }
                  size="sm"
                  className="shrink-0"
                  data-ocid="settings.admin.save_elevenlabs_key.button"
                >
                  {setElevenLabsKeyMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            {/* OpenRouter / Hermes config */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
            >
              <div className="flex items-center gap-2">
                <Bot
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                />
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Nduna — OpenRouter Config
                </Label>
                <Badge
                  className="bg-gold/20 border text-[10px]"
                  style={{
                    color: "oklch(0.30 0.10 35)",
                    borderColor: "oklch(0.75 0.12 85 / 0.5)",
                  }}
                >
                  TIER 3 EXCLUSIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Powers Nduna for Elite Driver subscribers. Uses free OpenRouter
                models. Get your key at{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                >
                  openrouter.ai/keys
                </a>
              </p>

              {isHermesConfigured && (
                <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <Check className="w-3 h-3" />
                  Configured — using model:{" "}
                  <span className="font-mono font-semibold">
                    {useCustomModel
                      ? customModelId || CURATED_MODELS[0].id
                      : (CURATED_MODELS.find((m) => m.id === selectedModel)
                          ?.name ?? selectedModel)}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {/* OpenRouter API Key */}
                <div className="relative">
                  <Input
                    type={showOpenRouterKey ? "text" : "password"}
                    placeholder="sk-or-v1-..."
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    className="pr-10"
                    data-ocid="settings.admin.openrouter_key.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showOpenRouterKey ? "Hide key" : "Show key"}
                  >
                    {showOpenRouterKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Model selector */}
                <div>
                  <Label
                    className="text-xs mb-1 block"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    AI Model
                  </Label>
                  {!useCustomModel && (
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger
                        className="text-xs"
                        data-ocid="settings.admin.model_select.trigger"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURATED_MODELS.map((m) => (
                          <SelectItem
                            key={m.id}
                            value={m.id}
                            className="text-xs"
                          >
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {useCustomModel && (
                    <Input
                      placeholder="e.g. anthropic/claude-3-haiku"
                      value={customModelId}
                      onChange={(e) => setCustomModelId(e.target.value)}
                      className="text-xs font-mono"
                      data-ocid="settings.admin.custom_model.input"
                    />
                  )}
                  <div
                    className="flex items-center gap-2 mt-2"
                    data-ocid="settings.admin.custom_model.toggle"
                  >
                    <Checkbox
                      id="custom-model-toggle"
                      checked={useCustomModel}
                      onCheckedChange={(v) => setUseCustomModel(v === true)}
                    />
                    <label
                      htmlFor="custom-model-toggle"
                      className="text-xs cursor-pointer"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Use custom model ID (any OpenRouter model)
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleSaveHermesConfig}
                  disabled={
                    !openRouterKey.trim() || setHermesConfigMut.isPending
                  }
                  size="sm"
                  className="gap-2"
                  data-ocid="settings.admin.save_hermes_config.button"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {setHermesConfigMut.isPending
                    ? "Saving..."
                    : "Save Nduna Config"}
                </Button>
              </div>

              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{
                  color: "oklch(0.50 0.18 35)",
                  backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                }}
              >
                Nduna runs on the canister with persistent memory per driver.
                Web search powered by Tavily. Future upgrade: hybrid VPS +
                canister mode for even greater capability.
              </p>
            </div>

            {/* Tavily Search Intelligence */}
            <div
              className="border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.tavily.section"
            >
              {/* Section card */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: isTavilyConfigured
                    ? "oklch(0.96 0.04 145 / 0.5)"
                    : "oklch(0.97 0.04 85 / 0.4)",
                  border: isTavilyConfigured
                    ? "1px solid oklch(0.50 0.18 145 / 0.3)"
                    : "1px solid oklch(0.75 0.12 85 / 0.4)",
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: isTavilyConfigured
                          ? "oklch(0.50 0.18 145 / 0.2)"
                          : "oklch(0.60 0.22 35 / 0.15)",
                      }}
                    >
                      <Search
                        className="w-4 h-4"
                        style={{
                          color: isTavilyConfigured
                            ? "oklch(0.40 0.18 145)"
                            : "oklch(0.50 0.18 35)",
                        }}
                      />
                    </div>
                    <Label
                      className="text-sm font-semibold"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Tavily Search Intelligence
                    </Label>
                  </div>

                  {/* Status pill */}
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={
                      isTavilyConfigured
                        ? {
                            background: "oklch(0.50 0.18 145 / 0.15)",
                            color: "oklch(0.35 0.18 145)",
                            border: "1px solid oklch(0.50 0.18 145 / 0.3)",
                          }
                        : {
                            background: "oklch(0.94 0.02 85 / 0.8)",
                            color: "oklch(0.55 0.05 85)",
                            border: "1px solid oklch(0.75 0.08 85 / 0.4)",
                          }
                    }
                    data-ocid="settings.admin.tavily.status"
                  >
                    {isTavilyConfigured ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90 animate-pulse" />
                        Connected
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        Not configured
                      </>
                    )}
                  </span>
                </div>

                {/* Usage line when active */}
                {isTavilyConfigured && tavilyUsage !== undefined && (
                  <div
                    className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                    style={{
                      background: "oklch(0.50 0.18 145 / 0.08)",
                      color: "oklch(0.35 0.18 145)",
                      border: "1px solid oklch(0.50 0.18 145 / 0.2)",
                    }}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong>{Number(tavilyUsage)}</strong> searches used this
                      month
                    </span>
                    <span
                      className="ml-auto text-[10px]"
                      style={{ color: "oklch(0.55 0.10 145)" }}
                    >
                      Free tier: 1,000/month
                    </span>
                  </div>
                )}

                {/* Help text */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Powers Nduna's weekly lead research, event intelligence, and
                  hiring signal detection. Get your free API key at{" "}
                  <a
                    href="https://app.tavily.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  >
                    app.tavily.com ↗
                  </a>
                </p>

                {/* Key input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showTavilyKey ? "text" : "password"}
                      placeholder="tvly-..."
                      value={tavilyKey}
                      onChange={(e) => setTavilyKey(e.target.value)}
                      className="pr-10 bg-background"
                      data-ocid="settings.admin.tavily_key.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTavilyKey(!showTavilyKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showTavilyKey ? "Hide key" : "Show key"}
                    >
                      {showTavilyKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => setTavilyKeyMut.mutate(tavilyKey)}
                    disabled={!tavilyKey.trim() || setTavilyKeyMut.isPending}
                    size="sm"
                    className="shrink-0"
                    data-ocid="settings.admin.save_tavily_key.button"
                  >
                    {setTavilyKeyMut.isPending ? "Saving..." : "Save Key"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Geolocation Intelligence (Admin) */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.geolocation.section"
            >
              <div className="flex items-center gap-2">
                <MapPin
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                />
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Geolocation Intelligence
                </Label>
                <Badge
                  className="bg-gold/20 border text-[10px]"
                  style={{
                    color: "oklch(0.30 0.10 35)",
                    borderColor: "oklch(0.75 0.12 85 / 0.5)",
                  }}
                >
                  ADMIN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Keys stored securely in backend. Used to calculate real traffic
                exposure for driver pitch decks.
              </p>

              {/* Google Maps API Key */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Google Maps API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showGoogleMapsKey ? "text" : "password"}
                      placeholder="AIzaSy..."
                      value={googleMapsKey}
                      onChange={(e) => setGoogleMapsKey(e.target.value)}
                      className="pr-10"
                      data-ocid="settings.admin.googlemaps_key.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showGoogleMapsKey ? "Hide key" : "Show key"}
                    >
                      {showGoogleMapsKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => setGoogleMapsKeyMut.mutate(googleMapsKey)}
                    disabled={
                      !googleMapsKey.trim() || setGoogleMapsKeyMut.isPending
                    }
                    size="sm"
                    className="shrink-0"
                    data-ocid="settings.admin.save_googlemaps_key.button"
                  >
                    {setGoogleMapsKeyMut.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              {/* TomTom API Key */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  TomTom API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showTomTomKey ? "text" : "password"}
                      placeholder="tomtom-..."
                      value={tomTomKey}
                      onChange={(e) => setTomTomKey(e.target.value)}
                      className="pr-10"
                      data-ocid="settings.admin.tomtom_key.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTomTomKey(!showTomTomKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showTomTomKey ? "Hide key" : "Show key"}
                    >
                      {showTomTomKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => setTomTomKeyMut.mutate(tomTomKey)}
                    disabled={!tomTomKey.trim() || setTomTomKeyMut.isPending}
                    size="sm"
                    className="shrink-0"
                    data-ocid="settings.admin.save_tomtom_key.button"
                  >
                    {setTomTomKeyMut.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Automated Lead Research (Camofox — Admin) */}
            <div
              className="space-y-3 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.camofox.section"
            >
              <div className="flex items-center gap-2">
                <Zap
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                />
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Automated Lead Research
                </Label>
                <Badge
                  className="bg-gold/20 border text-[10px]"
                  style={{
                    color: "oklch(0.30 0.10 35)",
                    borderColor: "oklch(0.75 0.12 85 / 0.5)",
                  }}
                >
                  ADMIN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Camofox browser automation scrapes public business directories
                to surface top advertising leads for each driver. Base URL
                stored securely — never exposed to drivers.
              </p>

              {/* Camofox status badge */}
              <div
                className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                  isCamofoxConfigured
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
                data-ocid="settings.admin.camofox.status"
              >
                {isCamofoxConfigured ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Configured ✓ — Camofox automation ready
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Not configured — enter base URL to enable lead research
                  </>
                )}
              </div>

              {/* Camofox base URL field */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Camofox Base URL
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showCamofoxUrl ? "text" : "password"}
                      placeholder="http://your-server:9377"
                      value={camofoxUrl}
                      onChange={(e) => setCamofoxUrl(e.target.value)}
                      className="pr-10 font-mono text-xs"
                      data-ocid="settings.admin.camofox_url.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCamofoxUrl(!showCamofoxUrl)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showCamofoxUrl ? "Hide URL" : "Show URL"}
                    >
                      {showCamofoxUrl ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => setCamofoxUrlMut.mutate(camofoxUrl)}
                    disabled={!camofoxUrl.trim() || setCamofoxUrlMut.isPending}
                    size="sm"
                    className="shrink-0"
                    data-ocid="settings.admin.save_camofox_url.button"
                  >
                    {setCamofoxUrlMut.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              {/* Scheduler config */}
              <div
                className="space-y-3 rounded-xl p-3"
                style={{
                  backgroundColor: "oklch(0.94 0.06 85 / 0.3)",
                  border: "1px solid oklch(0.75 0.12 85 / 0.3)",
                }}
                data-ocid="settings.admin.scheduler.section"
              >
                <div className="flex items-center gap-2">
                  <Calendar
                    className="w-3.5 h-3.5"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Weekly Automation Schedule
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Day of week */}
                  <div className="space-y-1">
                    <Label
                      className="text-xs"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Day of week
                    </Label>
                    <Select
                      value={schedulerDay}
                      onValueChange={setSchedulerDay}
                    >
                      <SelectTrigger
                        className="text-xs"
                        data-ocid="settings.admin.scheduler_day.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { value: "1", label: "Monday" },
                          { value: "2", label: "Tuesday" },
                          { value: "3", label: "Wednesday" },
                          { value: "4", label: "Thursday" },
                          { value: "5", label: "Friday" },
                          { value: "6", label: "Saturday" },
                          { value: "0", label: "Sunday" },
                        ].map((d) => (
                          <SelectItem
                            key={d.value}
                            value={d.value}
                            className="text-xs"
                          >
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hour */}
                  <div className="space-y-1">
                    <Label
                      className="text-xs"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Time
                    </Label>
                    <Select
                      value={schedulerHour}
                      onValueChange={setSchedulerHour}
                    >
                      <SelectTrigger
                        className="text-xs"
                        data-ocid="settings.admin.scheduler_hour.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS_OF_DAY.map(({ value, label }) => (
                          <SelectItem
                            key={value}
                            value={value}
                            className="text-xs"
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Enabled toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Automation enabled
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Runs weekly lead scrape on schedule
                    </p>
                  </div>
                  <Switch
                    checked={schedulerEnabled}
                    onCheckedChange={setSchedulerEnabled}
                    data-ocid="settings.admin.scheduler_enabled.switch"
                  />
                </div>

                <Button
                  onClick={() =>
                    setSchedulerConfigMut.mutate({
                      day: schedulerDay,
                      hour: schedulerHour,
                      enabled: schedulerEnabled,
                    })
                  }
                  disabled={setSchedulerConfigMut.isPending}
                  size="sm"
                  className="w-full gap-2"
                  data-ocid="settings.admin.save_scheduler.button"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {setSchedulerConfigMut.isPending
                    ? "Saving..."
                    : "Save Schedule"}
                </Button>
              </div>

              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{
                  color: "oklch(0.50 0.18 35)",
                  backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                }}
              >
                Only public data is scraped (Google Business, Yellow Pages SA,
                CIPC). Robots.txt is respected. Rate limiting enforced by your
                Camofox infrastructure.
              </p>
            </div>

            {/* Exa Company Research — Admin */}
            <ExaAdminSection />

            {/* Weekly Briefing */}
            <div
              className="space-y-3 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.weekly_briefing.section"
            >
              <div className="flex items-center gap-2">
                <MessageSquare
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                />
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Weekly WhatsApp Briefing
                </Label>
                <Badge
                  className="bg-gold/20 border text-[10px]"
                  style={{
                    color: "oklch(0.30 0.10 35)",
                    borderColor: "oklch(0.75 0.12 85 / 0.5)",
                  }}
                >
                  ADMIN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Send every driver their top 3 opportunities + earnings summary
                on WhatsApp each Monday morning.
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Briefings enabled
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {weeklyBriefingState?.lastSentAt != null
                      ? `Last sent: ${new Date(
                          Number(weeklyBriefingState.lastSentAt) / 1_000_000,
                        ).toLocaleDateString("en-ZA", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}`
                      : "Never sent"}
                  </p>
                </div>
                <Switch
                  checked={weeklyBriefingState?.enabled ?? false}
                  onCheckedChange={(v) => toggleBriefingMut.mutate(v)}
                  data-ocid="settings.admin.weekly_briefing.switch"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => triggerBriefingMut.mutate()}
                  disabled={triggerBriefingMut.isPending}
                  className="gap-1.5"
                  data-ocid="settings.admin.weekly_briefing.send_button"
                >
                  <Send className="w-3.5 h-3.5" />
                  {triggerBriefingMut.isPending ? "Sending..." : "Send Now"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNdunaPromptDialog(true)}
                  className="gap-1.5"
                  data-ocid="settings.admin.nduna_prompt.open_modal_button"
                >
                  <Bot className="w-3.5 h-3.5" />
                  View Nduna Prompt State
                </Button>
              </div>

              {briefingSendResult && (
                <p
                  className="text-xs text-success flex items-center gap-1"
                  data-ocid="settings.admin.weekly_briefing.success_state"
                >
                  <Check className="w-3 h-3" /> {briefingSendResult}
                </p>
              )}
            </div>

            {/* Nduna Prompt State Dialog */}
            <Dialog
              open={showNdunaPromptDialog}
              onOpenChange={setShowNdunaPromptDialog}
            >
              <DialogContent data-ocid="settings.admin.nduna_prompt.dialog">
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Nduna Prompt State
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Evolution #
                      {ndunaPromptState
                        ? Number(ndunaPromptState.evolutionCount)
                        : 0}
                      {ndunaPromptState?.lastEvolved != null && (
                        <span className="font-normal ml-2">
                          — Last evolved:{" "}
                          {new Date(
                            Number(ndunaPromptState.lastEvolved) / 1_000_000,
                          ).toLocaleDateString("en-ZA")}
                        </span>
                      )}
                    </p>
                    <div
                      className="rounded-lg p-3 text-xs font-mono leading-relaxed break-words overflow-auto max-h-40"
                      style={{
                        background: "oklch(0.94 0.06 85 / 0.4)",
                        color: "oklch(0.30 0.10 35)",
                      }}
                    >
                      {ndunaPromptState?.evolutionDelta ||
                        "No evolution delta yet."}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-center gap-2 flex-wrap">
                    {!showResetEvolutionConfirm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResetEvolutionConfirm(true)}
                        className="border-red-300 text-red-700 hover:bg-red-50 gap-1.5"
                        data-ocid="settings.admin.nduna_prompt.delete_button"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset Evolution
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => resetEvolutionMut.mutate()}
                          disabled={resetEvolutionMut.isPending}
                          className="text-xs"
                          data-ocid="settings.admin.nduna_prompt.confirm_button"
                        >
                          {resetEvolutionMut.isPending
                            ? "Resetting..."
                            : "Confirm Reset"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowResetEvolutionConfirm(false)}
                          className="text-xs"
                          data-ocid="settings.admin.nduna_prompt.cancel_button"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNdunaPromptDialog(false)}
                      data-ocid="settings.admin.nduna_prompt.close_button"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* SnapScan Payment Gateway — Admin */}
            <div
              className="space-y-3 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.snapscan.section"
            >
              <div className="flex items-center gap-2">
                <QrCode
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                />
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  SnapScan Payment Gateway
                </Label>
                <Badge
                  className="bg-gold/20 border text-[10px]"
                  style={{
                    color: "oklch(0.30 0.10 35)",
                    borderColor: "oklch(0.75 0.12 85 / 0.5)",
                  }}
                >
                  ADMIN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Enables automated tier unlocks when drivers pay via SnapScan.
                Credentials are stored securely in the backend — drivers never
                see these keys.
              </p>

              {/* Status badge */}
              <div
                className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                  isSnapScanConfigured
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
                data-ocid="settings.admin.snapscan.status"
              >
                {isSnapScanConfigured ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Configured ✓ — Automated tier unlock active
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Not configured — enter your SnapScan credentials to enable
                    automated payments
                  </>
                )}
              </div>

              {/* Merchant API Key */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Merchant API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showSnapScanApiKey ? "text" : "password"}
                    placeholder="Enter your SnapScan Merchant API key"
                    value={snapScanApiKey}
                    onChange={(e) => setSnapScanApiKey(e.target.value)}
                    className="pr-10"
                    data-ocid="settings.admin.snapscan_api_key.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSnapScanApiKey(!showSnapScanApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showSnapScanApiKey ? "Hide API key" : "Show API key"
                    }
                  >
                    {showSnapScanApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Webhook Secret
                </Label>
                <div className="relative">
                  <Input
                    type={showSnapScanWebhookSecret ? "text" : "password"}
                    placeholder="Enter your SnapScan webhook secret"
                    value={snapScanWebhookSecret}
                    onChange={(e) => setSnapScanWebhookSecret(e.target.value)}
                    className="pr-10"
                    data-ocid="settings.admin.snapscan_webhook_secret.input"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowSnapScanWebhookSecret(!showSnapScanWebhookSecret)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showSnapScanWebhookSecret ? "Hide secret" : "Show secret"
                    }
                  >
                    {showSnapScanWebhookSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Merchant ID */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Merchant ID
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your SnapScan merchant ID"
                  value={snapScanMerchantId}
                  onChange={(e) => setSnapScanMerchantId(e.target.value)}
                  data-ocid="settings.admin.snapscan_merchant_id.input"
                />
              </div>

              {/* Save button */}
              <Button
                onClick={() =>
                  setSnapScanConfigMut.mutate({
                    apiKey: snapScanApiKey,
                    webhookSecret: snapScanWebhookSecret,
                    merchantId: snapScanMerchantId,
                  })
                }
                disabled={
                  !snapScanApiKey.trim() ||
                  !snapScanWebhookSecret.trim() ||
                  !snapScanMerchantId.trim() ||
                  setSnapScanConfigMut.isPending
                }
                size="sm"
                className="gap-2 w-full"
                data-ocid="settings.admin.snapscan.save_button"
              >
                <Shield className="w-3.5 h-3.5" />
                {setSnapScanConfigMut.isPending
                  ? "Saving..."
                  : "Save SnapScan Config"}
              </Button>

              {/* Webhook URL info box */}
              <div
                className="rounded-lg p-3 space-y-2"
                style={{
                  backgroundColor: "oklch(0.94 0.06 85 / 0.3)",
                  border: "1px solid oklch(0.75 0.12 85 / 0.3)",
                }}
                data-ocid="settings.admin.snapscan.webhook_info"
              >
                <div className="flex items-center gap-1.5">
                  <Zap
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Register this webhook URL in your SnapScan merchant
                    dashboard:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-[11px] font-mono rounded px-2 py-1.5 break-all min-w-0"
                    style={{
                      background: "oklch(0.97 0.02 85 / 0.8)",
                      color: "oklch(0.30 0.10 35)",
                      border: "1px solid oklch(0.75 0.12 85 / 0.4)",
                    }}
                  >
                    {snapScanWebhookUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopySnapScanWebhook}
                    className="shrink-0 gap-1.5 text-xs"
                    data-ocid="settings.admin.snapscan.copy_webhook_button"
                    aria-label="Copy webhook URL"
                  >
                    {snapScanWebhookCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  SnapScan will POST to this URL each time a payment clears. The
                  backend verifies the signature and instantly unlocks the
                  driver's selected tier.
                </p>
              </div>

              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{
                  color: "oklch(0.50 0.18 35)",
                  backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                }}
              >
                Your SnapScan credentials are stored securely in the backend.
                Drivers never see these keys. Get your API access at{" "}
                <a
                  href="https://www.snapscan.co.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                >
                  snapscan.co.za
                </a>
                .
              </p>
            </div>

            {/* Nduna Email — AgentMail */}
            <div
              className="space-y-3 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.agentmail.section"
            >
              <div className="flex items-center gap-2">
                <Mail
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 35)" }}
                />
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Nduna Email (AgentMail)
                </Label>
                <Badge
                  className="bg-gold/20 border text-[10px]"
                  style={{
                    color: "oklch(0.30 0.10 35)",
                    borderColor: "oklch(0.75 0.12 85 / 0.5)",
                  }}
                >
                  ADMIN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Powers automated onboarding emails, weekly earnings briefings,
                and lead follow-up sequences delivered by Nduna via AgentMail.
              </p>

              {/* Nduna inbox address display */}
              {agentMailInboxId && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: "oklch(0.55 0.14 145 / 0.08)",
                    border: "1px solid oklch(0.55 0.14 145 / 0.25)",
                  }}
                  data-ocid="settings.admin.agentmail.inbox_display"
                >
                  <Mail
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "oklch(0.50 0.18 145)" }}
                  />
                  <p
                    className="text-xs font-mono font-semibold flex-1 truncate"
                    style={{ color: "oklch(0.40 0.12 145)" }}
                  >
                    {agentMailInboxId}
                  </p>
                  <Badge
                    className="text-[10px] shrink-0"
                    style={{
                      background: "oklch(0.55 0.14 145 / 0.15)",
                      color: "oklch(0.40 0.12 145)",
                      border: "1px solid oklch(0.55 0.14 145 / 0.3)",
                    }}
                  >
                    Active
                  </Badge>
                </div>
              )}

              {/* AgentMail API Key */}
              <div className="space-y-1.5">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  AgentMail API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showAgentMailKey ? "text" : "password"}
                      placeholder="am_..."
                      value={agentMailKey}
                      onChange={(e) => setAgentMailKey(e.target.value)}
                      className="pr-10"
                      data-ocid="settings.admin.agentmail_key.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAgentMailKey(!showAgentMailKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showAgentMailKey ? "Hide key" : "Show key"}
                    >
                      {showAgentMailKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => setAgentMailKeyMut.mutate(agentMailKey)}
                    disabled={
                      !agentMailKey.trim() || setAgentMailKeyMut.isPending
                    }
                    size="sm"
                    className="shrink-0"
                    data-ocid="settings.admin.save_agentmail_key.button"
                  >
                    {setAgentMailKeyMut.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your key at{" "}
                  <a
                    href="https://docs.agentmail.to"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  >
                    docs.agentmail.to
                  </a>
                </p>
              </div>

              {/* Provision inbox button */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Nduna's Email Inbox
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {agentMailInboxId
                      ? "Inbox provisioned — Nduna can send and receive email"
                      : "Provision an inbox for Nduna to send driver emails"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!agentMailInboxId || provisionInboxMut.isPending}
                  onClick={() => provisionInboxMut.mutate()}
                  className="gap-1.5 shrink-0"
                  data-ocid="settings.admin.provision_inbox.button"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {provisionInboxMut.isPending
                    ? "Provisioning..."
                    : agentMailInboxId
                      ? "Provisioned ✓"
                      : "Provision Inbox"}
                </Button>
              </div>

              {/* Email sequence toggles */}
              <div
                className="space-y-3 rounded-xl p-3"
                style={{
                  backgroundColor: "oklch(0.94 0.06 85 / 0.3)",
                  border: "1px solid oklch(0.75 0.12 85 / 0.3)",
                }}
                data-ocid="settings.admin.agentmail.toggles_section"
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: "oklch(0.30 0.10 35)" }}
                >
                  Automated Email Sequences
                </p>

                {/* Onboarding sequence */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Onboarding sequence (Day 1 / 3 / 7)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Sends automated welcome emails to new drivers
                    </p>
                  </div>
                  <Switch
                    checked={emailConfig?.onboardingEmailEnabled ?? false}
                    onCheckedChange={(v) => setOnboardingEmailMut.mutate(v)}
                    disabled={!agentMailInboxId}
                    data-ocid="settings.admin.agentmail.onboarding.switch"
                  />
                </div>

                {/* Weekly briefing emails */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Weekly earnings briefing email
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Sends a Monday earnings summary to all drivers
                    </p>
                  </div>
                  <Switch
                    checked={emailConfig?.weeklyBriefingEmailEnabled ?? false}
                    onCheckedChange={(v) => setWeeklyBriefingEmailMut.mutate(v)}
                    disabled={!agentMailInboxId}
                    data-ocid="settings.admin.agentmail.weekly_briefing.switch"
                  />
                </div>

                {/* Lead follow-up emails */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Lead follow-up emails (3 / 7 / 14 days)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Automated follow-ups on advertising leads
                    </p>
                  </div>
                  <Switch
                    checked={emailConfig?.leadFollowupEmailEnabled ?? false}
                    onCheckedChange={(v) => setLeadFollowupEmailMut.mutate(v)}
                    disabled={!agentMailInboxId}
                    data-ocid="settings.admin.agentmail.lead_followup.switch"
                  />
                </div>
              </div>

              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{
                  color: "oklch(0.50 0.18 35)",
                  backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                }}
              >
                Nduna's emails are sent via AgentMail — a privacy-first email
                API built for AI agents. Drivers never see your API key.
              </p>
            </div>

            {/* Section 15: Opportunity Hunter VPS */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.opportunity_hunter.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setOpportunityHunterExpanded((v) => !v)}
                data-ocid="settings.admin.opportunity_hunter.toggle"
              >
                <div className="flex items-center gap-2">
                  <Globe
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Opportunity Hunter VPS
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {opportunityHunterExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {opportunityHunterExpanded && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Nduna uses this VPS to run autonomous browser sessions and
                    find income opportunities for drivers — surfacing platform
                    bonuses, new apps, and leads not in any directory.
                  </p>

                  {/* Status badge */}
                  <div
                    className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                      opportunityHunterStatus?.configured
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                    data-ocid="settings.admin.opportunity_hunter.status"
                  >
                    {opportunityHunterStatus?.configured ? (
                      <>
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1">
                          Status: Configured
                          {opportunityHunterStatus.lastRun > 0n && (
                            <span className="ml-2 text-[11px] text-green-600">
                              · Last run:{" "}
                              {new Date(
                                Number(opportunityHunterStatus.lastRun) /
                                  1_000_000,
                              ).toLocaleDateString("en-ZA", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Status: Not configured — enter VPS endpoint to activate
                      </>
                    )}
                  </div>

                  {/* Last error */}
                  {opportunityHunterStatus?.lastError &&
                    opportunityHunterStatus.lastError.length > 0 && (
                      <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        Last error: {opportunityHunterStatus.lastError}
                      </div>
                    )}

                  {/* VPS Endpoint URL */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      VPS Endpoint URL{" "}
                      <span className="text-muted-foreground font-normal">
                        (must be https)
                      </span>
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://your-vps.example.com/hunt-opportunities"
                      value={opportunityHunterUrl}
                      onChange={(e) => setOpportunityHunterUrl(e.target.value)}
                      className="font-mono text-xs"
                      data-ocid="settings.admin.opportunity_hunter_url.input"
                    />
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        type={showOpportunityHunterKey ? "text" : "password"}
                        placeholder="Bearer token or API key"
                        value={opportunityHunterKey}
                        onChange={(e) =>
                          setOpportunityHunterKey(e.target.value)
                        }
                        className="pr-10"
                        data-ocid="settings.admin.opportunity_hunter_key.input"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowOpportunityHunterKey(!showOpportunityHunterKey)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showOpportunityHunterKey ? "Hide key" : "Show key"
                        }
                      >
                        {showOpportunityHunterKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      setOpportunityHunterConfigMut.mutate({
                        url: opportunityHunterUrl,
                        key: opportunityHunterKey,
                      })
                    }
                    disabled={
                      !opportunityHunterUrl.trim() ||
                      !opportunityHunterKey.trim() ||
                      setOpportunityHunterConfigMut.isPending
                    }
                    size="sm"
                    className="gap-2 w-full"
                    data-ocid="settings.admin.opportunity_hunter.save_button"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {setOpportunityHunterConfigMut.isPending
                      ? "Saving..."
                      : "Save VPS Config"}
                  </Button>

                  <p
                    className="text-xs rounded-lg px-3 py-2"
                    style={{
                      color: "oklch(0.50 0.18 35)",
                      backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                    }}
                  >
                    Nduna will POST to this endpoint when hunting for
                    opportunities. API key and URL are stored securely in the
                    backend — never visible to drivers.
                  </p>
                </div>
              )}
            </div>

            {/* Section 15b: Hyperframes Video Studio VPS */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.hyperframes.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setHyperframesExpanded((v) => !v)}
                data-ocid="settings.admin.hyperframes.toggle"
              >
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Hyperframes Video Studio
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {hyperframesExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {hyperframesExpanded && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    AI video rendering configuration for Tier 3 drivers. Nduna
                    sends slide compositions to your render server and returns a
                    downloadable MP4.
                  </p>

                  {/* Status badge */}
                  <div
                    className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                      hyperframesConfig?.configured
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-orange-50 text-orange-700 border border-orange-200"
                    }`}
                    data-ocid="settings.admin.hyperframes.status"
                  >
                    {hyperframesConfig?.configured ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Status: Configured — Tier 3 drivers can generate videos
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Not configured — drivers cannot generate videos
                      </>
                    )}
                  </div>

                  {/* VPS Render Server URL */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Render Server URL{" "}
                      <span className="text-muted-foreground font-normal">
                        (must be https)
                      </span>
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://your-vps.example.com"
                      value={hyperframesUrl}
                      onChange={(e) => setHyperframesUrl(e.target.value)}
                      className="font-mono text-xs"
                      data-ocid="settings.admin.hyperframes_url.input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set up a Hyperframes render server on your VPS, then paste
                      the URL here. Tier 3 drivers use this to generate TikTok
                      and Instagram videos.
                    </p>
                  </div>

                  {/* Render Server API Key */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Render Server API Key
                    </Label>
                    <div className="relative">
                      <Input
                        type={showHyperframesKey ? "text" : "password"}
                        placeholder="Bearer token for authentication"
                        value={hyperframesKey}
                        onChange={(e) => setHyperframesKey(e.target.value)}
                        className="pr-10"
                        data-ocid="settings.admin.hyperframes_key.input"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowHyperframesKey(!showHyperframesKey)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showHyperframesKey ? "Hide key" : "Show key"
                        }
                      >
                        {showHyperframesKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      setHyperframesConfigMut.mutate({
                        url: hyperframesUrl,
                        key: hyperframesKey,
                      })
                    }
                    disabled={
                      !hyperframesUrl.trim() ||
                      !hyperframesKey.trim() ||
                      setHyperframesConfigMut.isPending
                    }
                    size="sm"
                    className="gap-2 w-full"
                    data-ocid="settings.admin.hyperframes.save_button"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {setHyperframesConfigMut.isPending
                      ? "Saving..."
                      : "Save Video Config"}
                  </Button>

                  <p
                    className="text-xs rounded-lg px-3 py-2"
                    style={{
                      color: "oklch(0.50 0.18 35)",
                      backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                    }}
                  >
                    The render server URL and API key are stored securely in the
                    backend — never visible to drivers.
                  </p>
                </div>
              )}
            </div>
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.doc_vault.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setDocVaultExpanded((v) => !v)}
                data-ocid="settings.admin.doc_vault.toggle"
              >
                <div className="flex items-center gap-2">
                  <FileText
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Document Vault
                  </Label>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    TIER 2+
                  </Badge>
                </div>
                {docVaultExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {docVaultExpanded && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Document Vault is available to all Tier 2+ drivers — no
                    configuration required. Drivers can securely store vehicle
                    registration, operating licence, and business documents.
                  </p>

                  {/* Admin stats */}
                  {docVaultConfig && (
                    <div
                      className="grid grid-cols-2 gap-3"
                      data-ocid="settings.admin.doc_vault.stats"
                    >
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{
                          background: "oklch(0.55 0.18 35 / 0.08)",
                          border: "1px solid oklch(0.55 0.18 35 / 0.25)",
                        }}
                      >
                        <p
                          className="text-2xl font-display font-extrabold"
                          style={{ color: "oklch(0.60 0.18 35)" }}
                        >
                          {Number(
                            (
                              docVaultConfig as {
                                notesEnabled: boolean;
                                totalDocuments?: bigint;
                              }
                            ).totalDocuments ?? 0n,
                          )}
                        </p>
                        <p
                          className="text-[10px] font-semibold mt-0.5"
                          style={{ color: "oklch(0.60 0.18 35)" }}
                        >
                          Total Documents
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{
                          background: "oklch(0.76 0.12 75 / 0.08)",
                          border: "1px solid oklch(0.76 0.12 75 / 0.25)",
                        }}
                      >
                        <p
                          className="text-2xl font-display font-extrabold"
                          style={{ color: "oklch(0.55 0.11 75)" }}
                        >
                          {(() => {
                            const totalDocs = Number(
                              (
                                docVaultConfig as {
                                  notesEnabled: boolean;
                                  totalDocuments?: bigint;
                                }
                              ).totalDocuments ?? 0n,
                            );
                            return totalDocs > 0
                              ? `~${Math.round((totalDocs * 200) / 1024)} KB`
                              : "0 KB";
                          })()}
                        </p>
                        <p
                          className="text-[10px] font-semibold mt-0.5"
                          style={{ color: "oklch(0.55 0.11 75)" }}
                        >
                          Est. Storage
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Driver notes toggle */}
                  <div
                    className="rounded-xl p-3 space-y-2"
                    style={{
                      backgroundColor: "oklch(0.94 0.06 85 / 0.3)",
                      border: "1px solid oklch(0.75 0.12 85 / 0.3)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-xs font-medium"
                          style={{ color: "oklch(0.30 0.10 35)" }}
                        >
                          Allow drivers to add notes to documents
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Drivers can annotate uploaded files with short notes
                        </p>
                      </div>
                      <Switch
                        checked={docVaultNotesEnabled}
                        onCheckedChange={(v) => {
                          setDocVaultNotesEnabled(v);
                          setDocVaultNotesMut.mutate(v);
                        }}
                        data-ocid="settings.admin.doc_vault.notes.switch"
                      />
                    </div>
                  </div>

                  <p
                    className="text-xs rounded-lg px-3 py-2"
                    style={{
                      color: "oklch(0.50 0.18 35)",
                      backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
                    }}
                  >
                    All documents are stored encrypted on the Internet Computer
                    blockchain. Drivers control their own data — admins cannot
                    view document contents.
                  </p>
                </div>
              )}
            </div>

            {/* Nduna Intelligence — Orbis */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.orbis.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setOrbisExpanded((v) => !v)}
                data-ocid="settings.admin.orbis.toggle"
              >
                <div className="flex items-center gap-2">
                  <Brain
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Nduna Intelligence (Orbis)
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {orbisExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {orbisExpanded && (
                <div className="space-y-4 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Powers Nduna's fallback AI engine and Prompt Quality
                    Scoring. Free tier available at{" "}
                    <a
                      href="https://orbisapi.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                      style={{ color: "oklch(0.50 0.18 35)" }}
                    >
                      orbisapi.com ↗
                    </a>
                  </p>

                  {/* Status badge */}
                  <div
                    className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                      isOrbisConfigured
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                    data-ocid="settings.admin.orbis.status"
                  >
                    {isOrbisConfigured ? (
                      <>
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        Active — Nduna fallback engine and PQS enabled
                      </>
                    ) : (
                      <>
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        Not configured — enter API key or auto-register below
                      </>
                    )}
                  </div>

                  {/* PQS active notice */}
                  {isOrbisConfigured && (
                    <div
                      className="rounded-xl p-3 flex items-start gap-2"
                      style={{
                        background: "oklch(0.55 0.18 35 / 0.07)",
                        border: "1px solid oklch(0.55 0.18 35 / 0.25)",
                      }}
                      data-ocid="settings.admin.orbis.pqs_info"
                    >
                      <Sparkles
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        style={{ color: "oklch(0.60 0.22 35)" }}
                      />
                      <div className="space-y-2 flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "oklch(0.30 0.10 35)" }}
                        >
                          Prompt Quality Scoring is{" "}
                          {pqsEnabled ? "active" : "paused"} — Nduna checks
                          every question before answering to give you better
                          responses.
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground">
                            Toggle PQS pre-flight check
                          </p>
                          <Switch
                            checked={pqsEnabled}
                            onCheckedChange={setPqsEnabled}
                            data-ocid="settings.admin.orbis.pqs.switch"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Orbis API Key */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-semibold"
                      style={{ color: "oklch(0.30 0.10 35)" }}
                    >
                      Orbis API Key
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showOrbisKey ? "text" : "password"}
                          placeholder="sk_..."
                          value={orbisKey}
                          onChange={(e) => setOrbisKey(e.target.value)}
                          className="pr-10 font-mono text-xs"
                          autoComplete="new-password"
                          data-ocid="settings.admin.orbis_key.input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOrbisKey((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showOrbisKey ? "Hide key" : "Show key"}
                        >
                          {showOrbisKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        onClick={() => setOrbisKeyMut.mutate(orbisKey)}
                        disabled={!orbisKey.trim() || setOrbisKeyMut.isPending}
                        size="sm"
                        className="shrink-0"
                        data-ocid="settings.admin.orbis.save_key.button"
                      >
                        {setOrbisKeyMut.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Stored encrypted in the canister — never displayed after
                      save.
                    </p>
                  </div>

                  {/* Fallback model selector — only shown when key is set */}
                  {isOrbisConfigured && (
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.30 0.10 35)" }}
                      >
                        Preferred Fallback Model
                      </Label>
                      <Select
                        value={selectedFallbackModel}
                        onValueChange={(v) =>
                          setSelectedFallbackModel(v as OrbisFallbackModelId)
                        }
                      >
                        <SelectTrigger
                          className="text-xs"
                          data-ocid="settings.admin.orbis.fallback_model.select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORBIS_FALLBACK_MODELS.map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className="text-xs"
                            >
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        Preference stored locally — backend tries all free
                        models automatically.
                      </p>
                    </div>
                  )}

                  {/* Auto-registration — only shown when key is NOT set */}
                  {!isOrbisConfigured && (
                    <div
                      className="rounded-xl p-3 space-y-3"
                      style={{
                        background: "oklch(0.94 0.06 85 / 0.3)",
                        border: "1px solid oklch(0.75 0.12 85 / 0.3)",
                      }}
                      data-ocid="settings.admin.orbis.auto_register.panel"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: "oklch(0.30 0.10 35)" }}
                          >
                            Auto-register Nduna on Orbis
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Create a free Orbis account for Nduna — API key
                            saved automatically.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowOrbisRegistration((v) => !v)}
                          className="shrink-0 gap-1.5 text-xs"
                          data-ocid="settings.admin.orbis.register.open_modal_button"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          {showOrbisRegistration ? "Cancel" : "Register Nduna"}
                        </Button>
                      </div>

                      {showOrbisRegistration && (
                        <div
                          className="space-y-3 pt-1"
                          data-ocid="settings.admin.orbis.register.panel"
                        >
                          <div className="space-y-1.5">
                            <Label className="text-xs">Email</Label>
                            <Input
                              type="email"
                              placeholder="nduna@yourdomain.com"
                              value={orbisRegEmail}
                              onChange={(e) => setOrbisRegEmail(e.target.value)}
                              className="text-xs"
                              data-ocid="settings.admin.orbis.register.email.input"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Password</Label>
                            <Input
                              type="password"
                              placeholder="Strong password"
                              value={orbisRegPassword}
                              onChange={(e) =>
                                setOrbisRegPassword(e.target.value)
                              }
                              className="text-xs"
                              data-ocid="settings.admin.orbis.register.password.input"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Username</Label>
                            <Input
                              type="text"
                              placeholder="nduna-moneydriver"
                              value={orbisRegUsername}
                              onChange={(e) =>
                                setOrbisRegUsername(e.target.value)
                              }
                              className="text-xs"
                              data-ocid="settings.admin.orbis.register.username.input"
                            />
                          </div>

                          {orbisRegisterMut.isError && (
                            <p
                              className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                              data-ocid="settings.admin.orbis.register.error_state"
                            >
                              {(orbisRegisterMut.error as Error)?.message ||
                                "Registration failed"}
                            </p>
                          )}

                          {orbisRegisterMut.isSuccess && (
                            <p
                              className="text-xs flex items-center gap-1.5"
                              style={{ color: "oklch(0.40 0.18 145)" }}
                              data-ocid="settings.admin.orbis.register.success_state"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Nduna registered! API key saved automatically.
                            </p>
                          )}

                          <Button
                            size="sm"
                            onClick={() =>
                              orbisRegisterMut.mutate({
                                email: orbisRegEmail,
                                password: orbisRegPassword,
                                username: orbisRegUsername,
                              })
                            }
                            disabled={
                              !orbisRegEmail.trim() ||
                              !orbisRegPassword.trim() ||
                              !orbisRegUsername.trim() ||
                              orbisRegisterMut.isPending
                            }
                            className="w-full gap-2"
                            data-ocid="settings.admin.orbis.register.submit_button"
                          >
                            {orbisRegisterMut.isPending ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Registering Nduna...
                              </>
                            ) : (
                              <>
                                <Bot className="w-3.5 h-3.5" />
                                Register &amp; Get API Key
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section: Browserbase Opportunity Hunter */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.browserbase.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setBrowserbaseExpanded((v) => !v)}
                data-ocid="settings.admin.browserbase.toggle"
              >
                <div className="flex items-center gap-2">
                  <Cloud
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Browserbase Opportunity Hunter
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {browserbaseExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {browserbaseExpanded && <BrowserbasePanel />}
            </div>

            {/* Section: Orbis API Publisher */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.orbis_publisher.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setOrbisPublisherExpanded((v) => !v)}
                data-ocid="settings.admin.orbis_publisher.toggle"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Orbis API Publisher
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {orbisPublisherExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {orbisPublisherExpanded && <OrbisPublisherPanel />}
            </div>

            {/* Section: 0xWork Agent Marketplace */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.zeroxwork.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setZeroXWorkExpanded((v) => !v)}
                data-ocid="settings.admin.zeroxwork.toggle"
              >
                <div className="flex items-center gap-2">
                  <Zap
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    0xWork Agent Marketplace
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {zeroXWorkExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {zeroXWorkExpanded && <ZeroXWorkPanel />}
            </div>

            {/* Section: Nduna on X */}
            <div
              className="space-y-2 border-t pt-4"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
              data-ocid="settings.admin.x_posting.section"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setXPostingExpanded((v) => !v)}
                data-ocid="settings.admin.x_posting.toggle"
              >
                <div className="flex items-center gap-2">
                  <Twitter
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 35)" }}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: "oklch(0.30 0.10 35)" }}
                  >
                    Nduna's X Account
                  </Label>
                  <Badge
                    className="bg-gold/20 border text-[10px]"
                    style={{
                      color: "oklch(0.30 0.10 35)",
                      borderColor: "oklch(0.75 0.12 85 / 0.5)",
                    }}
                  >
                    ADMIN
                  </Badge>
                </div>
                {xPostingExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {xPostingExpanded && <XPostingPanel compact={true} />}
            </div>

            {/* Crypto Intelligence — Admin Only */}
            <div
              className="rounded-2xl overflow-hidden border border-border"
              data-ocid="settings.crypto_intel.panel"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors text-sm font-semibold"
                onClick={() => setCryptoExpanded((v) => !v)}
                data-ocid="settings.crypto_intel.toggle"
                aria-expanded={cryptoExpanded}
              >
                <span className="flex items-center gap-2 text-foreground">
                  <Coins className="w-4 h-4 text-primary" />
                  Crypto Intelligence
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    ADMIN
                  </Badge>
                </span>
                {cryptoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {cryptoExpanded && (
                <div className="p-4 space-y-5 border-t border-border bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Crypto skills that power Nduna's MiniPay savings advice,
                    live exchange rates, and transaction guides.
                  </p>

                  {/* Live USDC/ZAR rate */}
                  <div
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{
                      backgroundColor: "oklch(0.40 0.14 155 / 0.08)",
                      border: "1px solid oklch(0.40 0.14 155 / 0.25)",
                    }}
                    data-ocid="settings.crypto_intel.usdc_rate.card"
                  >
                    <TrendingUp
                      className="w-4 h-4 shrink-0"
                      style={{ color: "oklch(0.40 0.14 155)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.40 0.14 155)" }}
                      >
                        Live USDC/ZAR Rate
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {liveUSDCRate != null
                          ? `R${liveUSDCRate.toFixed(2)} per USDC (CoinGecko, 10-min cache)`
                          : "Rate unavailable — using R18.50 fallback"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 text-xs gap-1"
                      onClick={() => refetchUSDCRate()}
                      data-ocid="settings.crypto_intel.usdc_rate.refresh"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </Button>
                  </div>

                  {/* CoinMarketCap API Key */}
                  <div
                    className="space-y-2"
                    data-ocid="settings.crypto_intel.cmc.section"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <BarChart className="w-3.5 h-3.5 text-primary" />
                        CoinMarketCap API Key
                      </Label>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${isCMCConfigured ? "border-green-500/40 text-green-600 bg-green-500/10" : "border-muted-foreground/30 text-muted-foreground"}`}
                        data-ocid="settings.crypto_intel.cmc.status"
                      >
                        {isCMCConfigured ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            Configured
                          </>
                        ) : (
                          "Not configured"
                        )}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Fear &amp; Greed index and USDC stability in the Wealth
                      Academy.{" "}
                      <a
                        href="https://pro.coinmarketcap.com/account"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get free key →
                      </a>
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showCmcKey ? "text" : "password"}
                          placeholder="CMC-…"
                          value={cmcKey}
                          onChange={(e) => setCmcKey(e.target.value)}
                          className="rounded-xl pr-9 text-sm font-mono"
                          data-ocid="settings.crypto_intel.cmc.input"
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowCmcKey((v) => !v)}
                          aria-label={showCmcKey ? "Hide key" : "Show key"}
                        >
                          {showCmcKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setCMCKeyMut.mutate(cmcKey)}
                        disabled={!cmcKey.trim() || setCMCKeyMut.isPending}
                        className="shrink-0 gap-1.5"
                        data-ocid="settings.crypto_intel.cmc.save_button"
                      >
                        {setCMCKeyMut.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Brian API Key */}
                  <div
                    className="space-y-2"
                    data-ocid="settings.crypto_intel.brian.section"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        Brian API Key
                      </Label>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${isBrianConfigured ? "border-green-500/40 text-green-600 bg-green-500/10" : "border-muted-foreground/30 text-muted-foreground"}`}
                        data-ocid="settings.crypto_intel.brian.status"
                      >
                        {isBrianConfigured ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            Configured
                          </>
                        ) : (
                          "Not configured"
                        )}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Natural language transaction guides — "save R500 in
                      MiniPay".{" "}
                      <a
                        href="https://www.brianknows.org/app/apps/agent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get free key →
                      </a>
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showBrianKey ? "text" : "password"}
                          placeholder="brian_…"
                          value={brianKey}
                          onChange={(e) => setBrianKey(e.target.value)}
                          className="rounded-xl pr-9 text-sm font-mono"
                          data-ocid="settings.crypto_intel.brian.input"
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowBrianKey((v) => !v)}
                          aria-label={showBrianKey ? "Hide key" : "Show key"}
                        >
                          {showBrianKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setBrianKeyMut.mutate(brianKey)}
                        disabled={!brianKey.trim() || setBrianKeyMut.isPending}
                        className="shrink-0 gap-1.5"
                        data-ocid="settings.crypto_intel.brian.save_button"
                      >
                        {setBrianKeyMut.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* x402 Info */}
                  <div
                    className="rounded-xl p-3 flex items-start gap-3"
                    style={{
                      backgroundColor: "oklch(0.55 0.15 270 / 0.08)",
                      border: "1px solid oklch(0.55 0.15 270 / 0.25)",
                    }}
                    data-ocid="settings.crypto_intel.x402.card"
                  >
                    <Shield
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: "oklch(0.55 0.15 270)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.55 0.15 270)" }}
                      >
                        x402 Autonomous Payments — Active
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Nduna can process x402 HTTP 402 payment requests
                        autonomously. When an API call requires USDC payment,
                        Nduna surfaces the details and guides the driver through
                        payment via MiniPay.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Danger zone — Reset memory */}
            <div
              className="space-y-2 border-t border-red-200 pt-4"
              data-ocid="settings.admin.danger_zone"
            >
              <Label className="text-sm font-medium text-red-700">
                Danger Zone
              </Label>
              {!showResetConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  className="border-red-300 text-red-700 hover:bg-red-50 gap-1.5"
                  data-ocid="settings.admin.reset_memory.button"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reset All Driver Memory
                </Button>
              ) : (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-2">
                  <p className="text-xs text-red-700 font-medium">
                    This will clear all driver conversation history and memory.
                    Cannot be undone. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resetMemoryMut.mutate()}
                      disabled={resetMemoryMut.isPending}
                      className="gap-1.5 text-xs"
                      data-ocid="settings.admin.reset_memory.confirm"
                    >
                      {resetMemoryMut.isPending
                        ? "Clearing..."
                        : "Yes, clear everything"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResetConfirm(false)}
                      className="text-xs"
                      data-ocid="settings.admin.reset_memory.cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin: Driver Cohorts — separate card, admin-only */}
      {isAdmin && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid oklch(0.75 0.12 85 / 0.5)" }}
          data-ocid="settings.admin.cohorts.panel"
        >
          <div
            className="px-4 py-3 flex items-center gap-2 border-b"
            style={{
              backgroundColor: "oklch(0.97 0.04 85)",
              borderColor: "oklch(0.75 0.12 85 / 0.4)",
            }}
          >
            <span
              className="font-display font-bold text-sm"
              style={{ color: "oklch(0.30 0.10 35)" }}
            >
              Driver Cohorts
            </span>
            <span
              className="ml-auto text-[10px] rounded-full px-2 py-0.5 font-semibold"
              style={{
                backgroundColor: "oklch(0.75 0.12 85 / 0.3)",
                color: "oklch(0.30 0.10 35)",
              }}
            >
              ADMIN ONLY
            </span>
          </div>
          <div
            className="p-4 grid grid-cols-3 gap-3"
            style={{ backgroundColor: "oklch(0.97 0.04 85 / 0.3)" }}
          >
            {/* Power Earners */}
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "oklch(0.55 0.18 35 / 0.10)",
                border: "1px solid oklch(0.55 0.18 35 / 0.35)",
              }}
              data-ocid="settings.admin.cohorts.power_earners.card"
            >
              <p
                className="text-2xl font-display font-extrabold"
                style={{ color: "oklch(0.65 0.18 35)" }}
              >
                {cohortStats ? Number(cohortStats.powerEarners) : "—"}
              </p>
              <p
                className="text-[10px] font-bold mt-0.5"
                style={{ color: "oklch(0.65 0.18 35)" }}
              >
                Power Earners
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                200+ trips/month — aggressive pitch mode
              </p>
            </div>
            {/* Growth Drivers */}
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "oklch(0.76 0.12 75 / 0.10)",
                border: "1px solid oklch(0.76 0.12 75 / 0.35)",
              }}
              data-ocid="settings.admin.cohorts.growth_drivers.card"
            >
              <p
                className="text-2xl font-display font-extrabold"
                style={{ color: "oklch(0.58 0.11 75)" }}
              >
                {cohortStats ? Number(cohortStats.growthDrivers) : "—"}
              </p>
              <p
                className="text-[10px] font-bold mt-0.5"
                style={{ color: "oklch(0.58 0.11 75)" }}
              >
                Growth Drivers
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                100–199 trips/month — balanced mode
              </p>
            </div>
            {/* New Drivers */}
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "oklch(0.40 0.08 240 / 0.10)",
                border: "1px solid oklch(0.50 0.10 240 / 0.35)",
              }}
              data-ocid="settings.admin.cohorts.new_drivers.card"
            >
              <p
                className="text-2xl font-display font-extrabold"
                style={{ color: "oklch(0.60 0.10 240)" }}
              >
                {cohortStats ? Number(cohortStats.newDrivers) : "—"}
              </p>
              <p
                className="text-[10px] font-bold mt-0.5"
                style={{ color: "oklch(0.60 0.10 240)" }}
              >
                New Drivers
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                &lt;100 trips/month — foundation mode
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nduna Intelligence Skills — Admin Only */}
      {isAdmin && <NdunaSkillsPanel />}

      {/* Admin: Pilot Mode toggle link */}
      {isAdmin && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid oklch(0.75 0.12 85 / 0.5)" }}
          data-ocid="settings.admin.pilot_mode.panel"
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: "oklch(0.97 0.04 85)" }}
          >
            <FlaskConical
              className="w-4 h-4"
              style={{ color: "oklch(0.60 0.22 35)" }}
            />
            <div className="flex-1 min-w-0">
              <span
                className="font-display font-bold text-sm"
                style={{ color: "oklch(0.30 0.10 35)" }}
              >
                Pilot Mode
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {pilotMode
                  ? "ACTIVE — 90-day free pilot running"
                  : "Disabled — full pricing in effect"}
              </p>
            </div>
            {onTabChange && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTabChange("admin-pilot-mode")}
                data-ocid="settings.admin.pilot_mode.configure_button"
              >
                Configure
              </Button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={clear}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
        data-ocid="settings.signout.button"
      >
        Sign Out
      </button>

      {/* SA Compliance notices */}
      <div className="space-y-2">
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "oklch(0.97 0.04 85 / 0.5)",
            border: "1px solid oklch(0.75 0.12 85 / 0.4)",
          }}
        >
          <p className="text-xs" style={{ color: "oklch(0.30 0.10 35)" }}>
            <strong>FAIS Disclaimer:</strong> MoneyDrive is a trip and earnings
            tracking tool only. Nothing in this app constitutes financial
            advice. Please consult a qualified financial professional for any
            financial decisions.
          </p>
        </div>
        <div className="bg-muted rounded-xl p-3">
          <p className="text-muted-foreground text-xs text-center">
            <strong>POPIA Notice:</strong> Your personal data is processed in
            compliance with the Protection of Personal Information Act (POPIA).
            Your data is stored securely on the Internet Computer blockchain.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-2">
        &copy; {new Date().getFullYear()} MoneyDrive. All rights reserved.
      </p>
    </div>
  );
}
