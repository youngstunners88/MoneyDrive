import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";

export type DriverCohort = "PowerEarner" | "GrowthDriver" | "NewDriver";

export interface CohortProfile {
  cohort: DriverCohort;
  tripsThisMonth: number;
  earningsThisMonth: number;
  rating: number;
  cohortAdvice: string;
  upgradeRecommendation: string;
}

// Thresholds for cohort promotion
export const COHORT_THRESHOLDS = {
  GrowthDriver: 100,
  PowerEarner: 200,
} as const;

// Backend returns cohort as a Motoko variant: { PowerEarner: null } | { GrowthDriver: null } | { NewDriver: null }
type RawCohort =
  | { PowerEarner: null }
  | { GrowthDriver: null }
  | { NewDriver: null };

function parseCohort(raw: RawCohort): DriverCohort {
  if ("PowerEarner" in raw) return "PowerEarner";
  if ("GrowthDriver" in raw) return "GrowthDriver";
  return "NewDriver";
}

/** Next cohort name and trip target for a given cohort */
export function getNextCohortInfo(cohort: DriverCohort): {
  label: string;
  target: number;
} | null {
  if (cohort === "NewDriver")
    return { label: "Growth Driver", target: COHORT_THRESHOLDS.GrowthDriver };
  if (cohort === "GrowthDriver")
    return { label: "Power Earner", target: COHORT_THRESHOLDS.PowerEarner };
  return null; // PowerEarner is the top
}

export function useCohort() {
  const { actor, isFetching } = useActor();

  return useQuery<CohortProfile>({
    queryKey: ["driverCohortProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).getDriverCohortProfile();
      return {
        cohort: parseCohort(raw.cohort as RawCohort),
        tripsThisMonth: Number(raw.tripsThisMonth),
        earningsThisMonth: Number(raw.earningsThisMonth),
        rating: Number(raw.rating),
        cohortAdvice: raw.cohortAdvice as string,
        upgradeRecommendation: raw.upgradeRecommendation as string,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateDriverRating() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rating: number) => {
      if (!actor) throw new Error("No actor");
      // updateDriverRating is a new backend method — cast to any for forward compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).updateDriverRating(rating);
      return rating;
    },
    onSuccess: (savedRating) => {
      // Optimistically update the cached cohort profile rating
      queryClient.setQueryData<CohortProfile>(
        ["driverCohortProfile"],
        (prev) => (prev ? { ...prev, rating: savedRating } : prev),
      );
    },
  });
}
