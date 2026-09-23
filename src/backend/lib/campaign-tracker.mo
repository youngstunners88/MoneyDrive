import List          "mo:core/List";
import Time          "mo:core/Time";
import Float         "mo:core/Float";
import Nat           "mo:core/Nat";
import CampaignTypes "../types/campaign";

/// Campaign conversion tracking and A/B winner determination.
/// Stateless — caller passes in the event list and metrics map.
module {

  // ─── Event recording ──────────────────────────────────────────────────────────

  /// Append a conversion event to the shared event list.
  public func trackConversionEvent(
    events : List.List<CampaignTypes.CampaignConversionEvent>,
    event  : CampaignTypes.CampaignConversionEvent,
  ) {
    events.add(event);
    // Ring-buffer: keep only last 50,000 events
    if (events.size() > 50_000) {
      let arr   = events.toArray();
      let start = arr.size() - 50_000 : Nat;
      events.clear();
      events.addAll(arr.sliceToArray(start, arr.size()).values());
    };
  };

  // ─── Metrics computation ───────────────────────────────────────────────────────

  /// Compute aggregated metrics for a campaign from the conversion event list.
  public func getMetrics(
    events     : List.List<CampaignTypes.CampaignConversionEvent>,
    campaignId : Text,
    sends      : Nat,
  ) : CampaignTypes.CampaignMetrics {
    let now           = Time.now();
    var trialStarts   = 0;
    var paidConversions = 0;
    var revenueTotal  : Float = 0.0;

    events.forEach(func(ev : CampaignTypes.CampaignConversionEvent) {
      if (ev.campaignId == campaignId) {
        switch (ev.eventType) {
          case (#trial_start)      { trialStarts     += 1 };
          case (#trial_conversion) {
            paidConversions += 1;
            switch (ev.revenue) {
              case (?r) { revenueTotal := revenueTotal + r };
              case (null) {};
            };
          };
          case (#click)            {};
        };
      };
    });

    let conversionRate : Float = if (sends == 0) {
      0.0;
    } else {
      paidConversions.toFloat() / sends.toFloat();
    };

    {
      campaignId;
      sends;
      trialStarts;
      paidConversions;
      conversionRate;
      revenueAttributed = revenueTotal;
      lastUpdated       = now;
    };
  };

  // ─── A/B test winner determination ────────────────────────────────────────────

  /// Minimum event count before declaring a winner (per variant).
  let MIN_EVENTS_FOR_WINNER : Nat = 50;

  /// Minimum observation window before declaring a winner (72 hours in nanoseconds).
  let MIN_WINDOW_NS : Int = 259_200_000_000_000;

  /// Check if a winner can be declared for an A/B test.
  /// Returns updated AbTestResult with winner set if conditions are met, or original if not.
  public func checkAbTestWinner(
    abResult   : CampaignTypes.AbTestResult,
    events     : List.List<CampaignTypes.CampaignConversionEvent>,
    aSends     : Nat,
    bSends     : Nat,
    campaignACreatedAt : Int,
  ) : CampaignTypes.AbTestResult {
    let now = Time.now();

    // Require minimum observation window
    if (now - campaignACreatedAt < MIN_WINDOW_NS) {
      return abResult;
    };

    // Count conversions per variant
    var aConversions = 0;
    var bConversions = 0;
    var aEvents      = 0;
    var bEvents      = 0;

    events.forEach(func(ev : CampaignTypes.CampaignConversionEvent) {
      if (ev.campaignId == abResult.campaignAId) {
        aEvents += 1;
        if (ev.eventType == #trial_conversion) { aConversions += 1 };
      } else if (ev.campaignId == abResult.campaignBId) {
        bEvents += 1;
        if (ev.eventType == #trial_conversion) { bConversions += 1 };
      };
    });

    // Require minimum events in both variants
    if (aEvents < MIN_EVENTS_FOR_WINNER or bEvents < MIN_EVENTS_FOR_WINNER) {
      return abResult;
    };

    let aRate : Float = if (aSends == 0) { 0.0 } else { aConversions.toFloat() / aSends.toFloat() };
    let bRate : Float = if (bSends == 0) { 0.0 } else { bConversions.toFloat() / bSends.toFloat() };

    let winner : ?Text = if (aRate > bRate) {
      ?abResult.campaignAId;
    } else if (bRate > aRate) {
      ?abResult.campaignBId;
    } else {
      ?abResult.campaignAId; // tie goes to A (first-mover default)
    };

    {
      abResult with
      winnerCampaignId = winner;
      decidedAt        = ?now;
      aConversionRate  = aRate;
      bConversionRate  = bRate;
    };
  };

  // ─── Week-of-year helper ───────────────────────────────────────────────────────

  /// Returns the ISO week start date as "YYYY-MM-DD" for report headers.
  /// Uses nanosecond timestamp → seconds → day boundary.
  public func weekOf(nowNs : Int) : Text {
    let secs      = nowNs / 1_000_000_000;
    let days      = secs / 86_400;
    // Round down to Monday (days since epoch % 7; epoch 1970-01-01 was a Thursday → offset 3)
    let dayOfWeek = ((days + 3) % 7);  // 0=Mon, 6=Sun
    let mondayDays = days - dayOfWeek;
    // Convert back to approximate year/month/day — sufficient for report label
    let z    = mondayDays + 719_468;
    let era  = z / 146_097;
    let doe  = z % 146_097;
    let yoe  = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y    = yoe + era * 400;
    let doy  = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp   = (5 * doy + 2) / 153;
    let d    = doy - (153 * mp + 2) / 5 + 1;
    let m    = if (mp < 10) { mp + 3 } else { mp - 9 };
    let year = if (m <= 2) { y + 1 } else { y };
    let mm   = if (m  < 10) { "0" # m.toText() } else { m.toText() };
    let dd   = if (d  < 10) { "0" # d.toText() } else { d.toText() };
    year.toText() # "-" # mm # "-" # dd;
  };
};
