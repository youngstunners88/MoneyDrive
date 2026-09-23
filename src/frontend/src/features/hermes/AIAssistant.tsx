import { Button } from "@/components/ui/button";
import {
  Brain,
  Info,
  Zap as Lightning,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as behavioralContext from "../../services/behavioralContextService";
import type { MessageClassification } from "../../services/hermesService";
import { stripNdunaFormatting } from "../../services/hermesService";
import RecommendationFeedback from "../nduna-feedback/RecommendationFeedback";
import type { HermesMessage } from "./useHermes";

// ─── Recommendation detection helpers ─────────────────────────────────────────

const REC_KEYWORDS =
  /surge|drive at|earn|opportunity|advertising|pitch|recommend|try/i;

function isRecommendation(content: string): boolean {
  return REC_KEYWORDS.test(content);
}

function detectRecommendationType(
  content: string,
): "surge" | "product" | "advertising" {
  if (/surge|drive at|drive in|drive on|multiplier/i.test(content))
    return "surge";
  if (/product|sell|wifi|water|perfume|dashcam|candy/i.test(content))
    return "product";
  return "advertising";
}

function detectConfidence(content: string): "HIGH" | "MEDIUM" | "LOW" {
  if (/HIGH confidence|3x|surge multiplier|3 times/i.test(content))
    return "HIGH";
  if (/2x|MEDIUM confidence|double/i.test(content)) return "MEDIUM";
  return "LOW";
}

// ─── Orbis fallback + PQS helpers ─────────────────────────────────────────────

const ORBIS_MARKER = "[ORBIS_FALLBACK]";
const PQS_CLARIFICATION =
  "I want to help — could you share a bit more detail so I can give you the most useful answer?";

function stripOrbisFallbackMarker(text: string): string {
  return text.replace(/\[ORBIS_FALLBACK\]/g, "").trimStart();
}

function isOrbisFallback(text: string): boolean {
  return text.includes(ORBIS_MARKER);
}

function isPqsClarification(text: string): boolean {
  return text.trim() === PQS_CLARIFICATION;
}

// ─── Quick thumbs feedback ────────────────────────────────────────────────────

interface ThumbsFeedbackProps {
  messageId: string;
}

function ThumbsFeedback({ messageId }: ThumbsFeedbackProps) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const handleVote = useCallback(
    (vote: "up" | "down") => {
      if (voted) return;
      setVoted(vote);
      const outcome = vote === "up" ? "acted" : ("dismissed" as const);
      void behavioralContext.logOutcome(messageId, outcome);
      setShowThanks(true);
      setTimeout(() => setShowThanks(false), 2000);
    },
    [voted, messageId],
  );

  if (showThanks) {
    return (
      <span
        className="text-[10px] transition-opacity"
        style={{ color: "oklch(0.55 0.14 145)" }}
        aria-live="polite"
      >
        Thanks for the feedback
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      data-ocid={`feedback.thumbs.${messageId}`}
    >
      <span
        className="text-[10px] mr-0.5"
        style={{ color: "oklch(0.45 0.01 240)" }}
      >
        Did this help?
      </span>
      <button
        type="button"
        onClick={() => handleVote("up")}
        disabled={voted !== null}
        aria-label="Yes, this helped"
        className="p-1 rounded transition-all hover:scale-110 active:scale-95 disabled:opacity-40"
        style={{
          color:
            voted === "up" ? "oklch(0.55 0.14 145)" : "oklch(0.45 0.01 240)",
        }}
        data-ocid={`feedback.thumbs_up.${messageId}`}
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => handleVote("down")}
        disabled={voted !== null}
        aria-label="No, this didn't help"
        className="p-1 rounded transition-all hover:scale-110 active:scale-95 disabled:opacity-40"
        style={{
          color:
            voted === "down" ? "oklch(0.65 0.18 25)" : "oklch(0.45 0.01 240)",
        }}
        data-ocid={`feedback.thumbs_down.${messageId}`}
      >
        <ThumbsDown className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIAssistantProps {
  messages: HermesMessage[];
  isLoading: boolean;
  isClearing: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  input: string;
  setInput: (val: string) => void;
  messageClassifications: Map<string, MessageClassification>;
  hasMemory?: boolean;
  driverId?: string;
}

const SUGGESTION_CHIPS = [
  "What are the peak hours today?",
  "Best areas to drive right now?",
  "How's my earnings this week?",
  "Any big events coming up?",
  "Tips to increase my income?",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4 animate-fade-up">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-primary/20">
        <img
          src="https://i.imgur.com/u98U7S6.png"
          alt="Nduna"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary/40"
              style={{
                animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClassificationBadge({
  classification,
}: {
  classification: MessageClassification;
}) {
  if (classification === "deal_opportunity") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
        style={{
          background: "oklch(0.75 0.12 85 / 0.15)",
          border: "1px solid oklch(0.75 0.12 85 / 0.4)",
          color: "oklch(0.80 0.14 85)",
        }}
      >
        <Star className="w-2.5 h-2.5" />
        Deal Opportunity
      </span>
    );
  }
  if (classification === "action_item") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
        style={{
          background: "oklch(0.75 0.17 65 / 0.12)",
          border: "1px solid oklch(0.75 0.17 65 / 0.4)",
          color: "oklch(0.80 0.18 65)",
        }}
      >
        <Lightning className="w-2.5 h-2.5" />
        Action Item
      </span>
    );
  }
  return null;
}

export function MessageBubble({
  message,
  classification,
  driverId,
}: {
  message: HermesMessage;
  classification?: MessageClassification;
  driverId?: string;
}) {
  const isUser = message.role === "user";

  // Detect Orbis fallback before stripping marker
  const rawContent = message.content;
  const fromOrbis = !isUser && isOrbisFallback(rawContent);
  const pqsMessage = !isUser && isPqsClarification(rawContent.trim());

  // Strip classification tags, markdown, and Orbis marker from display text
  const displayContent = isUser
    ? message.content
    : stripOrbisFallbackMarker(stripNdunaFormatting(rawContent));

  const time = message.timestamp.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-up">
        <div className="max-w-[80%] min-w-0">
          <div
            className="rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.68 0.14 82))",
              color: "oklch(0.08 0.01 85)",
            }}
          >
            {displayContent}
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-1 pr-1">
            {time}
          </p>
        </div>
      </div>
    );
  }

  const isDeal = classification === "deal_opportunity";
  const isAction = classification === "action_item";
  const isActionable = isDeal || isAction;
  const showFeedback = isRecommendation(displayContent);
  const truncatedContent =
    displayContent.length > 200
      ? `${displayContent.slice(0, 200)}...`
      : displayContent;

  // PQS clarification message — distinct amber styling, no classification badge
  if (pqsMessage) {
    return (
      <div className="mb-4 animate-fade-up">
        <div className="flex items-end gap-2">
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border"
            style={{ borderColor: "oklch(0.75 0.17 65 / 0.4)" }}
          >
            <img
              src="https://i.imgur.com/u98U7S6.png"
              alt="Nduna"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-[80%] min-w-0">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed shadow-card flex items-start gap-2"
              style={{
                background: "oklch(0.16 0.025 65)",
                border: "1px solid oklch(0.70 0.17 65 / 0.35)",
              }}
            >
              <Info
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: "oklch(0.78 0.15 65)" }}
              />
              <span
                className="whitespace-pre-wrap"
                style={{ color: "oklch(0.88 0.10 65)" }}
              >
                {displayContent}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 pl-1">
              {time}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 animate-fade-up">
      <div className="flex items-end gap-2">
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border"
          style={
            isDeal
              ? { borderColor: "oklch(0.75 0.12 85 / 0.5)" }
              : isAction
                ? { borderColor: "oklch(0.75 0.17 65 / 0.4)" }
                : { borderColor: "oklch(0.75 0.12 85 / 0.2)" }
          }
        >
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-[80%] min-w-0">
          {/* Classification badge OR Orbis badge — never both */}
          {classification && classification !== "routine" && !fromOrbis && (
            <div className="mb-1 pl-1">
              <ClassificationBadge classification={classification} />
            </div>
          )}
          {fromOrbis && (
            <div className="mb-1 pl-1">
              <span
                className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.55 0.02 240 / 0.18)",
                  border: "1px solid oklch(0.55 0.04 240 / 0.35)",
                  color: "oklch(0.65 0.04 240)",
                }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Powered by Orbis
              </span>
            </div>
          )}
          <div
            className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-foreground shadow-card whitespace-pre-wrap"
            style={
              isDeal
                ? {
                    background: "oklch(0.12 0.015 85)",
                    border: "1px solid oklch(0.75 0.12 85 / 0.35)",
                    boxShadow: "0 0 12px oklch(0.75 0.12 85 / 0.1)",
                  }
                : isAction
                  ? {
                      background: "oklch(0.12 0.015 65)",
                      border: "1px solid oklch(0.75 0.17 65 / 0.3)",
                    }
                  : {
                      background: "oklch(0.14 0.012 82)",
                      border: "1px solid oklch(0.22 0.02 85)",
                    }
            }
          >
            {displayContent}
          </div>
          <div className="flex items-center justify-between mt-1 pl-1">
            <p className="text-[10px] text-muted-foreground">{time}</p>
            {/* Quick thumbs feedback for deal/action messages */}
            {isActionable && <ThumbsFeedback messageId={message.id} />}
          </div>
        </div>
      </div>

      {/* Full recommendation feedback form — shown for messages with surge/product/advertising content */}
      {showFeedback && driverId && (
        <div className="ml-10 mt-2" data-ocid={`feedback.${message.id}`}>
          <RecommendationFeedback
            recommendationId={message.id}
            recommendationType={detectRecommendationType(message.content)}
            content={truncatedContent}
            confidence={detectConfidence(message.content)}
            driverId={driverId}
          />
        </div>
      )}
    </div>
  );
}

export function AIAssistantUI({
  messages,
  isLoading,
  isClearing,
  sendMessage,
  clearConversation,
  input,
  setInput,
  messageClassifications,
  hasMemory,
  driverId,
}: AIAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMessages = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full min-h-[65vh]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-3 border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.015 75), oklch(0.14 0.02 82))",
          borderColor: "oklch(0.75 0.12 85 / 0.25)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: "oklch(0.75 0.12 85 / 0.5)" }}
          >
            <img
              src="https://i.imgur.com/u98U7S6.png"
              alt="Nduna"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-foreground text-sm">
                Nduna
              </span>
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "oklch(0.55 0.14 145)" }}
              />
              {hasMemory ? (
                <span
                  className="text-[11px] flex items-center gap-1"
                  style={{ color: "oklch(0.55 0.14 145)" }}
                >
                  <Brain className="w-3 h-3" />
                  Nduna remembers you
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  New session — Nduna is learning about you
                </span>
              )}
            </div>
          </div>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConversation}
            disabled={isClearing}
            className="gap-1.5 text-muted-foreground hover:text-destructive text-xs"
            data-ocid="ai.clear_conversation.button"
            aria-label="Clear conversation"
          >
            {isClearing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Clear
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-1 py-2 rounded-xl mb-3"
        style={{
          minHeight: "340px",
          maxHeight: "420px",
          background: "oklch(0.09 0.012 78)",
          border: "1px solid oklch(0.22 0.02 85)",
        }}
        data-ocid="ai.messages.container"
      >
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "oklch(0.75 0.12 85 / 0.1)",
                border: "1px solid oklch(0.75 0.12 85 / 0.2)",
              }}
            >
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground text-base mb-1">
              Ask Nduna anything
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
              Get surge predictions, earnings insights, event lookups, and
              strategies to grow your income.
            </p>
          </div>
        )}
        <div className="px-3 pt-2">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              classification={messageClassifications.get(msg.id)}
              driverId={driverId}
            />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestion chips */}
      {!hasMessages && (
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide"
          data-ocid="ai.suggestion_chips"
        >
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                sendMessage(chip);
              }}
              disabled={isLoading}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-full whitespace-nowrap font-medium transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "oklch(0.60 0.22 35 / 0.15)",
                border: "1px solid oklch(0.60 0.22 35 / 0.4)",
                color: "oklch(0.78 0.14 40)",
              }}
              data-ocid={`ai.chip.${chip.slice(0, 20).replace(/\s+/g, "_").toLowerCase()}`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2"
        data-ocid="ai.input.form"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Nduna anything about driving..."
          disabled={isLoading}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all disabled:opacity-50"
          style={{
            background: "oklch(0.14 0.015 80)",
            border: "1px solid oklch(0.28 0.025 80)",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor =
              "oklch(0.75 0.12 85 / 0.5)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor =
              "oklch(0.28 0.025 80)";
          }}
          data-ocid="ai.message.input"
          aria-label="Message to Nduna"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              input.trim() && !isLoading
                ? "linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.68 0.14 82))"
                : "oklch(0.20 0.02 85)",
          }}
          data-ocid="ai.send.button"
          aria-label="Send message to Nduna"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Send
              className="w-5 h-5"
              style={{
                color: input.trim()
                  ? "oklch(0.08 0.01 85)"
                  : "oklch(0.40 0.02 85)",
              }}
            />
          )}
        </button>
      </form>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Locked state for tier < 3
export function HermesLockedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] p-6 text-center">
      <div className="bg-card rounded-2xl shadow-card p-10 max-w-md w-full border border-border">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
            <img
              src="https://i.imgur.com/u98U7S6.png"
              alt="Nduna"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.60 0.22 35)" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Nduna
        </h2>
        <p className="text-muted-foreground text-sm mb-2">
          Your 24/7 AI driving assistant — available exclusively on{" "}
          <span className="text-primary font-semibold">Tier 3 Premium</span>.
        </p>
        <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
          Get real-time surge predictions, personalised earnings advice, fuel
          monitoring insights, event lookups, and instant answers.
        </p>
        <div
          className="rounded-xl px-4 py-3 text-sm font-semibold text-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.75 0.12 85 / 0.15), oklch(0.60 0.22 35 / 0.15))",
            border: "1px solid oklch(0.75 0.12 85 / 0.3)",
            color: "oklch(0.75 0.12 85)",
          }}
        >
          Upgrade to R800/month — Tier 3 Premium
        </div>
        <p className="text-muted-foreground text-xs mt-4">
          Go to <span className="text-primary">Settings → Plans</span> to
          upgrade your account.
        </p>
      </div>
    </div>
  );
}

export function HermesNotConfiguredState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] p-6 text-center">
      <div className="bg-card rounded-2xl shadow-card p-10 max-w-md w-full border border-border">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 mx-auto mb-6">
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          Nduna Needs Setup
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          The admin needs to configure Nduna with an OpenRouter API key to
          activate your AI assistant.
        </p>
      </div>
    </div>
  );
}
