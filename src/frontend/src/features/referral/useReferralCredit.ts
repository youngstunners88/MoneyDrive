import { useQuery } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";

/**
 * Returns the driver's current referral credit balance in ZAR (Float).
 * Calls getMyReferralCredit() on the backend.
 */
export function useMyReferralCredit() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["myReferralCredit"],
    queryFn: async () => {
      if (!actor) return 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).getMyReferralCredit();
      return typeof raw === "number" ? raw : Number(raw);
    },
    enabled: !!actor && !isFetching,
  });
}
