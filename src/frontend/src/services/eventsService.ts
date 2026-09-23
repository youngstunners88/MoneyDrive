/**
 * eventsService — SA event data formatting, NEW badge detection, and city filter logic.
 * Works with FetchedEvent and CalEvent types from the backend.
 */

import type { Event as CalEvent, FetchedEvent } from "../backend";

export type DisplayEvent =
  | { kind: "fetched"; data: FetchedEvent }
  | { kind: "custom"; data: CalEvent };

export const SA_CITIES = [
  "All Cities",
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
  "Bloemfontein",
  "Other",
] as const;

export type SACity = (typeof SA_CITIES)[number];

export const EVENT_CATEGORIES = [
  "All",
  "Sports",
  "Music",
  "Airport",
  "Transport",
  "My Events",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/**
 * Format a fetched event date string (ISO or YYYY-MM-DD) for display.
 */
export function formatFetchedEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a custom event date (bigint timestamp) for display.
 */
export function formatCustomEventDate(ts: bigint): string {
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

/**
 * Get the last refresh timestamp string from a list of fetched events.
 */
export function getLastRefreshLabel(events: FetchedEvent[]): string | null {
  if (!events.length) return null;
  const latest = events.reduce((max, e) =>
    Number(e.fetchedAt) > Number(max.fetchedAt) ? e : max,
  );
  const d = new Date(Number(latest.fetchedAt) / 1_000_000); // nanoseconds → ms
  return d.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Apply category and city filters to a list of display events.
 */
export function filterEvents(
  events: DisplayEvent[],
  catFilter: EventCategory,
  cityFilter: SACity,
): DisplayEvent[] {
  return events.filter((item) => {
    const isCustom = item.kind === "custom";
    if (catFilter === "My Events") return isCustom;
    if (catFilter !== "All" && item.data.category !== catFilter) return false;
    if (cityFilter !== "All Cities" && item.kind === "fetched") {
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
    return true;
  });
}

/**
 * Sort display events by date ascending.
 */
export function sortEventsByDate(events: DisplayEvent[]): DisplayEvent[] {
  return [...events].sort((a, b) => {
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
}

/**
 * Generate an ICS calendar file string for a given event.
 */
export function generateICS(event: {
  title: string;
  date: bigint;
  description: string;
  location: string;
}): string {
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
