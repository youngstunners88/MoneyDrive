/**
 * CompetitiveIntelligenceDashboard.tsx
 *
 * Tier 2+ component. Shows anonymous network intelligence from MoneyDrive
 * drivers across South Africa: city leaderboard, top responsive companies,
 * network stats, and the authenticated driver's competitive position.
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  BarChart2,
  Building2,
  MapPin,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CityLeaderEntry, CompanyResponsiveness } from "./types";
import {
  useCompetitiveStats,
  useDriverCompetitiveProfile,
} from "./useCompetitiveIntelligence";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtR(n: number): string {
  if (n >= 1000) return `R${(n / 1000).toFixed(0)}k`;
  return `R${n.toLocaleString()}`;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl flex-1"
      style={{
        background: highlight
          ? "rgba(186,117,23,0.12)"
          : "rgba(255,255,255,0.05)",
        border: highlight
          ? "1px solid rgba(186,117,23,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ color: highlight ? "#BA7517" : "#9CA3AF" }}>{icon}</div>
      <span
        className="font-display font-bold text-lg leading-none"
        style={{ color: highlight ? "#BA7517" : "#F9FAFB" }}
      >
        {value}
      </span>
      <span
        className="text-[10px] text-center leading-tight"
        style={{ color: "#9CA3AF" }}
      >
        {label}
      </span>
    </div>
  );
}

function CityRow({
  entry,
  rank,
}: {
  entry: CityLeaderEntry;
  rank: number;
}) {
  const isFirst = rank === 1;
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
      style={{
        background: isFirst ? "rgba(186,117,23,0.1)" : "rgba(255,255,255,0.03)",
        border: isFirst
          ? "1px solid rgba(186,117,23,0.3)"
          : "1px solid transparent",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 28,
          height: 28,
          background: isFirst
            ? "rgba(186,117,23,0.2)"
            : "rgba(255,255,255,0.06)",
        }}
      >
        {isFirst ? (
          <Award size={14} style={{ color: "#BA7517" }} />
        ) : (
          <span className="text-xs font-bold" style={{ color: "#9CA3AF" }}>
            {rank}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isFirst ? "#BA7517" : "#F9FAFB" }}
        >
          {entry.city}
        </p>
        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
          Top: {entry.topCompany}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold" style={{ color: "#F9FAFB" }}>
          {entry.dealsClosed} {entry.dealsClosed === 1 ? "deal" : "deals"}
        </p>
        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
          avg {fmtR(entry.avgDealValue)}/mo
        </p>
      </div>
    </div>
  );
}

function CompanyRow({ company }: { company: CompanyResponsiveness }) {
  const isHot = company.responseRate >= 0.5;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2
            size={13}
            style={{ color: isHot ? "#1A6B2A" : "#9CA3AF" }}
          />
          <span className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>
            {company.companyName}
          </span>
          {isHot && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(26,107,42,0.2)", color: "#1A6B2A" }}
            >
              RESPONSIVE
            </span>
          )}
        </div>
        <span className="text-xs font-bold" style={{ color: "#F9FAFB" }}>
          {pct(company.responseRate)}
        </span>
      </div>
      {/* Response rate bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.round(company.responseRate * 100)}%`,
            background: isHot
              ? "linear-gradient(90deg, #1A6B2A, #34A853)"
              : "linear-gradient(90deg, #BA7517, #D97706)",
          }}
        />
      </div>
      <div
        className="flex justify-between text-[10px]"
        style={{ color: "#9CA3AF" }}
      >
        <span>
          {company.successfulDeals} successful deal
          {company.successfulDeals !== 1 ? "s" : ""}
        </span>
        <span>avg {fmtR(company.avgDealValue)}/mo</span>
      </div>
    </div>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true">
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Skeleton className="h-4 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Skeleton className="h-4 w-44" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onGeneratePitch }: { onGeneratePitch?: () => void }) {
  return (
    <div
      className="rounded-2xl p-8 text-center space-y-4"
      style={{
        background: "rgba(186,117,23,0.05)",
        border: "1px dashed rgba(186,117,23,0.3)",
      }}
      data-ocid="competitive-empty-state"
    >
      <div
        className="mx-auto flex items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          background: "rgba(186,117,23,0.12)",
          border: "1.5px solid rgba(186,117,23,0.3)",
        }}
      >
        <BarChart2 size={24} style={{ color: "#BA7517" }} />
      </div>
      <div>
        <h3
          className="font-display font-bold text-base mb-1"
          style={{ color: "#F9FAFB" }}
        >
          Be the first in your city!
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
          Close a deal and help build the network. Once more drivers submit
          pitches, you'll see live leaderboards, top companies, and how you
          rank.
        </p>
      </div>
      {onGeneratePitch && (
        <button
          type="button"
          onClick={onGeneratePitch}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            background: "rgba(186,117,23,0.2)",
            color: "#BA7517",
            border: "1px solid rgba(186,117,23,0.35)",
          }}
          data-ocid="competitive-generate-pitch-cta"
        >
          Generate Your First Pitch →
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CompetitiveIntelligenceDashboardProps {
  onGeneratePitch?: () => void;
}

export default function CompetitiveIntelligenceDashboard({
  onGeneratePitch,
}: CompetitiveIntelligenceDashboardProps) {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch,
  } = useCompetitiveStats();
  const { data: myProfile, isLoading: profileLoading } =
    useDriverCompetitiveProfile();

  const isLoading = statsLoading || profileLoading;

  if (isLoading) return <DashboardSkeleton />;

  const isEmpty =
    !stats ||
    (stats.cityLeaderboard.length === 0 && stats.topCompanies.length === 0);

  if (isEmpty) {
    return <EmptyState onGeneratePitch={onGeneratePitch} />;
  }

  const hasProfile = myProfile?.city && myProfile.rank > 0;
  const networkAccuracy = Math.round((stats.networkSurgeAccuracy ?? 0) * 100);
  const myAccuracy = hasProfile
    ? Math.round(myProfile.surgeAccuracy * 100)
    : null;
  const accuracyDiff =
    myAccuracy !== null ? myAccuracy - networkAccuracy : null;

  return (
    <div
      className="space-y-4 animate-fade-up"
      data-ocid="competitive-intelligence-dashboard"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="font-display font-bold text-base"
            style={{ color: "#F9FAFB" }}
          >
            Network Intelligence
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Anonymous data from MoneyDrive drivers across South Africa
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
          aria-label="Refresh network data"
          data-ocid="competitive-refresh"
        >
          <RefreshCw size={14} style={{ color: "#9CA3AF" }} />
        </button>
      </div>

      {/* Network stats bar */}
      <div
        className="flex gap-2 p-3 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        data-ocid="competitive-network-stats"
      >
        <StatBadge
          icon={<Users size={16} />}
          label="Drivers in network"
          value={stats.totalDriversInNetwork.toLocaleString()}
        />
        <StatBadge
          icon={<TrendingUp size={16} />}
          label="Network surge accuracy"
          value={`${networkAccuracy}%`}
        />
        {hasProfile && (
          <StatBadge
            icon={<MapPin size={16} />}
            label={`Rank in ${myProfile.city}`}
            value={`${myProfile.rank} of ${myProfile.totalInCity}`}
            highlight
          />
        )}
      </div>

      {/* City leaderboard */}
      {stats.cityLeaderboard.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          data-ocid="competitive-city-leaderboard"
        >
          <div className="flex items-center gap-2 mb-1">
            <Award size={15} style={{ color: "#BA7517" }} />
            <h4 className="text-sm font-bold" style={{ color: "#F9FAFB" }}>
              Deals Closed This Month by City
            </h4>
          </div>
          {stats.cityLeaderboard.map((entry, idx) => (
            <CityRow key={entry.city} entry={entry} rank={idx + 1} />
          ))}
        </div>
      )}

      {/* Top companies */}
      {stats.topCompanies.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          data-ocid="competitive-top-companies"
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={15} style={{ color: "#1A6B2A" }} />
            <h4 className="text-sm font-bold" style={{ color: "#F9FAFB" }}>
              Most Responsive Companies
            </h4>
          </div>
          {stats.topCompanies.map((company) => (
            <CompanyRow key={company.companyName} company={company} />
          ))}
        </div>
      )}

      {/* Your position vs. network */}
      {hasProfile && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(186,117,23,0.05)",
            border: "1px solid rgba(186,117,23,0.2)",
          }}
          data-ocid="competitive-my-position"
        >
          <h4 className="text-sm font-bold" style={{ color: "#BA7517" }}>
            Your Position
          </h4>

          {/* Surge accuracy comparison */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "#9CA3AF" }}>Your surge accuracy</span>
              <span className="font-bold" style={{ color: "#F9FAFB" }}>
                {myAccuracy}%
                {accuracyDiff !== null && accuracyDiff !== 0 && (
                  <span
                    style={{
                      color: accuracyDiff > 0 ? "#1A6B2A" : "#D85A30",
                      marginLeft: 4,
                    }}
                  >
                    ({accuracyDiff > 0 ? "+" : ""}
                    {accuracyDiff}% vs. network)
                  </span>
                )}
              </span>
            </div>
            <div
              className="relative h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {/* Network avg baseline */}
              <div
                className="absolute h-full"
                style={{
                  width: `${networkAccuracy}%`,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
              {/* Your score */}
              <div
                className="absolute h-full rounded-full"
                style={{
                  width: `${myAccuracy ?? 0}%`,
                  background:
                    (myAccuracy ?? 0) >= networkAccuracy
                      ? "linear-gradient(90deg, #1A6B2A, #34A853)"
                      : "linear-gradient(90deg, #D85A30, #F97316)",
                }}
              />
            </div>
            <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
              Network avg: {networkAccuracy}%
            </p>
          </div>

          {/* Deals comparison */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Deals closed
              </p>
              <p
                className="text-lg font-display font-bold"
                style={{ color: "#F9FAFB" }}
              >
                {myProfile.dealsClosedCount}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Avg deal value
              </p>
              <p
                className="text-lg font-display font-bold"
                style={{ color: "#BA7517" }}
              >
                {myProfile.avgDealValue > 0
                  ? fmtR(myProfile.avgDealValue)
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {stats.month && (
        <p className="text-[11px] text-center" style={{ color: "#6B7280" }}>
          Data for {stats.month} · Refreshed hourly · All stats anonymous
        </p>
      )}
    </div>
  );
}
