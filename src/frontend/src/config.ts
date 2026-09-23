import { createActorWithConfig as _createActorWithConfig, type CreateActorOptions } from "@caffeineai/core-infrastructure";
import { createActor, type backendInterface } from "./backend";
import type { createActorFunction } from "@caffeineai/core-infrastructure";

export async function createActorWithConfig(options?: CreateActorOptions): Promise<backendInterface> {
  return _createActorWithConfig<backendInterface>(
    createActor as createActorFunction<backendInterface>,
    options,
  );
}

// MoneyDrive SnapScan merchant ID for tier subscription payments
// This is an empty fallback — the real ID is fetched from the backend at runtime
// via getSnapScanMerchantId(). Set it once in the admin panel under SnapScan Payment Gateway.
export const MONEYDRIVE_SNAPSCAN_ID = "";
