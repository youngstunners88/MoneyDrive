/**
 * queryKeys — typed query key factory.
 * All React Query cache keys live here. Never use inline string arrays in useQuery.
 * Usage: queryKey: queryKeys.profile.me()
 */
export const queryKeys = {
  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const,
  },
  admin: {
    all: ["admin"] as const,
    isAdmin: () => [...queryKeys.admin.all, "isAdmin"] as const,
  },
  gateway: {
    all: ["gateway"] as const,
    status: () => [...queryKeys.gateway.all, "status"] as const,
    metrics: () => [...queryKeys.gateway.all, "metrics"] as const,
    entries: (limit?: number) =>
      [...queryKeys.gateway.all, "entries", limit] as const,
    remaining: () => [...queryKeys.gateway.all, "remaining"] as const,
  },
  nduna: {
    all: ["nduna"] as const,
    memory: () => [...queryKeys.nduna.all, "memory"] as const,
    memoryEntries: () => [...queryKeys.nduna.all, "memoryEntries"] as const,
    analyticsProfile: () =>
      [...queryKeys.nduna.all, "analyticsProfile"] as const,
    surgeOpportunities: () => [...queryKeys.nduna.all, "surge"] as const,
    earningsSnapshot: () =>
      [...queryKeys.nduna.all, "earningsSnapshot"] as const,
    advertisingCase: () => [...queryKeys.nduna.all, "advertisingCase"] as const,
    configured: () => [...queryKeys.nduna.all, "configured"] as const,
    remaining: () => [...queryKeys.nduna.all, "remaining"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    events: (dateRange?: string) =>
      [...queryKeys.analytics.all, "events", dateRange] as const,
    summary: () => [...queryKeys.analytics.all, "summary"] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: () => [...queryKeys.leads.all, "list"] as const,
  },
  events: {
    all: ["events"] as const,
    list: () => [...queryKeys.events.all, "list"] as const,
  },
  documents: {
    all: ["documents"] as const,
    list: () => [...queryKeys.documents.all, "list"] as const,
  },
  fleet: {
    all: ["fleet"] as const,
    vehicles: () => [...queryKeys.fleet.all, "vehicles"] as const,
    summary: () => [...queryKeys.fleet.all, "summary"] as const,
  },
  earnings: {
    all: ["earnings"] as const,
    total: () => [...queryKeys.earnings.all, "total"] as const,
    trips: () => [...queryKeys.earnings.all, "trips"] as const,
    snapshot: () => [...queryKeys.earnings.all, "snapshot"] as const,
  },
  voice: {
    all: ["voice"] as const,
    usage: () => [...queryKeys.voice.all, "usage"] as const,
  },
} as const;
