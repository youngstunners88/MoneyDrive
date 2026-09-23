import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Lock,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  tier: number;
  initialQuery?: string;
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
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
        <Zap className="w-4 h-4 text-primary" />
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
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
            {message.content}
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-1 pr-1">
            {time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4 animate-fade-up">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
        <Zap className="w-4 h-4 text-primary" />
      </div>
      <div className="max-w-[80%] min-w-0">
        <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-foreground shadow-card whitespace-pre-wrap">
          {message.content}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 pl-1">{time}</p>
      </div>
    </div>
  );
}

function LockedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] p-6 text-center">
      <div className="bg-card rounded-2xl shadow-card p-10 max-w-md w-full border border-border">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Lock className="w-9 h-9 text-primary" />
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
          monitoring insights, event lookups, and instant answers — like having
          an AI employee in your car.
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

function NotConfiguredState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] p-6 text-center">
      <div className="bg-card rounded-2xl shadow-card p-10 max-w-md w-full border border-border">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <Zap className="w-9 h-9 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          Nduna Needs Setup
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Your admin needs to configure Nduna with an API key. It'll be ready
          for you shortly.
        </p>
        <div
          className="rounded-xl px-4 py-3 text-sm text-center"
          style={{
            background: "oklch(0.15 0.02 85)",
            border: "1px solid oklch(0.25 0.02 85)",
          }}
        >
          <p className="text-muted-foreground">
            Need help?{" "}
            <span className="text-primary font-medium">
              Contact your account manager
            </span>{" "}
            or check back shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant({ tier, initialQuery }: Props) {
  const { actor } = useActor();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuerySent = useRef(false);

  const { data: isConfigured, isLoading: checkingConfig } = useQuery({
    queryKey: ["openClawConfigured"],
    queryFn: () => actor!.isOpenClawConfigured(),
    enabled: !!actor && tier >= 3,
    staleTime: 60_000,
  });

  const clearMut = useMutation({
    mutationFn: () => actor!.clearAgentConversation(),
    onSuccess: () => setMessages([]),
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!actor || !text.trim() || isTyping) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      try {
        const result = await actor.queryAIAgent(text.trim(), null);
        const responseText =
          result.__kind__ === "ok"
            ? result.ok
            : `Sorry, I encountered an issue: ${result.err}. Please try again.`;
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-err-${Date.now()}`,
            role: "assistant",
            content:
              "I ran into a connection issue. Please check your internet and try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [actor, isTyping],
  );

  // Auto-send initialQuery once when configured and ready
  useEffect(() => {
    if (
      initialQuery &&
      isConfigured &&
      actor &&
      !initialQuerySent.current &&
      !isTyping
    ) {
      initialQuerySent.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, isConfigured, actor, isTyping, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (tier < 3) return <LockedState />;

  if (checkingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConfigured) return <NotConfiguredState />;

  const hasMessages = messages.length > 0;

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
            className="w-10 h-10 rounded-full flex items-center justify-center border font-display font-bold text-base"
            style={{
              background: "oklch(0.75 0.12 85 / 0.15)",
              borderColor: "oklch(0.75 0.12 85 / 0.35)",
              color: "oklch(0.75 0.12 85)",
            }}
          >
            H
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
              <span
                className="text-[11px]"
                style={{ color: "oklch(0.55 0.14 145)" }}
              >
                Online — Your personal driver assistant
              </span>
            </div>
          </div>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearMut.mutate()}
            disabled={clearMut.isPending}
            className="gap-1.5 text-muted-foreground hover:text-destructive text-xs"
            data-ocid="ai.clear_conversation.button"
            aria-label="Clear conversation"
          >
            {clearMut.isPending ? (
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
              Start a conversation with Nduna
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
              Ask me anything about driving strategy, surge times, fuel savings,
              or upcoming events in your city.
            </p>
          </div>
        )}
        <div className="px-3 pt-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
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
              onClick={() => sendMessage(chip)}
              disabled={isTyping}
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
          disabled={isTyping}
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
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              input.trim() && !isTyping
                ? "linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.68 0.14 82))"
                : "oklch(0.20 0.02 85)",
          }}
          data-ocid="ai.send.button"
          aria-label="Send message to Nduna"
        >
          {isTyping ? (
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

      {/* Typing dot keyframe — injected inline for portability */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
