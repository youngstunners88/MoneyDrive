import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useFuel() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: fuelProfile } = useQuery({
    queryKey: ["fuelProfile"],
    queryFn: () => actor!.getFuelProfile(),
    enabled: !!actor,
  });

  const { data: fuelLogs } = useQuery({
    queryKey: ["fuelLogs"],
    queryFn: () => actor!.getFuelLogs(),
    enabled: !!actor,
  });

  const saveProfileMut = useMutation({
    mutationFn: ({
      consumption,
      vehicleName,
    }: { consumption: number; vehicleName: string }) =>
      actor!.saveFuelProfile(consumption, vehicleName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuelProfile"] }),
  });

  const logFuelMut = useMutation({
    mutationFn: ({
      cost,
      distance,
      fuelUsed,
    }: { cost: number; distance: number; fuelUsed: number }) => {
      // Validate all numeric fields before calling backend
      const validFuelUsed = validatePositiveNumber(fuelUsed, "fuelUsed", 1000);
      const validDistance = validatePositiveNumber(
        distance,
        "distanceKm",
        2000,
      );
      const validCost = validatePositiveNumber(cost, "cost", 10000);

      return actor!.addFuelLog({
        cost: validCost,
        date: BigInt(Date.now()),
        distance: validDistance,
        fuelUsed: validFuelUsed,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuelLogs"] }),
    onError: (err: Error) => {
      // Re-throw so callers (toast handlers) can display the validation message
      throw err;
    },
  });

  return {
    fuelProfile,
    fuelLogs: fuelLogs ?? [],
    saveProfile: saveProfileMut.mutate,
    isSavingProfile: saveProfileMut.isPending,
    logFuel: logFuelMut.mutate,
    isLoggingFuel: logFuelMut.isPending,
  };
}
