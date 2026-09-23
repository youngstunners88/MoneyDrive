import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Nat "mo:core/Nat";

/// Per-driver daily query rate limiter.
/// Tier-based limits: Tier 1 = 20/day, Tier 2 = 50/day, Tier 3 = 200/day.
/// State (buckets + lastResetDate) lives in main.mo actor vars and is passed in.
/// This module is pure logic — no canister state access.
module {

  // ─── Error Types ──────────────────────────────────────────────────────────

  /// Errors returned by the rate limiter.
  public type RateLimitError = {
    /// Caller has exhausted their daily allowance.
    #LimitExceeded : { tier : Nat; resetAtMidnight : Text };
    /// Tier value is out of bounds (must be 1–3).
    #InvalidTier;
  };

  // ─── Data Types ───────────────────────────────────────────────────────────

  /// Per-principal daily usage bucket.
  public type DailyBucket = {
    /// Number of queries made today.
    count : Nat;
    /// Start-of-current-day epoch milliseconds (UTC midnight).
    dayStartMs : Int;
  };

  /// Mutable state injected from main.mo.
  public type State = {
    /// Principal (as Text) → DailyBucket.
    buckets : Map.Map<Text, DailyBucket>;
    /// Last reset date stored as ISO date string "YYYY-MM-DD".
    var lastResetDate : Text;
  };

  // ─── Tier Limits ──────────────────────────────────────────────────────────

  /// Daily limits indexed by (tier - 1): [Tier1, Tier2, Tier3].
  let TIER_LIMITS : [Nat] = [20, 50, 200];

  // ─── Init ─────────────────────────────────────────────────────────────────

  public func initState() : State {
    {
      buckets = Map.empty<Text, DailyBucket>();
      var lastResetDate = "";
    };
  };

  // ─── Pure Helpers ─────────────────────────────────────────────────────────

  /// Return the daily limit for a given tier (1-indexed).
  /// Returns 20 for any tier < 1; 200 for any tier > 3 (treat as Tier 3).
  public func limitForTier(tier : Nat) : Nat {
    if (tier == 0) { return TIER_LIMITS[0] };
    let idx = if (tier > 3) { 2 } else { (tier - 1 : Nat) };
    TIER_LIMITS[idx];
  };

  /// Compute the UTC midnight epoch milliseconds for a given millisecond timestamp.
  /// day boundary = currentTimeMs - (currentTimeMs mod 86_400_000)
  public func dayStartMs(currentTimeMs : Int) : Int {
    let ms : Int = 86_400_000;
    currentTimeMs - Int.rem(currentTimeMs, ms);
  };

  /// Reset a bucket if it belongs to a previous day; otherwise return as-is.
  /// Pure function — no mutation.
  public func resetIfNewDay(bucket : DailyBucket, currentTimeMs : Int) : DailyBucket {
    let start = dayStartMs(currentTimeMs);
    if (bucket.dayStartMs < start) {
      { count = 0; dayStartMs = start };
    } else {
      bucket;
    };
  };

  /// Format a UTC reset time as "HH:MM UTC" given an epoch-millisecond day-start.
  /// The reset always occurs at the next UTC midnight (00:00 UTC).
  func formatResetTime(currentDayStartMs : Int) : Text {
    // Next midnight is always 24h after the current day start.
    ignore currentDayStartMs;
    "00:00 UTC";
  };

  /// Convert a nanosecond IC timestamp to an ISO date string "YYYY-MM-DD".
  /// Uses UTC (no timezone offset) — consistent for daily reset boundary.
  public func toDateString(nowNs : Int) : Text {
    let secsUtc : Nat = Int.abs(nowNs / 1_000_000_000);
    let daysSinceEpoch : Nat = secsUtc / 86_400;
    // Gregorian civil date algorithm
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
    yStr # "-" # mStr # "-" # dStr;
  };

  // ─── Core Operations ──────────────────────────────────────────────────────

  /// Check if caller is within their tier limit, then increment the counter.
  ///
  /// Returns:
  ///   #ok(remaining)     — call is allowed; remaining = queries left after this one.
  ///   #err(#LimitExceeded) — daily cap reached.
  ///   #err(#InvalidTier)   — tier is 0 (unauthenticated / unset profile).
  ///
  /// currentTimeMs: current time in milliseconds (Time.now() / 1_000_000).
  public func checkAndIncrement(
    principal : Principal,
    tier : Nat,
    buckets : Map.Map<Text, DailyBucket>,
    currentTimeMs : Int,
  ) : { #ok : Nat; #err : RateLimitError } {
    // Tier 0 is not a valid subscription tier for rate-limiting purposes.
    if (tier == 0) { return #err(#InvalidTier) };

    let limit = limitForTier(tier);
    let key = principal.toText();
    let start = dayStartMs(currentTimeMs);

    // Fetch and possibly reset bucket.
    let bucket : DailyBucket = switch (buckets.get(key)) {
      case (null) { { count = 0; dayStartMs = start } };
      case (?b) { resetIfNewDay(b, currentTimeMs) };
    };

    if (bucket.count >= limit) {
      return #err(#LimitExceeded {
        tier;
        resetAtMidnight = formatResetTime(bucket.dayStartMs);
      });
    };

    // Increment and persist.
    let updated : DailyBucket = { bucket with count = bucket.count + 1 };
    buckets.add(key, updated);
    #ok(limit - updated.count);
  };

  /// Return how many queries the caller has remaining today for their tier.
  /// Returns 0 for invalid tier; does NOT modify state.
  public func getRemainingQueries(
    principal : Principal,
    tier : Nat,
    buckets : Map.Map<Text, DailyBucket>,
    currentTimeMs : Int,
  ) : Nat {
    if (tier == 0) { return 0 };
    let limit = limitForTier(tier);
    let key = principal.toText();
    let bucket : DailyBucket = switch (buckets.get(key)) {
      case (null) { { count = 0; dayStartMs = dayStartMs(currentTimeMs) } };
      case (?b) { resetIfNewDay(b, currentTimeMs) };
    };
    if (bucket.count >= limit) { 0 } else { limit - bucket.count };
  };

  /// Admin-only manual reset — clears all buckets and resets the date string.
  public func resetAll(state : State, nowNs : Int) {
    state.buckets.clear();
    state.lastResetDate := toDateString(nowNs);
  };
};
