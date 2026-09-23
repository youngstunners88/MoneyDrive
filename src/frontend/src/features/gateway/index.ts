// Gateway feature — public API surface

export { useGatewayStore } from "./useGatewayStore";

export {
  useClearGatewayConfig,
  useGatewayEntries,
  useGatewayMetrics,
  useGatewayStatus,
  useRemainingNdunaQueries,
  useSetGatewayConfig,
  /** @deprecated Use queryKeys.gateway.* from lib/queryKeys instead */
  GATEWAY_QUERY_KEYS,
} from "./useGatewayMetrics";

export { GatewayAdminPanel } from "./GatewayAdminPanel";

export type {
  GatewayConfigForm,
  GatewayMetricEntry,
  GatewayMetricsSummary,
  GatewayStatus,
  TestConnectionResult,
} from "./types";
