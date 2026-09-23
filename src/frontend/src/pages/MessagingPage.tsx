/**
 * MessagingPage.tsx — Nduna WhatsApp gateway UI.
 * Drivers can chat with Nduna directly via WhatsApp — this page shows
 * the full conversation history, lets drivers register their number,
 * and admins can configure the 360dialog API key.
 * Available to all tiers (Tier 1+).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import type {
  MessageDeliveryStatus,
  WhatsAppConversationEntry,
} from "../features/messaging/types";
import {
  useIsWhatsAppConfigured,
  useRegisterWhatsAppPhone,
  useSaveWhatsAppConfig,
  useUnreadWhatsAppCount,
  useWhatsAppHistory,
} from "../features/messaging/useMessaging";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  profile?: UserProfile | null;
  tier?: number;
  isAdmin?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMANDS = [
  {
    cmd: "/leads",
    desc: "Top 10 companies to pitch this week",
    emoji: "🎯",
  },
  {
    cmd: "/coach [company]",
    desc: "Get a personalised pitch strategy",
    emoji: "🧠",
  },
  {
    cmd: "/status",
    desc: "Your earnings & deal summary",
    emoji: "📊",
  },
  {
    cmd: "/help",
    desc: "See all available commands",
    emoji: "💡",
  },
] as const;

const STATUS_ICONS: Record<MessageDeliveryStatus, React.ReactNode> = {
  sent: <Clock className="w-3 h-3 text-muted-foreground" />,
  delivered: <CheckCheck className="w-3 h-3 text-muted-foreground" />,
  read: <CheckCheck className="w-3 h-3 text-primary" />,
  failed: <X className="w-3 h-3 text-destructive" />,
};

const STATUS_LABEL: Record<MessageDeliveryStatus, string> = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ entry }: { entry: WhatsAppConversationEntry }) {
  const isOutbound = entry.direction === "outbound";
  const ts = Number(entry.timestamp / 1_000_000n);
  const timeStr = formatDistanceToNow(new Date(ts), { addSuffix: true });

  return (
    <div
      className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-3`}
    >
      {!isOutbound && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2 mt-1 shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
          isOutbound
            ? "bg-burnt-orange text-foreground rounded-br-sm shadow-card"
            : "bg-card border border-border rounded-bl-sm"
        }`}
        data-ocid="messaging.message_bubble"
      >
        {isOutbound && (
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
            Nduna
          </p>
        )}
        <p className="text-sm leading-relaxed break-words">{entry.body}</p>
        <div
          className={`flex items-center gap-1.5 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}
        >
          <span className="text-[10px] opacity-50">{timeStr}</span>
          {isOutbound && (
            <span title={STATUS_LABEL[entry.deliveryStatus]}>
              {STATUS_ICONS[entry.deliveryStatus]}
            </span>
          )}
        </div>
        {entry.errorMsg && (
          <p className="text-[10px] text-destructive mt-1 border-t border-destructive/20 pt-1">
            ⚠ {entry.errorMsg}
          </p>
        )}
      </div>
      {isOutbound && (
        <div className="w-7 h-7 rounded-full bg-burnt-orange/20 flex items-center justify-center ml-2 mt-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-burnt-orange" />
        </div>
      )}
    </div>
  );
}

function ConnectionStatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`messaging-status-indicator ${connected ? "connected" : "disconnected"}`}
    >
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

// ─── Admin Config Panel ───────────────────────────────────────────────────────

function AdminConfigPanel() {
  const saveConfig = useSaveWhatsAppConfig();
  const [apiKey, setApiKey] = useState("");
  const [phone, setPhone] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [open, setOpen] = useState(false);

  const webhookUrl = `https://${window.location.hostname}/whatsapp-webhook`;

  const handleSave = () => {
    if (!apiKey.trim() || !phone.trim()) {
      toast.error("API key and phone number are required");
      return;
    }
    saveConfig.mutate(
      {
        apiKey: apiKey.trim(),
        phoneNumber: phone.trim(),
        webhookSecret: webhookSecret.trim(),
      },
      {
        onSuccess: () => {
          setApiKey("");
          setWebhookSecret("");
        },
      },
    );
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied");
  };

  return (
    <Card className="border-border/80 shadow-card">
      <CardHeader className="pb-3">
        <button
          type="button"
          className="flex items-center justify-between w-full text-left"
          onClick={() => setOpen((v) => !v)}
          data-ocid="messaging.admin_config.toggle"
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            Admin: WhatsApp Configuration
          </CardTitle>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4 pt-0">
          {/* 360dialog API Key */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              360dialog API Key
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="pr-10"
                data-ocid="messaging.admin_config.api_key"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey((v) => !v)}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://www.360dialog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                360dialog dashboard
              </a>
              . Never visible once saved.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              WhatsApp Business Number (E.164)
            </Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27821234567"
              data-ocid="messaging.admin_config.phone"
            />
          </div>

          {/* Webhook Secret */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Webhook Secret
            </Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Optional verification token"
                className="pr-10"
                data-ocid="messaging.admin_config.webhook_secret"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSecret((v) => !v)}
              >
                {showSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Webhook URL (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Webhook URL (register in 360dialog)
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="text-xs font-mono bg-muted/30 text-muted-foreground"
                data-ocid="messaging.admin_config.webhook_url"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyWebhook}
                className="shrink-0"
                data-ocid="messaging.admin_config.copy_webhook"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saveConfig.isPending || !apiKey.trim() || !phone.trim()}
            className="w-full"
            data-ocid="messaging.admin_config.save"
          >
            {saveConfig.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {saveConfig.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Command Shortcuts ────────────────────────────────────────────────────────

function CommandShortcuts({ compact = false }: { compact?: boolean }) {
  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success(`Command "${cmd}" copied — paste it into WhatsApp!`);
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {COMMANDS.map(({ cmd, desc, emoji }) => (
          <button
            key={cmd}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/50 px-3 py-2 text-left hover:bg-muted/70 transition-colors group"
            onClick={() => handleCopy(cmd)}
            data-ocid={`messaging.command.${cmd.replace(/[^a-z0-9]/gi, "_")}`}
          >
            <span className="text-base shrink-0">{emoji}</span>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold text-foreground truncate">
                {cmd}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        WhatsApp Command Shortcuts
      </p>
      <div className="command-shortcuts-grid">
        {COMMANDS.map(({ cmd, desc, emoji }) => (
          <button
            key={cmd}
            type="button"
            className="command-shortcut-button"
            onClick={() => handleCopy(cmd)}
            data-ocid={`messaging.command.${cmd.replace(/[^a-z0-9]/gi, "_")}`}
          >
            <span className="command-shortcut-icon">{emoji}</span>
            <span className="command-shortcut-label font-mono text-[11px]">
              {cmd}
            </span>
            <span className="command-shortcut-description">{desc}</span>
            <Copy className="w-3 h-3 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        Tap any card to copy command — paste it straight into WhatsApp
      </p>
    </div>
  );
}

// ─── WhatsApp Onboarding Guide ────────────────────────────────────────────────

function WhatsAppOnboardingGuide({
  whatsappNumber,
  onRegistered,
}: {
  whatsappNumber: string;
  onRegistered: () => void;
}) {
  const registerPhone = useRegisterWhatsAppPhone();
  const [phoneInput, setPhoneInput] = useState("");
  const [registered, setRegistered] = useState(false);

  const numberDisplay = whatsappNumber || "Set in admin panel";
  const hasNumber = !!whatsappNumber;

  const waContactUrl = hasNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
    : "#";

  const waOpenUrl = hasNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Nduna")}`
    : "#";

  const handleRegister = () => {
    if (!phoneInput.trim()) return;
    registerPhone.mutate(phoneInput.trim(), {
      onSuccess: () => {
        setRegistered(true);
        setPhoneInput("");
        onRegistered();
      },
    });
  };

  if (registered) {
    return (
      <Card
        className="border-success/30 bg-success/5 shadow-card"
        data-ocid="messaging.onboarding.success_state"
      >
        <CardContent className="p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-lg">
              You're connected! 🎉
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Open WhatsApp and message us to start chatting with Nduna.
            </p>
          </div>
          {hasNumber && (
            <a
              href={waOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="messaging.onboarding.open_whatsapp_button"
            >
              <Button className="gap-2 w-full sm:w-auto">
                <Smartphone className="w-4 h-4" />
                Open WhatsApp
              </Button>
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border-border/80 shadow-card overflow-hidden"
      data-ocid="messaging.onboarding.guide"
    >
      {/* Header strip */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))",
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-base leading-tight">
            Chat with Nduna on WhatsApp
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            3 quick steps to get started
          </p>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Step 1 */}
        <div className="flex gap-4" data-ocid="messaging.onboarding.step_1">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div className="w-px flex-1 bg-border/50 mt-2" />
          </div>
          <div className="pb-5 min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Save the number
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Add MoneyDrive to your WhatsApp contacts so you can message us.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono text-sm font-bold text-foreground">
                  {numberDisplay}
                </span>
              </div>
              {hasNumber && (
                <a
                  href={waContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="messaging.onboarding.save_contact_button"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Save Contact
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4" data-ocid="messaging.onboarding.step_2">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div className="w-px flex-1 bg-border/50 mt-2" />
          </div>
          <div className="pb-5 min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Register your number
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Enter your WhatsApp number below so Nduna knows who you are.
            </p>
            <div
              className="flex gap-2"
              data-ocid="messaging.register_phone.form"
            >
              <Input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+27821234567"
                type="tel"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                data-ocid="messaging.register_phone.input"
              />
              <Button
                onClick={handleRegister}
                disabled={registerPhone.isPending || !phoneInput.trim()}
                data-ocid="messaging.register_phone.submit"
              >
                {registerPhone.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Link
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Include your country code, e.g.{" "}
              <code className="text-primary">+27821234567</code>
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4" data-ocid="messaging.onboarding.step_3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Start chatting
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Open WhatsApp, message us{" "}
              <span className="font-semibold text-foreground">"Hi Nduna"</span>{" "}
              and you're in. Use these commands to get the most out of Nduna:
            </p>
            <CommandShortcuts compact />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Connected Badge ──────────────────────────────────────────────────────────

function ConnectedBadge({ whatsappNumber }: { whatsappNumber: string }) {
  const hasNumber = !!whatsappNumber;
  const waOpenUrl = hasNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Nduna")}`
    : "#";

  return (
    <Card
      className="border-success/30 bg-success/5 p-4 flex items-center justify-between gap-3"
      data-ocid="messaging.connected.badge"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-success" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            WhatsApp connected
          </p>
          <p className="text-xs text-muted-foreground">
            Your number is linked — Nduna recognises your messages
          </p>
        </div>
      </div>
      {hasNumber && (
        <a
          href={waOpenUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid="messaging.connected.open_whatsapp"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Open
          </Button>
        </a>
      )}
    </Card>
  );
}

// ─── Conversation History ─────────────────────────────────────────────────────

function ConversationHistory() {
  const {
    data: history = [],
    isLoading,
    refetch,
    isFetching,
  } = useWhatsAppHistory(100);

  const sorted = [...history].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <Skeleton className="h-14 w-64 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card
        className="p-8 text-center bg-muted/20 border-border/50"
        data-ocid="messaging.empty_state"
      >
        <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-semibold text-foreground">No messages yet</p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          Follow the steps above to connect your WhatsApp, then send{" "}
          <code className="text-primary font-mono">/help</code> to get started.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Conversation History
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 px-2 text-xs gap-1.5"
          data-ocid="messaging.refresh"
        >
          <RefreshCw
            className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      <div
        className="message-sync-card bg-card border-border rounded-2xl min-h-[300px] max-h-[55vh] overflow-y-auto px-4 py-4"
        data-ocid="messaging.conversation_list"
      >
        {sorted.map((entry) => (
          <MessageBubble key={entry.messageId} entry={entry} />
        ))}
      </div>
      {/* Error entries summary */}
      {sorted.some((e) => e.deliveryStatus === "failed") && (
        <div className="message-error-state mt-3">
          <div className="message-error-icon">!</div>
          <div className="message-error-content">
            <p className="message-error-title">Some messages failed to send</p>
            <p className="message-error-text">
              Check your WhatsApp number registration and ensure your number is
              linked correctly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagingPage({ profile, isAdmin = false }: Props) {
  const { data: unreadCount = 0 } = useUnreadWhatsAppCount();
  const { data: isConfigured = false } = useIsWhatsAppConfigured();

  // Check if the driver already has a phone number linked (profile may store it)
  const hasLinkedPhone =
    !!profile &&
    "whatsappPhone" in profile &&
    typeof profile.whatsappPhone === "string" &&
    (profile.whatsappPhone as string).length > 0;

  const [phoneLinked, setPhoneLinked] = useState(hasLinkedPhone);

  // Retrieve the configured WhatsApp number for display — we use the hostname
  // as a placeholder; actual number comes from admin config (not exposed to frontend).
  // If isConfigured is true we show a placeholder that admin must verify.
  const displayNumber = isConfigured ? "+27 [configured in admin]" : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2 flex-wrap">
            <MessageCircle className="w-6 h-6 text-primary" />
            WhatsApp + Nduna
            {unreadCount > 0 && (
              <Badge
                className="bg-primary text-primary-foreground text-xs px-2 ml-1"
                data-ocid="messaging.unread_badge"
              >
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Chat with Nduna directly from WhatsApp — no app needed
          </p>
        </div>
      </div>

      {/* ── Connection Status Card ── */}
      <Card className="p-4 flex items-center justify-between gap-3 border-border/80">
        <div className="flex items-center gap-3">
          {isConfigured ? (
            <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-success" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">WhatsApp Status</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConfigured
                ? "Nduna is live on WhatsApp — drivers can message in"
                : "Not yet activated — admin needs to configure the API key"}
            </p>
          </div>
        </div>
        <ConnectionStatusBadge connected={isConfigured} />
      </Card>

      {/* ── Admin Config Panel (admin only) ── */}
      {isAdmin && <AdminConfigPanel />}

      {/* ── Not connected banner (non-admin) ── */}
      {!isConfigured && !isAdmin && (
        <div className="message-error-state">
          <div className="message-error-icon">
            <Settings className="w-4 h-4" />
          </div>
          <div className="message-error-content">
            <p className="message-error-title">WhatsApp not yet activated</p>
            <p className="message-error-text">
              The admin needs to configure the 360dialog API key. Once live,
              you'll be able to message Nduna directly from WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* ── Onboarding Guide or Connected Badge ── */}
      {isConfigured &&
        !isAdmin &&
        (phoneLinked ? (
          <ConnectedBadge whatsappNumber={displayNumber} />
        ) : (
          <WhatsAppOnboardingGuide
            whatsappNumber={displayNumber}
            onRegistered={() => setPhoneLinked(true)}
          />
        ))}

      {/* ── Command Shortcuts (only shown after linking) ── */}
      {(phoneLinked || isAdmin) && <CommandShortcuts />}

      {/* ── Conversation History ── */}
      <ConversationHistory />
    </div>
  );
}
