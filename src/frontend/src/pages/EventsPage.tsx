import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  MapPin,
  Music,
  Pencil,
  Plane,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Event as CalEvent, FetchedEvent, UserProfile } from "../backend";

/** Extended FetchedEvent with optional Tavily intelligence fields */
interface FetchedEventEnriched extends FetchedEvent {
  /** 1–10 driver earning opportunity score from Tavily event intelligence */
  opportunityScore?: number;
}
import { useActor } from "../hooks/useActor";

interface Props {
  profile: UserProfile | null | undefined;
  tier: number;
}

const CATEGORIES = [
  "All",
  "Sports",
  "Music",
  "Airport",
  "Transport",
  "My Events",
];

const SA_CITIES = [
  "All Cities",
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
  "Bloemfontein",
  "Other",
];

const categoryIcons: Record<string, React.ReactNode> = {
  Sports: <Trophy className="w-3 h-3" />,
  Music: <Music className="w-3 h-3" />,
  Airport: <Plane className="w-3 h-3" />,
  Transport: <CalendarDays className="w-3 h-3" />,
  Custom: <MapPin className="w-3 h-3" />,
  Festival: <Sparkles className="w-3 h-3" />,
  Concert: <Music className="w-3 h-3" />,
  Comedy: <Zap className="w-3 h-3" />,
};

const categoryColors: Record<string, string> = {
  Sports: "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
  Music: "bg-purple-900/40 text-purple-300 border-purple-700/40",
  Concert: "bg-purple-900/40 text-purple-300 border-purple-700/40",
  Festival: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  Airport: "bg-sky-900/40 text-sky-300 border-sky-700/40",
  Transport: "bg-orange-900/40 text-orange-300 border-orange-700/40",
  Custom: "bg-muted text-muted-foreground border-border",
  Comedy: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
};

function formatEventDate(dateStr: string): string {
  // Try parsing ISO or "YYYY-MM-DD" format
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCustomDate(ts: bigint): string {
  const d = new Date(Number(ts));
  const datePart = d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} at ${timePart}`;
}

function generateICS(event: {
  title: string;
  date: bigint;
  description: string;
  location: string;
}) {
  const d = new Date(Number(event.date));
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  const endDate = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MoneyDrive//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${event.title}`,
    `DTSTART:${fmt(d)}`,
    `DTEND:${fmt(endDate)}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function addToCalendar(event: {
  title: string;
  date: bigint;
  description: string;
  location: string;
}) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getLastRefresh(events: FetchedEventEnriched[]): string | null {
  if (!events.length) return null;
  const latest = events.reduce((max, e) =>
    Number(e.fetchedAt) > Number(max.fetchedAt) ? e : max,
  );
  const d = new Date(Number(latest.fetchedAt) / 1_000_000); // nanoseconds → ms
  return d.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const BLANK_FORM = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  category: "Custom",
};

// --- Unified event shape for display ---
type DisplayEvent =
  | { kind: "fetched"; data: FetchedEventEnriched }
  | { kind: "custom"; data: CalEvent };

export default function EventsPage({ profile: _profile, tier }: Props) {
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [addOpen, setAddOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalEvent | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [markedRead, setMarkedRead] = useState(false);

  const { data: fetchedEvents, isLoading: loadingFetched } = useQuery<
    FetchedEventEnriched[]
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

  // Mark events as read after displaying NEW badges
  useEffect(() => {
    if (!actor || !fetchedEvents || markedRead) return;
    const hasNew = fetchedEvents.some(
      (e) => e.isNew && !e.id?.startsWith("sa-fallback-"),
    );
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
      toast.success("Events refreshed! Check for new upcoming events.");
    },
    onError: (e: Error) =>
      toast.error(`Refresh failed: ${e.message || "Try again later"}`),
  });

  const addEventMut = useMutation({
    mutationFn: (ev: CalEvent) => actor!.addCustomEvent(ev),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customEvents"] });
      setAddOpen(false);
      setEditEvent(null);
      setForm(BLANK_FORM);
      toast.success(editEvent ? "Event updated" : "Event added");
    },
    onError: () => toast.error("Failed to save event"),
  });

  const deleteEventMut = useMutation({
    mutationFn: (id: string) => actor!.deleteCustomEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customEvents"] });
      setEventToDelete(null);
      toast.success("Event removed");
    },
    onError: () => {
      setEventToDelete(null);
      toast.error("Failed to remove event");
    },
  });

  const isLoading = loadingFetched || loadingCustom;

  // Build unified display list — filter out backend fallback events entirely
  const isFallbackEvent = (e: FetchedEventEnriched) =>
    typeof e.id === "string" && e.id.startsWith("sa-fallback-");

  const realFetchedEvents = (fetchedEvents ?? []).filter(
    (e) => !isFallbackEvent(e),
  );

  // True when backend returned only fallbacks (or nothing) — no real live events
  const onlyFallbacks =
    (fetchedEvents ?? []).length > 0 && realFetchedEvents.length === 0;

  const allDisplayEvents: DisplayEvent[] = [
    ...realFetchedEvents.map(
      (e): DisplayEvent => ({ kind: "fetched", data: e }),
    ),
    ...(customEvents ?? []).map(
      (e): DisplayEvent => ({ kind: "custom", data: e }),
    ),
  ];

  // Apply filters
  const filtered = allDisplayEvents.filter((item) => {
    const cat =
      item.kind === "fetched" ? item.data.category : item.data.category;
    const isCustom = item.kind === "custom";

    if (catFilter === "My Events") return isCustom;
    if (catFilter !== "All" && cat !== catFilter) return false;

    if (cityFilter !== "All Cities") {
      if (item.kind === "fetched") {
        const city = item.data.city;
        if (cityFilter === "Other") {
          const knownCities = SA_CITIES.filter(
            (c) => c !== "All Cities" && c !== "Other",
          );
          return !knownCities.some((c) =>
            city.toLowerCase().includes(c.toLowerCase()),
          );
        }
        return city.toLowerCase().includes(cityFilter.toLowerCase());
      }
      // Custom events have no city filter — always include
      return true;
    }
    return true;
  });

  // Sort by date
  const sorted = [...filtered].sort((a, b) => {
    const aDate =
      a.kind === "fetched"
        ? new Date(a.data.date).getTime()
        : Number(a.data.date);
    const bDate =
      b.kind === "fetched"
        ? new Date(b.data.date).getTime()
        : Number(b.data.date);
    return aDate - bDate;
  });

  const newCount = (realFetchedEvents ?? []).filter((e) => e.isNew).length;
  const lastRefresh = getLastRefresh(realFetchedEvents ?? []);

  const openEditDialog = (event: CalEvent) => {
    const d = new Date(Number(event.date));
    setForm({
      title: event.title,
      description: event.description,
      date: d.toISOString().split("T")[0],
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      location: event.location,
      category: event.category,
    });
    setEditEvent(event);
    setAddOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setAddOpen(false);
      setEditEvent(null);
      setForm(BLANK_FORM);
    }
  };

  const handleSaveEvent = () => {
    const dt = new Date(`${form.date}T${form.time || "00:00"}`);
    addEventMut.mutate({
      eventId: editEvent ? editEvent.eventId : crypto.randomUUID(),
      title: form.title,
      description: form.description,
      date: BigInt(dt.getTime()),
      location: form.location,
      category: form.category,
      isUserCreated: true,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Event Calendar</h1>
            {newCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse"
                style={{
                  background: "oklch(0.75 0.18 65 / 0.2)",
                  color: "oklch(0.85 0.18 65)",
                  border: "1px solid oklch(0.75 0.18 65 / 0.5)",
                  boxShadow: "0 0 12px oklch(0.75 0.18 65 / 0.4)",
                }}
                data-ocid="events.new_badge.count"
              >
                ⚡ {newCount} NEW
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Upcoming events that drive demand in your area
          </p>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Last updated: {lastRefresh}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tier >= 3 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-burnt-orange/40 text-burnt-orange hover:bg-burnt-orange/10"
              onClick={() => refreshMut.mutate()}
              disabled={refreshMut.isPending}
              data-ocid="events.refresh.button"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshMut.isPending ? "animate-spin" : ""}`}
              />
              {refreshMut.isPending ? "Refreshing…" : "Refresh"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditEvent(null);
              setForm(BLANK_FORM);
              setAddOpen(true);
            }}
            className="gap-1.5"
            data-ocid="events.add_event.button"
          >
            <Plus className="w-3.5 h-3.5" /> Add Event
          </Button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              catFilter === c
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            data-ocid="events.filter.tab"
          >
            {c}
          </button>
        ))}
      </div>

      {/* City filter chips */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {SA_CITIES.map((city) => (
          <button
            type="button"
            key={city}
            onClick={() => setCityFilter(city)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              cityFilter === city
                ? "bg-burnt-orange/90 text-foreground shadow-sm"
                : "bg-card/60 border border-border/60 text-muted-foreground hover:border-burnt-orange/40 hover:text-foreground"
            }`}
            data-ocid="events.city.filter"
          >
            {city}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-3">
        {isLoading ? (
          ["skel-a", "skel-b", "skel-c"].map((sk) => (
            <div
              key={sk}
              className="rounded-xl p-4 card-warm border border-border animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : onlyFallbacks ? (
          /* Backend returned only hardcoded fallbacks — show friendly placeholder */
          <div
            className="rounded-xl bg-muted/40 border border-border px-5 py-8 text-center"
            data-ocid="events.list.empty_state"
          >
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Events update every Monday. Check back soon for upcoming events
              near you.
            </p>
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="text-center py-14"
            data-ocid="events.list.empty_state"
          >
            <CalendarDays className="w-12 h-12 text-muted-foreground/25 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">
              No events found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
              {catFilter === "My Events"
                ? "Add your own events to plan ahead for high-demand periods."
                : "Events will appear here as they're scheduled. Check back soon or refresh."}
            </p>
          </div>
        ) : (
          sorted.map((item, idx) => (
            <EventCard
              key={item.kind === "fetched" ? item.data.id : item.data.eventId}
              item={item}
              idx={idx}
              onEdit={(e) => openEditDialog(e)}
              onDelete={(e) => setEventToDelete(e)}
              onAddToCalendar={(e) => addToCalendar(e)}
            />
          ))
        )}
      </div>

      {/* Add / Edit Event Dialog */}
      <Dialog open={addOpen} onOpenChange={handleDialogClose}>
        <DialogContent data-ocid="events.add_event.dialog">
          <DialogHeader>
            <DialogTitle>
              {editEvent ? "Edit Event" : "Add Custom Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                placeholder="e.g. Airport Peak Time"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="events.form.title.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="events.form.date.input"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  data-ocid="events.form.time.input"
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g. FNB Stadium, Soweto"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                data-ocid="events.form.location.input"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger data-ocid="events.form.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Sports", "Music", "Airport", "Transport", "Custom"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Why is this event important for drivers?"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                data-ocid="events.form.description.textarea"
              />
            </div>
            <Button
              className="w-full"
              disabled={!form.title || !form.date || addEventMut.isPending}
              onClick={handleSaveEvent}
              data-ocid="events.form.submit_button"
            >
              {addEventMut.isPending
                ? "Saving..."
                : editEvent
                  ? "Save Changes"
                  : "Add Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete event confirmation */}
      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={(open) => {
          if (!open) setEventToDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="events.delete_event.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this event?</AlertDialogTitle>
            <AlertDialogDescription>
              "{eventToDelete?.title}" will be permanently removed. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="events.delete_event.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                eventToDelete && deleteEventMut.mutate(eventToDelete.eventId)
              }
              data-ocid="events.delete_event.confirm_button"
            >
              Remove Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- EventCard ---
interface EventCardProps {
  item: DisplayEvent;
  idx: number;
  onEdit: (e: CalEvent) => void;
  onDelete: (e: CalEvent) => void;
  onAddToCalendar: (e: {
    title: string;
    date: bigint;
    description: string;
    location: string;
  }) => void;
}
function EventCard({
  item,
  idx,
  onEdit,
  onDelete,
  onAddToCalendar,
}: EventCardProps) {
  if (item.kind === "fetched") {
    return (
      <FetchedEventCard
        event={item.data}
        idx={idx}
        onAddToCalendar={onAddToCalendar}
      />
    );
  }
  return (
    <CustomEventCard
      event={item.data}
      idx={idx}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddToCalendar={onAddToCalendar}
    />
  );
}

function FetchedEventCard({
  event,
  idx,
  onAddToCalendar,
}: {
  event: FetchedEventEnriched;
  idx: number;
  onAddToCalendar: (e: {
    title: string;
    date: bigint;
    description: string;
    location: string;
  }) => void;
}) {
  const catColor = categoryColors[event.category] ?? categoryColors.Custom;
  const catIcon = categoryIcons[event.category] ?? (
    <CalendarDays className="w-3 h-3" />
  );

  return (
    <Card
      className="card-warm border-border/70 shadow-card card-hover-lift overflow-hidden"
      data-ocid={`events.list.item.${idx + 1}`}
    >
      {/* Left accent stripe based on driver relevance */}
      <div className="flex">
        <div
          className="w-1 shrink-0 rounded-l-xl"
          style={{ background: "oklch(0.60 0.22 35)" }}
        />
        <CardContent className="pt-4 pb-3 px-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {event.isNew && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse"
                    style={{
                      background: "oklch(0.75 0.18 65 / 0.2)",
                      color: "oklch(0.88 0.20 65)",
                      border: "1px solid oklch(0.75 0.18 65 / 0.6)",
                      boxShadow: "0 0 10px oklch(0.75 0.18 65 / 0.45)",
                    }}
                    data-ocid={`events.new_badge.${idx + 1}`}
                  >
                    ⚡ NEW
                  </span>
                )}
                {/* Tavily opportunity score badge */}
                {event.opportunityScore !== undefined &&
                  event.opportunityScore >= 7 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: "oklch(0.75 0.12 85 / 0.2)",
                        color: "oklch(0.50 0.18 75)",
                        border: "1px solid oklch(0.75 0.12 85 / 0.5)",
                      }}
                      data-ocid={`events.opportunity_badge.${idx + 1}`}
                    >
                      💰 High Earning
                    </span>
                  )}
                <Badge
                  className={`text-xs gap-1 border ${catColor}`}
                  variant="outline"
                >
                  {catIcon}
                  {event.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-border/40 text-muted-foreground/60"
                >
                  SA Events
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm leading-snug">
                {event.title}
              </h3>

              {/* Driver relevance badge */}
              {event.driverRelevance && (
                <div className="mt-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      background: "oklch(0.60 0.22 35 / 0.15)",
                      color: "oklch(0.75 0.18 45)",
                      border: "1px solid oklch(0.60 0.22 35 / 0.35)",
                    }}
                    data-ocid={`events.relevance_badge.${idx + 1}`}
                  >
                    🚗 {event.driverRelevance}
                  </span>
                </div>
              )}

              {/* Date + venue + city */}
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {formatEventDate(event.date)}
                </span>
                {(event.venue || event.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[event.venue, event.city].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-7 whitespace-nowrap"
                onClick={() =>
                  onAddToCalendar({
                    title: event.title,
                    date: BigInt(new Date(event.date).getTime()),
                    description: event.driverRelevance || "",
                    location: [event.venue, event.city]
                      .filter(Boolean)
                      .join(", "),
                  })
                }
                data-ocid={`events.add_to_calendar.button.${idx + 1}`}
              >
                <CalendarDays className="w-3 h-3" /> Save
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function CustomEventCard({
  event,
  idx,
  onEdit,
  onDelete,
  onAddToCalendar,
}: {
  event: CalEvent;
  idx: number;
  onEdit: (e: CalEvent) => void;
  onDelete: (e: CalEvent) => void;
  onAddToCalendar: (e: {
    title: string;
    date: bigint;
    description: string;
    location: string;
  }) => void;
}) {
  const catColor = categoryColors[event.category] ?? categoryColors.Custom;
  const catIcon = categoryIcons[event.category] ?? (
    <CalendarDays className="w-3 h-3" />
  );

  return (
    <Card
      className="shadow-card card-hover-lift overflow-hidden"
      data-ocid={`events.list.item.${idx + 1}`}
    >
      <div className="flex">
        <div className="w-1 shrink-0 rounded-l-xl bg-primary/60" />
        <CardContent className="pt-4 pb-3 px-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <Badge
                  className={`text-xs gap-1 border ${catColor}`}
                  variant="outline"
                >
                  {catIcon}
                  {event.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary/70"
                >
                  My Event
                </Badge>
              </div>
              <h3 className="font-semibold text-sm leading-snug">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {formatCustomDate(event.date)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-7"
                onClick={() => onAddToCalendar(event)}
                data-ocid={`events.add_to_calendar.button.${idx + 1}`}
              >
                <CalendarDays className="w-3 h-3" /> Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1 h-7 text-primary hover:text-primary"
                onClick={() => onEdit(event)}
                data-ocid={`events.edit.button.${idx + 1}`}
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive h-7 hover:text-destructive"
                onClick={() => onDelete(event)}
                data-ocid={`events.delete.button.${idx + 1}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
