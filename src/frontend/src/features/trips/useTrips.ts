import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../shared/hooks/useActor";

// SECURITY FIX MEDIUM-001: validate numeric fields before sending to backend
function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  max: number,
): number {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num) || num <= 0 || num > max) {
    throw new Error(
      `Invalid ${fieldName}: must be a positive number not exceeding ${max}`,
    );
  }
  return num;
}

function validateNonNegativeNumber(
  value: unknown,
  fieldName: string,
  max: number,
): number {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num) || num < 0 || num > max) {
    throw new Error(
      `Invalid ${fieldName}: must be a non-negative number not exceeding ${max}`,
    );
  }
  return num;
}

export function useTrips() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => actor!.getTrips(),
    enabled: !!actor,
  });

  const addTripMut = useMutation({
    mutationFn: async (tripData: {
      platform: string;
      amount: number;
      durationMinutes: number;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");

      // Validate numeric fields before calling backend
      const amount = validatePositiveNumber(tripData.amount, "earnings", 50000);
      const durationMinutes = validatePositiveNumber(
        tripData.durationMinutes,
        "durationMinutes",
        1440,
      );

      await actor.addTrip({
        tripId: crypto.randomUUID(),
        platform: tripData.platform,
        amount,
        durationMinutes: BigInt(durationMinutes),
        date: BigInt(Date.now()),
        notes: tripData.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["earningsTotal"] });
      toast.success("Trip logged!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTripMut = useMutation({
    mutationFn: (tripId: string) => actor!.deleteTrip(tripId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["earningsTotal"] });
    },
  });

  return {
    trips: trips ?? [],
    isLoading,
    addTrip: addTripMut.mutateAsync,
    isAdding: addTripMut.isPending,
    deleteTrip: deleteTripMut.mutate,
    isDeleting: deleteTripMut.isPending,
  };
}

// Export for reuse across feature hooks
export { validatePositiveNumber, validateNonNegativeNumber };
