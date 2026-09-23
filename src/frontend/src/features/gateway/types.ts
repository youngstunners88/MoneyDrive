// Gateway feature types — all types live here, never inline in hooks or components

export interface GatewayStatus {
  configured: boolean;
  url: string | null;
}

export interface GatewayMetricsSummary {
  totalRequests: bigint;
  gatewayRequests: bigint;
  directRequests: bigint;
  cacheHits: bigint;
  avgGatewayMs: bigint;
  avgDirectMs: bigint;
  errorCount: bigint;
}

export interface GatewayMetricEntry {
  timestamp: bigint;
  durationMs: bigint;
  isGateway: boolean;
  wasCached: boolean;
  model: string;
  error: string | null;
}

export interface GatewayConfigForm {
  url: string;
  apiKey: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}
