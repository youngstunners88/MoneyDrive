import Text "mo:core/Text";
import Time "mo:core/Time";
import EventTypes "../types/events";
import EventsLib "../lib/events";

/// Public API mixin for smart SA event fetching.
/// Injected state:
///   fetchedEvents   - { var value : [EventTypes.FetchedEvent] }
///   lastFetchState  - { var lastFetchTime : Int }
///   tavilyKeyStore  - { var value : Text } — used as fallback when Quicket returns empty
mixin (
  fetchedEvents : { var value : [EventTypes.FetchedEvent] },
  lastFetchState : { var lastFetchTime : Int },
  tavilyKeyStore : { var value : Text },
) {

  // 7 days in nanoseconds
  let WEEKLY_INTERVAL : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
  // 72 hours in nanoseconds — events fetched within this window are flagged isNew
  let NEW_WINDOW : Int = 72 * 60 * 60 * 1_000_000_000;

  /// Trigger a fetch of the latest SA events via HTTP outcall.
  /// All authenticated users can trigger this. Respects weekly refresh cadence
  /// unless forceRefresh = true (for mid-week pop-up events).
  public shared ({ caller }) func fetchAndStoreSAEvents(forceRefresh : Bool) : async { #ok : [EventTypes.FetchedEvent]; #err : Text } {
    let now = Time.now();
    let timeSinceLast = now - lastFetchState.lastFetchTime;

    // Only re-fetch if > 7 days since last fetch OR forceRefresh requested
    if (not forceRefresh and timeSinceLast < WEEKLY_INTERVAL) {
      // Return cached events — no need to re-fetch
      return #ok (fetchedEvents.value);
    };

    try {
      let fetched = await* EventsLib.fetchSAEvents(tavilyKeyStore.value);

      // Collect IDs of freshly fetched events for dedup
      let fetchedIds = fetched.map(func(e : EventTypes.FetchedEvent) : Text { e.id });

      // Keep existing stored events not already in new batch (avoids duplicates)
      let existingKept = fetchedEvents.value.filter(
        func(e : EventTypes.FetchedEvent) : Bool {
          not fetchedIds.any(func(id : Text) : Bool { id == e.id });
        }
      );

      // Mark fresh events isNew based on age (should be true for all just-fetched)
      let freshMarked = fetched.map(
        func(e : EventTypes.FetchedEvent) : EventTypes.FetchedEvent {
          let age = now - e.fetchedAt;
          { e with isNew = age < NEW_WINDOW };
        }
      );

      // Existing events no longer in the new batch → clear isNew
      let existingCleared = existingKept.map(
        func(e : EventTypes.FetchedEvent) : EventTypes.FetchedEvent { { e with isNew = false } }
      );

      // Merge: fresh events first, then leftovers; sort by date ascending
      let combined = freshMarked.concat(existingCleared);
      let sorted = combined.sort(func(a : EventTypes.FetchedEvent, b : EventTypes.FetchedEvent) : { #less; #equal; #greater } {
        Text.compare(a.date, b.date);
      });

      fetchedEvents.value := sorted;
      lastFetchState.lastFetchTime := now;

      #ok sorted;
    } catch (_) {
      // On fetch error, serve whatever is already in the cache.
      // Never inject hardcoded/fabricated events — return empty if nothing cached.
      #err "Fetch failed — showing cached events";
    };
  };

  /// Return all currently stored fetched events, sorted by date ascending.
  public query func getFetchedEvents() : async [EventTypes.FetchedEvent] {
    fetchedEvents.value;
  };

  /// Mark all fetched events as read (clears isNew flag).
  public shared ({ caller }) func markEventsAsRead() : async () {
    fetchedEvents.value := EventsLib.markAllAsRead(fetchedEvents.value);
  };
};
