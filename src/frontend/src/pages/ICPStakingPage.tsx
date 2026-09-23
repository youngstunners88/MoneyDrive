import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Coins,
  ExternalLink,
  RefreshCw,
  Shield,
  Smartphone,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  cacheUSDCRate,
  formatRateAge,
  formatUSDCRate,
  getCachedUSDCRate,
  getFallbackRate,
  parseUSDCZARRaw,
} from "../services/exchangeRateService";

interface MiniPayPageProps {
  profile: UserProfile | null | undefined;
  tier: number;
}

const FALLBACK_RAND_PER_USDC = 18.5;
const APY = 0.05;

const WHY_CARDS = [
  {
    icon: <Smartphone className="w-6 h-6 text-white" />,
    bg: "linear-gradient(135deg, oklch(0.52 0.20 35), oklch(0.60 0.18 50))",
    title: "Setup in 2 Minutes",
    desc: "Download Opera Mini, open MiniPay, enter your phone number. That's it. No bank forms. No waiting.",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    bg: "linear-gradient(135deg, oklch(0.40 0.14 155), oklch(0.50 0.16 145))",
    title: "Earn Interest Daily",
    desc: "Hold USDC or cUSD in your MiniPay wallet and earn interest every day. Your money grows while you drive.",
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    bg: "linear-gradient(135deg, oklch(0.55 0.15 270), oklch(0.45 0.18 290))",
    title: "Send & Receive Free",
    desc: "Send money to anyone with a phone number. No bank fees. No transfer delays. Instant.",
  },
];

const STEPS = [
  {
    num: 1,
    icon: <Smartphone className="w-5 h-5" />,
    title: "Download Opera Mini",
    desc: "Go to opera.com/mini on your phone. Download and install it. It's free.",
    link: "https://www.opera.com/mini/download",
    linkLabel: "Download Opera Mini →",
  },
  {
    num: 2,
    icon: <Wallet className="w-5 h-5" />,
    title: "Open MiniPay",
    desc: "Inside Opera Mini, tap the MiniPay icon. It's built in — no extra app needed.",
    link: null,
    linkLabel: null,
  },
  {
    num: 3,
    icon: <Shield className="w-5 h-5" />,
    title: "Enter Your Phone Number",
    desc: "MiniPay uses your phone number as your wallet address. No seed phrases. No complicated passwords.",
    link: null,
    linkLabel: null,
  },
  {
    num: 4,
    icon: <Coins className="w-5 h-5" />,
    title: "Add Your First Rands",
    desc: "Tap 'Add Money'. You can buy USDC with your SA bank card or EFT. Starts at just R50.",
    link: null,
    linkLabel: null,
  },
  {
    num: 5,
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Start Earning",
    desc: "Your USDC starts earning interest immediately. No lock periods. You can withdraw any time.",
    link: null,
    linkLabel: null,
  },
];

const ICP_DISSOLVE = [
  { label: "6 months", apy: "~3% APY" },
  { label: "1 year", apy: "~5% APY" },
  { label: "4 years", apy: "~12% APY" },
  { label: "8 years", apy: "~15% APY" },
];

const DURATION_OPTIONS = [
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
  { label: "2 years", months: 24 },
];

export default function ICPStakingPage(_props: MiniPayPageProps) {
  const [monthlySaving, setMonthlySaving] = useState<string>("500");
  const [duration, setDuration] = useState<string>("12");
  const [icpOpen, setIcpOpen] = useState(false);

  // Live USDC/ZAR rate
  const { actor, isFetching } = useActor();
  const [randPerUsdc, setRandPerUsdc] = useState(FALLBACK_RAND_PER_USDC);
  const [rateData, setRateData] = useState(getFallbackRate());
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedUSDCRate();
    if (cached) {
      setRandPerUsdc(cached.zarPerUsdc);
      setRateData(cached);
      setRateLoading(false);
      return;
    }
    if (!actor || isFetching) return;

    type ActorWithRate = typeof actor & {
      getUSDCZARRate?: () => Promise<string>;
    };
    const ext = actor as ActorWithRate;
    if (!ext.getUSDCZARRate) {
      setRateLoading(false);
      return;
    }

    ext
      .getUSDCZARRate()
      .then((raw: string) => {
        const parsed = parseUSDCZARRaw(raw);
        if (parsed) {
          cacheUSDCRate(parsed);
          setRandPerUsdc(parsed.zarPerUsdc);
          setRateData(parsed);
        }
      })
      .catch(() => {
        // Fallback already set as default state
      })
      .finally(() => setRateLoading(false));
  }, [actor, isFetching]);

  function refreshRate() {
    if (!actor) return;
    setRateLoading(true);
    type ActorWithRate = typeof actor & {
      getUSDCZARRate?: () => Promise<string>;
    };
    const ext = actor as ActorWithRate;
    if (!ext.getUSDCZARRate) {
      setRateLoading(false);
      return;
    }
    ext
      .getUSDCZARRate()
      .then((raw: string) => {
        const parsed = parseUSDCZARRaw(raw);
        if (parsed) {
          cacheUSDCRate(parsed);
          setRandPerUsdc(parsed.zarPerUsdc);
          setRateData(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setRateLoading(false));
  }

  const monthlyNum = Number.parseFloat(monthlySaving) || 0;
  const durationNum = Number.parseInt(duration, 10) || 12;

  function calcGrowth(monthlyRand: number, months: number) {
    if (monthlyRand <= 0 || months <= 0) return { rand: 0, usdc: 0 };
    const totalDeposit = monthlyRand * months;
    const usdc = totalDeposit / randPerUsdc;
    const years = months / 12;
    const earned = usdc * APY * years;
    const totalUsdc = usdc + earned;
    return { rand: totalUsdc * randPerUsdc, usdc: totalUsdc };
  }

  const result = calcGrowth(monthlyNum, durationNum);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-24">
      {/* ── SECTION 1: HERO BANNER ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-fade-up"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.20 35) 0%, oklch(0.62 0.18 55) 60%, oklch(0.70 0.14 70) 100%)",
        }}
        data-ocid="minipay.hero.card"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative z-10">
          <Badge className="bg-white/20 text-white border-white/30 text-[10px] mb-3 font-bold">
            PASSIVE INCOME — START TODAY
          </Badge>

          <h1 className="font-display font-extrabold text-2xl text-white leading-tight mb-2">
            Start Earning While You Sleep
          </h1>
          <p className="text-white/85 text-sm leading-relaxed mb-5">
            MiniPay turns your phone into a savings account. No bank needed. No
            complicated setup. Just your phone number and a few taps.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.opera.com/mini/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[oklch(0.52_0.20_35)] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-md btn-press"
              data-ocid="minipay.hero.get_started.link"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-white/15 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/25 transition-colors border border-white/30 btn-press"
              data-ocid="minipay.hero.how_it_works.link"
              onClick={() => {
                document
                  .getElementById("minipay-steps")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How It Works
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: WHY MINIPAY ─────────────────────────────────────── */}
      <div className="animate-fade-up stagger-1">
        <h2 className="font-display font-bold text-base text-foreground mb-3">
          Why Drivers Love MiniPay
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WHY_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl p-4 flex flex-col gap-3 shadow-card"
              style={{ background: card.bg }}
              data-ocid={`minipay.why.${card.title.replace(/\s+/g, "_").toLowerCase()}.card`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {card.icon}
              </div>
              <div>
                <p className="font-display font-bold text-sm text-white mb-1">
                  {card.title}
                </p>
                <p className="text-white/80 text-xs leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: WHAT IS A STABLECOIN ───────────────────────────── */}
      <Card
        className="rounded-2xl shadow-card animate-fade-up stagger-2"
        data-ocid="minipay.stablecoin.card"
      >
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-bold text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            What's a Stablecoin? (Simple Version)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A stablecoin is digital money that's{" "}
            <strong className="text-foreground">
              always worth 1 US Dollar
            </strong>
            . Unlike Bitcoin which can drop 50% overnight, stablecoins never
            change in price. 1 USDC = R{randPerUsdc.toFixed(2)} today. 1 USDC =
            R{randPerUsdc.toFixed(2)} tomorrow. Always stable.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs rounded-xl overflow-hidden">
              <thead>
                <tr
                  className="text-white"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))",
                  }}
                >
                  <th className="px-3 py-2.5 text-left font-bold" />
                  <th className="px-3 py-2.5 text-center font-bold">
                    Bank Account
                  </th>
                  <th className="px-3 py-2.5 text-center font-bold">Bitcoin</th>
                  <th className="px-3 py-2.5 text-center font-bold">
                    MiniPay (USDC)
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Price Stability", "✅", "❌", "✅"],
                  [
                    "Earns Interest",
                    "Tiny (2–4%)",
                    "No guarantee",
                    "✅ (3–8%)",
                  ],
                  ["Instant Transfers", "❌", "❌", "✅"],
                  ["No Bank Needed", "❌", "Sort of", "✅"],
                  ["Works in SA", "✅", "✅", "✅"],
                ].map(([label, bank, btc, mini], i) => (
                  <tr
                    key={label}
                    className={i % 2 === 0 ? "bg-muted/30" : "bg-card"}
                  >
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {label}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {bank}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {btc}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-primary">
                      {mini}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 4: SAVINGS CALCULATOR ─────────────────────────────── */}
      <Card
        className="rounded-2xl shadow-card animate-fade-up stagger-3"
        data-ocid="minipay.calculator.card"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <CardTitle className="font-display font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              See How Much You Can Grow
            </CardTitle>
            {/* Live rate badge */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {rateLoading ? (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading rate…
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: rateData.isLive
                        ? "oklch(0.40 0.14 155 / 0.15)"
                        : "oklch(0.70 0.10 60 / 0.15)",
                      color: rateData.isLive
                        ? "oklch(0.40 0.14 155)"
                        : "oklch(0.55 0.10 60)",
                    }}
                    data-ocid="minipay.calculator.rate.badge"
                  >
                    {formatUSDCRate(rateData)}
                  </span>
                  <button
                    type="button"
                    onClick={refreshRate}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Refresh exchange rate"
                    data-ocid="minipay.calculator.rate.refresh"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {!rateLoading && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatRateAge(rateData.fetchedAt)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monthly-saving" className="text-sm font-medium">
                Save per month (R)
              </Label>
              <Input
                id="monthly-saving"
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={monthlySaving}
                onChange={(e) => setMonthlySaving(e.target.value)}
                className="rounded-xl"
                data-ocid="minipay.calculator.amount.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">How long?</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger
                  className="rounded-xl"
                  data-ocid="minipay.calculator.duration.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.months} value={String(opt.months)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Output */}
          <div
            className="rounded-xl p-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.70 0.14 70 / 0.12), oklch(0.62 0.18 55 / 0.10))",
              border: "1px solid oklch(0.70 0.14 70 / 0.30)",
            }}
            data-ocid="minipay.calculator.result.card"
          >
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">
              Your MiniPay Savings (estimated at 5% APY)
            </p>
            <p
              className="font-display font-extrabold text-3xl"
              style={{ color: "oklch(0.60 0.18 55)" }}
            >
              R
              {result.rand.toLocaleString("en-ZA", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-sm font-semibold text-muted-foreground mt-0.5">
              ≈ {result.usdc.toFixed(2)} USDC
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
              Based on {formatUSDCRate(rateData)} · Not a guarantee
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 5: STEP-BY-STEP ONBOARDING ──────────────────────── */}
      <div
        className="animate-fade-up stagger-4"
        id="minipay-steps"
        data-ocid="minipay.steps.section"
      >
        <h2 className="font-display font-bold text-base text-foreground mb-4">
          Get Set Up in 5 Minutes
        </h2>
        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="flex gap-4 relative"
              data-ocid={`minipay.step.item.${step.num}`}
            >
              {/* Vertical connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-8px)] z-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, oklch(0.52 0.20 35 / 0.4), oklch(0.62 0.18 55 / 0.1))",
                  }}
                />
              )}

              {/* Step badge */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display font-extrabold text-white text-sm shadow-md z-10 relative"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.20 35), oklch(0.62 0.18 55))",
                }}
              >
                {step.num}
              </div>

              <div className="flex-1 pb-6">
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-primary opacity-80"
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                    <p className="font-display font-bold text-sm text-foreground">
                      {step.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {step.desc}
                  </p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline"
                      data-ocid={`minipay.step.${step.num}.link`}
                    >
                      {step.linkLabel}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 6: TRANSACTING WITH MINIPAY ─────────────────────── */}
      <div className="animate-fade-up stagger-5">
        <h2 className="font-display font-bold text-base text-foreground mb-3">
          Use MiniPay Every Day
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))",
            }}
            data-ocid="minipay.transact.pay_receive.card"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <p className="font-display font-bold text-sm text-white mb-1.5">
              Pay &amp; Receive
            </p>
            <p className="text-white/75 text-xs leading-relaxed">
              Send money to family or friends using just their phone number. Pay
              for goods and services at MiniPay merchants across SA.
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.40 0.14 155), oklch(0.50 0.16 145))",
            }}
            data-ocid="minipay.transact.cash_out.card"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <p className="font-display font-bold text-sm text-white mb-1.5">
              Cash Out to Rands
            </p>
            <p className="text-white/75 text-xs leading-relaxed">
              Need Rands? Tap 'Withdraw', link your SA bank account, and your
              money lands in minutes. Fees under R1.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 7: ICP STAKING (ADVANCED, COLLAPSIBLE) ──────────── */}
      <div
        className="rounded-2xl border border-border overflow-hidden animate-fade-up stagger-5"
        data-ocid="minipay.icp_staking.section"
      >
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 p-4 bg-card hover:bg-muted/40 transition-colors text-left"
          onClick={() => setIcpOpen((prev) => !prev)}
          aria-expanded={icpOpen}
          data-ocid="minipay.icp_staking.toggle"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base"
              style={{ background: "oklch(0.45 0.18 290 / 0.8)" }}
            >
              ∞
            </div>
            <div>
              <p className="font-display font-bold text-sm text-foreground">
                Want to Go Deeper? ICP Staking
              </p>
              <p className="text-[11px] text-muted-foreground">
                Advanced crypto — for experienced users only
              </p>
            </div>
          </div>
          {icpOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {icpOpen && (
          <div className="px-4 pb-5 pt-1 border-t border-border bg-muted/20 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed pt-3">
              <strong className="text-foreground">
                ICP staking is for advanced users
              </strong>{" "}
              who are comfortable with crypto. It requires buying ICP on an
              exchange, setting up a wallet, and locking your funds for months.{" "}
              <strong className="text-primary">
                Start with MiniPay first — it's much simpler.
              </strong>
            </p>

            {/* Dissolve table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-3 py-2 text-left font-bold text-foreground">
                      Lock Period
                    </th>
                    <th className="px-3 py-2 text-right font-bold text-foreground">
                      Estimated APY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ICP_DISSOLVE.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.label}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-primary">
                        {row.apy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "NNS (Stake ICP)",
                  url: "https://nns.ic0.app",
                  ocid: "minipay.icp.nns.link",
                },
                {
                  label: "Plug Wallet",
                  url: "https://plugwallet.ooo",
                  ocid: "minipay.icp.plug.link",
                },
                {
                  label: "ICP on CoinGecko",
                  url: "https://www.coingecko.com/en/coins/internet-computer",
                  ocid: "minipay.icp.coingecko.link",
                },
              ].map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-3 py-1.5 bg-card hover:border-primary/40"
                  data-ocid={link.ocid}
                >
                  {link.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 8: FOOTER DISCLAIMER ──────────────────────────────── */}
      <div
        className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed animate-fade-up stagger-6"
        data-ocid="minipay.disclaimer.card"
      >
        <p className="font-semibold text-foreground mb-1">Disclaimer</p>
        MiniPay and USDC are financial products. The interest rates shown are
        estimates based on current market conditions and may change. MoneyDrive
        does not provide financial advice. Always do your own research before
        investing. Stablecoins are subject to smart contract and counterparty
        risk. The Rand/USD conversion rate used ({formatUSDCRate(rateData)}) is{" "}
        {rateData.isLive ? "a live market rate" : "an estimate"} for
        illustration purposes only.
        <br />
        <br />
        <strong className="text-foreground">FAIS:</strong> MoneyDrive is not a
        financial services provider. Information is for informational purposes
        only. <strong className="text-foreground">POPIA:</strong> Your data is
        protected under POPIA.
      </div>

      <div className="h-4" />
    </div>
  );
}
