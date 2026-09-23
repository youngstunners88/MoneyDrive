/**
 * types.ts — WhatsApp/messaging feature TypeScript types.
 * Mirrors backend Motoko types for messaging and conversation history.
 */

// ─── Channel & Message enums ──────────────────────────────────────────────────

export type ConversationChannel = "app" | "whatsapp" | "telegram";

export type MessageDirection = "inbound" | "outbound";

export type MessageDeliveryStatus = "sent" | "delivered" | "read" | "failed";

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface WhatsAppConversationEntry {
  messageId: string;
  driverId: string;
  direction: MessageDirection;
  body: string;
  deliveryStatus: MessageDeliveryStatus;
  /** Unix nanoseconds */
  timestamp: bigint;
  channel: ConversationChannel;
  errorMsg?: string;
  mediaStorageRef?: string;
}

// ─── WhatsApp config (admin-only) ─────────────────────────────────────────────

export interface WhatsAppConfig {
  phoneNumber: string;
  apiKey: string;
  webhookSecret: string;
}
