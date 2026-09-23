import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import LeadTypes "../types/leads";

/// Scheduler library — helpers for weekly lead generation orchestration.
/// The actual async timer + HTTP outcalls live in the mixin (needs <system> capability).
module {

  // ── Config helpers ────────────────────────────────────────────────────────────

  /// Default scheduler config: Sundays at 02:00 UTC, enabled.
  public let defaultConfig : LeadTypes.SchedulerConfig = {
    dayOfWeek = 0;
    hour      = 2;
    enabled   = true;
  };

  /// Validate a scheduler config (dayOfWeek 0–6, hour 0–23).
  public func validateConfig(config : LeadTypes.SchedulerConfig) : Bool {
    config.dayOfWeek <= 6 and config.hour <= 23;
  };

  // ── Deduplication against existing pitches ────────────────────────────────────

  /// Filter out leads whose company name already appears in the driver's pitch pipeline.
  /// Uses case-insensitive containment check.
  public func filterAlreadyPitched(
    leads          : [LeadTypes.ScrapedLead],
    pitchedNames   : [Text],
  ) : [LeadTypes.ScrapedLead] {
    let loweredNames = pitchedNames.map(func(n : Text) : Text { n.toLower() });
    let pitched = List.fromArray(loweredNames);
    leads.filter(func(l : LeadTypes.ScrapedLead) : Bool {
      let nameLower = l.companyName.toLower();
      not pitched.any(func(p : Text) : Bool {
        p.contains(#text nameLower) or nameLower.contains(#text p)
      })
    })
  };

  // ── Batch key ─────────────────────────────────────────────────────────────────

  /// Composite key for a lead batch: "driverId_weekNumber_year".
  public func batchKey(driverId : Text, weekNumber : Nat, year : Nat) : Text {
    driverId # "_" # weekNumber.toText() # "_" # year.toText();
  };

  // ── Target industries for a city ─────────────────────────────────────────────

  /// Return the industries to search for a given city.
  /// Defaults to logistics + transport + advertising.
  public func industriesForCity(city : Text) : [Text] {
    let lower = city.toLower();
    if (lower.contains(#text "durban") or lower.contains(#text "port") or lower.contains(#text "harbour")) {
      ["logistics", "shipping", "transport", "freight", "advertising"];
    } else if (lower.contains(#text "cape")) {
      ["logistics", "transport", "fleet management", "advertising", "tourism"];
    } else {
      ["logistics", "transport", "delivery", "fleet management", "advertising"];
    };
  };

  // ── Top-10 selection ──────────────────────────────────────────────────────────

  /// Select the top 10 leads from a ranked list (already sorted desc by compositeScore).
  public func topTen(leads : [LeadTypes.ScrapedLead]) : [LeadTypes.ScrapedLead] {
    let result = List.empty<LeadTypes.ScrapedLead>();
    var count  = 0;
    for (l in leads.values()) {
      if (count < 10) {
        result.add(l);
        count := count + 1;
      };
    };
    result.toArray();
  };

  // ── Audit log key ─────────────────────────────────────────────────────────────

  /// Generate a unique audit log ID.
  public func auditLogId(driverId : Text, source : Text, now : Int) : Text {
    "audit_" # driverId # "_" # source # "_" # now.toText();
  };
};
