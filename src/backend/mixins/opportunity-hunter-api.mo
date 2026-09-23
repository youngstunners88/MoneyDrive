import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import IC "ic:aaaaa-aa";
import OppTypes "../types/opportunity";
import AgentTypes "../types/agent";
import AgentLib "../lib/agent";

/// Public API mixin for the Opportunity Hunter domain (Tier 3).
/// Nduna autonomously scans for income opportunities outside predefined parameters:
/// new platforms, intercity routes, promotions, regulatory changes, and business leads.
/// Scan results are fetched via HTTP outcall to a VPS sidecar running browser-use.
/// Findings expire after 14 days; max 10 findings stored per driver per scan.
/// After storing findings, the top 3 are pushed into the driver's ndunaRecommendations.
mixin (
  accessControlState   : AccessControl.AccessControlState,
  profiles             : Map.Map<Principal, {
    displayName        : Text;
    currencyCode       : Text;
    subscriptionTier   : Nat;
    voiceEnabled       : Bool;
    fuelConsumptionRate : Float;
    vehicleName        : Text;
  }>,
  /// Primary finding store: findingId → OpportunityFinding
  opportunityFindings  : Map.Map<Text, OppTypes.OpportunityFinding>,
  /// Scan history: scanId → OpportunityScan
  opportunityScans     : Map.Map<Text, OppTypes.OpportunityScan>,
  /// Secondary index: driverId (Text) → list of findingIds for that driver
  driverOpportunityIndex : Map.Map<Text, List.List<Text>>,
  /// VPS sidecar URL for the browser-use hunter service (admin-set, never exposed)
  hunterVpsUrl         : { var value : Text },
  /// Bearer auth key for the VPS sidecar (admin-set, never exposed)
  hunterVpsKey         : { var value : Text },
  /// Driver recommendation list — findings push top 3 summaries here after each scan
  ndunaRecommendations : List.List<AgentTypes.NdunaRecommendation>,
) {

  // ── Constants ────────────────────────────────────────────────────────────

  /// 14 days in nanoseconds
  let FOURTEEN_DAYS_NS : Int = 14 * 24 * 60 * 60 * 1_000_000_000;

  // ── Admin: VPS config ─────────────────────────────────────────────────────

  /// Admin only: store the opportunity hunter VPS URL and bearer key securely.
  /// Never exposed to the frontend — same pattern as Camofox, Hyperframes VPS.
  public shared ({ caller }) func setOpportunityHunterConfig(
    url : Text,
    key : Text,
  ) : async { #ok : Bool; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can configure the opportunity hunter");
    };
    if (url.size() > 0 and not url.startsWith(#text "https://")) {
      return #err("URL must start with https://");
    };
    hunterVpsUrl.value := url;
    hunterVpsKey.value := key;
    #ok(true);
  };

  /// Returns whether the opportunity hunter VPS has been configured.
  public query func isOpportunityHunterConfigured() : async Bool {
    hunterVpsUrl.value != "" and hunterVpsKey.value != ""
  };

  // ── Driver: trigger hunt ──────────────────────────────────────────────────

  /// Trigger an opportunity hunt for the given driver via the VPS sidecar.
  /// HTTP POST to hunterVpsUrl with JSON body: { driverId, city, platforms, brief="open" }.
  /// Response is parsed line-by-line; findings are stored and indexed by driverId.
  /// Top 3 findings are pushed to ndunaRecommendations for the driver.
  /// Findings expire after 14 days; max 10 findings stored per driver per scan.
  /// Requires Tier 3+ subscription when called by the driver themselves;
  /// admins may trigger for any driverId.
  public shared ({ caller }) func triggerOpportunityHunt(driverId : Text) : async { #ok : Text; #err : Text } {
    // Capture caller BEFORE any await
    let capturedCaller = caller;
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);

    if (not AccessControl.hasPermission(accessControlState, capturedCaller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    // Tier check: Tier 3 or admin
    if (not isAdmin) {
      let profile = switch (profiles.get(capturedCaller)) {
        case (null) { return #err("Profile not found — create your profile first") };
        case (?p)   { p };
      };
      if (profile.subscriptionTier < 3) {
        return #err("Opportunity Hunter requires Tier 3 subscription.");
      };
    };

    // Config check
    if (hunterVpsUrl.value == "" or hunterVpsKey.value == "") {
      return #err("Opportunity Hunter is not configured. Ask an admin to set the VPS URL and key.");
    };

    let now = Time.now();
    let scanId = "scan_" # driverId # "_" # now.toText();

    // Build the HTTP POST body
    let requestBody =
      "{\"driverId\":\"" # AgentLib.escapeJson(driverId) # "\"," #
      "\"brief\":\"open\"," #
      "\"city\":\"South Africa\"," #
      "\"timestamp\":" # now.toText() # "}";

    let httpRequest : IC.http_request_args = {
      url              = hunterVpsUrl.value;
      max_response_bytes = ?200_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # hunterVpsKey.value },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body         = ?requestBody.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let httpResponse = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      let failedScan : OppTypes.OpportunityScan = {
        scanId   = scanId;
        driverId = driverId;
        scanDate = now;
        status   = "failed";
        findings = [];
        error    = ?("Network error: " # e.message());
      };
      opportunityScans.add(scanId, failedScan);
      return #err("Opportunity Hunt failed: " # e.message());
    };

    if (httpResponse.status != 200) {
      let errBody = switch (httpResponse.body.decodeUtf8()) {
        case (null) { "HTTP " # httpResponse.status.toText() };
        case (?t)   { "HTTP " # httpResponse.status.toText() # ": " # t };
      };
      let failedScan : OppTypes.OpportunityScan = {
        scanId   = scanId;
        driverId = driverId;
        scanDate = now;
        status   = "failed";
        findings = [];
        error    = ?errBody;
      };
      opportunityScans.add(scanId, failedScan);
      return #err(errBody);
    };

    let responseText = switch (httpResponse.body.decodeUtf8()) {
      case (null) { "" };
      case (?t)   { t };
    };

    // Parse response line-by-line for findings
    // Each line may contain: {"title":"...","description":"...","category":"...","score":N}
    let findingIds = List.empty<Text>();
    let lines = responseText.split(#char '\n');
    var idx : Nat = 0;

    for (line in lines) {
      if (idx >= 10) {
        // max 10 findings per scan
      } else {
        let title = _extractJsonTextField(line, "title");
        let description = _extractJsonTextField(line, "description");
        let categoryText = _extractJsonTextField(line, "category");
        let scoreText = _extractJsonTextField(line, "score");

        if (title.size() > 0) {
          let score : Nat = switch (Nat.fromText(scoreText)) {
            case (?n) { if (n > 100) { 100 } else { n } };
            case (null) { 50 };
          };

          let category : OppTypes.OpportunityCategory = _parseCategory(categoryText);
          let findingId = driverId # "-" # idx.toText() # "-" # now.toText();
          let expiresAt = now + FOURTEEN_DAYS_NS;

          let finding : OppTypes.OpportunityFinding = {
            id             = findingId;
            driverId       = driverId;
            category       = category;
            title          = title;
            description    = if (description.size() > 0) { description } else { title };
            relevanceScore = score;
            source         = "vps-hunter";
            discoveredAt   = now;
            expiresAt      = expiresAt;
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

          idx := idx + 1;
        };
      };
    };

    // Push top 3 findings to ndunaRecommendations
    let allFindingIds = findingIds.toArray();
    let top3Count = if (allFindingIds.size() < 3) { allFindingIds.size() } else { 3 };
    var recIdx : Nat = 0;
    while (recIdx < top3Count) {
      switch (opportunityFindings.get(allFindingIds[recIdx])) {
        case (null)     {};
        case (?finding) {
          let rec : AgentTypes.NdunaRecommendation = {
            driverId           = driverId;
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
      recIdx := recIdx + 1;
    };

    // Store completed scan record
    let completedScan : OppTypes.OpportunityScan = {
      scanId   = scanId;
      driverId = driverId;
      scanDate = now;
      status   = "complete";
      findings = allFindingIds;
      error    = null;
    };
    opportunityScans.add(scanId, completedScan);

    #ok(scanId);
  };

  // ── Driver: view findings ─────────────────────────────────────────────────

  /// Return the most recent non-expired, non-dismissed findings for the calling driver.
  /// Sorted by relevanceScore descending, capped at `limit` results.
  /// Requires Tier 3+ subscription.
  public query ({ caller }) func getDriverOpportunities(limit : Nat) : async [OppTypes.OpportunityFinding] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(caller)) {
      case (null) { return [] };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin and profile.subscriptionTier < 3) {
      return [];
    };

    let driverId = caller.toText();
    let findingIds = switch (driverOpportunityIndex.get(driverId)) {
      case (null) { return [] };
      case (?ids) { ids.toArray() };
    };

    let now = Time.now();
    let result = List.empty<OppTypes.OpportunityFinding>();
    for (fid in findingIds.values()) {
      switch (opportunityFindings.get(fid)) {
        case (null)     {};
        case (?finding) {
          if (not finding.dismissed and finding.expiresAt > now) {
            result.add(finding);
          };
        };
      };
    };

    // Sort by relevanceScore descending
    let sorted = result.toArray().sort(func(a, b) {
      Nat.compare(b.relevanceScore, a.relevanceScore)
    });

    // Cap at limit
    let cap = if (sorted.size() < limit) { sorted.size() } else { limit };
    sorted.sliceToArray(0, cap);
  };

  /// Dismiss an opportunity finding owned by the calling driver.
  /// Returns #ok(true) on success, #err with reason on failure.
  public shared ({ caller }) func dismissOpportunity(findingId : Text) : async { #ok : Bool; #err : Text } {
    let capturedCaller = caller;

    if (not AccessControl.hasPermission(accessControlState, capturedCaller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(capturedCaller)) {
      case (null) { return #err("Profile not found") };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);
    if (not isAdmin and profile.subscriptionTier < 3) {
      return #err("Opportunity Hunter requires Tier 3 subscription.");
    };

    let driverId = capturedCaller.toText();
    switch (opportunityFindings.get(findingId)) {
      case (null)     { #err("Finding not found: " # findingId) };
      case (?finding) {
        if (finding.driverId != driverId and not isAdmin) {
          return #err("Unauthorized: Finding belongs to a different driver");
        };
        opportunityFindings.add(findingId, { finding with dismissed = true });
        #ok(true);
      };
    };
  };

  // ── Status ────────────────────────────────────────────────────────────────

  /// Return hunter configuration and last-run status (admin or Tier 3 driver).
  public query ({ caller }) func getOpportunityHunterStatus() : async {
    configured : Bool;
    lastRun    : Int;
    lastError  : Text;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };

    let configured = hunterVpsUrl.value != "" and hunterVpsKey.value != "";
    let driverId = caller.toText();

    // Find most recent scan for this driver
    var lastRun : Int = 0;
    var lastError : Text = "";

    for ((_, scan) in opportunityScans.entries()) {
      if (scan.driverId == driverId and scan.scanDate > lastRun) {
        lastRun := scan.scanDate;
        lastError := switch (scan.error) {
          case (null)  { "" };
          case (?err)  { err };
        };
      };
    };

    { configured; lastRun; lastError };
  };

  // ── Private helpers ───────────────────────────────────────────────────────

  /// Extract a string field value from a simple JSON object line.
  /// Handles both string values ("field":"value") and numeric values ("field":N).
  private func _extractJsonTextField(json : Text, fieldName : Text) : Text {
    // Try string value first: "field":"value"
    let needle = "\"" # fieldName # "\":\"";
    switch (_splitOnFirst(json, needle)) {
      case (?(_, after)) { _takeUntilQuote(after) };
      case (null) {
        // Try numeric value: "field":N
        let numNeedle = "\"" # fieldName # "\":";
        switch (_splitOnFirst(json, numNeedle)) {
          case (null) { "" };
          case (?(_, after)) {
            // Read until comma, }, or end
            var result = "";
            label scan for (c in after.toIter()) {
              let code = c.toNat32();
              if (code == 44 or code == 125 or code == 10 or code == 13) {
                break scan;
              };
              result := result # Text.fromChar(c);
            };
            result.trim(#predicate(func(c : Char) : Bool { c == ' ' }));
          };
        };
      };
    };
  };

  /// Split text on first occurrence of sep.
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

  /// Take characters until the first unescaped double-quote.
  private func _takeUntilQuote(text : Text) : Text {
    var result = "";
    var escaped = false;
    for (c in text.toIter()) {
      let code = c.toNat32();
      if (escaped) {
        if (c == 'n') { result := result # "\n" }
        else if (c == 'r') { result := result # "\r" }
        else if (c == 't') { result := result # "\t" }
        else { result := result # Text.fromChar(c) };
        escaped := false;
      } else if (code == 92) {
        escaped := true;
      } else if (code == 34) {
        return result;
      } else {
        result := result # Text.fromChar(c);
      };
    };
    result;
  };

  /// Parse a category string into the OpportunityCategory variant.
  private func _parseCategory(categoryText : Text) : OppTypes.OpportunityCategory {
    let lower = categoryText.toLower();
    if (lower.contains(#text "platform")) { #newPlatform }
    else if (lower.contains(#text "intercity") or lower.contains(#text "route")) { #intercityRoute }
    else if (lower.contains(#text "promotion") or lower.contains(#text "bonus") or lower.contains(#text "challenge")) { #platformPromotion }
    else if (lower.contains(#text "income") or lower.contains(#text "delivery") or lower.contains(#text "rental") or lower.contains(#text "freight")) { #incomeCategory }
    else if (lower.contains(#text "lead") or lower.contains(#text "business") or lower.contains(#text "advertising")) { #businessLead }
    else if (lower.contains(#text "regulatory") or lower.contains(#text "legislation") or lower.contains(#text "sars") or lower.contains(#text "policy")) { #regulatoryChange }
    else { #businessLead }; // default fallback
  };
};
