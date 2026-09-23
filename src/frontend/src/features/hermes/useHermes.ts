import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type {
  DriverAnalyticsProfile,
  DriverMemory,
  DriverMemoryEntry,
} from "../../backend";
import { queryKeys } from "../../lib/queryKeys";
import { analytics } from "../../services/analyticsService";
import * as behavioralContext from "../../services/behavioralContextService";
import {
  type MessageClassification,
  classifyMessage,
  queryNduna,
} from "../../services/hermesService";
import { useActor } from "../../shared/hooks/useActor";
import { type ChatMessage, useChatStore } from "./useChatStore";

// Re-export ChatMessage as HermesMessage for backward compatibility
export type HermesMessage = ChatMessage;

export function useHermes(tier: number) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // Chat UI state from Zustand (optimistic messages + streaming flag)
  const {
    messages,
    isStreaming,
    addMessage,
    updateMessageStatus,
    setMessages,
    setStreaming,
  } = useChatStore();

  // Message classifications stay local to the hook instance (not shared across tabs)
  const [messageClassifications, setMessageClassifications] = useState<
    Map<string, MessageClassification>
  >(new Map());

  const initialQuerySentRef = useRef(false);

  // ── Server state (React Query) ───────────────────────────────────────────────

  const { data: isConfigured, isLoading: checkingConfig } = useQuery({
    queryKey: queryKeys.nduna.configured(),
    queryFn: () => actor!.isOpenClawConfigured(),
    enabled: !!actor && tier >= 3,
    staleTime: 60_000,
  });

  const {
    data: analyticsProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery<DriverAnalyticsProfile | null>({
    queryKey: queryKeys.nduna.analyticsProfile(),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDriverAnalyticsProfile();
    },
    enabled: !!actor && tier >= 3,
    staleTime: 5 * 60_000,
  });

  const { data: driverMemory, isLoading: memoryLoading } =
    useQuery<DriverMemory | null>({
      queryKey: queryKeys.nduna.memory(),
      queryFn: async () => {
        if (!actor) return null;
        return actor.getDriverMemory();
      },
      enabled: !!actor && tier >= 3,
      staleTime: 2 * 60_000,
    });

  const { data: driverMemoryEntries } = useQuery<DriverMemoryEntry[]>({
    queryKey: queryKeys.nduna.memoryEntries(),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDriverMemoryEntries();
    },
    enabled: !!actor && tier >= 3,
    staleTime: 2 * 60_000,
  });

  const { data: earningsSnapshot, refetch: refetchEarningsSnapshot } =
    useQuery<string>({
      queryKey: queryKeys.nduna.earningsSnapshot(),
      queryFn: async () => {
        if (!actor) return "";
        return actor.getDriverEarningsSnapshot();
      },
      enabled: !!actor && tier >= 3,
      staleTime: 5 * 60_000,
    });

  const {
    data: surgeOpportunities,
    isLoading: surgeLoading,
    refetch: refetchSurge,
  } = useQuery<string>({
    queryKey: queryKeys.nduna.surgeOpportunities(),
    queryFn: async () => {
      if (!actor) return "";
      return actor.detectSurgeOpportunities();
    },
    enabled: !!actor && tier >= 3,
    staleTime: 10 * 60_000,
  });

  const {
    data: advertisingBusinessCase,
    isLoading: adCaseLoading,
    refetch: refetchAdCase,
  } = useQuery<string>({
    queryKey: queryKeys.nduna.advertisingCase(),
    queryFn: async () => {
      if (!actor) return "";
      return actor.buildAdvertisingBusinessCase();
    },
    enabled: !!actor && tier >= 3,
    staleTime: 10 * 60_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const recalcMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.recalculateDriverProfile();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.nduna.analyticsProfile(), updated);
    },
  });

  const clearMut = useMutation({
    mutationFn: () => actor!.clearAgentConversation(),
    onSuccess: () => {
      setMessages([]);
      setMessageClassifications(new Map());
      queryClient.invalidateQueries({ queryKey: queryKeys.nduna.memory() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.nduna.memoryEntries(),
      });
    },
  });

  // ── Send message — optimistic ─────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!actor || !text.trim() || isStreaming) return;

      const userId = `u-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userId,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
        status: "pending",
      };
      // Optimistically add user message immediately — chat feels instant
      addMessage(userMsg);
      setStreaming(true);

      const startTime = Date.now();
      try {
        // Fetch 7-day behavioral context to enrich Nduna's response
        const contextData = await behavioralContext.getContextSummary();

        // All AI calls go through the service layer — never call actor.queryAIAgent directly
        const responseText = await queryNduna(
          actor,
          text.trim(),
          contextData || undefined,
        );

        // User message delivered — mark as sent
        updateMessageStatus(userId, "sent");

        const assistantId = `a-${Date.now()}`;
        const assistantMsg: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        };
        addMessage(assistantMsg);

        // Classify the response for the badge display
        const classification = classifyMessage(responseText);
        setMessageClassifications((prev) =>
          new Map(prev).set(assistantId, classification),
        );

        // Close the behavioral loop — log that a recommendation was received
        behavioralContext.logRecommendationReceived(assistantId, responseText);

        analytics.track({
          category: "nduna_query",
          action: "query_sent",
          durationMs: Date.now() - startTime,
          success: true,
          metadata: { classification: classifyMessage(text) },
        });

        queryClient.invalidateQueries({ queryKey: queryKeys.nduna.memory() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.nduna.remaining(),
        });
      } catch (err) {
        // Inline error — mark user message with the error text
        const errorText =
          err instanceof Error ? err.message : "Connection failed";
        updateMessageStatus(userId, "error", errorText);

        analytics.track({
          category: "nduna_query",
          action: "query_failed",
          durationMs: Date.now() - startTime,
          success: false,
          errorMessage: errorText,
        });

        addMessage({
          id: `a-err-${Date.now()}`,
          role: "assistant",
          content:
            "I ran into a connection issue. Please check your internet and try again.",
          timestamp: new Date(),
        });
      } finally {
        setStreaming(false);
      }
    },
    [
      actor,
      isStreaming,
      addMessage,
      setStreaming,
      updateMessageStatus,
      queryClient,
    ],
  );

  const clearConversation = useCallback(() => {
    clearMut.mutate();
  }, [clearMut]);

  const recalculateProfile = useCallback(() => {
    recalcMutation.mutate();
  }, [recalcMutation]);

  return {
    messages,
    isLoading: isStreaming,
    sendMessage,
    clearConversation,
    isClearing: clearMut.isPending,
    isConfigured,
    checkingConfig,
    initialQuerySentRef,
    analyticsProfile,
    profileLoading,
    refetchProfile,
    recalculateProfile,
    isRecalculating: recalcMutation.isPending,
    driverMemory,
    memoryLoading,
    driverMemoryEntries: driverMemoryEntries ?? [],
    earningsSnapshot: earningsSnapshot ?? "",
    refetchEarningsSnapshot,
    surgeOpportunities: surgeOpportunities ?? "",
    surgeLoading,
    refetchSurge,
    advertisingBusinessCase: advertisingBusinessCase ?? "",
    adCaseLoading,
    refetchAdCase,
    messageClassifications,
  };
}
