import { useCallback, useEffect, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";

// ─── Types ──────────────────────────────────────────────────────────────────

export type QueueItemType = "trip" | "expense" | "sale" | "product";

export interface QueueItem<T = unknown> {
  id: string;
  type: QueueItemType;
  data: T;
  createdAt: number;
}

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

const DB_NAME = "moneydrive_offline";
const STORE_NAME = "queue";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbAdd(item: QueueItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface OfflineQueueHook {
  isOnline: boolean;
  addToQueue: (type: QueueItemType, data: unknown) => Promise<void>;
  processQueue: (
    processor: (item: QueueItem) => Promise<void>,
  ) => Promise<void>;
}

/**
 * useOfflineQueue
 *
 * Stores pending writes in IndexedDB when the device is offline.
 * processQueue is called automatically when isOnline transitions
 * from false → true, and can also be called manually.
 *
 * Usage:
 *   const { isOnline, addToQueue, processQueue } = useOfflineQueue(processor);
 */
export function useOfflineQueue(
  processor?: (item: QueueItem) => Promise<void>,
): OfflineQueueHook {
  const { isOnline } = useNetworkStatus();
  const processorRef = useRef(processor);
  processorRef.current = processor;

  // Auto-process when coming back online
  useEffect(() => {
    if (!isOnline) return;
    if (!processorRef.current) return;
    processQueueInternal(processorRef.current).catch(() => {
      /* errors handled inside */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const addToQueue = useCallback(
    async (type: QueueItemType, data: unknown): Promise<void> => {
      const item: QueueItem = {
        id: crypto.randomUUID(),
        type,
        data,
        createdAt: Date.now(),
      };
      await dbAdd(item);
    },
    [],
  );

  const processQueue = useCallback(
    async (proc: (item: QueueItem) => Promise<void>): Promise<void> => {
      await processQueueInternal(proc);
    },
    [],
  );

  return { isOnline, addToQueue, processQueue };
}

async function processQueueInternal(
  processor: (item: QueueItem) => Promise<void>,
): Promise<void> {
  let items: QueueItem[];
  try {
    items = await dbGetAll();
  } catch {
    return;
  }
  for (const item of items) {
    try {
      await processor(item);
      await dbDelete(item.id);
    } catch {
      // Leave item in queue; will retry on next online event
    }
  }
}
