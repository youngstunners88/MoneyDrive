import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import IntelTypes "../types/intelligence";
import BBTypes "../types/browserbase";
import OppTypes "../types/opportunity";
import AdvTypes "../types/advertising";
import AnalyticsLog "../lib/analytics-log";
import OrbisDataProvider "../lib/orbis/OrbisDataProvider";
import BrowserbaseProvider "../lib/browserbase/BrowserbaseProvider";
import AgentTypes "../types/agent";

/// Public API mixin for the SA Market Intelligence and Browserbase hunt domain.
///
/// Exposes:
///   - getSAIntelligence         — unauthenticated query for Orbis marketplace
///   - setOrbisPublisherConfig   — admin: configure Orbis marketplace listing
///   - getOrbisPublisherStatus   — query: current listing status
///   - setBrowserbaseConfig      — admin: store Browserbase API key
///   - isBrowserbaseConfigured   — query: check if key is set
///   - triggerBrowserbaseHunt    — admin: run a Browserbase hunt for a driver
mixin (
  accessControlState  : AccessControl.AccessControlState,
  analyticsState      : AnalyticsLog.State,
  /// All trips for intelligence aggregation — same map as main.mo `trips`
  allTrips            : Map.Map<Principal, Map.Map<Text, {
    platform        : Text;
    amount          : Float;
    date            : Int;
    notes           : Text;
    tripId          : Text;
    durationMinutes : Nat;
  }>>,
  /// All advertising pitches for ad conversion rate aggregation
  companyPitches      : Map.Map<Text, AdvTypes.CompanyPitch>,
  /// Browserbase API key — admin-only, never returned in any query
  browserbaseApiKey   : { var value : Text },
  /// Orbis publisher config — admin-only
  orbisPublisherConfig : { var value : ?IntelTypes.OrbisListingConfig },
  /// Orbis listing status — updated after each publish or call
  orbisListingStatus  : { var value : IntelTypes.OrbisListingStatus },
  /// Opportunity findings store — same map used by opportunity-hunter-api.mo
  opportunityFindings : Map.Map<Text, OppTypes.OpportunityFinding>,
  /// Scan history — same map used by opportunity-hunter-api.mo
  opportunityScans    : Map.Map<Text, OppTypes.OpportunityScan>,
  /// Driver opportunity index — same map used by opportunity-hunter-api.mo
  driverOpportunityIndex : Map.Map<Text, List.List<Text>>,
  /// Nduna recommendations list — findings are pushed here after each hunt
  ndunaRecommendations : List.List<AgentTypes.NdunaRecommendation>,
) {

  // ── Constants ────────────────────────────────────────────────────────────────

  /// 14 days in nanoseconds — matches opportunity-hunter-api.mo expiry
  let BB_FOURTEEN_DAYS_NS : Int = 14 * 24 * 60 * 60 * 1_000_000_000;

  /// Default SA target URLs for Browserbase opportunity hunts
  let DEFAULT_SA_HUNT_URLS : [Text] = [
    "https://maxim.co.za",
    "https://www.indriver.com/city/johannesburg",
    "https://www.uber.com/za/en/drive/",
    "https://bolt.eu/en-za/driver/",
    "https://careers.discoverygroup.com",
  ];

  // ── getSAIntelligence ────────────────────────────────────────────────────────

  /// Query anonymised SA market intelligence.
  /// Accessible without authentication for the Orbis marketplace endpoint.
  /// Validates anonymisation before returning — rejects data with sampleSize < 10.
  public func getSAIntelligence(
    req : IntelTypes.IntelligenceQuery,
  ) : async { #ok : IntelTypes.IntelligenceResult; #err : Text } {
    let now = Time.now();
    let cityLabel = switch (req.city) {
      case (null) { "All SA" };
      case (?c)   { c };
    };

    // Flatten all trips into TripRecord projections for aggregation
    let tripList = List.empty<OrbisDataProvider.TripRecord>();
    for ((_, userTrips) in allTrips.entries()) {
      for ((_, trip) in userTrips.entries()) {
        tripList.add({
          platform = trip.platform;
          amount   = trip.amount;
          date     = trip.date;
          notes    = trip.notes;
        });
      };
    };
    let trips = tripList.toArray();

    // Project CompanyPitch to DealRecord for ad conversion aggregation
    // CompanyPitch.pitchDate is Nat64; convert to Int for DealRecord
    // CompanyPitch has no industry field — derive from companyName or use "General"
    let dealList = List.empty<OrbisDataProvider.DealRecord>();
    for ((_, pitch) in companyPitches.entries()) {
      let statusText : Text = switch (pitch.status) {
        case (#closed)      { "closed" };
        case (#rejected)    { "rejected" };
        case (#abandoned)   { "abandoned" };
        case (#sent)        { "sent" };
        case (#viewed)      { "viewed" };
        case (#interested)  { "interested" };
        case (#negotiating) { "negotiating" };
      };
      dealList.add({
        status    = statusText;
        industry  = "General";   // CompanyPitch has no industry field
        pitchedAt = Nat.fromNat64(pitch.pitchDate).toInt();
        closedAt  = null;
      });
    };
    let deals = dealList.toArray();

    // Dispatch to the correct aggregation function
    let dataPoints : [IntelTypes.IntelligenceDataPoint] = switch (req.category) {
      case (#surgeWindows)       { OrbisDataProvider.aggregateSurgeWindows(trips) };
      case (#topZones)           { OrbisDataProvider.aggregateTopZones(trips) };
      case (#adConversionRates)  { OrbisDataProvider.aggregateAdConversionRates(deals) };
      case (#earningsBenchmarks) { OrbisDataProvider.aggregateEarningsBenchmarks(trips) };
      case (#leadQuality)        { OrbisDataProvider.aggregateAdConversionRates(deals) };
    };

    let categoryText : Text = switch (req.category) {
      case (#surgeWindows)       { "surgeWindows" };
      case (#topZones)           { "topZones" };
      case (#adConversionRates)  { "adConversionRates" };
      case (#earningsBenchmarks) { "earningsBenchmarks" };
      case (#leadQuality)        { "leadQuality" };
    };

    // Apply limit if set
    let limitedData : [IntelTypes.IntelligenceDataPoint] = if (req.limit > 0 and dataPoints.size() > req.limit) {
      dataPoints.sliceToArray(0, req.limit)
    } else {
      dataPoints
    };

    let result : IntelTypes.IntelligenceResult = {
      category    = categoryText;
      city        = cityLabel;
      generatedAt = now;
      data        = limitedData;
    };

    // Validate anonymisation before returning
    if (not OrbisDataProvider.validateAnonymisation(result)) {
      return #err("Insufficient data for anonymisation — sampleSize < 10 or PII detected");
    };

    #ok(result);
  };

  // ── setOrbisPublisherConfig ──────────────────────────────────────────────────

  /// Admin only: store or update the Orbis marketplace publisher configuration.
  /// When autoPublish = true, the listing status is set to listed = true.
  public shared ({ caller }) func setOrbisPublisherConfig(
    config : IntelTypes.OrbisListingConfig,
  ) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can configure the Orbis publisher");
    };

    orbisPublisherConfig.value := ?config;

    if (config.autoPublish) {
      orbisListingStatus.value := {
        orbisListingStatus.value with
        listed    = true;
        listingId = ?("listing_" # Time.now().toText());
      };
    };

    AnalyticsLog.logEvent(
      analyticsState,
      "admin_action",
      "orbis_publisher_configured",
      caller.toText(),
      null,
      true,
      null,
      "{\"listingName\":\"" # config.listingName # "\",\"autoPublish\":" # (if (config.autoPublish) { "true" } else { "false" }) # "}",
      null,
    );

    #ok("Orbis publisher configured");
  };

  // ── getOrbisPublisherStatus ──────────────────────────────────────────────────

  /// Return current Orbis marketplace listing status.
  public func getOrbisPublisherStatus() : async IntelTypes.OrbisListingStatus {
    orbisListingStatus.value;
  };

  // ── setBrowserbaseConfig ─────────────────────────────────────────────────────

  /// Admin only: store the Browserbase API key securely.
  /// Key is never returned in any query — same pattern as all MoneyDrive API keys.
  public shared ({ caller }) func setBrowserbaseConfig(
    apiKey : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can configure Browserbase");
    };

    browserbaseApiKey.value := apiKey;

    AnalyticsLog.logEvent(
      analyticsState,
      "admin_action",
      "browserbase_configured",
      caller.toText(),
      null,
      true,
      null,
      "{\"configured\":" # (if (apiKey != "") { "true" } else { "false" }) # "}",
      null,
    );

    #ok("Browserbase configured");
  };

  // ── isBrowserbaseConfigured ──────────────────────────────────────────────────

  /// Returns true if a Browserbase API key has been set.
  public func isBrowserbaseConfigured() : async Bool {
    browserbaseApiKey.value != "";
  };

  // ── triggerBrowserbaseHunt ───────────────────────────────────────────────────

  /// Admin only: trigger a Browserbase-driven opportunity hunt for `driverPrincipal`.
  /// Runs BrowserbaseProvider.runOpportunityHunt across the default SA target URLs,
  /// then stores findings in opportunityFindings and opportunityScans — same storage
  /// contract as the existing VPS-based triggerOpportunityHunt in opportunity-hunter-api.mo.
  /// Top 3 findings are pushed to ndunaRecommendations.
  /// Returns the scan ID on success.
  public shared ({ caller }) func triggerBrowserbaseHunt(
    driverPrincipal : Principal,
  ) : async { #ok : Text; #err : Text } {
    let capturedCaller = caller;
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);

    if (not isAdmin) {
      return #err("Unauthorized: Only admins can trigger Browserbase hunts");
    };

    if (browserbaseApiKey.value == "") {
      return #err("Browserbase not configured — set the API key in the admin panel first");
    };

    let now      = Time.now();
    let driverId = driverPrincipal.toText();
    let scanId   = "bb-scan_" # driverId # "_" # now.toText();

    let config : BBTypes.BrowserbaseConfig = {
      apiKey    = browserbaseApiKey.value;
      projectId = null;
      timeout   = 30;
    };

    // Run the hunt against default SA target URLs
    let huntResult = await BrowserbaseProvider.runOpportunityHunt(
      config,
      DEFAULT_SA_HUNT_URLS,
      "SA ride-hailing driver income opportunities",
    );

    let huntFindings : [BBTypes.OpportunityHuntResult] = switch (huntResult) {
      case (#err(e)) {
        let failedScan : OppTypes.OpportunityScan = {
          scanId;
          driverId;
          scanDate = now;
          status   = "failed";
          findings = [];
          error    = ?("Browserbase hunt error: " # e);
        };
        opportunityScans.add(scanId, failedScan);
        AnalyticsLog.logEvent(
          analyticsState,
          "browserbase",
          "hunt_failed",
          driverId,
          null,
          false,
          ?e,
          "{}",
          null,
        );
        return #err("Browserbase hunt failed: " # e);
      };
      case (#ok(findings)) { findings };
    };

    // Store each finding — same contract as opportunity-hunter-api.mo
    let findingIds = List.empty<Text>();
    var idx : Nat = 0;

    for (huntFinding in huntFindings.values()) {
      if (idx < 10) {
        let category : OppTypes.OpportunityCategory = _bbParseCategory(huntFinding.category);
        let findingId = "bb-" # now.toText() # "-" # idx.toText();
        let expiresAt = now + BB_FOURTEEN_DAYS_NS;

        let finding : OppTypes.OpportunityFinding = {
          id             = findingId;
          driverId;
          category;
          title          = huntFinding.title;
          description    = huntFinding.description;
          relevanceScore = huntFinding.relevanceScore;
          source         = "browserbase";
          discoveredAt   = now;
          expiresAt;
          dismissed      = false;
        };

        opportunityFindings.add(findingId, finding);
        findingIds.add(findingId);

        // Update driver secondary index
        let existingIds = switch (driverOpportunityIndex.get(driverId)) {
          case (null) { List.empty<Text>() };
          case (?ids) { ids };
        };
        existingIds.add(findingId);
        driverOpportunityIndex.add(driverId, existingIds);

        idx += 1;
      };
    };

    // Push top 3 to ndunaRecommendations
    let allIds = findingIds.toArray();
    let top3   = if (allIds.size() < 3) { allIds.size() } else { 3 };
    var recIdx = 0;
    while (recIdx < top3) {
      switch (opportunityFindings.get(allIds[recIdx])) {
        case (null)     {};
        case (?finding) {
          let rec : AgentTypes.NdunaRecommendation = {
            driverId;
            timestamp          = Int.abs(now).toNat64();
            recommendationType = "opportunity";
            content            = "opportunity: " # finding.title;
            confidence         = if (finding.relevanceScore >= 70) { "HIGH" }
                                 else if (finding.relevanceScore >= 40) { "MEDIUM" }
                                 else { "LOW" };
          };
          ndunaRecommendations.add(rec);
        };
      };
      recIdx += 1;
    };

    // Update listing call count
    orbisListingStatus.value := {
      orbisListingStatus.value with
      totalCalls = orbisListingStatus.value.totalCalls + 1;
    };

    // Store completed scan record
    let completedScan : OppTypes.OpportunityScan = {
      scanId;
      driverId;
      scanDate = now;
      status   = "complete";
      findings = allIds;
      error    = null;
    };
    opportunityScans.add(scanId, completedScan);

    AnalyticsLog.logEvent(
      analyticsState,
      "browserbase",
      "hunt_completed",
      driverId,
      null,
      true,
      null,
      "{\"findingCount\":" # idx.toText() # ",\"scanId\":\"" # scanId # "\"}",
      null,
    );

    #ok("Hunt completed: " # idx.toText() # " findings (scanId: " # scanId # ")");
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Parse a category string into the OpportunityCategory variant.
  private func _bbParseCategory(categoryText : Text) : OppTypes.OpportunityCategory {
    let lower = categoryText.toLower();
    if (lower.contains(#text "platform") or lower.contains(#text "newplatform")) { #newPlatform }
    else if (lower.contains(#text "intercity") or lower.contains(#text "route")) { #intercityRoute }
    else if (lower.contains(#text "promotion") or lower.contains(#text "bonus") or lower.contains(#text "challenge")) { #platformPromotion }
    else if (lower.contains(#text "income") or lower.contains(#text "delivery") or lower.contains(#text "rental")) { #incomeCategory }
    else if (lower.contains(#text "regulatory") or lower.contains(#text "legislation") or lower.contains(#text "policy")) { #regulatoryChange }
    else { #businessLead };
  };
};
