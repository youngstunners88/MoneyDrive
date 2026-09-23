import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Event as CalEvent, FetchedEvent } from "../../backend";
import { useActor } from "../../shared/hooks/useActor";

export function useEvents() {
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();
  const [markedRead, setMarkedRead] = useState(false);

  const { data: fetchedEvents, isLoading: loadingFetched } = useQuery<
    FetchedEvent[]
  >({
    queryKey: ["fetchedEvents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFetchedEvents();
    },
    enabled: !!actor && !actorFetching,
  });

  const { data: customEvents, isLoading: loadingCustom } = useQuery<CalEvent[]>(
    {
      queryKey: ["customEvents"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getCustomEvents();
      },
      enabled: !!actor && !actorFetching,
    },
  );

  useEffect(() => {
    if (!actor || !fetchedEvents || markedRead) return;
    const hasNew = fetchedEvents.some((e) => e.isNew);
    if (hasNew) {
      const t = setTimeout(() => {
        actor.markEventsAsRead().catch(() => {});
        setMarkedRead(true);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [actor, fetchedEvents, markedRead]);

  const refreshMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.fetchAndStoreSAEvents(true);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fetchedEvents"] });
      setMarkedRead(false);
      toast.success("Events refreshed!");
    },
    onError: (e: Error) => toast.error(`Refresh failed: ${e.message}`),
  });

  const addEventMut = useMutation({
    mutationFn: (ev: CalEvent) => actor!.addCustomEvent(ev),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customEvents"] });
    },
    onError: () => toast.error("Failed to save event"),
  });

  const deleteEventMut = useMutation({
    mutationFn: (id: string) => actor!.deleteCustomEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customEvents"] });
      toast.success("Event removed");
    },
    onError: () => toast.error("Failed to remove event"),
  });

  const newCount = (fetchedEvents ?? []).filter((e) => e.isNew).length;

  return {
    fetchedEvents: fetchedEvents ?? [],
    customEvents: customEvents ?? [],
    isLoading: loadingFetched || loadingCustom,
    newCount,
    refresh: refreshMut.mutate,
    isRefreshing: refreshMut.isPending,
    addEvent: addEventMut.mutate,
    isAddingEvent: addEventMut.isPending,
    deleteEvent: deleteEventMut.mutate,
    isDeletingEvent: deleteEventMut.isPending,
  };
}
