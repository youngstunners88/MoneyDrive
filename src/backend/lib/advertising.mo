import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AdvTypes "../types/advertising";

/// Domain logic for MoneyDrive Layer 3: recommendation feedback loop and advertising deal pipeline.
/// All state is owned by the actor (main.mo) and injected into this module via function parameters.
/// This module is stateless — it operates on the maps passed in.
module {
  // ── Public type aliases ─────────────────────────────────────────────────────

  public type NdunaRecommendationV2 = AdvTypes.NdunaRecommendationV2;
  public type RecommendationOutcomeV2 = AdvTypes.RecommendationOutcomeV2;
  public type CompanyPitch = AdvTypes.CompanyPitch;
  public type PitchStatus = AdvTypes.PitchStatus;
  public type OutcomeStats = AdvTypes.OutcomeStats;
  public type MonthlyInsights = AdvTypes.MonthlyInsights;
  public type DriverAction = AdvTypes.DriverAction;

  // ── Recommendation V2 functions ────────────────────────────────────────────

  /// Store a recommendation. Returns the ID on the stored rec.
  public func logRecommendationV2(
    recommendations : Map.Map<Text, NdunaRecommendationV2>,
    rec : NdunaRecommendationV2,
  ) : Text {
    recommendations.add(rec.id, rec);
    rec.id;
  };

  /// Record the outcome of a recommendation by its Text ID.
  public func recordOutcomeV2(
    outcomes : Map.Map<Text, RecommendationOutcomeV2>,
    outcome : RecommendationOutcomeV2,
  ) : Bool {
    outcomes.add(outcome.recommendationId, outcome);
    true;
  };

  /// Get a single outcome by recommendation ID.
  public func getOutcomeV2(
    outcomes : Map.Map<Text, RecommendationOutcomeV2>,
    recommendationId : Text,
  ) : ?RecommendationOutcomeV2 {
    outcomes.get(recommendationId);
  };

  /// Get all outcomes for a given driver.
  public func getDriverOutcomesV2(
    outcomes : Map.Map<Text, RecommendationOutcomeV2>,
    driverId : Text,
  ) : [RecommendationOutcomeV2] {
    let result = List.empty<RecommendationOutcomeV2>();
    for ((_, outcome) in outcomes.entries()) {
      if (outcome.driverId == driverId) {
        result.add(outcome);
      };
    };
    result.toArray();
  };

  /// Get all outcomes for a driver in a given calendar year/month.
  /// Month is 1-indexed (1 = January, 12 = December).
  /// Filters by comparing recordedAt nanoseconds against month boundaries.
  public func getMonthOutcomes(
    outcomes : Map.Map<Text, RecommendationOutcomeV2>,
    driverId : Text,
    year : Nat,
    month : Nat,
  ) : [RecommendationOutcomeV2] {
    let (startNs, endNs) = monthBoundaries(year, month);
    let result = List.empty<RecommendationOutcomeV2>();
    for ((_, outcome) in outcomes.entries()) {
      if (
        outcome.driverId == driverId and
        outcome.recordedAt >= startNs and
        outcome.recordedAt < endNs
      ) {
        result.add(outcome);
      };
    };
    result.toArray();
  };

  // ── Company Pitch CRUD ─────────────────────────────────────────────────────

  /// Create a new pitch. Returns the pitch ID.
  public func createPitch(
    pitches : Map.Map<Text, CompanyPitch>,
    pitch : CompanyPitch,
  ) : Text {
    pitches.add(pitch.id, pitch);
    pitch.id;
  };

  /// Get a pitch by ID.
  public func getPitch(
    pitches : Map.Map<Text, CompanyPitch>,
    id : Text,
  ) : ?CompanyPitch {
    pitches.get(id);
  };

  /// Get all pitches for a driver.
  public func getDriverPitches(
    pitches : Map.Map<Text, CompanyPitch>,
    driverId : Text,
  ) : [CompanyPitch] {
    let result = List.empty<CompanyPitch>();
    for ((_, pitch) in pitches.entries()) {
      if (pitch.driverId == driverId) {
        result.add(pitch);
      };
    };
    result.toArray();
  };

  /// Replace a pitch record wholesale (full update). Returns true if pitch existed.
  public func updatePitch(
    pitches : Map.Map<Text, CompanyPitch>,
    id : Text,
    updated : CompanyPitch,
  ) : Bool {
    switch (pitches.get(id)) {
      case null { false };
      case (?_) {
        pitches.add(id, updated);
        true;
      };
    };
  };

  /// Delete a pitch by ID. Returns true if it existed.
  public func deletePitch(
    pitches : Map.Map<Text, CompanyPitch>,
    id : Text,
  ) : Bool {
    switch (pitches.get(id)) {
      case null { false };
      case (?_) {
        pitches.remove(id);
        true;
      };
    };
  };

  /// Update only the status of a pitch and bump updatedAt. Returns true if pitch existed.
  public func updatePitchStatus(
    pitches : Map.Map<Text, CompanyPitch>,
    id : Text,
    status : PitchStatus,
  ) : Bool {
    switch (pitches.get(id)) {
      case null { false };
      case (?existing) {
        let now64 = Int.abs(Time.now()).toNat64();
        pitches.add(id, { existing with status; updatedAt = now64 });
        true;
      };
    };
  };

  /// Get all pitches for a driver filtered by status.
  public func getPitchesByStatus(
    pitches : Map.Map<Text, CompanyPitch>,
    driverId : Text,
    status : PitchStatus,
  ) : [CompanyPitch] {
    let result = List.empty<CompanyPitch>();
    for ((_, pitch) in pitches.entries()) {
      if (pitch.driverId == driverId and pitchStatusEq(pitch.status, status)) {
        result.add(pitch);
      };
    };
    result.toArray();
  };

  // ── Intelligence functions ─────────────────────────────────────────────────

  /// Generate follow-up reminder strings for a driver's open pitches.
  /// Rules:
  ///   - #sent: remind after 3 days since pitchDate
  ///   - #interested: remind after 7 days since lastFollowUp (or pitchDate if no follow-up)
  ///   - #negotiating: always return highest-priority reminder
  public func generateFollowUpReminders(
    pitches : Map.Map<Text, CompanyPitch>,
    driverId : Text,
    now : Nat64,
  ) : [Text] {
    let threeDays : Nat64 = 3 * 86_400_000_000_000;
    let sevenDays : Nat64 = 7 * 86_400_000_000_000;
    let reminders = List.empty<Text>();
    for ((_, pitch) in pitches.entries()) {
      if (pitch.driverId == driverId) {
        switch (pitch.status) {
          case (#sent) {
            if (now >= pitch.pitchDate and now - pitch.pitchDate >= threeDays) {
              reminders.add(
                "Check in with " # pitch.companyName # " — it's been 3 days since you sent your pitch."
              );
            };
          };
          case (#interested) {
            let refDate = switch (pitch.lastFollowUp) {
              case (?d) { d };
              case null { pitch.pitchDate };
            };
            if (now >= refDate and now - refDate >= sevenDays) {
              reminders.add(
                pitch.companyName # " is interested — follow up within 24 hours!"
              );
            };
          };
          case (#negotiating) {
            reminders.add(
              pitch.companyName # " is negotiating. This is your highest priority — close this deal!"
            );
          };
          case (_) {};
        };
      };
    };
    reminders.toArray();
  };

  /// Compute aggregate outcome statistics for a driver in a given month.
  public func getOutcomeStats(
    outcomes : Map.Map<Text, RecommendationOutcomeV2>,
    recommendations : Map.Map<Text, NdunaRecommendationV2>,
    driverId : Text,
    year : Nat,
    month : Nat,
  ) : OutcomeStats {
    let monthOutcomes = getMonthOutcomes(outcomes, driverId, year, month);

    var total = 0;
    var tried = 0;
    var skipped = 0;
    var partial = 0;
    var totalRevenue = 0;
    var triedWithRevenue = 0;
    var surgeTried = 0;
    var surgeTotal = 0;

    for (outcome in monthOutcomes.values()) {
      total += 1;
      switch (outcome.action) {
        case (#tried) {
          tried += 1;
          switch (outcome.revenue) {
            case (?r) {
              totalRevenue += r;
              triedWithRevenue += 1;
            };
            case null {};
          };
        };
        case (#skipped) { skipped += 1 };
        case (#partial) { partial += 1 };
      };
      // Check if this is a surge recommendation for accuracy calculation
      switch (recommendations.get(outcome.recommendationId)) {
        case (?rec) {
          switch (rec.recommendationType) {
            case (#surge) {
              surgeTotal += 1;
              switch (outcome.action) {
                case (#tried) { surgeTried += 1 };
                case (_) {};
              };
            };
            case (_) {};
          };
        };
        case null {};
      };
    };

    let surgeAccuracy : Float = if (surgeTotal == 0) {
      0.0;
    } else {
      surgeTried.toFloat() / surgeTotal.toFloat();
    };

    let avgRevenue = if (triedWithRevenue == 0) {
      0;
    } else {
      totalRevenue / triedWithRevenue;
    };

    {
      totalRecommendations = total;
      triedCount = tried;
      skippedCount = skipped;
      partialCount = partial;
      surgeAccuracy;
      totalRevenueTracked = totalRevenue;
      avgRevenuePerTried = avgRevenue;
    };
  };

  /// Run the full monthly learning analysis for a driver.
  /// Combines recommendation outcomes + pitch pipeline data into MonthlyInsights.
  public func monthlyAnalysis(
    outcomes : Map.Map<Text, RecommendationOutcomeV2>,
    recommendations : Map.Map<Text, NdunaRecommendationV2>,
    pitches : Map.Map<Text, CompanyPitch>,
    driverId : Text,
    year : Nat,
    month : Nat,
  ) : MonthlyInsights {
    let stats = getOutcomeStats(outcomes, recommendations, driverId, year, month);
    let monthOutcomes = getMonthOutcomes(outcomes, driverId, year, month);

    // Collect top surge recommendation contents (tried outcomes)
    let topSurge = List.empty<Text>();
    // Collect product conversion contents (tried outcomes)
    let productConv = List.empty<Text>();

    for (outcome in monthOutcomes.values()) {
      switch (outcome.action) {
        case (#tried) {
          switch (recommendations.get(outcome.recommendationId)) {
            case (?rec) {
              switch (rec.recommendationType) {
                case (#surge) { topSurge.add(rec.content) };
                case (#product) { productConv.add(rec.content) };
                case (_) {};
              };
            };
            case null {};
          };
        };
        case (_) {};
      };
    };

    // Advertising pipeline stats
    let driverPitches = getDriverPitches(pitches, driverId);
    var pitchesSent = 0;
    let interested = List.empty<Text>();
    let negotiating = List.empty<Text>();
    let closed = List.empty<Text>();

    for (pitch in driverPitches.values()) {
      pitchesSent += 1;
      switch (pitch.status) {
        case (#interested) { interested.add(pitch.companyName) };
        case (#negotiating) { negotiating.add(pitch.companyName) };
        case (#closed) { closed.add(pitch.companyName) };
        case (_) {};
      };
    };

    let insights : MonthlyInsights = {
      driverId;
      year;
      month;
      surgeAccuracy = stats.surgeAccuracy;
      topSurgeRecommendations = topSurge.toArray();
      productConversions = productConv.toArray();
      advertisingStats = {
        pitchesSent;
        companiesInterested = interested.toArray();
        dealsNegotiating = negotiating.toArray();
        dealsClosed = closed.toArray();
      };
      suggestedSystemPromptUpdate = generateSystemPromptDelta({
        driverId;
        year;
        month;
        surgeAccuracy = stats.surgeAccuracy;
        topSurgeRecommendations = topSurge.toArray();
        productConversions = productConv.toArray();
        advertisingStats = {
          pitchesSent;
          companiesInterested = interested.toArray();
          dealsNegotiating = negotiating.toArray();
          dealsClosed = closed.toArray();
        };
        suggestedSystemPromptUpdate = "";
      });
    };
    insights;
  };

  /// Generate a system prompt delta text block from MonthlyInsights.
  /// This block is prepended to Nduna's system prompt the following month.
  public func generateSystemPromptDelta(insights : MonthlyInsights) : Text {
    let accuracy = (insights.surgeAccuracy * 100.0).toText();
    var delta = "# Nduna Monthly Update — " # insights.year.toText() # "/" # insights.month.toText() # "\n\n";
    delta #= "Surge prediction accuracy this month: " # accuracy # "%\n\n";

    if (insights.topSurgeRecommendations.size() > 0) {
      delta #= "Top performing surge windows:\n";
      for (rec in insights.topSurgeRecommendations.values()) {
        delta #= "  - " # rec # "\n";
      };
      delta #= "\n";
    };

    if (insights.productConversions.size() > 0) {
      delta #= "Products successfully converted this month:\n";
      for (rec in insights.productConversions.values()) {
        delta #= "  - " # rec # "\n";
      };
      delta #= "\n";
    };

    let adStats = insights.advertisingStats;
    if (adStats.pitchesSent > 0) {
      delta #= "Advertising pipeline: " # adStats.pitchesSent.toText() # " pitches active.\n";
      if (adStats.companiesInterested.size() > 0) {
        delta #= "Interested companies: " # adStats.companiesInterested.values().join(", ") # "\n";
      };
      if (adStats.dealsNegotiating.size() > 0) {
        delta #= "Negotiating: " # adStats.dealsNegotiating.values().join(", ") # " — push for closure.\n";
      };
      if (adStats.dealsClosed.size() > 0) {
        delta #= "Closed deals: " # adStats.dealsClosed.values().join(", ") # " — great work!\n";
      };
    };

    delta #= "\nACTION: Adjust recommendations based on the above data.";
    delta;
  };

  // ── Internal helpers ───────────────────────────────────────────────────────

  /// Convert a calendar year + month (1-indexed) to a nanosecond range [start, end).
  /// Uses a simplified 30-day month and 365-day year approximation (sufficient for filtering).
  public func monthBoundaries(year : Nat, month : Nat) : (Nat64, Nat64) {
    let nsPerDay : Nat64 = 86_400_000_000_000;
    let nsPerYear : Nat64 = 365 * nsPerDay;
    let nsPerMonth : Nat64 = 30 * nsPerDay;
    // Approximate epoch offset: years since 1970 (guard against underflow)
    let yearsElapsed : Nat = if (year > 1970) { year - 1970 } else { 0 };
    let monthsElapsed : Nat = if (month > 1) { month - 1 } else { 0 };
    let yearOffset : Nat64 = yearsElapsed.toNat64() * nsPerYear;
    let monthOffset : Nat64 = monthsElapsed.toNat64() * nsPerMonth;
    let start = yearOffset + monthOffset;
    let end_ = start + nsPerMonth;
    (start, end_);
  };

  /// Render a PitchStatus as a human-readable Text label.
  public func pitchStatusText(status : PitchStatus) : Text {
    switch (status) {
      case (#sent) { "Sent" };
      case (#viewed) { "Viewed" };
      case (#interested) { "Interested" };
      case (#negotiating) { "Negotiating" };
      case (#closed) { "Closed" };
      case (#rejected) { "Rejected" };
      case (#abandoned) { "Abandoned" };
    };
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Equality check for PitchStatus variants.
  private func pitchStatusEq(a : PitchStatus, b : PitchStatus) : Bool {
    switch (a, b) {
      case (#sent, #sent) { true };
      case (#viewed, #viewed) { true };
      case (#interested, #interested) { true };
      case (#negotiating, #negotiating) { true };
      case (#closed, #closed) { true };
      case (#rejected, #rejected) { true };
      case (#abandoned, #abandoned) { true };
      case (_, _) { false };
    };
  };
};
