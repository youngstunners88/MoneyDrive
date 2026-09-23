import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";

export interface ReferralCode {
  code: string;
  ownerId: string;
  ownerName: string;
  createdAt: number;
  timesUsed: number;
  totalEarned: number;
}

export interface ReferralStats {
  timesUsed: number;
  totalEarned: number;
  pendingBonus: number;
}

export interface ReferralConfig {
  enabled: boolean;
  bonusPerReferral: number;
  bonusSource: string;
  minTripsToQualify: number;
}

export function useMyReferralCode() {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralCode>({
    queryKey: ["myReferralCode"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).getMyReferralCode();
      return {
        code: raw.code as string,
        ownerId: raw.ownerId as string,
        ownerName: raw.ownerName as string,
        createdAt: Number(raw.createdAt) / 1_000_000,
        timesUsed: Number(raw.timesUsed),
        totalEarned: Number(raw.totalEarned),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReferralStats() {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralStats>({
    queryKey: ["referralStats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).getReferralStats();
      return {
        timesUsed: Number(raw.timesUsed),
        totalEarned: Number(raw.totalEarned),
        pendingBonus: Number(raw.pendingBonus),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReferralConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralConfig>({
    queryKey: ["referralConfig"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).getReferralConfig();
      return {
        enabled: raw.enabled as boolean,
        bonusPerReferral: Number(raw.bonusPerReferral),
        bonusSource: raw.bonusSource as string,
        minTripsToQualify: Number(raw.minTripsToQualify),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApplyReferralCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).applyReferralCode(code);
      if (result && "err" in result) throw new Error(String(result.err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
      queryClient.invalidateQueries({ queryKey: ["myReferralCode"] });
    },
  });
}
