import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import LeadTypes "../types/leads";

/// Lead ranking library — scores and sorts scraped companies for driver relevance.
module {

  // ── Target industries ────────────────────────────────────────────────────────

  /// Primary target industries (logistics, transport, delivery, fleet management).
  let primaryIndustries : [Text] = [
    "logistics", "transport", "delivery", "courier", "freight",
    "fleet", "trucking", "shipping", "distribution", "supply chain",
  ];

  /// Adjacent industries with partial fit.
  let adjacentIndustries : [Text] = [
    "advertising", "marketing", "branding", "retail", "food",
    "manufacturing", "construction", "mining", "energy", "automotive",
  ];

  // ── Scoring ──────────────────────────────────────────────────────────────────

  /// Compute the industry fit score (0–30 pts).
  public func industryFitScore(industry : Text) : Nat {
    let lower = industry.toLower();
    let isPrimary  = primaryIndustries.any(func(k : Text) : Bool {
      lower.contains(#text k)
    });
    if (isPrimary) { return 30 };

    let isAdjacent = adjacentIndustries.any(func(k : Text) : Bool {
      lower.contains(#text k)
    });
    if (isAdjacent) { return 15 };

    0;
  };

  /// Compute the location proximity score (0–20 pts).
  public func locationProximityScore(leadCity : Text, driverCity : Text) : Nat {
    let leadLower   = leadCity.toLower();
    let driverLower = driverCity.toLower();
    if (leadLower.contains(#text driverLower) or driverLower.contains(#text leadLower)) {
      return 20;
    };
    // Same province heuristic: share a province keyword
    let provinces : [Text] = [
      "gauteng", "western cape", "kwazulu-natal", "eastern cape",
      "limpopo", "mpumalanga", "north west", "free state", "northern cape",
    ];
    for (prov in provinces.values()) {
      if (leadLower.contains(#text prov) and driverLower.contains(#text prov)) {
        return 10;
      };
    };
    0;
  };

  /// Compute company size proxy score (0–20 pts).
  public func companySizeScore(lead : LeadTypes.ScrapedLead) : Nat {
    var score = 0;
    if (lead.website != "") { score := score + 10 };
    if (lead.phone != "")   { score := score + 5  };
    if (lead.email != "")   { score := score + 5  };
    score;
  };

  /// Compute hiring / newness signal score (0–20 pts).
  /// +10 if found on multiple sources, +10 if CIPC registration looks recent (year >= 2022).
  public func hiringSignalScore(lead : LeadTypes.ScrapedLead, sourceCount : Nat) : Nat {
    var score = 0;
    // Multi-source bonus
    if (sourceCount >= 2) { score := score + 10 };
    // Recent CIPC registration heuristic: scoringFactors stores reg number like "2022/123456/07"
    if (lead.source == "cipc") {
      let parts = lead.scoringFactors.split(#char '/').toArray();
      if (parts.size() >= 1) {
        switch (Nat.fromText(parts[0])) {
          case (?regYear) {
            if (regYear >= 2022) { score := score + 10 };
          };
          case null {};
        };
      };
    };
    score;
  };

  /// Score a single lead and return it with compositeScore + scoringFactors set.
  /// If tavilyHiringSignal is already true on the lead (set by the mixin after enrichment),
  /// the hiring signal score is boosted by 20% of the total.
  /// Exa enrichment boosts:
  ///   +15 if exaEnriched.employeeCount is present (company has more than ~10 staff)
  ///   +10 if exaEnriched.contactEmail is present
  public func scoreOne(
    lead       : LeadTypes.ScrapedLead,
    driverCity : Text,
    sourceCount : Nat,
  ) : LeadTypes.ScrapedLead {
    let iScore  = industryFitScore(lead.industry);
    let lScore  = locationProximityScore(lead.address # " " # lead.industry, driverCity);
    let sScore  = companySizeScore(lead);
    let hScore  = hiringSignalScore(lead, sourceCount);
    var total   = iScore + lScore + sScore + hScore;

    // Tavily hiring signal boost: +20% of total (capped at 100)
    if (lead.tavilyHiringSignal) {
      let boost = total / 5; // 20%
      total := total + boost;
    };

    // Exa enrichment boosts
    var exaEmployeeBoost = 0;
    var exaContactBoost  = 0;
    switch (lead.exaEnriched) {
      case (?exa) {
        // +15 if employee count present (indicates company of substance)
        switch (exa.employeeCount) {
          case (?_) { exaEmployeeBoost := 15 };
          case (null) {};
        };
        // +10 if a verified contact email was found
        switch (exa.contactEmail) {
          case (?_) { exaContactBoost := 10 };
          case (null) {};
        };
      };
      case (null) {};
    };
    total := total + exaEmployeeBoost + exaContactBoost;

    // Browserbase company research boost: +10 if Browserbase enrichment present
    var browserbaseBoost = 0;
    switch (lead.browserbaseEnriched) {
      case (?_) { browserbaseBoost := 10 };
      case (null) {};
    };
    total := total + browserbaseBoost;

    if (total > 100) { total := 100 };

    let tavilyFlag   = if (lead.tavilyHiringSignal) { ",tavily_hiring=true" } else { "" };
    let exaFlag      = if (exaEmployeeBoost > 0 or exaContactBoost > 0) {
      ",exa_employee=" # exaEmployeeBoost.toText() # ",exa_contact=" # exaContactBoost.toText()
    } else { "" };
    let bbFlag       = if (browserbaseBoost > 0) { ",browserbaseResearchBoost=10" } else { "" };
    let factors = "industry=" # iScore.toText() #
                  ",location=" # lScore.toText() #
                  ",size=" # sScore.toText() #
                  ",hiring=" # hScore.toText() #
                  tavilyFlag # exaFlag # bbFlag;

    { lead with compositeScore = total; scoringFactors = factors };
  };

  /// Score all leads, sort descending, return top `limit` entries.
  public func rankLeads(
    leads      : [LeadTypes.ScrapedLead],
    driverCity : Text,
    sourceCount : Nat,
    limit      : Nat,
  ) : [LeadTypes.ScrapedLead] {
    // Count per-name occurrences for multi-source bonus
    let scored = leads.map(func(l : LeadTypes.ScrapedLead) : LeadTypes.ScrapedLead {
      scoreOne(l, driverCity, sourceCount)
    });

    let sorted = scored.sort(func(a : LeadTypes.ScrapedLead, b : LeadTypes.ScrapedLead) : Order.Order {
      // Descending by compositeScore
      if (a.compositeScore > b.compositeScore) { #less }
      else if (a.compositeScore < b.compositeScore) { #greater }
      else { #equal };
    });

    // Take top `limit`
    let taken = List.empty<LeadTypes.ScrapedLead>();
    var count = 0;
    for (lead in sorted.values()) {
      if (count < limit) {
        taken.add(lead);
        count := count + 1;
      };
    };
    taken.toArray();
  };

  // ── Batch helpers ─────────────────────────────────────────────────────────────

  /// Build a LeadBatch record from ranked leads.
  public func buildBatch(
    driverId     : Text,
    weekNumber   : Nat,
    year         : Nat,
    rankedLeads  : [LeadTypes.ScrapedLead],
    totalScraped : Nat,
    now          : Int,
  ) : LeadTypes.LeadBatch {
    {
      driverId;
      weekNumber;
      year;
      leads        = rankedLeads;
      generatedAt  = now;
      totalScraped;
      totalRanked  = rankedLeads.size();
    };
  };

  /// Compute the ISO week number for a given nanosecond timestamp.
  public func isoWeekNumber(nowNs : Int) : Nat {
    let secsPerDay  = 86_400;
    let daysPerWeek = 7;
    let daysSinceEpoch = Int.abs(nowNs) / 1_000_000_000 / secsPerDay;
    // Simple approximation: week 1 = days 0–6
    (daysSinceEpoch / daysPerWeek) % 53 + 1;
  };

  /// Compute the year for a given nanosecond timestamp.
  public func yearFromNs(nowNs : Int) : Nat {
    let secsPerYear = 31_536_000;
    1970 + Int.abs(nowNs) / 1_000_000_000 / secsPerYear;
  };
};
