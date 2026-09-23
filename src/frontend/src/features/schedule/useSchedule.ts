import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../shared/hooks/useActor";

type ShiftData = {
  shiftId: string;
  date: bigint;
  startTime: string;
  endTime: string;
  targetEarnings: number;
  status: string;
  notes: string;
};

export function useSchedule() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcomingShifts"],
    queryFn: () => actor!.getUpcomingShifts(),
    enabled: !!actor,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["shiftHistory"],
    queryFn: () => actor!.getShiftHistory(),
    enabled: !!actor,
  });

  const addShiftMut = useMutation({
    mutationFn: (shift: ShiftData) => actor!.addOrUpdateShift(shift),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["upcomingShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftHistory"] });
      toast.success("Shift added");
    },
    onError: () => toast.error("Failed to add shift"),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ shift, status }: { shift: ShiftData; status: string }) =>
      actor!.addOrUpdateShift({ ...shift, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["upcomingShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftHistory"] });
      toast.success("Shift updated");
    },
  });

  const deleteShiftMut = useMutation({
    mutationFn: (shiftId: string) => actor!.deleteShift(shiftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["upcomingShifts"] });
      qc.invalidateQueries({ queryKey: ["shiftHistory"] });
      toast.success("Shift deleted");
    },
    onError: () => toast.error("Failed to delete shift"),
  });

  return {
    upcoming: upcoming ?? [],
    upcomingLoading,
    history: history ?? [],
    historyLoading,
    addShift: addShiftMut.mutate,
    isAddingShift: addShiftMut.isPending,
    updateStatus: updateStatusMut.mutate,
    deleteShift: deleteShiftMut.mutate,
    isDeletingShift: deleteShiftMut.isPending,
  };
}
