import List    "mo:core/List";
import Map     "mo:core/Map";
import Text    "mo:core/Text";
import Float   "mo:core/Float";
import Nat     "mo:core/Nat";
import Int     "mo:core/Int";
import IntelTypes "../../types/intelligence";

/// Orbis Data Provider — stateless aggregation of anonymised SA market intelligence.
/// Separate from OrbisProvider.mo which handles LLM fallback and PQS.
/// All functions take raw data as parameters; no actor state is touched here.
/// Strict anonymisation rule: sampleSize MUST be >= 10 for any data point returned.
module {

  public type IntelligenceDataPoint = IntelTypes.IntelligenceDataPoint;
  public type IntelligenceResult    = IntelTypes.IntelligenceResult;
  public type IntelligenceQuery     = IntelTypes.IntelligenceQuery;

  // ── Minimum sample size for anonymisation ─────────────────────────────────

  let MIN_SAMPLE_SIZE : Nat = 10;

  // ── Minimal trip/deal record types needed for aggregation ───────────────────

  /// Minimal projection of a trip record used for aggregation only.
  /// Full Trip type lives in main.mo; this avoids a circular import.
  public type TripRecord = {
    platform : Text;
    amount   : Float;
    date     : Int;    // nanosecond timestamp
    notes    : Text;   // may contain zone/area hints
  };

  /// Minimal projection of a deal record used for aggregation only.
  public type DealRecord = {
    status       : Text;   // "closed" | "open" | "rejected" etc.
    industry     : Text;
    pitchedAt    : Int;
    closedAt     : ?Int;
  };

  // ── aggregateSurgeWindows ────────────────────────────────────────────────────

  /// Derive anonymised surge window data points from a slice of trip records.
  /// Groups trips by hour-of-day (0-23), calculates average earnings per group.
  /// Only emits groups with sampleSize >= 10.
  public func aggregateSurgeWindows(trips : [TripRecord]) : [IntelligenceDataPoint] {
    if (trips.size() == 0) { return [] };

    // Accumulate sum and count per hour bucket
    let hourSums   = Map.empty<Nat, Float>();
    let hourCounts = Map.empty<Nat, Nat>();

    for (trip in trips.values()) {
      // Convert nanosecond timestamp to hour-of-day (0-23)
      // nanoseconds -> seconds -> hour
      let seconds : Int = trip.date / 1_000_000_000;
      let hourOfDay : Nat = Int.abs(seconds / 3600) % 24;

      let prevSum   = switch (hourSums.get(hourOfDay))   { case (null) { 0.0 }; case (?v) { v } };
      let prevCount = switch (hourCounts.get(hourOfDay)) { case (null) { 0   }; case (?v) { v } };
      hourSums.add(hourOfDay, prevSum + trip.amount);
      hourCounts.add(hourOfDay, prevCount + 1);
    };

    // Compute overall average to derive surge multiplier
    var totalEarnings : Float = 0.0;
    var totalCount    : Nat   = 0;
    for ((_, sum) in hourSums.entries()) { totalEarnings := totalEarnings + sum };
    for ((_, cnt) in hourCounts.entries()) { totalCount := totalCount + cnt };
    let overallAvg : Float = if (totalCount == 0) { 1.0 } else { totalEarnings / totalCount.toFloat() };

    let results = List.empty<IntelligenceDataPoint>();

    for ((hour, count) in hourCounts.entries()) {
      if (count >= MIN_SAMPLE_SIZE) {
        let sum = switch (hourSums.get(hour)) { case (null) { 0.0 }; case (?v) { v } };
        let avg = sum / count.toFloat();
        let multiplier : Float = if (overallAvg == 0.0) { 1.0 } else { avg / overallAvg };

        // Format hour label as "HH:00-HH+1:00"
        let nextHour = (hour + 1) % 24;
        let hourLabel = _padTwo(hour) # ":00-" # _padTwo(nextHour) # ":00";

        let dp : IntelligenceDataPoint = {
          name = hourLabel;
          value      = _roundFloat(multiplier, 2);
          unit       = "surge_multiplier";
          sampleSize = count;
        };
        results.add(dp);
      };
    };

    // Sort descending by value (highest surge first), take top 5
    let sorted = results.toArray().sort(func(a : IntelligenceDataPoint, b : IntelligenceDataPoint) : { #less; #equal; #greater } {
      if (a.value > b.value) { #less } else if (a.value < b.value) { #greater } else { #equal }
    });
    let cap = if (sorted.size() < 5) { sorted.size() } else { 5 };
    sorted.sliceToArray(0, cap);
  };

  // ── aggregateTopZones ────────────────────────────────────────────────────────

  /// Derive anonymised top earning zone data points.
  /// Parses zone hints from trip notes (looks for "zone:" or known SA area names).
  /// Groups by zone, averages earnings per trip per zone.
  /// Only emits zones with sampleSize >= 10.
  public func aggregateTopZones(trips : [TripRecord]) : [IntelligenceDataPoint] {
    if (trips.size() == 0) { return [] };

    let zoneSums   = Map.empty<Text, Float>();
    let zoneCounts = Map.empty<Text, Nat>();

    for (trip in trips.values()) {
      // Extract zone from notes: look for "zone:Sandton" pattern or known SA suburbs
      let zone = _extractZone(trip.notes, trip.platform);

      let prevSum   = switch (zoneSums.get(zone))   { case (null) { 0.0 }; case (?v) { v } };
      let prevCount = switch (zoneCounts.get(zone)) { case (null) { 0   }; case (?v) { v } };
      zoneSums.add(zone, prevSum + trip.amount);
      zoneCounts.add(zone, prevCount + 1);
    };

    let results = List.empty<IntelligenceDataPoint>();

    for ((zone, count) in zoneCounts.entries()) {
      if (count >= MIN_SAMPLE_SIZE) {
        let sum = switch (zoneSums.get(zone)) { case (null) { 0.0 }; case (?v) { v } };
        let avg = sum / count.toFloat();

        let dp : IntelligenceDataPoint = {
          name       = zone;
          value      = _roundFloat(avg, 2);
          unit       = "avg_rand_per_trip";
          sampleSize = count;
        };
        results.add(dp);
      };
    };

    // Sort descending by avg earnings, take top 5
    let sorted = results.toArray().sort(func(a : IntelligenceDataPoint, b : IntelligenceDataPoint) : { #less; #equal; #greater } {
      if (a.value > b.value) { #less } else if (a.value < b.value) { #greater } else { #equal }
    });
    let cap = if (sorted.size() < 5) { sorted.size() } else { 5 };
    sorted.sliceToArray(0, cap);
  };

  // ── aggregateAdConversionRates ───────────────────────────────────────────────

  /// Derive anonymised advertising deal conversion rates by industry.
  /// Conversion = (closed deals / total pitched) per industry.
  /// Only emits industries with sampleSize >= 10.
  public func aggregateAdConversionRates(deals : [DealRecord]) : [IntelligenceDataPoint] {
    if (deals.size() == 0) { return [] };

    let industryTotal  = Map.empty<Text, Nat>();
    let industryClosed = Map.empty<Text, Nat>();

    for (deal in deals.values()) {
      let industry = if (deal.industry == "") { "General" } else { deal.industry };
      let prevTotal  = switch (industryTotal.get(industry))  { case (null) { 0 }; case (?v) { v } };
      let prevClosed = switch (industryClosed.get(industry)) { case (null) { 0 }; case (?v) { v } };

      industryTotal.add(industry, prevTotal + 1);
      let isClosed = deal.status.toLower() == "closed" or deal.status.toLower() == "won";
      industryClosed.add(industry, if (isClosed) { prevClosed + 1 } else { prevClosed });
    };

    let results = List.empty<IntelligenceDataPoint>();

    for ((industry, total) in industryTotal.entries()) {
      if (total >= MIN_SAMPLE_SIZE) {
        let closed = switch (industryClosed.get(industry)) { case (null) { 0 }; case (?v) { v } };
        let conversionRate : Float = closed.toFloat() / total.toFloat();

        let dp : IntelligenceDataPoint = {
          name       = industry;
          value      = _roundFloat(conversionRate, 4);
          unit       = "conversion_rate";
          sampleSize = total;
        };
        results.add(dp);
      };
    };

    // Sort descending by conversion rate, take top 5
    let sorted = results.toArray().sort(func(a : IntelligenceDataPoint, b : IntelligenceDataPoint) : { #less; #equal; #greater } {
      if (a.value > b.value) { #less } else if (a.value < b.value) { #greater } else { #equal }
    });
    let cap = if (sorted.size() < 5) { sorted.size() } else { 5 };
    sorted.sliceToArray(0, cap);
  };

  // ── aggregateEarningsBenchmarks ──────────────────────────────────────────────

  /// Derive anonymised earnings benchmarks by platform.
  /// Calculates average earnings per trip per platform.
  /// Only emits platforms with sampleSize >= 10.
  public func aggregateEarningsBenchmarks(trips : [TripRecord]) : [IntelligenceDataPoint] {
    if (trips.size() == 0) { return [] };

    let platformSums   = Map.empty<Text, Float>();
    let platformCounts = Map.empty<Text, Nat>();

    for (trip in trips.values()) {
      let platform = if (trip.platform == "") { "Unknown" } else { trip.platform };
      let prevSum   = switch (platformSums.get(platform))   { case (null) { 0.0 }; case (?v) { v } };
      let prevCount = switch (platformCounts.get(platform)) { case (null) { 0   }; case (?v) { v } };
      platformSums.add(platform, prevSum + trip.amount);
      platformCounts.add(platform, prevCount + 1);
    };

    let results = List.empty<IntelligenceDataPoint>();

    for ((platform, count) in platformCounts.entries()) {
      if (count >= MIN_SAMPLE_SIZE) {
        let sum = switch (platformSums.get(platform)) { case (null) { 0.0 }; case (?v) { v } };
        let avg = sum / count.toFloat();

        // Construct label with city hint from platform name (SA context)
        let platformLabel = platform # " South Africa";

        let dp : IntelligenceDataPoint = {
          name = platformLabel;
          value      = _roundFloat(avg, 2);
          unit       = "avg_rand_per_shift";
          sampleSize = count;
        };
        results.add(dp);
      };
    };

    // Sort descending by avg earnings, take top 5
    let sorted = results.toArray().sort(func(a : IntelligenceDataPoint, b : IntelligenceDataPoint) : { #less; #equal; #greater } {
      if (a.value > b.value) { #less } else if (a.value < b.value) { #greater } else { #equal }
    });
    let cap = if (sorted.size() < 5) { sorted.size() } else { 5 };
    sorted.sliceToArray(0, cap);
  };

  // ── validateAnonymisation ────────────────────────────────────────────────────

  /// Validate that an IntelligenceResult meets the anonymisation contract:
  ///   - Every data point has sampleSize >= 10
  ///   - No label contains PII patterns (email, phone, ID numbers, principal-like strings)
  /// Returns true if the result is safe to publish, false otherwise.
  public func validateAnonymisation(data : IntelligenceResult) : Bool {
    for (dp in data.data.values()) {
      // Hard sampleSize check
      if (dp.sampleSize < MIN_SAMPLE_SIZE) { return false };

      // PII pattern detection in names
      let lower = dp.name.toLower();
      // Email pattern: contains "@"
      if (lower.contains(#text "@")) { return false };
      // Phone pattern: 10+ consecutive digits
      if (_hasLongDigitRun(dp.name, 9)) { return false };
      // Principal-like: contains "-" sequences typical of IC principals
      if (_looksLikePrincipal(dp.name)) { return false };
    };
    true;
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Extract a zone/area name from trip notes.
  /// Looks for "zone:NAME" pattern first, then falls back to known SA suburbs.
  private func _extractZone(notes : Text, platform : Text) : Text {
    let lower = notes.toLower();

    // Explicit zone tag
    switch (_splitOnFirst(lower, "zone:")) {
      case (?(_, after)) {
        var zone = "";
        for (c in after.toIter()) {
          let code = c.toNat32();
          if (code == 44 or code == 32 or code == 59 or code == 10) {
            // comma, space, semicolon, newline — stop
          } else {
            zone := zone # Text.fromChar(c);
          };
        };
        if (zone.size() > 2) { return _capitalise(zone) };
      };
      case (null) {};
    };

    // Known SA suburb detection
    let saZones = [
      ("sandton",     "Sandton CBD"),
      ("rosebank",    "Rosebank"),
      ("fourways",    "Fourways"),
      ("midrand",     "Midrand"),
      ("soweto",      "Soweto"),
      ("cape town",   "Cape Town CBD"),
      ("waterfront",  "V&A Waterfront"),
      ("claremont",   "Claremont"),
      ("durban",      "Durban CBD"),
      ("umhlanga",    "Umhlanga"),
      ("pretoria",    "Pretoria CBD"),
      ("centurion",   "Centurion"),
      ("joburg",      "Johannesburg CBD"),
      ("airport",     "OR Tambo Airport"),
    ];
    for ((kw, zoneName) in saZones.values()) {
      if (lower.contains(#text kw)) { return zoneName };
    };

    // Fall back to platform as a proxy for zone grouping
    if (platform != "") { platform # " Network" } else { "Other" };
  };

  /// Capitalise the first character of a text string.
  private func _capitalise(t : Text) : Text {
    let chars = t.toArray();
    if (chars.size() == 0) return t;
    let first = chars[0];
    // Convert lowercase ascii to uppercase by subtracting 32 from char code
    let upperChar : Char = if (first >= 'a' and first <= 'z') {
      let _code = first.toNat32() - 32;
      // Reconstruct char from nat32 via text encoding
      let upperText = Text.fromChar(first).toUpper();
      let upperChars = upperText.toArray();
      if (upperChars.size() > 0) { upperChars[0] } else { first }
    } else {
      first
    };
    Text.fromChar(upperChar) # Text.fromArray(chars.sliceToArray(1, chars.size()));
  };

  /// Returns true if `text` contains a run of >= `minLen` consecutive digit characters.
  private func _hasLongDigitRun(text : Text, minLen : Nat) : Bool {
    var run = 0;
    for (c in text.toIter()) {
      let code = c.toNat32();
      if (code >= 48 and code <= 57) {
        run += 1;
        if (run >= minLen) { return true };
      } else {
        run := 0;
      };
    };
    false;
  };

  /// Returns true if `text` looks like an IC principal (5 groups of 5 chars separated by "-").
  private func _looksLikePrincipal(text : Text) : Bool {
    let parts = text.split(#char '-').toArray();
    if (parts.size() < 4) { return false };
    var allShortAlnum = true;
    for (part in parts.values()) {
      if (part.size() < 3 or part.size() > 8) { allShortAlnum := false };
    };
    allShortAlnum and parts.size() >= 4;
  };

  /// Round a Float to `decimals` decimal places (max 4).
  /// Uses ceil-based rounding to avoid dependency on Float.floor or Float.nearest.
  private func _roundFloat(x : Float, decimals : Nat) : Float {
    var factor : Float = 1.0;
    var d = 0;
    while (d < decimals and d < 4) {
      factor := factor * 10.0;
      d += 1;
    };
    // Truncate via ceil(x - 0.5) for positive round-half-up rounding
    let shifted = x * factor;
    let rounded = Float.ceil(shifted - 0.5);
    rounded / factor;
  };

  /// Zero-pad a Nat to at least 2 digits.
  private func _padTwo(n : Nat) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  /// Split text on the first occurrence of sep.
  private func _splitOnFirst(text : Text, sep : Text) : ?(Text, Text) {
    let textArr = text.toArray();
    let sepArr  = sep.toArray();
    let tLen = textArr.size();
    let sLen = sepArr.size();
    if (sLen == 0 or tLen < sLen) return null;

    var i = 0;
    while (i + sLen <= tLen) {
      var match = true;
      var j = 0;
      while (j < sLen) {
        if (textArr[i + j] != sepArr[j]) { match := false };
        j += 1;
      };
      if (match) {
        let before = Text.fromArray(textArr.sliceToArray(0, i));
        let after  = Text.fromArray(textArr.sliceToArray(i + sLen, tLen));
        return ?(before, after);
      };
      i += 1;
    };
    null;
  };
};
