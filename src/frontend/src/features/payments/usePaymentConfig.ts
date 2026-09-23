import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DriverPaymentConfig } from "../../backend.d";
import { useActor } from "../../shared/hooks/useActor";

export function usePaymentConfig() {
  const { actor: rawActor } = useActor();
  const actor = rawActor as
    | (typeof rawActor & {
        getMyPaymentConfig(): Promise<DriverPaymentConfig | null>;
        saveDriverPaymentConfig(config: DriverPaymentConfig): Promise<void>;
        getPassengerOrders(): Promise<
          Array<{
            orderId: string;
            driverName: string;
            items: Array<{
              productName: string;
              quantity: bigint;
              unitPrice: number;
            }>;
            totalAmount: number;
            paymentMethod: string;
            timestamp: bigint;
            passengerNote: string;
          }>
        >;
        deletePassengerOrder(orderId: string): Promise<void>;
      })
    | null;
  const qc = useQueryClient();

  const { data: paymentConfig, isLoading: configLoading } = useQuery({
    queryKey: ["payment-config"],
    queryFn: () => actor!.getMyPaymentConfig(),
    enabled: !!actor,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["passenger-orders"],
    queryFn: () => actor!.getPassengerOrders(),
    enabled: !!actor,
  });

  const saveConfigMut = useMutation({
    mutationFn: async ({
      config,
      snapScanMerchantId,
    }: { config: DriverPaymentConfig; snapScanMerchantId: string }) => {
      if (!actor) throw new Error("No actor");
      const merchantId = snapScanMerchantId.trim();
      const baseRef = config.bankReference
        .replace(/\|\|SNAPSCAN:[^|]*/g, "")
        .trim();
      const encodedConfig: DriverPaymentConfig = {
        ...config,
        bankReference: merchantId
          ? `${baseRef}||SNAPSCAN:${merchantId}`.replace(/^\|\|/, "")
          : baseRef,
      };
      // SECURITY FIX FRONTEND-001: merchant ID is saved to backend only — never localStorage
      await actor.saveDriverPaymentConfig(encodedConfig);
    },
    onSuccess: () => {
      toast.success("Payment settings saved!");
      qc.invalidateQueries({ queryKey: ["payment-config"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const deleteOrderMut = useMutation({
    mutationFn: (orderId: string) => actor!.deletePassengerOrder(orderId),
    onSuccess: () => {
      toast.success("Order deleted");
      qc.invalidateQueries({ queryKey: ["passenger-orders"] });
    },
    onError: () => toast.error("Failed to delete order"),
  });

  return {
    paymentConfig,
    configLoading,
    orders: orders ?? [],
    ordersLoading,
    saveConfig: saveConfigMut.mutate,
    isSavingConfig: saveConfigMut.isPending,
    deleteOrder: deleteOrderMut.mutate,
    isDeletingOrder: deleteOrderMut.isPending,
  };
}
