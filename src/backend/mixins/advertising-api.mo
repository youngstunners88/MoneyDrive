import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import AgentTypes "../types/agent";
import AdvTypes "../types/advertising";
import AdvLib "../lib/advertising";
import AnalyticsLog "../lib/analytics-log";

/// Public API mixin for MoneyDrive Layer 3: recommendation feedback loop + advertising deal pipeline.
/// Exposes all CRUD and intelligence functions as canister public methods so they appear
/// in the generated TypeScript bindings.
mixin (
  analyticsLog : AnalyticsLog.State,
  accessControlState : AccessControl.AccessControlState,
  /// Global store: recommendation ID → NdunaRecommendationV2
  advRecommendations : Map.Map<Text, AdvTypes.NdunaRecommendationV2>,
  /// Global store: recommendation ID → RecommendationOutcomeV2
  advOutcomes : Map.Map<Text, AdvTypes.RecommendationOutcomeV2>,
  /// Global store: pitch ID → CompanyPitch
  companyPitches : Map.Map<Text, AdvTypes.CompanyPitch>,
  /// Nduna prompt state — updated when monthlyAnalysis runs to close the learning loop
  ndunaPromptState : { var value : AgentTypes.NdunaSystemPromptState },
) {
  // ── Recommendation V2 API ──────────────────────────────────────────────────

  /// Log a Nduna recommendation (V2 with Text ID + proper variants).
  /// Returns the recommendation ID that was stored.
  public shared ({ caller }) func logRecommendationV2(rec : AdvTypes.NdunaRecommendationV2) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Allow if rec.driverId is empty (system-generated), otherwise verify ownership
    if (rec.driverId != "" and rec.driverId != caller.toText()) {
      Runtime.trap("Unauthorized: Can only log recommendations for your own driver ID");
    };
    let recId = AdvLib.logRecommendationV2(advRecommendations, rec);
    AnalyticsLog.logEvent(
      analyticsLog,
      "deal_event",
      "recommendation_logged",
      caller.toText(),
      null,
      true,
      null,
      "{\"recId\":\"" # recId # "\",\"type\":\"" # debug_show(rec.recommendationType) # "\"}",
      null,
    );
    recId;
  };

  /// Record the outcome of a recommendation (V2).
  /// Returns true if the outcome was stored.
  public shared ({ caller }) func recordOutcomeV2(outcome : AdvTypes.RecommendationOutcomeV2) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (outcome.driverId != caller.toText()) {
      Runtime.trap("Unauthorized: Can only record outcomes for your own driver ID");
    };
    let stored = AdvLib.recordOutcomeV2(advOutcomes, outcome);
    if (stored) {
      let outcomeText = debug_show(outcome.action);
      let revenueText = switch (outcome.revenue) { case (?r) { r.toText() }; case (null) { "0" } };
      AnalyticsLog.logEvent(
        analyticsLog,
        "deal_event",
        "outcome_recorded",
        caller.toText(),
        null,
        true,
        null,
        "{\"recId\":\"" # outcome.recommendationId # "\",\"outcome\":\"" # outcomeText # "\",\"revenue\":" # revenueText # "}",
        null,
      );
    };
    stored;
  };

  /// Get the outcome for a specific recommendation ID.
  public query func getOutcomeV2(recommendationId : Text) : async ?AdvTypes.RecommendationOutcomeV2 {
    AdvLib.getOutcomeV2(advOutcomes, recommendationId);
  };

  /// Get all outcomes logged for a given driver ID.
  public query func getDriverOutcomesV2(driverId : Text) : async [AdvTypes.RecommendationOutcomeV2] {
    AdvLib.getDriverOutcomesV2(advOutcomes, driverId);
  };

  /// Get all outcomes for a driver in a given year/month.
  /// month is 1-indexed (1 = January, 12 = December).
  public query func getMonthOutcomes(driverId : Text, year : Nat, month : Nat) : async [AdvTypes.RecommendationOutcomeV2] {
    AdvLib.getMonthOutcomes(advOutcomes, driverId, year, month);
  };

  // ── Company Pitch CRUD API ─────────────────────────────────────────────────

  /// Create a new advertising pitch. Returns the pitch ID.
  public shared ({ caller }) func createPitch(pitch : AdvTypes.CompanyPitch) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (pitch.driverId != caller.toText()) {
      Runtime.trap("Unauthorized: Can only create pitches for your own driver ID");
    };
    AdvLib.createPitch(companyPitches, pitch);
  };

  /// Get a pitch by ID. Returns null if not found.
  public query func getPitch(id : Text) : async ?AdvTypes.CompanyPitch {
    AdvLib.getPitch(companyPitches, id);
  };

  /// Get all pitches for a driver.
  public query func getDriverPitches(driverId : Text) : async [AdvTypes.CompanyPitch] {
    AdvLib.getDriverPitches(companyPitches, driverId);
  };

  /// Replace a pitch record in full. Returns true if the pitch existed.
  public shared ({ caller }) func updatePitch(id : Text, updated : AdvTypes.CompanyPitch) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Verify existing pitch belongs to caller
    switch (companyPitches.get(id)) {
      case (null) { Runtime.trap("Pitch not found: " # id) };
      case (?existing) {
        if (existing.driverId != caller.toText()) {
          Runtime.trap("Unauthorized: Can only update your own pitches");
        };
      };
    };
    // Also ensure the updated record's driverId is not being changed to someone else
    if (updated.driverId != caller.toText()) {
      Runtime.trap("Unauthorized: Cannot change pitch ownership");
    };
    AdvLib.updatePitch(companyPitches, id, updated);
  };

  /// Delete a pitch by ID. Returns true if it existed.
  public shared ({ caller }) func deletePitch(id : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Verify existing pitch belongs to caller
    switch (companyPitches.get(id)) {
      case (null) { return false };
      case (?existing) {
        if (existing.driverId != caller.toText()) {
          Runtime.trap("Unauthorized: Can only delete your own pitches");
        };
      };
    };
    AdvLib.deletePitch(companyPitches, id);
  };

  /// Update only the status of a pitch. Returns true if the pitch existed.
  public shared ({ caller }) func updatePitchStatus(id : Text, status : AdvTypes.PitchStatus) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Verify existing pitch belongs to caller
    switch (companyPitches.get(id)) {
      case (null) { return false };
      case (?existing) {
        if (existing.driverId != caller.toText()) {
          Runtime.trap("Unauthorized: Can only update status of your own pitches");
        };
      };
    };
    let updated = AdvLib.updatePitchStatus(companyPitches, id, status);
    if (updated) {
      let statusText = debug_show(status);
      AnalyticsLog.logEvent(
        analyticsLog,
        "deal_event",
        "pitch_status_changed",
        caller.toText(),
        null,
        true,
        null,
        "{\"pitchId\":\"" # id # "\",\"newStatus\":\"" # statusText # "\"}",
        null,
      );
    };
    updated;
  };

  /// Get all pitches for a driver filtered by a specific status.
  public query func getPitchesByStatus(driverId : Text, status : AdvTypes.PitchStatus) : async [AdvTypes.CompanyPitch] {
    AdvLib.getPitchesByStatus(companyPitches, driverId, status);
  };

  // ── Intelligence API ───────────────────────────────────────────────────────

  /// Generate follow-up reminder strings for a driver's open pitches.
  /// Returns an array of human-readable reminder messages.
  public query func generateFollowUpReminders(driverId : Text) : async [Text] {
    let now64 : Nat64 = Nat64.fromNat(Int.abs(Time.now()));
    AdvLib.generateFollowUpReminders(companyPitches, driverId, now64);
  };

  /// Compute aggregate outcome statistics for a driver in a given month.
  public query func getOutcomeStats(driverId : Text, year : Nat, month : Nat) : async AdvTypes.OutcomeStats {
    AdvLib.getOutcomeStats(advOutcomes, advRecommendations, driverId, year, month);
  };

  /// Run the full monthly learning analysis for a driver.
  /// Returns structured MonthlyInsights including a suggested system prompt update.
  /// Also automatically applies the generated prompt delta to ndunaPromptState,
  /// closing the learning loop — Nduna uses the updated prompt on the next chat call.
  public shared ({ caller }) func monthlyAnalysis(driverId : Text, year : Nat, month : Nat) : async AdvTypes.MonthlyInsights {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (driverId != caller.toText() and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only run analysis for your own driver ID");
    };
    let insights = AdvLib.monthlyAnalysis(advOutcomes, advRecommendations, companyPitches, driverId, year, month);
    // Close the learning loop: apply the generated delta to Nduna's prompt state
    if (insights.suggestedSystemPromptUpdate != "") {
      let current = ndunaPromptState.value;
      ndunaPromptState.value := {
        current with
        evolutionDelta = insights.suggestedSystemPromptUpdate;
        lastEvolved = ?Time.now();
        evolutionCount = current.evolutionCount + 1;
      };
    };
    insights;
  };

  /// Generate a system prompt delta text block from MonthlyInsights.
  /// Intended to be prepended to Nduna's system prompt the following month.
  public query func generateSystemPromptDelta(insights : AdvTypes.MonthlyInsights) : async Text {
    AdvLib.generateSystemPromptDelta(insights);
  };
};
