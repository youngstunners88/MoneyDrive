import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Timer "mo:core/Timer";
import Debug "mo:core/Debug";
import AccessControl "mo:caffeineai-authorization/access-control";
import IC "ic:aaaaa-aa";
import LeadTypes "../types/leads";
import LeadScraper "../lib/lead-scraper";
import LeadRanker "../lib/lead-ranker";
import LeadScheduler "../lib/lead-scheduler";
import AdvTypes "../types/advertising";
import AgentLib "../lib/agent";
import AnalyticsLog "../lib/analytics-log";
import ExaProvider "../lib/exa/ExaProvider";
import BrowserbaseProvider "../lib/browserbase/BrowserbaseProvider";

/// Public API mixin for the lead-research domain.
/// - Camofox base URL stored securely (admin-only set, never exposed to frontend)
/// - Exposes driver-facing lead queries and manual refresh trigger
/// - Weekly scheduler wired via IC Timer
/// - Tavily augments Camofox scraping: extra company discovery + hiring signal enrichment
/// - Exa enriches top 20 leads with company intelligence after Camofox/Tavily pipeline
mixin (
  analyticsLog : AnalyticsLog.State,
  accessControlState : AccessControl.AccessControlState,
  camofoxBaseUrl     : { var value : Text },
  leadsMap           : Map.Map<Text, LeadTypes.ScrapedLead>,
  leadBatchesMap     : Map.Map<Text, LeadTypes.LeadBatch>,
  auditLogMap        : Map.Map<Text, LeadTypes.ScraperAuditLog>,
  schedulerConfig    : { var value : LeadTypes.SchedulerConfig },
  companyPitches     : Map.Map<Text, AdvTypes.CompanyPitch>,
  tavilyApiKey       : { var value : Text },
  tavilyCallCount    : { var value : Nat },
  tavilyMonth        : { var value : Nat },
  /// Driver profiles, for city lookup
  profiles           : Map.Map<Principal, {
    displayName        : Text;
    currencyCode       : Text;
    subscriptionTier   : Nat;
    voiceEnabled       : Bool;
    fuelConsumptionRate : Float;
    vehicleName        : Text;
  }>,
  /// Debounce: driverId (Text) → last refresh timestamp in nanoseconds.
  /// Prevents a driver from spawning multiple concurrent scrape jobs within 5 minutes.
  lastLeadRefreshPerDriver : Map.Map<Text, Int>,
  /// Pilot mode flag — when true, Camofox and Tavily paid-tier outcalls are skipped.
  pilotMode : { var value : Bool },
  /// Exa API key — enables post-scrape company intelligence enrichment.
  exaApiKey : { var value : Text },
  /// Browserbase API key — enables company website research as Exa fallback.
  browserbaseApiKey : { var value : Text },
) {

  // ── Admin: Camofox URL management ─────────────────────────────────────────────

  /// Admin-only: store the Camofox base URL securely in the canister.
  /// Never exposed to frontend — same pattern as ElevenLabs API key.
  public shared ({ caller }) func setCamofoxBaseUrl(url : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the Camofox base URL");
    };
    camofoxBaseUrl.value := url;
  };

  /// Returns whether Camofox has been configured.
  public query func isCamofoxConfigured() : async Bool {
    camofoxBaseUrl.value != "";
  };

  // ── Scheduler config ──────────────────────────────────────────────────────────

  /// Admin-only: get current scheduler configuration.
  public query ({ caller }) func getSchedulerConfig() : async LeadTypes.SchedulerConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view scheduler config");
    };
    schedulerConfig.value;
  };

  /// Admin-only: update the scheduler configuration.
  public shared ({ caller }) func setSchedulerConfig(config : LeadTypes.SchedulerConfig) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can update scheduler config");
    };
    if (not LeadScheduler.validateConfig(config)) {
      return #err("Invalid config: dayOfWeek must be 0–6, hour must be 0–23");
    };
    schedulerConfig.value := config;
    #ok;
  };

  // ── Driver-facing lead queries ─────────────────────────────────────────────────

  /// Get leads for the calling driver. Returns current week by default;
  /// pass explicit weekNumber + year to retrieve a historical batch.
  public query ({ caller }) func getDriverLeads(
    weekNumber : ?Nat,
    year       : ?Nat,
  ) : async [LeadTypes.ScrapedLead] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    let now      = Time.now();
    let wk = switch (weekNumber) {
      case (?w) { w };
      case null { LeadRanker.isoWeekNumber(now) };
    };
    let yr = switch (year) {
      case (?y) { y };
      case null { LeadRanker.yearFromNs(now) };
    };
    let key = LeadScheduler.batchKey(driverId, wk, yr);
    switch (leadBatchesMap.get(key)) {
      case (null)   { [] };
      case (?batch) { batch.leads };
    };
  };

  /// Get a specific lead batch for the calling driver.
  public query ({ caller }) func getDriverLeadBatch(weekNumber : Nat, year : Nat) : async ?LeadTypes.LeadBatch {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let key = LeadScheduler.batchKey(caller.toText(), weekNumber, year);
    leadBatchesMap.get(key);
  };

  /// Update the status of a specific lead.
  public shared ({ caller }) func updateLeadStatus(
    leadId : Text,
    status : LeadTypes.LeadStatus,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    switch (leadsMap.get(leadId)) {
      case (null)  { #err("Lead not found: " # leadId) };
      case (?lead) {
        if (lead.driverId != caller.toText()) {
          return #err("Unauthorized: Lead belongs to a different driver");
        };
        leadsMap.add(leadId, { lead with status });
        AnalyticsLog.logEvent(
          analyticsLog,
          "lead_event",
          "lead_status_changed",
          caller.toText(),
          null,
          true,
          null,
          "{\"leadId\":\"" # leadId # "\",\"newStatus\":\"" # debug_show(status) # "\",\"company\":\"" # lead.companyName # "\"}",
          null,
        );
        #ok;
      };
    };
  };

  // ── Manual lead refresh ───────────────────────────────────────────────────────

  /// Trigger a lead refresh for the calling driver. Non-blocking: schedules a
  /// one-shot async scrape job and returns immediately.
  /// Debounced: returns early if a refresh was triggered within the last 5 minutes.
  public shared ({ caller }) func triggerLeadRefresh() : async { #ok : Text; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    // ── Pilot mode guard — skip Camofox paid outcall ─────────────────────────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: Camofox triggerLeadRefresh");
      return #ok("[pilot_mode] Lead research is disabled during the pilot period. Full scraping will activate when pilot mode is turned off.");
    };
    if (camofoxBaseUrl.value == "") {
      return #err("Camofox is not configured. Ask an admin to set the Camofox base URL.");
    };
    let driverId = caller.toText();
    let now = Time.now();

    // ── Debounce: prevent multiple concurrent scrape jobs ───────────────────
    // 5 minutes = 300_000_000_000 nanoseconds
    switch (lastLeadRefreshPerDriver.get(driverId)) {
      case (?lastRefresh) {
        if (now - lastRefresh < 300_000_000_000) {
          return #err("Refresh in progress, try again in 5 minutes");
        };
      };
      case (null) {};
    };
    // Record the refresh timestamp before spawning the timer
    lastLeadRefreshPerDriver.add(driverId, now);

    let capturedCaller = caller;
    ignore Timer.setTimer<system>(#seconds(0), func() : async () {
      await _runScraperForDriver(capturedCaller);
    });

    AnalyticsLog.logEvent(
      analyticsLog,
      "lead_event",
      "leads_refreshed",
      driverId,
      null,
      true,
      null,
      "{\"city\":\"" # (switch (profiles.get(caller)) { case (null) { "unknown" }; case (?p) { p.displayName } }) # "\"}",
      null,
    );

    #ok("Lead refresh started for driver " # driverId # ". Check back in a few minutes.");
  };

  // ── Admin: audit log ──────────────────────────────────────────────────────────

  /// Admin-only: get the full scraper audit log.
  public query ({ caller }) func getLeadAuditLog() : async [LeadTypes.ScraperAuditLog] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view the audit log");
    };
    auditLogMap.values().toArray();
  };

  // ── Internal scraper runner ───────────────────────────────────────────────────

  /// Run the full scraping pipeline for a given driver principal.
  /// After Camofox scraping, if Tavily is configured, augments results with:
  ///   1. Additional company discovery via Tavily search (up to 2 calls)
  ///   2. Hiring signal enrichment for the top 10 ranked leads (up to 3 calls)
  ///   Total Tavily calls capped at 5 per driver per run.
  private func _runScraperForDriver(driver : Principal) : async () {
    let driverId = driver.toText();
    let now      = Time.now();
    let wk       = LeadRanker.isoWeekNumber(now);
    let yr       = LeadRanker.yearFromNs(now);

    // Get driver's city from profile (fall back to "Johannesburg")
    let city = switch (profiles.get(driver)) {
      case (null) { "Johannesburg" };
      case (?p)   { if (p.displayName != "") { p.displayName } else { "Johannesburg" } };
    };

    let industries = LeadScheduler.industriesForCity(city);
    let pitchedNames = _getPitchedCompanyNames(driverId);
    let allLeads = List.empty<LeadTypes.ScrapedLead>();
    var totalScraped = 0;

    for (industry in industries.values()) {
      // Google Business
      let gbLeads = await _scrapeUrl(
        driverId, "google_business",
        LeadScraper.googleBusinessUrl(industry, city),
        industry, city, wk, yr,
      );
      for (l in gbLeads.values()) { allLeads.add(l) };
      totalScraped := totalScraped + gbLeads.size();

      // Yellow Pages SA
      let ypLeads = await _scrapeUrl(
        driverId, "yellowpages_sa",
        LeadScraper.yellowPagesSAUrl(industry, city),
        industry, city, wk, yr,
      );
      for (l in ypLeads.values()) { allLeads.add(l) };
      totalScraped := totalScraped + ypLeads.size();
    };

    // CIPC
    let cipcLeads = await _scrapeCIPC(driverId, city, wk, yr);
    for (l in cipcLeads.values()) { allLeads.add(l) };
    totalScraped := totalScraped + cipcLeads.size();

    // ── Tavily augmentation: additional company discovery ──────────────────────
    // Cap at 5 Tavily calls total per run. Use first 2 for discovery.
    var tavilyCallsUsed : Nat = 0;
    let maxTavilyCalls : Nat = 5;

    if (tavilyApiKey.value != "" and tavilyCallsUsed < maxTavilyCalls) {
      let tavilyLeads = await _tavilyDiscoverLeads(driverId, city, wk, yr, tavilyCallsUsed, maxTavilyCalls);
      for (l in tavilyLeads.0.values()) { allLeads.add(l) };
      totalScraped := totalScraped + tavilyLeads.0.size();
      tavilyCallsUsed := tavilyLeads.1;
    };

    let deduped  = LeadScraper.deduplicateLeads(allLeads.toArray());
    let filtered = LeadScheduler.filterAlreadyPitched(deduped, pitchedNames);

    // Initial ranking (without Tavily enrichment yet)
    var ranked = LeadRanker.rankLeads(filtered, city, 3, 50);

    // ── Tavily enrichment: hiring signal detection for top 10 ──────────────────
    if (tavilyApiKey.value != "" and tavilyCallsUsed < maxTavilyCalls) {
      ranked := await _enrichTopLeadsWithTavily(ranked, tavilyCallsUsed, maxTavilyCalls);
      // Re-score with Tavily signals now set on the leads
      ranked := LeadRanker.rankLeads(ranked, city, 3, 50);
    };

    // ── Exa enrichment: company intelligence for top 20 leads ─────────────────
    // Run sequentially to avoid cycle spikes.
    if (exaApiKey.value != "") {
      ranked := await _enrichTopLeadsWithExa(ranked, 20);
      // Re-rank with Exa signals now applied
      ranked := LeadRanker.rankLeads(ranked, city, 3, 50);
    };

    // ── Browserbase enrichment: fallback for leads with no Exa data ────────────
    // Only runs when Browserbase is configured and a lead has a website but no Exa data.
    // Best-effort: failures are logged and skipped, pipeline continues.
    if (browserbaseApiKey.value != "") {
      ranked := await _enrichLeadsWithBrowserbase(ranked);
      // Re-rank with Browserbase signals applied
      ranked := LeadRanker.rankLeads(ranked, city, 3, 50);
    };

    for (lead in ranked.values()) {
      leadsMap.add(lead.id, lead);
    };

    let batch    = LeadRanker.buildBatch(driverId, wk, yr, ranked, totalScraped, now);
    let batchKey = LeadScheduler.batchKey(driverId, wk, yr);
    leadBatchesMap.add(batchKey, batch);
  };

  /// Use Tavily to discover additional companies for a city.
  /// Returns (newLeads, callsUsed) — calls 2 Tavily queries (one for logistics, one broad).
  private func _tavilyDiscoverLeads(
    driverId    : Text,
    city        : Text,
    weekNumber  : Nat,
    year        : Nat,
    callsUsed   : Nat,
    maxCalls    : Nat,
  ) : async ([LeadTypes.ScrapedLead], Nat) {
    var used = callsUsed;
    let now  = Time.now();
    let newLeads = List.empty<LeadTypes.ScrapedLead>();

    // Query 1: logistics/transport focus
    if (used < maxCalls) {
      let query1 = "South African logistics transport delivery fleet companies in " # city # " actively hiring or expanding 2025 advertising opportunities";
      let raw1 = await* AgentLib.tavilySearchRaw(tavilyApiKey.value, query1);
      _incrementTavilyCount(now);
      used := used + 1;

      if (raw1 != "") {
        let companies = AgentLib.parseTavilyCompanies(raw1);
        var i = 0;
        while (i < companies.size()) {
          let (name, url) = companies[i];
          if (name.size() > 2) {
            let lead : LeadTypes.ScrapedLead = {
              id             = "tv1_" # driverId # "_" # now.toText() # "_" # i.toText();
              driverId       = driverId;
              companyName    = name;
              address        = city;
              website        = url;
              phone          = "";
              email          = "";
              industry       = "logistics";
              source         = "tavily";
              compositeScore = 0;
              scoringFactors = "";
              weekNumber     = weekNumber;
              year           = year;
              scrapedAt      = now;
              status         = #pending;
              tavilyHiringSignal = false;
              tavilySnippet      = "";
              exaEnriched        = null;
              browserbaseEnriched = null;
            };
            newLeads.add(lead);
          };
          i := i + 1;
        };
      };
    };

    // Query 2: broad SA company advertising opportunities
    if (used < maxCalls) {
      let query2 = "South African FMCG retail telecoms insurance companies in " # city # " expanding brand advertising transport 2025";
      let raw2 = await* AgentLib.tavilySearchRaw(tavilyApiKey.value, query2);
      _incrementTavilyCount(now);
      used := used + 1;

      if (raw2 != "") {
        let companies = AgentLib.parseTavilyCompanies(raw2);
        var i = 0;
        while (i < companies.size()) {
          let (name, url) = companies[i];
          if (name.size() > 2) {
            let lead : LeadTypes.ScrapedLead = {
              id             = "tv2_" # driverId # "_" # now.toText() # "_" # i.toText();
              driverId       = driverId;
              companyName    = name;
              address        = city;
              website        = url;
              phone          = "";
              email          = "";
              industry       = "retail";
              source         = "tavily";
              compositeScore = 0;
              scoringFactors = "";
              weekNumber     = weekNumber;
              year           = year;
              scrapedAt      = now;
              status         = #pending;
              tavilyHiringSignal = false;
              tavilySnippet      = "";
              exaEnriched        = null;
              browserbaseEnriched = null;
            };
            newLeads.add(lead);
          };
          i := i + 1;
        };
      };
    };

    (newLeads.toArray(), used);
  };

  /// Enrich the top 10 leads with Tavily hiring signal detection.
  /// Each call queries "[company name] South Africa is hiring expanding 2025".
  /// Returns the array of leads with tavilyHiringSignal and tavilySnippet updated.
  private func _enrichTopLeadsWithTavily(
    leads     : [LeadTypes.ScrapedLead],
    callsUsed : Nat,
    maxCalls  : Nat,
  ) : async [LeadTypes.ScrapedLead] {
    let enriched = List.empty<LeadTypes.ScrapedLead>();
    var used = callsUsed;
    let now  = Time.now();

    // Enrich at most the first 10 leads, subject to remaining call budget
    let enrichLimit = if (leads.size() < 10) { leads.size() } else { 10 };
    var i = 0;
    while (i < enrichLimit) {
      let lead = leads[i];
      if (used < maxCalls) {
        let hiringQuery = lead.companyName # " South Africa is hiring expanding 2025";
        let raw = await* AgentLib.tavilySearchRaw(tavilyApiKey.value, hiringQuery);
        _incrementTavilyCount(now);
        used := used + 1;
        if (raw != "") {
          let (hasSignal, snippet) = AgentLib.detectHiringSignal(raw);
          enriched.add({ lead with tavilyHiringSignal = hasSignal; tavilySnippet = snippet });
        } else {
          enriched.add(lead);
        };
      } else {
        enriched.add(lead);
      };
      i := i + 1;
    };

    // Append any remaining leads beyond the enriched window unchanged
    while (i < leads.size()) {
      enriched.add(leads[i]);
      i := i + 1;
    };

    enriched.toArray();
  };

  /// Enrich the top `limit` leads with Exa company intelligence.
  /// Runs sequentially to avoid cycle spikes. If Exa fails for a lead,
  /// the lead continues through the pipeline without Exa data (graceful fallback).
  private func _enrichTopLeadsWithExa(
    leads : [LeadTypes.ScrapedLead],
    limit : Nat,
  ) : async [LeadTypes.ScrapedLead] {
    let enriched = List.empty<LeadTypes.ScrapedLead>();
    let cap = if (leads.size() < limit) { leads.size() } else { limit };
    var i = 0;
    while (i < cap) {
      let lead = leads[i];
      let result = await* ExaProvider.companyResearch(
        exaApiKey.value,
        lead.companyName # " South Africa",
        pilotMode.value,
      );
      switch (result) {
        case (#ok(exa)) {
          enriched.add({ lead with exaEnriched = ?exa });
        };
        case (#err(errMsg)) {
          Debug.print("[exa] enrichment failed for " # lead.companyName # ": " # errMsg);
          enriched.add(lead); // continue without Exa data
        };
      };
      i += 1;
    };
    // Append remaining leads beyond the enriched window unchanged
    while (i < leads.size()) {
      enriched.add(leads[i]);
      i += 1;
    };
    enriched.toArray();
  };

  /// Enrich leads that have a website URL but no Exa data using Browserbase company research.
  /// Only the first lead without Exa data is enriched per run (to limit cycle consumption).
  /// Returns the full lead array with browserbaseEnriched set on qualifying leads.
  private func _enrichLeadsWithBrowserbase(
    leads : [LeadTypes.ScrapedLead],
  ) : async [LeadTypes.ScrapedLead] {
    let enriched = List.empty<LeadTypes.ScrapedLead>();
    var enrichedOne = false; // cap at one Browserbase call per pipeline run
    var i = 0;

    while (i < leads.size()) {
      let lead = leads[i];
      // Only enrich if: no Exa data, has a website URL, and haven't done one already this run
      if (
        not enrichedOne and
        lead.exaEnriched == null and
        lead.browserbaseEnriched == null and
        lead.website != ""
      ) {
        let config : BrowserbaseProvider.BrowserbaseConfig = {
          apiKey    = browserbaseApiKey.value;
          projectId = null;
          timeout   = 30;
        };
        let result = await BrowserbaseProvider.researchCompany(config, lead.website, lead.companyName);
        switch (result) {
          case (#ok(bbResult)) {
            // Map BrowserbaseProvider.BrowserbaseCompanyResult → LeadTypes.BrowserbaseCompanyResult
            let leadBbResult : LeadTypes.BrowserbaseCompanyResult = {
              companyName        = bbResult.companyName;
              websiteUrl         = bbResult.websiteUrl;
              description        = bbResult.description;
              industry           = bbResult.industry;
              estimatedEmployees = bbResult.estimatedEmployees;
              hiringSignals      = bbResult.hiringSignals;
              contactEmail       = bbResult.contactEmail;
              keyServices        = bbResult.keyServices;
              scrapedAt          = bbResult.scrapedAt;
              source             = bbResult.source;
            };
            enriched.add({ lead with browserbaseEnriched = ?leadBbResult });
            enrichedOne := true;
            Debug.print("[browserbase] enriched lead: " # lead.companyName);
          };
          case (#err(e)) {
            Debug.print("[browserbase] enrichment failed for " # lead.companyName # ": " # e);
            enriched.add(lead);
          };
        };
      } else {
        enriched.add(lead);
      };
      i += 1;
    };
    enriched.toArray();
  };

  /// Scrape a URL via Camofox: create tab → navigate → snapshot → close → parse.
  private func _scrapeUrl(
    driverId   : Text,
    source     : Text,
    url        : Text,
    industry   : Text,
    city       : Text,
    weekNumber : Nat,
    year       : Nat,
  ) : async [LeadTypes.ScrapedLead] {
    let base = camofoxBaseUrl.value;
    let now  = Time.now();
    let auditId = LeadScheduler.auditLogId(driverId, source, now);

    // Robots check
    let domain = _extractDomain(url);
    let robotsBody = await _httpGet(LeadScraper.robotsTxtUrl(domain));
    let path = _extractPath(url);
    if (not LeadScraper.isPathAllowedByRobots(robotsBody, path)) {
      auditLogMap.add(auditId, LeadScraper.buildAuditLog(
        auditId, driverId, source, url, false, 0,
        ?("Blocked by robots.txt")
      ));
      return [];
    };

    // Create Camofox tab (response is JSON like {"tabId":"abc123"})
    let createResp = await _httpPost(base # "/tabs", "{}");
    let tabId = _extractJsonValue(createResp, "tabId");
    if (tabId == "") {
      auditLogMap.add(auditId, LeadScraper.buildAuditLog(
        auditId, driverId, source, url, false, 0,
        ?("Failed to create Camofox tab")
      ));
      return [];
    };

    // Navigate
    ignore await _httpPost(
      base # "/tabs/" # tabId # "/navigate",
      LeadScraper.buildNavigateBody(url),
    );

    // Snapshot
    let snapshot = await _httpGet(base # "/tabs/" # tabId # "/snapshot");

    // Close
    ignore await _httpPost(base # "/tabs/" # tabId # "/close", "{}");

    let leads = switch (source) {
      case ("google_business") {
        LeadScraper.parseGoogleBusinessSnapshot(snapshot, driverId, city, industry, weekNumber, year)
      };
      case ("yellowpages_sa") {
        LeadScraper.parseYellowPagesSnapshot(snapshot, driverId, city, industry, weekNumber, year)
      };
      case _ { [] };
    };

    auditLogMap.add(auditId, LeadScraper.buildAuditLog(
      auditId, driverId, source, url, true, leads.size(), null
    ));
    leads;
  };

  /// Scrape CIPC with text-input interaction.
  private func _scrapeCIPC(
    driverId   : Text,
    city       : Text,
    weekNumber : Nat,
    year       : Nat,
  ) : async [LeadTypes.ScrapedLead] {
    let base    = camofoxBaseUrl.value;
    let url     = LeadScraper.cipcSearchUrl();
    let now     = Time.now();
    let auditId = LeadScheduler.auditLogId(driverId, "cipc", now);

    // Robots check
    let robotsBody = await _httpGet(LeadScraper.robotsTxtUrl("https://www.cipc.co.za"));
    if (not LeadScraper.isPathAllowedByRobots(robotsBody, "/index.php/search-enterprise/")) {
      return [];
    };

    let createResp = await _httpPost(base # "/tabs", "{}");
    let tabId = _extractJsonValue(createResp, "tabId");
    if (tabId == "") { return [] };

    ignore await _httpPost(base # "/tabs/" # tabId # "/navigate", LeadScraper.buildNavigateBody(url));
    ignore await _httpPost(base # "/tabs/" # tabId # "/type", LeadScraper.buildTypeBody("search-input", city));
    ignore await _httpPost(base # "/tabs/" # tabId # "/click", LeadScraper.buildClickBody("search-button"));

    let snapshot = await _httpGet(base # "/tabs/" # tabId # "/snapshot");
    ignore await _httpPost(base # "/tabs/" # tabId # "/close", "{}");

    let leads = LeadScraper.parseCIPCSnapshot(snapshot, driverId, weekNumber, year);
    auditLogMap.add(auditId, LeadScraper.buildAuditLog(
      auditId, driverId, "cipc", url, true, leads.size(), null
    ));
    leads;
  };

  // ── Raw HTTP helpers ──────────────────────────────────────────────────────────

  private func _httpPost(url : Text, body : Text) : async Text {
    let req : IC.http_request_args = {
      url;
      max_response_bytes = ?50_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Accept"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?body.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };
    let resp = await (with cycles = 50_000_000_000) IC.http_request(req);
    switch (resp.body.decodeUtf8()) {
      case (null)  { "" };
      case (?text) { text };
    };
  };

  private func _httpGet(url : Text) : async Text {
    let req : IC.http_request_args = {
      url;
      max_response_bytes = ?200_000;
      headers = [
        { name = "Accept"; value = "text/plain, application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = null;
      method = #get;
      transform = null;
      is_replicated = ?false;
    };
    let resp = await (with cycles = 50_000_000_000) IC.http_request(req);
    switch (resp.body.decodeUtf8()) {
      case (null)  { "" };
      case (?text) { text };
    };
  };

  // ── Private helpers ───────────────────────────────────────────────────────────

  private func _getPitchedCompanyNames(driverId : Text) : [Text] {
    let names = List.empty<Text>();
    for ((_, pitch) in companyPitches.entries()) {
      if (pitch.driverId == driverId) {
        names.add(pitch.companyName);
      };
    };
    names.toArray();
  };

  /// Increment Tavily call count, resetting if month has changed.
  private func _incrementTavilyCount(now : Int) {
    let secsPerMonth : Nat = 2_592_000; // approx 30-day months
    let month = Int.abs(now / 1_000_000_000) / secsPerMonth;
    if (tavilyMonth.value != month) {
      tavilyMonth.value := month;
      tavilyCallCount.value := 0;
    };
    tavilyCallCount.value += 1;
  };

  /// Extract domain (scheme + host) from a URL.
  private func _extractDomain(url : Text) : Text {
    var slashCount = 0;
    var domainEnd  = 0;
    let chars = url.toArray();
    var i = 0;
    while (i < chars.size()) {
      if (chars[i] == '/') {
        slashCount := slashCount + 1;
        if (slashCount == 3) { domainEnd := i; i := chars.size() };
      };
      i := i + 1;
    };
    if (domainEnd > 0) {
      Text.fromArray(chars.sliceToArray(0, domainEnd))
    } else {
      url
    };
  };

  /// Extract path portion of a URL (everything after the domain).
  private func _extractPath(url : Text) : Text {
    var slashCount = 0;
    var pathStart  = 0;
    let chars = url.toArray();
    var i = 0;
    while (i < chars.size()) {
      if (chars[i] == '/') {
        slashCount := slashCount + 1;
        if (slashCount == 3) { pathStart := i; i := chars.size() };
      };
      i := i + 1;
    };
    if (pathStart > 0) {
      Text.fromArray(chars.sliceToArray(pathStart, chars.size()))
    } else {
      "/"
    };
  };

  /// Extract a string value from a simple JSON blob: {"key":"value",...}.
  private func _extractJsonValue(json : Text, key : Text) : Text {
    let marker = "\"" # key # "\":\"";
    let parts = json.split(#text marker).toArray();
    if (parts.size() < 2) { return "" };
    let afterMarker = parts[1];
    let closing = afterMarker.split(#text "\"").toArray();
    if (closing.size() < 1) { return "" };
    closing[0];
  };
};
