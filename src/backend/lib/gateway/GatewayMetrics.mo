import List "mo:core/List";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";

/// Gateway performance metrics tracker.
/// Maintains a rolling buffer of the last 100 latency samples.
/// Tracks cache hits/misses, cost savings, per-hour request counts,
/// and latency percentiles (p50/p95/p99).
/// State is injected from main.mo (no internal canister state).
module {

  // ─── Error Types ──────────────────────────────────────────────────────────

  public type MetricsError = {
    /// A counter would have overflowed Nat.
    #Overflow;
    /// Latency value is nonsensical (e.g. max Nat).
    #InvalidLatency;
    /// The hour-key Text is not in "YYYY-MM-DD-HH" format.
    #HourKeyParseError;
  };

  // ─── Data Types ───────────────────────────────────────────────────────────

  /// A single metric entry recording one AI gateway call.
  public type MetricEntry = {
    timestamp   : Int;
    durationMs  : Nat;
    isGateway   : Bool;
    wasCached   : Bool;
    model       : Text;
    error       : ?Text;
  };

  /// Aggregated summary returned by getSummary().
  public type Summary = {
    totalRequests    : Nat;
    gatewayRequests  : Nat;
    directRequests   : Nat;
    cacheHits        : Nat;
    avgGatewayMs     : Nat;
    avgDirectMs      : Nat;
    errorCount       : Nat;
  };

  /// Latency percentile snapshot.
  public type LatencyPercentiles = {
    p50 : Nat;
    p95 : Nat;
    p99 : Nat;
  };

  /// Mutable state injected from main.mo.
  public type State = {
    /// Rolling buffer — oldest entries are evicted when size exceeds MAX_ENTRIES.
    entries : List.List<MetricEntry>;
    /// Separate cache hit / miss counters for accurate hit-rate calculation.
    var cacheHits   : Nat;
    var cacheMisses : Nat;
    /// Cost savings tracked in cents to avoid floating-point drift.
    var openRouterSavedCents   : Nat;
    var elevenlabsSavedCents   : Nat;
    /// Sorted rolling buffer of the last MAX_ENTRIES latency samples (Nat, ms).
    /// Kept sorted via insertion-sort on every recordCall().
    latencySamples : List.List<Nat>;
    /// Per-hour request counts: key = "YYYY-MM-DD-HH", value = request count.
    hourlyRequests : Map.Map<Text, Nat>;
  };

  // ─── Constants ────────────────────────────────────────────────────────────

  /// Max entries to keep in the rolling buffer and latency sample window.
  let MAX_ENTRIES : Nat = 100;

  // ─── Init ─────────────────────────────────────────────────────────────────

  public func initState() : State {
    {
      entries            = List.empty<MetricEntry>();
      var cacheHits      = 0;
      var cacheMisses    = 0;
      var openRouterSavedCents  = 0;
      var elevenlabsSavedCents  = 0;
      latencySamples     = List.empty<Nat>();
      hourlyRequests     = Map.empty<Text, Nat>();
    };
  };

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  /// Insert `val` into a sorted List<Nat> in ascending order (insertion-sort step).
  /// Returns the updated sorted list capped to MAX_ENTRIES.
  func insertSorted(sorted : List.List<Nat>, val : Nat) {
    // Find insertion index.
    var inserted = false;
    var i : Nat = 0;
    let size = sorted.size();
    // Walk forward to find where val fits.
    label search while (i < size) {
      let existing = sorted.at(i);
      if (val <= existing) {
        // Insert before position i.
        // Rebuild by creating a new list with val at position i.
        // Efficient enough for MAX_ENTRIES = 100.
        let arr = sorted.toArray();
        sorted.clear();
        var j : Nat = 0;
        while (j < i) {
          sorted.add(arr[j]);
          j += 1;
        };
        sorted.add(val);
        j := i;
        while (j < arr.size()) {
          sorted.add(arr[j]);
          j += 1;
        };
        inserted := true;
        break search;
      };
      i += 1;
    };
    if (not inserted) {
      sorted.add(val);
    };
    // Evict oldest (lowest) if over capacity — drop first element.
    if (sorted.size() > MAX_ENTRIES) {
      let arr = sorted.toArray();
      sorted.clear();
      var k : Nat = 1;
      while (k < arr.size()) {
        sorted.add(arr[k]);
        k += 1;
      };
    };
  };

  /// Derive the "YYYY-MM-DD-HH" hour key from a nanosecond IC timestamp.
  func toHourKey(timestampNs : Int) : Text {
    let secsUtc : Nat = Int.abs(timestampNs / 1_000_000_000);
    let totalHours : Nat = secsUtc / 3_600;
    let hour : Nat = totalHours % 24;
    let daysSinceEpoch : Nat = secsUtc / 86_400;
    // Gregorian civil date algorithm (same as RateLimiter.toDateString).
    let z : Nat = daysSinceEpoch + 719_468;
    let era : Nat = z / 146_097;
    let doe : Nat = z % 146_097;
    let yoe : Nat = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y : Nat = yoe + era * 400;
    let doy : Nat = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Nat = (5 * doy + 2) / 153;
    let d : Nat = doy - (153 * mp + 2) / 5 + 1;
    let m : Nat = if (mp < 10) { mp + 3 } else { mp - 9 };
    let year : Nat = if (m <= 2) { y + 1 } else { y };

    let yStr = year.toText();
    let mStr = if (m < 10) { "0" # m.toText() } else { m.toText() };
    let dStr = if (d < 10) { "0" # d.toText() } else { d.toText() };
    let hStr = if (hour < 10) { "0" # hour.toText() } else { hour.toText() };
    yStr # "-" # mStr # "-" # dStr # "-" # hStr;
  };

  // ─── Core Recording ───────────────────────────────────────────────────────

  /// Single entry point for recording a gateway call metric.
  ///
  /// - isGateway:      true if routed through Cloudflare AI Gateway.
  /// - cacheHit:       true if Cloudflare served from cache.
  /// - latencyMs:      round-trip time in milliseconds.
  /// - costSavedCents: estimated cost saving in cents (0 if none).
  /// - timestamp:      IC nanosecond timestamp (Time.now()).
  public func recordCall(
    state     : State,
    isGateway : Bool,
    cacheHit  : Bool,
    latencyMs : Nat,
    costSavedCents : Nat,
    timestamp : Int,
  ) {
    // 1. Rolling MetricEntry buffer.
    let entry : MetricEntry = {
      timestamp;
      durationMs = latencyMs;
      isGateway;
      wasCached = cacheHit;
      model = "";    // model tag can be added by callers via record() directly if needed
      error = null;
    };
    state.entries.add(entry);
    if (state.entries.size() > MAX_ENTRIES) {
      let arr = state.entries.toArray();
      state.entries.clear();
      var i : Nat = 1;
      while (i < arr.size()) {
        state.entries.add(arr[i]);
        i += 1;
      };
    };

    // 2. Cache hit / miss counters.
    if (cacheHit) {
      state.cacheHits += 1;
    } else {
      state.cacheMisses += 1;
    };

    // 3. Cost savings (gateway saves go to openRouter bucket by default).
    if (isGateway) {
      state.openRouterSavedCents += costSavedCents;
    };

    // 4. Latency sorted buffer (insertion-sort).
    insertSorted(state.latencySamples, latencyMs);

    // 5. Per-hour request count.
    let key = toHourKey(timestamp);
    let prev = switch (state.hourlyRequests.get(key)) {
      case (null) { 0 };
      case (?n) { n };
    };
    state.hourlyRequests.add(key, prev + 1);
  };

  /// Record a full MetricEntry (used by existing callers in the codebase).
  /// Delegates to recordCall so all state stays in sync.
  public func record(state : State, entry : MetricEntry) {
    recordCall(
      state,
      entry.isGateway,
      entry.wasCached,
      entry.durationMs,
      0,
      entry.timestamp,
    );
  };

  // ─── Query Methods ────────────────────────────────────────────────────────

  /// Returns cache hit rate as a Float in [0.0, 1.0].
  /// Returns 0.0 if no requests have been recorded.
  public func getCacheHitRate(state : State) : Float {
    let total = state.cacheHits + state.cacheMisses;
    if (total == 0) { return 0.0 };
    state.cacheHits.toFloat() / total.toFloat();
  };

  /// Returns the top 5 busiest hours sorted by request count (descending).
  /// Each entry is (hourKey, requestCount).
  public func getTopHours(state : State) : [(Text, Nat)] {
    let arr = state.hourlyRequests.entries().toArray();
    // Sort descending by count.
    let sorted = arr.sort(func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
      // Reverse order: higher count first.
      if (a.1 > b.1) { #less }
      else if (a.1 < b.1) { #greater }
      else { #equal };
    });
    if (sorted.size() <= 5) {
      sorted;
    } else {
      sorted.sliceToArray(0, 5);
    };
  };

  /// Returns p50, p95, and p99 latency percentiles from the sorted sample buffer.
  /// Returns {p50=0; p95=0; p99=0} if no samples exist.
  public func getLatencyPercentiles(state : State) : LatencyPercentiles {
    let size = state.latencySamples.size();
    if (size == 0) { return { p50 = 0; p95 = 0; p99 = 0 } };

    func percentileIndex(pct : Float) : Nat {
      // Nearest-rank method.
      let idx = Int.abs(Float.ceil(pct / 100.0 * size.toFloat()).toInt());
      let capped = if (idx == 0) { 1 } else { idx };
      if (capped > size) { size - 1 } else { capped - 1 };
    };

    let p50 = state.latencySamples.at(percentileIndex(50.0));
    let p95 = state.latencySamples.at(percentileIndex(95.0));
    let p99 = state.latencySamples.at(percentileIndex(99.0));
    { p50; p95; p99 };
  };

  /// Return the last `limit` metric entries (most recent last in buffer order).
  public func getRecentEntries(state : State, limit : Nat) : [MetricEntry] {
    let arr = state.entries.toArray();
    let total = arr.size();
    if (total == 0) { return [] };
    let take = if (limit > total) { total } else { limit };
    let start = total - take : Nat;
    arr.sliceToArray(start, total);
  };

  /// Compute and return an aggregated summary over all buffered entries.
  public func getSummary(state : State) : Summary {
    let arr = state.entries.toArray();
    let total = arr.size();
    if (total == 0) {
      return {
        totalRequests = 0; gatewayRequests = 0; directRequests = 0;
        cacheHits = 0; avgGatewayMs = 0; avgDirectMs = 0; errorCount = 0;
      };
    };

    var gatewayRequests : Nat = 0;
    var cacheHits       : Nat = 0;
    var errorCount      : Nat = 0;
    var sumGatewayMs    : Nat = 0;
    var sumDirectMs     : Nat = 0;
    var directRequests  : Nat = 0;

    for (entry in arr.values()) {
      if (entry.isGateway) {
        gatewayRequests += 1;
        sumGatewayMs += entry.durationMs;
      } else {
        directRequests += 1;
        sumDirectMs += entry.durationMs;
      };
      if (entry.wasCached) { cacheHits += 1 };
      switch (entry.error) {
        case (?_) { errorCount += 1 };
        case (null) {};
      };
    };

    let avgGatewayMs = if (gatewayRequests == 0) { 0 } else { sumGatewayMs / gatewayRequests };
    let avgDirectMs  = if (directRequests == 0)  { 0 } else { sumDirectMs / directRequests };

    {
      totalRequests = total;
      gatewayRequests;
      directRequests;
      cacheHits;
      avgGatewayMs;
      avgDirectMs;
      errorCount;
    };
  };
};
