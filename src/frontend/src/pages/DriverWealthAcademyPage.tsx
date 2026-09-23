import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  PiggyBank,
  Play,
  TrendingUp,
  Youtube,
} from "lucide-react";

interface ChannelCard {
  handle: string;
  name: string;
  subtitle: string;
  description: string;
  url: string;
  tag: string;
  tagColor: string;
}

const CHANNELS: ChannelCard[] = [
  {
    handle: "@AlexHormozi",
    name: "Alex Hormozi",
    subtitle: "Business strategy and income maximization",
    description:
      "Alex turned broke gyms into a $100M+ empire. Watch how he thinks — then apply his offer-building and pricing strategies directly to your in-car products, branding deals, and income streams.",
    url: "https://www.youtube.com/@AlexHormozi",
    tag: "OFFERS & SALES",
    tagColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    handle: "@MyronGolden",
    name: "Myron Golden",
    subtitle: "Sales mastery and wealth building",
    description:
      "A man who went from mailman to millionaire. Myron teaches biblical wealth principles with real-world tactics. Your mindset is your biggest asset — this channel will upgrade it.",
    url: "https://www.youtube.com/@MyronGolden",
    tag: "WEALTH MINDSET",
    tagColor: "bg-primary/20 text-primary border-primary/30",
  },
  {
    handle: "@TheRichDadChannel",
    name: "Rich Dad Channel",
    subtitle: "Financial intelligence, investing, escaping the rat race",
    description:
      "Robert Kiyosaki's official channel. Regular content on cash flow, real estate, and building passive income. Learn to make your money work — so you don't have to drive forever.",
    url: "https://www.youtube.com/@TheRichDadChannel",
    tag: "CASH FLOW",
    tagColor: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    handle: "@vthembekwayo",
    name: "Vusi Thembekwayo",
    subtitle:
      "Africa's most sought-after speaker on entrepreneurship and business strategy",
    description:
      "Africa's most-booked speaker on business, growth, and entrepreneurship. Vusi breaks down how to build wealth in emerging markets — directly applicable to how you grow your driving business into something bigger.",
    url: "https://www.youtube.com/@vthembekwayo",
    tag: "ENTREPRENEURSHIP",
    tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    handle: "@trilliondollarman",
    name: "Trillion Dollar Man",
    subtitle:
      "High-performance mindset, wealth building, and success strategies",
    description:
      "High-performance mindset, elite wealth-building strategies, and the success principles that separate top earners from the rest. If you want to think bigger about your income — start here.",
    url: "https://www.youtube.com/@trilliondollarman",
    tag: "MINDSET",
    tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
];

const PRINCIPLES = [
  {
    icon: "💡",
    title: "Your car is an asset",
    desc: "Every trip is income. Every in-car product is a new revenue stream. Every passenger is a potential customer.",
  },
  {
    icon: "📈",
    title: "Track every rand",
    desc: "Rich people know exactly where their money goes. MoneyDrive is your financial command center.",
  },
  {
    icon: "🎯",
    title: "Multiple income streams",
    desc: "WiFi, water, perfume, advertising, live streaming — your car can earn while you drive.",
  },
  {
    icon: "🧠",
    title: "Financial IQ compounds",
    desc: "The more you learn, the better decisions you make. 30 minutes of education a day changes your life.",
  },
];

function handleViewManual() {
  window.location.href = "/manual";
}

import type { Tab } from "../routing/routes";

export default function DriverWealthAcademyPage({
  onNavigate,
}: {
  onNavigate?: (tab: Tab) => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* ── ONBOARDING GUIDE CARD — TOP ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 mb-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.20 35) 0%, oklch(0.62 0.18 55) 50%, oklch(0.70 0.14 70) 100%)",
        }}
        data-ocid="academy.onboarding_guide.card"
      >
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-0.5">
              FREE FOR ALL DRIVERS
            </p>
            <h2 className="font-display text-lg font-extrabold text-white leading-tight mb-1">
              Your Free Onboarding Guide
            </h2>
            <p className="text-white/80 text-xs leading-relaxed">
              Read the{" "}
              <strong className="text-white">Level Up Your Hustle</strong> guide
              to get the most out of MoneyDrive — step-by-step, written for SA
              drivers.
            </p>
          </div>
          <Button
            onClick={handleViewManual}
            className="shrink-0 gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-bold"
            data-ocid="academy.view_manual.button"
          >
            <BookOpen className="w-4 h-4" />
            View Manual
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Driver Wealth Academy
            </h1>
            <p className="text-muted-foreground text-sm">
              Your MBA on Wheels — the financial education that your school
              never gave you.
            </p>
          </div>
        </div>

        {/* Mission banner */}
        <div
          className="rounded-2xl p-4 border border-gold/20 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.17 0.035 75), oklch(0.14 0.025 80))",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm mb-1">
                MoneyDrive is an Earnings Optimization + Income Expansion System
              </p>
              <p className="text-white/60 text-xs leading-relaxed">
                Your car is not just transportation — it's your business. The
                drivers who win treat driving like a business, think like
                investors, and never stop learning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wealth Principles */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {PRINCIPLES.map((p) => (
          <div
            key={p.title}
            className="bg-card rounded-xl border border-border p-3 card-hover-lift"
          >
            <div className="text-xl mb-2">{p.icon}</div>
            <p className="font-semibold text-xs text-foreground mb-1">
              {p.title}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── BOOKS ──────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gold" />
        <h2 className="font-display font-bold text-base text-foreground">
          Books
        </h2>
      </div>

      <a
        href="https://richandpoordads.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-8 bg-card rounded-2xl border border-border p-4 card-hover-lift transition-all hover:border-gold/40 group"
        data-ocid="academy.book.rich_dad_poor_dad.link"
      >
        <div className="flex items-start gap-4">
          {/* Book cover placeholder */}
          <div
            className="w-16 h-20 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.60 0.22 35), oklch(0.42 0.16 35))",
            }}
          >
            <span className="text-white font-display font-bold text-[9px] leading-tight text-center px-1">
              RICH DAD POOR DAD
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold/40" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display font-bold text-sm text-foreground">
                Rich Dad Poor Dad
              </h3>
              <Badge className="text-[9px] px-1.5 py-0 bg-gold/20 text-gold border-gold/30 border font-bold">
                MUST READ
              </Badge>
            </div>
            <p className="text-[11px] text-primary font-semibold mb-1.5">
              ✦ The book that changed how millions think about money
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mandatory reading for any driver serious about building wealth.
              Understand the difference between assets and liabilities — and why
              your car is an income-producing machine.
            </p>
            <div className="flex items-center gap-1 mt-3 text-gold text-xs font-semibold group-hover:gap-2 transition-all">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read free →</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </div>
          </div>
        </div>
      </a>

      {/* ── MINIPAY PASSIVE INCOME CARD ────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 mb-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.20 35) 0%, oklch(0.62 0.18 55) 60%, oklch(0.70 0.14 70) 100%)",
        }}
        data-ocid="academy.minipay.card"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <PiggyBank className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-bold mb-1.5">
              PASSIVE INCOME
            </Badge>
            <h2 className="font-display text-lg font-extrabold text-white leading-tight mb-1">
              Grow Your Money with MiniPay
            </h2>
            <p className="text-white/80 text-xs leading-relaxed">
              Set up a stablecoin savings account in 5 minutes. Earn interest
              daily. No bank needed. Your phone number is your wallet.
            </p>
          </div>
          <Button
            onClick={() => onNavigate?.("staking")}
            className="shrink-0 gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-bold"
            data-ocid="academy.minipay.get_started.button"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── CHANNELS ───────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <Youtube className="w-4 h-4 text-red-400" />
        <h2 className="font-display font-bold text-base text-foreground">
          YouTube Channels
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {CHANNELS.map((ch) => (
          <div
            key={ch.handle}
            className="bg-card rounded-2xl border border-border p-4 card-hover-lift flex flex-col gap-3"
          >
            {/* Top row */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <Youtube className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <h3 className="font-display font-bold text-sm text-foreground">
                    {ch.name}
                  </h3>
                  <Badge
                    className={`text-[9px] px-1.5 py-0 border font-bold ${ch.tagColor}`}
                  >
                    {ch.tag}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{ch.handle}</p>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-[11px] text-primary font-semibold leading-snug">
              ✦ {ch.subtitle}
            </p>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">
              {ch.description}
            </p>

            {/* CTA */}
            <a
              href={ch.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors mt-auto"
              data-ocid={`academy.channel.${ch.handle.replace("@", "").toLowerCase()}.link`}
              aria-label={`Watch ${ch.name} on YouTube`}
            >
              <Play className="w-3.5 h-3.5" />
              Watch on YouTube →
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        ))}
      </div>

      {/* Footer motivation */}
      <div className="rounded-xl border border-border px-4 py-4 text-center bg-muted/40 mb-4">
        <p className="text-sm font-bold text-foreground mb-1">
          Knowledge compounds. Start today.
        </p>
        <p className="text-xs text-muted-foreground">
          Spend 30 minutes a day learning. In 12 months, you'll think like a
          business owner — not an employee. MoneyDrive is built to help you make
          that leap.
        </p>
      </div>

      {/* Legal */}
      <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">
          <strong>FAIS:</strong> MoneyDrive is not a financial services
          provider. Educational content is for informational purposes only.{" "}
          <strong>POPIA:</strong> Your data is protected under POPIA.
        </p>
      </div>
    </div>
  );
}
