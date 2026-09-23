import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../shared/hooks/useActor";

export function useEarnings() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => actor!.getTrips(),
    enabled: !!actor,
  });

  const { data: earningsTotal, isLoading: earningsLoading } = useQuery({
    queryKey: ["earningsTotal"],
    queryFn: () => actor!.getEarningsTotal(),
    enabled: !!actor,
  });

  const deleteTripMut = useMutation({
    mutationFn: (tripId: string) => actor!.deleteTrip(tripId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["earningsTotal"] });
      toast.success("Trip removed");
    },
    onError: () => toast.error("Failed to remove trip"),
  });

  const totalAmount = earningsTotal ? earningsTotal[0] : 0;
  const totalTrips = earningsTotal ? Number(earningsTotal[1]) : 0;

  return {
    trips: trips ?? [],
    tripsLoading,
    earningsLoading,
    totalAmount,
    totalTrips,
    deleteTrip: deleteTripMut.mutate,
    isDeletingTrip: deleteTripMut.isPending,
  };
}
