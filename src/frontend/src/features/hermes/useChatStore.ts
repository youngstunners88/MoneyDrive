/**
 * useChatStore — Zustand store for Nduna chat UI state only.
 * Server state (memory, analytics profile) lives in useHermes React Query hooks.
 * This store handles optimistic local messages and input value — never canister data.
 */

import { create } from "zustand";

/** Status of a user-sent message in the optimistic local state. */
export type MessageStatus = "pending" | "sent" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** Only present on user messages — tracks optimistic send state. */
  status?: MessageStatus;
  /** Only present on user messages with status='error'. */
  errorText?: string;
}

interface ChatStore {
  /** Local message array — includes optimistic user messages before server confirms. */
  messages: ChatMessage[];
  /** Controlled input value for the message box. */
  inputValue: string;
  /** True while waiting for the AI response to stream/return. */
  isStreaming: boolean;

  // ── Setters ──────────────────────────────────────────────────────────────────
  setInputValue: (val: string) => void;
  setStreaming: (v: boolean) => void;

  // ── Message operations ───────────────────────────────────────────────────────
  /** Add a new message to the end of the array. */
  addMessage: (msg: ChatMessage) => void;
  /** Update a message's status (and optionally errorText) by id. */
  updateMessageStatus: (
    id: string,
    status: MessageStatus,
    errorText?: string,
  ) => void;
  /** Replace the entire messages array (e.g. on clear). */
  setMessages: (msgs: ChatMessage[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  inputValue: "",
  isStreaming: false,

  setInputValue: (inputValue) => set({ inputValue }),
  setStreaming: (isStreaming) => set({ isStreaming }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateMessageStatus: (id, status, errorText) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, status, ...(errorText ? { errorText } : {}) } : m,
      ),
    })),

  setMessages: (messages) => set({ messages }),
}));
