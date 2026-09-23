/**
 * ZeroXWorkPanel.tsx — Admin panel for Nduna's 0xWork agent marketplace registration.
 * Self-contained — reads its own hooks, no props from parent.
 * Follows the same visual pattern as OrbisPublisherPanel and BrowserbasePanel.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ClipboardCopy,
  DollarSign,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  type ZeroXWorkTask,
  useAvailableTasks,
  useClaimTask,
  useTrigger0xWorkRegistration,
  useTriggerTaskDiscovery,
  useZeroXWorkEarnings,
  useZeroXWorkStatus,
} from "./use0xWork";

// ─── Category badge config ────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<
  ZeroXWorkTask["category"],
  { bg: string; text: string; border: string }
> = {
  Writing: {
    bg: "oklch(0.55 0.18 35 / 0.10)",
    text: "oklch(0.45 0.18 35)",
    border: "oklch(0.55 0.18 35 / 0.30)",
  },
  Research: {
    bg: "oklch(0.75 0.12 85 / 0.15)",
    text: "oklch(0.40 0.10 65)",
    border: "oklch(0.75 0.12 85 / 0.40)",
  },
  Data: {
    bg: "oklch(0.55 0.14 270 / 0.10)",
    text: "oklch(0.45 0.14 270)",
    border: "oklch(0.55 0.14 270 / 0.30)",
  },
  Creative: {
    bg: "oklch(0.55 0.14 145 / 0.10)",
    text: "oklch(0.40 0.14 145)",
    border: "oklch(0.55 0.14 145 / 0.30)",
  },
};

const DIFFICULTY_DOT: Record<ZeroXWorkTask["difficulty"], string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-red-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ZeroXWorkPanel() {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: status, isLoading: statusLoading } = useZeroXWorkStatus();
  const { data: earnings } = useZeroXWorkEarnings();
  const { data: tasks, isLoading: tasksLoading } = useAvailableTasks();

  const register = useTrigger0xWorkRegistration();
  const discover = useTriggerTaskDiscovery();
  const claimTask = useClaimTask();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr).then(() => {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    });
  };

  const isRegistered = status?.registered === true;
  const walletAddress = status?.walletAddress ?? null;

  return (
    <div className="space-y-4 pt-1" data-ocid="settings.admin.zeroxwork.panel">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Nduna joins the Base chain task marketplace — he claims Writing,
        Research, Data, and Creative tasks autonomously and earns USDC with no
        human involvement. Earnings go to his Base wallet; you can cashout at
        any time.
      </p>

      {/* ── Status + Earnings card ─────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: isRegistered
            ? "oklch(0.55 0.14 145 / 0.06)"
            : "oklch(0.94 0.06 85 / 0.3)",
          border: isRegistered
            ? "1px solid oklch(0.55 0.14 145 / 0.25)"
            : "1px solid oklch(0.75 0.12 85 / 0.3)",
        }}
        data-ocid="settings.admin.zeroxwork.status_card"
      >
        {/* Registration status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isRegistered ? (
            <>
              <Badge
                className="gap-1.5 text-xs"
                style={{
                  background: "oklch(0.55 0.14 145 / 0.15)",
                  color: "oklch(0.35 0.14 145)",
                  border: "1px solid oklch(0.55 0.14 145 / 0.3)",
                }}
                data-ocid="settings.admin.zeroxwork.registered_badge"
              >
                <CheckCircle2 className="w-3 h-3" />
                Registered on 0xWork
              </Badge>
              <Badge
                className="text-[10px] gap-1"
                style={{
                  background: "oklch(0.45 0.14 240 / 0.12)",
                  color: "oklch(0.40 0.12 240)",
                  border: "1px solid oklch(0.45 0.14 240 / 0.25)",
                }}
              >
                Base Chain · USDC
              </Badge>
            </>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 text-xs text-muted-foreground"
              data-ocid="settings.admin.zeroxwork.unregistered_badge"
            >
              <Info className="w-3 h-3" />
              Not registered yet
            </Badge>
          )}
        </div>

        {/* Wallet address row */}
        {isRegistered && walletAddress && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: "oklch(0.20 0.05 240 / 0.08)",
              border: "1px solid oklch(0.45 0.10 240 / 0.25)",
            }}
            data-ocid="settings.admin.zeroxwork.wallet_row"
          >
            <code
              className="text-xs font-mono flex-1 min-w-0 truncate"
              style={{ color: "oklch(0.45 0.12 240)" }}
            >
              {truncateAddress(walletAddress)}
            </code>
            <button
              type="button"
              onClick={() => handleCopyAddress(walletAddress)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy wallet address"
              data-ocid="settings.admin.zeroxwork.copy_address_button"
            >
              {copiedAddress ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ClipboardCopy className="w-3.5 h-3.5" />
              )}
            </button>
            <a
              href={`https://basescan.org/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="View on BaseScan"
              data-ocid="settings.admin.zeroxwork.basescan_link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Capabilities badges */}
        {isRegistered && (
          <div className="flex flex-wrap gap-1.5">
            {(["Writing", "Research", "Data", "Creative"] as const).map(
              (cap) => {
                const style = CATEGORY_STYLE[cap];
                return (
                  <span
                    key={cap}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {cap}
                  </span>
                );
              },
            )}
          </div>
        )}

        {/* Earnings metrics */}
        {isRegistered && (
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-lg p-2.5 text-center"
              style={{
                background: "oklch(0.55 0.14 145 / 0.10)",
                border: "1px solid oklch(0.55 0.14 145 / 0.25)",
              }}
              data-ocid="settings.admin.zeroxwork.usdc_earned_stat"
            >
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <DollarSign
                  className="w-3 h-3"
                  style={{ color: "oklch(0.40 0.14 145)" }}
                />
              </div>
              <p
                className="font-display font-bold text-base leading-none"
                style={{ color: "oklch(0.35 0.14 145)" }}
              >
                ${(earnings?.totalUSDCEarned ?? 0).toFixed(2)}
              </p>
              <p className="text-[9px] font-semibold text-muted-foreground mt-1">
                USDC Earned
              </p>
            </div>

            <div
              className="rounded-lg p-2.5 text-center"
              style={{
                background: "oklch(0.75 0.12 85 / 0.12)",
                border: "1px solid oklch(0.75 0.12 85 / 0.25)",
              }}
              data-ocid="settings.admin.zeroxwork.tasks_completed_stat"
            >
              <p
                className="font-display font-bold text-base leading-none mt-3.5"
                style={{ color: "oklch(0.40 0.12 85)" }}
              >
                {earnings?.tasksCompleted ?? 0}
              </p>
              <p className="text-[9px] font-semibold text-muted-foreground mt-1">
                Tasks Done
              </p>
            </div>

            <div
              className="rounded-lg p-2.5 text-center"
              style={{
                background: status?.activeTaskId
                  ? "oklch(0.55 0.18 35 / 0.10)"
                  : "oklch(0.94 0.02 85 / 0.5)",
                border: status?.activeTaskId
                  ? "1px solid oklch(0.55 0.18 35 / 0.30)"
                  : "1px solid oklch(0.75 0.08 85 / 0.25)",
              }}
              data-ocid="settings.admin.zeroxwork.active_task_stat"
            >
              <div className="mt-3.5">
                {status?.activeTaskId ? (
                  <span
                    className="w-2 h-2 rounded-full animate-pulse mx-auto block"
                    style={{ background: "oklch(0.55 0.18 35)" }}
                  />
                ) : (
                  <p
                    className="text-[10px] font-semibold"
                    style={{ color: "oklch(0.60 0.05 85)" }}
                  >
                    None
                  </p>
                )}
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground mt-1">
                Active Task
              </p>
            </div>
          </div>
        )}

        {/* Pending payout note — hidden (pendingUSDC not tracked in current backend) */}
        {false && isRegistered && (
          <div
            className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
            style={{
              background: "oklch(0.75 0.12 85 / 0.12)",
              color: "oklch(0.40 0.10 65)",
              border: "1px solid oklch(0.75 0.12 85 / 0.25)",
            }}
            data-ocid="settings.admin.zeroxwork.pending_payout"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>$0.00 USDC</strong> pending in escrow — releases on task
              approval
            </span>
          </div>
        )}
      </div>

      {/* ── Not registered — register CTA ──────────────────────────────────── */}
      {!isRegistered && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: "oklch(0.55 0.18 35 / 0.05)",
            border: "1px solid oklch(0.55 0.18 35 / 0.20)",
          }}
          data-ocid="settings.admin.zeroxwork.register_cta"
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "oklch(0.30 0.10 35)" }}
            >
              Register Nduna on 0xWork
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Nduna gets a Base wallet, stakes{" "}
              <span className="font-semibold">$AXOBOTL</span> (free faucet), and
              starts claiming tasks autonomously. No ongoing setup — it runs in
              the background while he serves drivers.
            </p>
          </div>

          {register.isError && (
            <p
              className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2"
              data-ocid="settings.admin.zeroxwork.register.error_state"
            >
              {(register.error as Error)?.message ||
                "Registration failed — try again."}
            </p>
          )}

          <Button
            onClick={() => register.mutate()}
            disabled={register.isPending}
            className="w-full gap-2"
            style={
              !register.isPending
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.52 0.20 35), oklch(0.45 0.18 45))",
                    color: "white",
                    border: "none",
                  }
                : {}
            }
            data-ocid="settings.admin.zeroxwork.register.submit_button"
          >
            {register.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Registering Nduna…
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Register Nduna on 0xWork
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Free to register · USDC earnings on Base chain · No API key needed
          </p>
        </div>
      )}

      {/* ── Discover Tasks button ──────────────────────────────────────────── */}
      {isRegistered && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => discover.mutate()}
          disabled={discover.isPending}
          className="w-full gap-2 text-xs"
          data-ocid="settings.admin.zeroxwork.discover_button"
        >
          {discover.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {discover.isPending ? "Scanning 0xWork…" : "Discover New Tasks"}
        </Button>
      )}

      {/* ── Available Tasks list ───────────────────────────────────────────── */}
      {isRegistered && (
        <div
          className="space-y-2"
          data-ocid="settings.admin.zeroxwork.tasks_list"
        >
          {tasksLoading ? (
            <div
              className="rounded-xl px-4 py-6 text-center"
              style={{
                background: "oklch(0.94 0.06 85 / 0.3)",
                border: "1px solid oklch(0.75 0.12 85 / 0.25)",
              }}
              data-ocid="settings.admin.zeroxwork.tasks.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Loading available tasks…
              </p>
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div
              className="rounded-xl px-4 py-5 text-center"
              style={{
                background: "oklch(0.94 0.06 85 / 0.3)",
                border: "1px solid oklch(0.75 0.12 85 / 0.25)",
              }}
              data-ocid="settings.admin.zeroxwork.tasks.empty_state"
            >
              <p className="text-xs text-muted-foreground">
                No available tasks right now.{" "}
                <button
                  type="button"
                  onClick={() => discover.mutate()}
                  className="font-semibold underline"
                  style={{ color: "oklch(0.55 0.18 35)" }}
                >
                  Discover tasks →
                </button>
              </p>
            </div>
          ) : (
            <>
              <p
                className="text-xs font-semibold"
                style={{ color: "oklch(0.30 0.10 35)" }}
              >
                Available Tasks ({tasks.length})
              </p>
              {tasks.map((task, idx) => {
                const catStyle = CATEGORY_STYLE[task.category];
                return (
                  <div
                    key={task.id}
                    className="rounded-xl p-3 space-y-2"
                    style={{
                      background: "oklch(0.97 0.04 85 / 0.4)",
                      border: "1px solid oklch(0.75 0.12 85 / 0.30)",
                    }}
                    data-ocid={`settings.admin.zeroxwork.task.${idx + 1}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: catStyle.bg,
                              color: catStyle.text,
                              border: `1px solid ${catStyle.border}`,
                            }}
                          >
                            {task.category}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${DIFFICULTY_DOT[task.difficulty]}`}
                            title={`${task.difficulty} difficulty`}
                          />
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {task.difficulty}
                          </span>
                        </div>
                        <p
                          className="text-xs font-semibold leading-snug"
                          style={{ color: "oklch(0.25 0.08 35)" }}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                          {task.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right space-y-1.5">
                        <p
                          className="text-sm font-display font-bold"
                          style={{ color: "oklch(0.40 0.14 145)" }}
                        >
                          ${task.bountyUSDC.toFixed(2)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">USDC</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">
                        Due: {task.deadline}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => claimTask.mutate(task.id)}
                        disabled={claimTask.isPending || !!status?.activeTaskId}
                        className="h-7 text-[11px] gap-1 px-2.5"
                        style={
                          !claimTask.isPending && !status?.activeTaskId
                            ? {
                                borderColor: "oklch(0.55 0.18 35 / 0.5)",
                                color: "oklch(0.45 0.18 35)",
                              }
                            : {}
                        }
                        data-ocid={`settings.admin.zeroxwork.claim_button.${idx + 1}`}
                      >
                        {claimTask.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        {status?.activeTaskId ? "Task Active" : "Claim"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Info footer ───────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-2 text-[11px] rounded-lg px-3 py-2"
        style={{
          color: "oklch(0.50 0.18 35)",
          backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
        }}
      >
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          0xWork tasks run autonomously via WebSocket, XMTP, and REST polling.
          Nduna submits deliverables; payment releases from on-chain escrow on
          approval. See{" "}
          <a
            href="https://www.0xwork.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            0xwork.org ↗
          </a>
        </span>
      </div>
    </div>
  );
}
