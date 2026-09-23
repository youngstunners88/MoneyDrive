import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { StakingRecord } from "../../backend";
import { useActor } from "../../shared/hooks/useActor";

export function useStaking() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const {
    data: priceRaw,
    isLoading: priceLoading,
    isError: priceError,
    refetch: refetchPrice,
    isFetching: priceRefetching,
  } = useQuery<string>({
    queryKey: ["icpPrice"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getICPPrice();
    },
    enabled: !!actor,
    refetchInterval: 60_000,
  });

  const { data: stakingRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["stakingRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStakingRecords();
    },
    enabled: !!actor,
  });

  const saveMut = useMutation({
    mutationFn: async (
      record: Omit<StakingRecord, "stakeId"> & { stakeId?: string },
    ) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveStakingRecord({
        stakeId: record.stakeId ?? `stake_${Date.now()}`,
        icpAmount: record.icpAmount,
        dissolveDelayDays: record.dissolveDelayDays,
        startDate: record.startDate,
        notes: record.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stakingRecords"] });
      toast.success("Stake logged! 🎉");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (stakeId: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteStakingRecord(stakeId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stakingRecords"] });
      toast.success("Stake removed");
    },
    onError: () => toast.error("Failed to delete stake"),
  });

  return {
    priceRaw: priceRaw ?? "",
    priceLoading,
    priceError,
    priceRefetching,
    refetchPrice,
    stakingRecords: stakingRecords ?? [],
    recordsLoading,
    saveStake: saveMut.mutateAsync,
    isSaving: saveMut.isPending,
    deleteStake: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
  };
}
