/// Types for MoneyDrive's structured analytics event logging system.
/// All types are shared (immutable, serializable) so they can be returned from public query functions.
module {

  /// A single structured analytics event logged by any domain.
  public type AnalyticsEvent = {
    id          : Text;   // unique event ID: "evt_<timestamp>_<counter>"
    category    : Text;   // "api_call" | "nduna_query" | "error" | "user_action" | "performance" | "deal_event" | "lead_event" | "video_event"
    action      : Text;   // specific action: "queryAIAgent", "addTrip", "updatePitchStatus", etc.
    driverId    : Text;   // caller principal as Text, or "system" for admin/system events
    timestamp   : Int;    // Time.now() in nanoseconds
    durationMs  : ?Int;   // response time in ms (Nduna calls, API calls); null if not measured
    success     : Bool;   // did the operation succeed?
    errorMessage : ?Text; // error detail if success=false
    metadata    : Text;   // JSON-like text with extra context (platform, tier, lead score, etc.)
    tier        : ?Text;  // "1" | "2" | "3" | "admin" at time of event; null if unknown
  };

  /// Aggregated summary stats over the full analytics buffer.
  public type AnalyticsSummary = {
    totalEvents       : Nat;
    errorCount        : Nat;
    ndunaQueryCount   : Nat;
    avgNdunaDurationMs : ?Int;   // null when ndunaQueryCount = 0
    topActions        : [(Text, Nat)];  // (actionName, count) sorted desc, top 10
  };
};
