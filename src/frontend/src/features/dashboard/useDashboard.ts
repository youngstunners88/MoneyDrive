import { useQuery } from "@tanstack/react-query";
import { useActor } from "../../shared/hooks/useActor";

export function useDashboard(tier: number) {
  const { actor } = useActor();

  const { data: earningsTotal, isLoading: earningsLoading } = useQuery({
    queryKey: ["earningsTotal"],
    queryFn: () => actor!.getEarningsTotal(),
    enabled: !!actor,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => actor!.getTrips(),
    enabled: !!actor,
  });

  const { data: upcomingShifts } = useQuery({
    queryKey: ["upcomingShifts"],
    queryFn: () => actor!.getUpcomingShifts(),
    enabled: !!actor && tier >= 2,
  });

  const { data: earningsGoal } = useQuery({
    queryKey: ["earningsGoal"],
    queryFn: () => actor!.getEarningsGoal(),
    enabled: !!actor,
  });

  const totalAmount = earningsTotal ? earningsTotal[0] : 0;
  const totalTrips = earningsTotal ? Number(earningsTotal[1]) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const todayTrips = (trips ?? []).filter(
    (t) =>
      Number(t.date) >= todayTimestamp &&
      Number(t.date) < todayTimestamp + 86400000,
  );
  const todayEarnings = todayTrips.reduce((s, t) => s + t.amount, 0);

  return {
    trips: trips ?? [],
    tripsLoading,
    earningsLoading,
    totalAmount,
    totalTrips,
    todayTrips,
    todayEarnings,
    upcomingShifts: upcomingShifts ?? [],
    earningsGoal,
    isLoading: tripsLoading || earningsLoading,
  };
}
