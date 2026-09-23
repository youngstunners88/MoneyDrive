import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Check,
  Copy,
  Gift,
  Share2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import {
  useApplyReferralCode,
  useMyReferralCode,
  useReferralConfig,
  useReferralStats,
} from "../features/referral/useReferral";
import { useMyReferralCredit } from "../features/referral/useReferralCredit";
import { formatCurrency } from "../lib/currency";

// ─── Ref param handling ───────────────────────────────────────────────────────
// On first load, capture ?ref=CODE from the URL and store it in localStorage.
// The backend call is made separately via applyReferralCode after login.
function captureRefParam() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    localStorage.setItem("moneydrive_referral_code", ref.toUpperCase());
  }
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        highlight
          ? "bg-primary/10 border border-primary/30"
          : "bg-muted/40 border border-border/40"
      }`}
      data-ocid={`referral.stat.${label.toLowerCase().replace(/\s+/g, "_")}`}
    >
      <p
        className={`font-display font-bold text-lg leading-tight ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { data: referralCode, isLoading: codeLoading } = useMyReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: config } = useReferralConfig();
  const { data: creditBalance = 0, isLoading: creditLoading } =
    useMyReferralCredit();
  const applyMut = useApplyReferralCode();

  const [applyInput, setApplyInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const appUrl = "https://moneydriver-2oj.caffeine.xyz";
  const code = referralCode?.code ?? "";
  const bonusAmount =
    config && config.bonusPerReferral > 0 ? config.bonusPerReferral : 50;
  const bonusText = formatCurrency(bonusAmount, "ZAR");
  const refLink = code ? `${appUrl}?ref=${code}` : appUrl;

  const shareText = `Join me on MoneyDrive — SA's driver income platform. Use my code ${code} to sign up: ${refLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Capture ?ref= param on mount
  useEffect(() => {
    captureRefParam();
  }, []);

  // Apply stored referral code after actor is ready (handled in App.tsx on first login)
  // Here we just read and pre-fill the input if a code is in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("moneydrive_referral_code");
    if (stored && !applyInput) {
      setApplyInput(stored);
    }
  }, [applyInput]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — try manually");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setLinkCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      toast.error("Could not copy — try manually");
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join MoneyDrive",
        text: shareText,
        url: refLink,
      });
    } else {
      await handleCopyLink();
    }
  };

  const handleApply = () => {
    if (!applyInput.trim()) return;
    applyMut.mutate(applyInput.trim().toUpperCase(), {
      onSuccess: () => {
        toast.success("Referral code applied!");
        localStorage.removeItem("moneydrive_referral_code");
        setApplyInput("");
      },
      onError: (err) => toast.error(err.message || "Invalid code"),
    });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* ── Hero ── */}
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))",
        }}
        data-ocid="referral.hero.card"
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.76 0.12 75), oklch(0.55 0.18 145), oklch(0.76 0.12 75))",
            opacity: 0.6,
          }}
        />
        <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-7 h-7 text-gold" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white mb-2">
          Earn R50 Per Referral
        </h1>
        <p className="text-white/80 text-sm max-w-xs mx-auto">
          Share MoneyDrive with fellow drivers. When they sign up and pay, you
          earn <span className="text-gold font-bold">{bonusText}</span> —
          automatically applied to your next subscription.
        </p>
      </div>

      {/* ── Credit Balance (show prominently if > 0) ── */}
      {!creditLoading && creditBalance > 0 && (
        <Card
          className="border-success/30 bg-success/5 shadow-card"
          data-ocid="referral.credit_balance.card"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Your Referral Credit
              </p>
              <p className="font-display font-black text-2xl text-success leading-tight">
                {formatCurrency(creditBalance, "ZAR")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will be automatically applied to your next payment
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-success/60 shrink-0" />
          </CardContent>
        </Card>
      )}

      {/* ── Your Referral Code ── */}
      <Card className="shadow-card" data-ocid="referral.code.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {codeLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div
              className="rounded-xl p-4 text-center border-2"
              style={{
                borderColor: "oklch(0.76 0.12 75 / 0.5)",
                background: "oklch(0.76 0.12 75 / 0.08)",
              }}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Your code
              </p>
              <p
                className="font-mono font-black text-3xl text-foreground tracking-widest"
                data-ocid="referral.code.display"
              >
                {code || "—"}
              </p>
            </div>
          )}

          {/* Referral link */}
          {code && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
              <p className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">
                {refLink}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="referral.copy_link.button"
                title="Copy referral link"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={!code}
              className="gap-1.5 flex-col h-auto py-2.5 text-xs"
              data-ocid="referral.copy_code.button"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Code"}
            </Button>

            <a
              href={code ? whatsappUrl : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors ${
                code
                  ? "bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent"
                  : "border-border text-muted-foreground cursor-not-allowed opacity-50"
              }`}
              data-ocid="referral.whatsapp_share.button"
              onClick={(e) => !code && e.preventDefault()}
            >
              <SiWhatsapp className="w-4 h-4" />
              WhatsApp
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              disabled={!code}
              className="gap-1.5 flex-col h-auto py-2.5 text-xs"
              data-ocid="referral.share_link.button"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats ── */}
      <Card className="shadow-card" data-ocid="referral.stats.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatTile
                label="Drivers Referred"
                value={String(stats?.timesUsed ?? 0)}
              />
              <StatTile
                label="Total Earned"
                value={formatCurrency(stats?.totalEarned ?? 0, "ZAR")}
                highlight={(stats?.totalEarned ?? 0) > 0}
              />
              <StatTile
                label="Pending"
                value={formatCurrency(stats?.pendingBonus ?? 0, "ZAR")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── How it works ── */}
      <Card className="shadow-card" data-ocid="referral.how_it_works.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              step: "1",
              title: "Share your unique link or code",
              desc: "Send your referral link or code to any driver friend via WhatsApp, SMS, or in person.",
            },
            {
              step: "2",
              title: "They sign up and pay",
              desc: `When they register and make their first subscription payment, you earn ${bonusText} instantly.`,
            },
            {
              step: "3",
              title: "Your R50 is applied automatically",
              desc: "Your credit is stored in your account and deducted from your next subscription renewal — no action needed from you.",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">
                  {item.step}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}

          {config && config.minTripsToQualify > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-[10px]">
                Referred driver needs {config.minTripsToQualify}+ trips to
                qualify
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Apply a referral code ── */}
      <Card className="shadow-card" data-ocid="referral.apply.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm">
            Have a Referral Code?
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            If you signed up without a code, you can still apply one here.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. MD-JOHN4821"
              value={applyInput}
              onChange={(e) => setApplyInput(e.target.value.toUpperCase())}
              className="font-mono"
              data-ocid="referral.apply_code.input"
            />
            <Button
              onClick={handleApply}
              disabled={!applyInput.trim() || applyMut.isPending}
              className="shrink-0 gap-1.5"
              data-ocid="referral.apply_code.submit_button"
            >
              {applyMut.isPending ? (
                "Applying..."
              ) : (
                <>
                  Apply
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
          {applyMut.isSuccess && (
            <p
              className="text-xs text-success mt-2 flex items-center gap-1"
              data-ocid="referral.apply_code.success_state"
            >
              <Check className="w-3 h-3" /> Code applied! Your friend will earn
              their bonus when you activate.
            </p>
          )}
          {applyMut.isError && (
            <p
              className="text-xs text-destructive mt-2"
              data-ocid="referral.apply_code.error_state"
            >
              {applyMut.error?.message || "Invalid code. Check and try again."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
