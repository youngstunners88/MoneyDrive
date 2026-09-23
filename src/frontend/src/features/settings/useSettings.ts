import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserProfile } from "../../backend";
import { useActor } from "../../shared/hooks/useActor";
import { useAuth } from "../auth/useAuth";

type OpportunityHunterActorExt = {
  setOpportunityHunterConfig?: (
    url: string,
    key: string,
  ) => Promise<
    { __kind__: "ok"; ok: boolean } | { __kind__: "err"; err: string }
  >;
  isOpportunityHunterConfigured?: () => Promise<boolean>;
  getOpportunityHunterStatus?: () => Promise<{
    configured: boolean;
    lastRun: bigint;
    lastError: string;
  }>;
};

export function useSettings() {
  const { actor } = useActor();
  const { logout } = useAuth();
  const qc = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor,
  });

  const { data: isElevenLabsConfigured, refetch: refetchElevenLabs } = useQuery(
    {
      queryKey: ["isElevenLabsConfigured"],
      queryFn: () => actor!.isElevenLabsConfigured(),
      enabled: !!actor && !!isAdmin,
    },
  );

  const { data: isOpenClawConfigured, refetch: refetchOpenClaw } = useQuery({
    queryKey: ["isOpenClawConfigured"],
    queryFn: () => actor!.isOpenClawConfigured(),
    enabled: !!actor && !!isAdmin,
  });

  const { data: isStripeConfigured } = useQuery({
    queryKey: ["isStripeConfigured"],
    queryFn: () => actor!.isStripeConfigured(),
    enabled: !!actor && !!isAdmin,
  });

  // ── Opportunity Hunter Status ──────────────────────────────────────────────

  const { data: opportunityHunterStatus, refetch: refetchOpportunityHunter } =
    useQuery({
      queryKey: ["opportunityHunterStatus"],
      queryFn: async () => {
        if (!actor) return null;
        const ext = actor as typeof actor & OpportunityHunterActorExt;
        if (ext.getOpportunityHunterStatus)
          return ext.getOpportunityHunterStatus();
        return null;
      },
      enabled: !!actor && !!isAdmin,
    });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveProfileMut = useMutation({
    mutationFn: async (p: UserProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(p);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const setElevenLabsKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      await actor.setElevenLabsApiKey(key);
    },
    onSuccess: () => {
      toast.success("ElevenLabs API key saved securely.");
      refetchElevenLabs();
    },
    onError: () => toast.error("Failed to save API key."),
  });

  const setOpenClawKeyMut = useMutation({
    mutationFn: async ({
      key,
      url,
      model,
    }: { key: string; url: string; model: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.setOpenClawApiKey(key, url, model);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("OpenRouter API key saved securely.");
      refetchOpenClaw();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save OpenRouter key."),
  });

  const setOpportunityHunterConfigMut = useMutation({
    mutationFn: async ({ url, key }: { url: string; key: string }) => {
      if (!actor) throw new Error("No actor");
      if (!url.startsWith("https://"))
        throw new Error("VPS Endpoint URL must start with https://");
      const ext = actor as typeof actor & OpportunityHunterActorExt;
      if (ext.setOpportunityHunterConfig) {
        const result = await ext.setOpportunityHunterConfig(url, key);
        if (result.__kind__ === "err")
          throw new Error((result as { __kind__: "err"; err: string }).err);
      } else {
        throw new Error("setOpportunityHunterConfig not available on actor");
      }
    },
    onSuccess: () => {
      toast.success("Opportunity Hunter VPS configured.");
      refetchOpportunityHunter();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Opportunity Hunter config."),
  });

  const createCheckoutMut = useMutation({
    mutationFn: async ({
      tier,
      returnUrl,
      cancelUrl,
    }: { tier: number; returnUrl: string; cancelUrl: string }) => {
      if (!actor) throw new Error("Not connected");
      const tierProducts: Record<
        number,
        { name: string; desc: string; price: number }
      > = {
        1: {
          name: "Hustler",
          desc: "MoneyDrive Hustler — 14-day free trial, then R350/month",
          price: 35000,
        },
        2: {
          name: "Pro Driver",
          desc: "MoneyDrive Pro Driver subscription",
          price: 53000,
        },
        3: {
          name: "Elite Driver",
          desc: "MoneyDrive Elite Driver subscription",
          price: 80000,
        },
      };
      const product = tierProducts[tier];
      if (!product) throw new Error("Invalid tier");
      const url = await actor.createCheckoutSession(
        [
          {
            productName: product.name,
            productDescription: product.desc,
            currency: "ZAR",
            quantity: BigInt(1),
            priceInCents: BigInt(product.price),
          },
        ],
        returnUrl,
        cancelUrl,
      );
      return url;
    },
    onError: () =>
      toast.error("Payment setup failed. Make sure Stripe is configured."),
  });

  return {
    isAdmin: isAdmin ?? false,
    isElevenLabsConfigured,
    isOpenClawConfigured,
    isStripeConfigured,
    opportunityHunterStatus,
    saveProfile: saveProfileMut.mutate,
    isSavingProfile: saveProfileMut.isPending,
    setElevenLabsKey: setElevenLabsKeyMut.mutate,
    isSettingElevenLabs: setElevenLabsKeyMut.isPending,
    setOpenClawKey: setOpenClawKeyMut.mutate,
    isSettingOpenClaw: setOpenClawKeyMut.isPending,
    setOpportunityHunterConfig: setOpportunityHunterConfigMut.mutate,
    isSettingOpportunityHunter: setOpportunityHunterConfigMut.isPending,
    createCheckout: createCheckoutMut.mutateAsync,
    isCreatingCheckout: createCheckoutMut.isPending,
    logout,
  };
}
