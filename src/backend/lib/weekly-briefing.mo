import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import MsgTypes "../types/messaging";
import AgentTypes "../types/agent";
import LeadTypes "../types/leads";

/// Stateless domain logic for the weekly WhatsApp briefing scheduler.
/// Determines whether a briefing should be sent and builds the briefing message body.
module {
  // ── Scheduling helpers ──────────────────────────────────────────────────────

  /// Returns true if a weekly briefing should be sent right now.
  /// Rules:
  ///   - briefing.enabled must be true
  ///   - Current day of week (Mon=0) must match briefingDayOfWeek
  ///   - Current hour must be >= briefingHour
  ///   - Either lastSentAt is null, OR it was more than 6 days ago
  public func shouldSendBriefing(state : MsgTypes.WeeklyBriefingState, now : Int) : Bool {
    if (not state.enabled) { return false };

    // Day of week (0 = Monday in our convention)
    // ICP Time.now() returns nanoseconds since Unix epoch
    // Unix epoch day 0 was Thursday (4), so offset by +4 to align Mon=0
    let secondsSinceEpoch = Int.abs(now / 1_000_000_000);
    let daysSinceEpoch = secondsSinceEpoch / 86_400;
    // Unix day 0 was Thursday; shift so Monday = 0
    // Thu=3, Fri=4, Sat=5, Sun=6, Mon=0, Tue=1, Wed=2
    let dayOfWeek : Nat = (daysSinceEpoch + 3) % 7; // Mon=0 alignment

    if (dayOfWeek != state.briefingDayOfWeek) { return false };

    // Check hour (approximate from seconds)
    let hourOfDay : Nat = (secondsSinceEpoch % 86_400) / 3600;
    if (hourOfDay < state.briefingHour) { return false };

    // Check cooldown — must be at least 6 days since last send
    let sixDaysNs : Int = 6 * 86_400 * 1_000_000_000;
    switch (state.lastSentAt) {
      case (null) { true };
      case (?lastSent) {
        now - lastSent >= sixDaysNs;
      };
    };
  };

  /// Build the WhatsApp briefing message for a driver.
  /// Uses the driver's top leads by compositeScore, analytics profile, and cohort.
  /// Content is personalised per cohort: Power Earners get 5 opportunities, Growth Drivers get 3, New Drivers get 2 + educational tips.
  /// If tavilyMarketIntelligence is non-empty, it is appended as a "Market Intelligence" line.
  public func buildBriefingMessage(
    leads : [LeadTypes.ScrapedLead],
    analytics : ?AgentTypes.DriverAnalyticsProfile,
    cohort : AgentTypes.DriverCohort,
    currencyCode : Text,
    tavilyMarketIntelligence : Text,
    driverRating : Float,
  ) : Text {
    // ── Earnings context ─────────────────────────────────────────────────────
    let (earningsText, tripsThisMonth) = switch (analytics) {
      case (null) { ("—", 0) };
      case (?ap) {
        let weeklyEarnings = ap.totalEarnings / 52.0;
        (currencyCode # " " # roundToText(weeklyEarnings), ap.totalTrips / 12);
      };
    };

    // ── Cohort-specific configuration ────────────────────────────────────────
    let (cohortLabel, cohortHeadline, maxLeads, cohortCta) = switch (cohort) {
      case (#PowerEarner) {
        let earningsMonthlyEst = switch (analytics) {
          case (null) { "R0" };
          case (?ap) { "R" # roundToText(ap.totalEarnings / 12.0) };
        };
        (
          "🏆 *You are a POWER EARNER*",
          "You're in the elite tier. 5 high-value pitch opportunities below.",
          5,
          "💰 On track for " # earningsMonthlyEst # " this month from advertising. Tap *Generate Pitch* to close your next deal.",
        );
      };
      case (#GrowthDriver) {
        let ratingNote = if (driverRating < 4.8) {
          "⭐ Your " # driverRating.toText() # " rating opens mid-market deals — improving to 4.8+ raises close rate by 23%."
        } else {
          "⭐ Your " # driverRating.toText() # " rating is solid — focus on pitching."
        };
        let tripsTopower = switch (analytics) { case (null) { 200 }; case (?ap) { let tm = ap.totalTrips / 12; if (tm >= 200) { 0 } else { 200 - tm : Nat } } };
        (
          "📈 *You are a GROWTH DRIVER*",
          ratingNote,
          3,
          "Keep pitching — you're " # tripsTopower.toText() # " trips/month from Power Earner status.",
        );
      };
      case (#NewDriver) {
        let tripsToGrowth = if (tripsThisMonth >= 100) { 0 } else { 100 - tripsThisMonth : Nat };
        let ratingGoal = if (driverRating < 4.8) {
          "Your " # driverRating.toText() # " rating → work toward 4.8 before pitching."
        } else {
          "Your " # driverRating.toText() # " rating is ready — focus on hitting 100 trips."
        };
        (
          "🌱 *You are a NEW DRIVER — " # tripsToGrowth.toText() # " trips to Growth Driver status*",
          ratingGoal,
          2,
          "📚 Study the Wealth Academy and hit 100 trips. Your car's in-car sales (WiFi R5, Water R15) generate income right now.",
        );
      };
    };

    // ── Top leads (capped per cohort) ────────────────────────────────────────
    let sorted = leads.sort(func(a : LeadTypes.ScrapedLead, b : LeadTypes.ScrapedLead) : { #less; #equal; #greater } {
      if (a.compositeScore > b.compositeScore) { #less }
      else if (a.compositeScore < b.compositeScore) { #greater }
      else { #equal };
    });
    let take = if (sorted.size() < maxLeads) { sorted.size() } else { maxLeads };

    var leadsSection = "";
    if (take == 0) {
      leadsSection := "_No leads yet — your weekly batch is being prepared._";
    } else {
      var i = 0;
      while (i < take) {
        let lead = sorted[i];
        let hiringBadge = if (lead.compositeScore >= 80) { " 🔥" } else { "" };
        leadsSection := leadsSection # (i + 1).toText() # ". *" # lead.companyName # "*" # hiringBadge # "\n";
        leadsSection := leadsSection # "   " # lead.industry # " | " # lead.source # "\n";
        i += 1;
      };
    };

    // ── New high-score company this week ────────────────────────────────────
    var newHighText = "_None this week_";
    for (lead in sorted.values()) {
      if (lead.compositeScore >= 80 and newHighText == "_None this week_") {
        newHighText := lead.companyName # " (" # lead.industry # ") — score: " # lead.compositeScore.toText() # "/100";
      };
    };

    // ── Build message ────────────────────────────────────────────────────────
    let marketSection = if (tavilyMarketIntelligence == "") { "" }
                        else { "📡 *Market Intelligence:* " # tavilyMarketIntelligence # "\n\n" };

    "🚗 *Your MoneyDrive Weekly Briefing*\n\n" #
    cohortLabel # "\n" #
    cohortHeadline # "\n\n" #
    "💰 Earnings this week: *" # earningsText # "*\n\n" #
    "🏆 *Your Top " # take.toText() # " Pitch Opportunities:*\n" #
    leadsSection # "\n" #
    "🔥 Top lead this week: " # newHighText # "\n\n" #
    marketSection #
    cohortCta # "\n\n" #
    "_Reply /leads for full list • /coach [company] for pitch strategy_";
  };

  /// Round a Float to 2 decimal places and return as Text.
  private func roundToText(f : Float) : Text {
    let rounded = Float.nearest(f * 100.0) / 100.0;
    rounded.toText();
  };
};
