import List   "mo:core/List";
import Time   "mo:core/Time";
import Int    "mo:core/Int";
import Nat    "mo:core/Nat";
import Text   "mo:core/Text";
import AnalyticsTypes "../types/analytics";

/// Pure-computation analytics event logging module.
/// State (the List buffer and ID counter) lives in main.mo and is passed into each call.
/// This keeps the module stateless and avoids cross-compilation-unit mutable-state issues.
module {

  // ── State type ─────────────────────────────────────────────────────────────

  /// Opaque state bundle stored as actor-level vars in main.mo.
  public type State = {
    events    : List.List<AnalyticsTypes.AnalyticsEvent>;
    var nextId : Nat;
  };

  /// Initialise a fresh analytics state (called once at actor init time).
  public func initState() : State {
    {
      events    = List.empty<AnalyticsTypes.AnalyticsEvent>();
      var nextId = 0;
    };
  };

  // ── Ring-buffer cap ────────────────────────────────────────────────────────

  let MAX_EVENTS : Nat = 10_000;

  // ── Core logging function ──────────────────────────────────────────────────

  /// Append a new event to the analytics buffer.
  /// Drops the oldest events when the buffer exceeds MAX_EVENTS.
  public func logEvent(
    state        : State,
    category     : Text,
    action       : Text,
    driverId     : Text,
    durationMs   : ?Int,
    success      : Bool,
    errorMessage : ?Text,
    metadata     : Text,
    tier         : ?Text,
  ) {
    let now = Time.now();
    state.nextId += 1;
    let id = "evt_" # now.toText() # "_" # state.nextId.toText();

    let event : AnalyticsTypes.AnalyticsEvent = {
      id;
      category;
      action;
      driverId;
      timestamp    = now;
      durationMs;
      success;
      errorMessage;
      metadata;
      tier;
    };

    state.events.add(event);

    // Ring-buffer cap: if over MAX_EVENTS, keep only the last MAX_EVENTS elements
    if (state.events.size() > MAX_EVENTS) {
      let size  = state.events.size();
      let start = size - MAX_EVENTS : Nat;
      let arr   = state.events.sliceToArray(start, size);
      state.events.clear();
      state.events.addAll(arr.values());
    };
  };

  // ── Query helpers ──────────────────────────────────────────────────────────

  /// Returns the last `limit` events, newest first.
  public func getRecentEvents(state : State, limit : Nat) : [AnalyticsTypes.AnalyticsEvent] {
    let arr  = state.events.toArray();
    let size = arr.size();
    let take = if (limit < size) { limit } else { size };
    // Reverse to get newest-first, then take `take` items
    let reversed = arr.reverse();
    reversed.sliceToArray(0, take);
  };

  /// Returns the last `limit` events for a specific driver (newest first).
  public func getEventsByDriver(state : State, driverId : Text, limit : Nat) : [AnalyticsTypes.AnalyticsEvent] {
    let arr      = state.events.toArray();
    let filtered = arr.filter(func(e : AnalyticsTypes.AnalyticsEvent) : Bool { e.driverId == driverId });
    let size     = filtered.size();
    let take     = if (limit < size) { limit } else { size };
    let reversed = filtered.reverse();
    reversed.sliceToArray(0, take);
  };

  /// Returns the last `limit` events for a specific category (newest first).
  public func getEventsByCategory(state : State, category : Text, limit : Nat) : [AnalyticsTypes.AnalyticsEvent] {
    let arr      = state.events.toArray();
    let filtered = arr.filter(func(e : AnalyticsTypes.AnalyticsEvent) : Bool { e.category == category });
    let size     = filtered.size();
    let take     = if (limit < size) { limit } else { size };
    let reversed = filtered.reverse();
    reversed.sliceToArray(0, take);
  };

  /// Returns the last `limit` error events (success=false), newest first.
  public func getErrorEvents(state : State, limit : Nat) : [AnalyticsTypes.AnalyticsEvent] {
    let arr      = state.events.toArray();
    let filtered = arr.filter(func(e : AnalyticsTypes.AnalyticsEvent) : Bool { not e.success });
    let size     = filtered.size();
    let take     = if (limit < size) { limit } else { size };
    let reversed = filtered.reverse();
    reversed.sliceToArray(0, take);
  };

  /// Computes aggregated summary stats over the full buffer.
  public func getAnalyticsSummary(state : State) : AnalyticsTypes.AnalyticsSummary {
    let arr            = state.events.toArray();
    let total          = arr.size();
    var errorCount     = 0;
    var ndunaCount     = 0;
    var totalNdunaNs : Int = 0;
    // Action frequency map (simple linear scan — acceptable at ≤10k events)
    // We'll build a sorted top-10 list from an Array of (action, count) pairs.
    var actionCounts : [(Text, Nat)] = [];

    for (ev in arr.values()) {
      if (not ev.success) { errorCount += 1 };
      if (ev.category == "nduna_query") {
        ndunaCount += 1;
        switch (ev.durationMs) {
          case (?ms) { totalNdunaNs := totalNdunaNs + ms };
          case (null) {};
        };
      };
      // Update action count
      var found = false;
      actionCounts := actionCounts.map<(Text, Nat), (Text, Nat)>(func(pair : (Text, Nat)) : (Text, Nat) {
        let (a, c) = pair;
        if (a == ev.action) { found := true; (a, c + 1) } else { (a, c) }
      });
      if (not found) {
        actionCounts := actionCounts.concat([(ev.action, 1)]);
      };
    };

    let avgNdunaDuration : ?Int = if (ndunaCount == 0) {
      null
    } else {
      ?(totalNdunaNs / ndunaCount)
    };

    // Sort action counts descending and take top 10
    let sorted = actionCounts.sort(func(pa : (Text, Nat), pb : (Text, Nat)) : { #less; #equal; #greater } {
      let (_, ca) = pa;
      let (_, cb) = pb;
      if (ca > cb) { #less } else if (ca < cb) { #greater } else { #equal }
    });
    let topTake = if (sorted.size() < 10) { sorted.size() } else { 10 };
    let topActions = sorted.sliceToArray(0, topTake);

    {
      totalEvents        = total;
      errorCount;
      ndunaQueryCount    = ndunaCount;
      avgNdunaDurationMs = avgNdunaDuration;
      topActions;
    };
  };

  /// Remove all events older than `olderThanTimestamp` nanoseconds.
  public func clearOldEvents(state : State, olderThanTimestamp : Int) {
    let arr     = state.events.toArray();
    let kept    = arr.filter(func(e : AnalyticsTypes.AnalyticsEvent) : Bool {
      e.timestamp >= olderThanTimestamp
    });
    state.events.clear();
    state.events.addAll(kept.values());
  };

  // ── Nduna context builder ──────────────────────────────────────────────────

  /// Build a concise analytics context string to inject into Nduna's prompt
  /// when the driver's message contains analytics-related keywords.
  public func buildAnalyticsContext(events : [AnalyticsTypes.AnalyticsEvent]) : Text {
    let size = events.size();
    if (size == 0) { return "" };

    var tripCount  = 0;
    var expCount   = 0;
    var fuelCount  = 0;
    var ndunaCount = 0;
    var errCount   = 0;
    var totalNdunaMs : Int = 0;

    for (ev in events.values()) {
      switch (ev.action) {
        case ("trip_added")    { tripCount  += 1 };
        case ("expense_added") { expCount   += 1 };
        case ("fuel_added")    { fuelCount  += 1 };
        case ("queryAIAgent")  {
          ndunaCount += 1;
          switch (ev.durationMs) {
            case (?ms) { totalNdunaMs := totalNdunaMs + ms };
            case (null) {};
          };
        };
        case (_) {};
      };
      if (not ev.success) { errCount += 1 };
    };

    let avgNdunaText = if (ndunaCount == 0) { "" } else {
      let avgMs = totalNdunaMs / ndunaCount;
      " (avg " # avgMs.toText() # "ms)"
    };

    let errText = if (errCount == 0) { "" } else {
      ", " # errCount.toText() # " error(s)"
    };

    "\n\nRECENT ACTIVITY (last " # size.toText() # " events):\n" #
    "- Trips logged: " # tripCount.toText() # "\n" #
    "- Expenses logged: " # expCount.toText() # "\n" #
    "- Fuel logs: " # fuelCount.toText() # "\n" #
    "- Nduna queries: " # ndunaCount.toText() # avgNdunaText # errText # "\n";
  };

  /// Returns true if `msg` contains analytics-related keywords Nduna should respond to.
  public func isAnalyticsQuery(msg : Text) : Bool {
    let lower = msg.toLower();
    lower.contains(#text "errors") or
    lower.contains(#text "performance") or
    lower.contains(#text "how many trips") or
    lower.contains(#text "what went wrong") or
    lower.contains(#text "analytics") or
    lower.contains(#text "how is the app") or
    lower.contains(#text "how is moneydriver") or
    lower.contains(#text "activity") or
    lower.contains(#text "recent actions");
  };
};
