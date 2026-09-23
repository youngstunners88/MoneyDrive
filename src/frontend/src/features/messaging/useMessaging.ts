/**
 * useMessaging.ts — React Query hooks for the WhatsApp/messaging feature.
 * Wraps backend messaging APIs: history, unread count, config, and phone registration.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import type { WhatsAppConfig, WhatsAppConversationEntry } from "./types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const messagingKeys = {
  history: (limit?: number) => ["whatsapp-history", limit] as const,
  unreadCount: () => ["whatsapp-unread"] as const,
  isConfigured: () => ["whatsapp-configured"] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch WhatsApp/in-app conversation history for the caller. */
export function useWhatsAppHistory(limit?: number) {
  const { actor, isFetching } = useActor();
  return useQuery<WhatsAppConversationEntry[]>({
    queryKey: messagingKeys.history(limit),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getWhatsAppHistory(
        limit !== undefined ? BigInt(limit) : null,
        null,
      );
      return result as WhatsAppConversationEntry[];
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000, // 15s — messages refresh frequently
  });
}

/** Get count of unread incoming messages for the caller. */
export function useUnreadWhatsAppCount() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: messagingKeys.unreadCount(),
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getUnreadWhatsAppCount();
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000, // poll every 30s
  });
}

/** Check whether WhatsApp is configured (admin-set API keys present). */
export function useIsWhatsAppConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: messagingKeys.isConfigured(),
    queryFn: async () => {
      if (!actor) return false;
      return actor.isWhatsAppConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Register/update the driver's WhatsApp phone number. */
export function useRegisterWhatsAppPhone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (phone) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.registerWhatsAppPhone(phone);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.history() });
      toast.success("WhatsApp number registered successfully");
    },
    onError: (err) => {
      toast.error(`Failed to register number: ${err.message}`);
    },
  });
}

/** Admin-only: save WhatsApp API config (phone, apiKey, webhookSecret). */
export function useSaveWhatsAppConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, WhatsAppConfig>({
    mutationFn: async (config) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setWhatsAppConfig(
        config as import("../../backend.d.ts").WhatsAppConfig,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.isConfigured(),
      });
      toast.success("WhatsApp configuration saved");
    },
    onError: (err) => {
      toast.error(`Failed to save config: ${err.message}`);
    },
  });
}

/** Send a WhatsApp message to a phone number (admin/support use). */
export function useSendWhatsAppMessage() {
  const { actor } = useActor();
  return useMutation<string, Error, { toPhone: string; body: string }>({
    mutationFn: async ({ toPhone, body }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.sendWhatsAppMessage(toPhone, body);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onError: (err) => {
      toast.error(`Message failed: ${err.message}`);
    },
  });
}
