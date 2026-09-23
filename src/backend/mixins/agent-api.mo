import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Debug "mo:core/Debug";
import AccessControl "mo:caffeineai-authorization/access-control";
import AgentTypes "../types/agent";
import DocTypes "../types/document";
import AgentLib "../lib/agent";
import AnalyticsLog "../lib/analytics-log";
import RateLimiter "../lib/gateway/RateLimiter";
import GatewayMetrics "../lib/gateway/GatewayMetrics";
import IC "ic:aaaaa-aa";

/// Public API mixin for the Nduna AI Agent (Tier 3 exclusive).
/// Nduna is a persistent analytics tool — it learns over time via ICP canister storage.
/// All conversation history, memory entries, driver analytics profiles, and recommendation
/// outcomes are persisted for the monthly learning loop.
mixin (
  analyticsLog : AnalyticsLog.State,
  rateLimiterState : RateLimiter.State,
  gatewayMetricsState : GatewayMetrics.State,
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, {
    displayName : Text;
    currencyCode : Text;
    subscriptionTier : Nat;
    voiceEnabled : Bool;
    fuelConsumptionRate : Float;
    vehicleName : Text;
  }>,
  trips : Map.Map<Principal, Map.Map<Text, {
    tripId : Text;
    date : Int;
    platform : Text;
    amount : Float;
    durationMinutes : Nat;
    notes : Text;
  }>>,
  expenses : Map.Map<Principal, Map.Map<Text, {
    expenseId : Text;
    category : Text;
    amount : Float;
    date : Int;
    notes : Text;
  }>>,
  fuelLogs : Map.Map<Principal, Map.Map<Int, {
    date : Int;
    distance : Float;
    fuelUsed : Float;
    cost : Float;
  }>>,
  shifts : Map.Map<Principal, Map.Map<Text, {
    shiftId : Text;
    date : Int;
    startTime : Text;
    endTime : Text;
    targetEarnings : Float;
    status : Text;
    notes : Text;
  }>>,
  events : Map.Map<Principal, Map.Map<Text, {
    eventId : Text;
    title : Text;
    description : Text;
    date : Int;
    location : Text;
    category : Text;
    isUserCreated : Bool;
  }>>,
  openClawApiKey : { var value : ?Text },
  openClawApiUrl : { var value : Text },
  openClawModel : { var value : Text },
  aiGatewayUrl : { var value : ?Text },
  aiGatewayApiKey : { var value : ?Text },
  tavilyApiKeyStore : { var value : Text },
  tavilyCallCountStore : { var value : Nat },
  tavilyMonthStore : { var value : Nat },
  agentConversations : Map.Map<Principal, AgentTypes.ConversationState>,
  hermesHistory : Map.Map<Principal, List.List<AgentTypes.AgentMessage>>,
  driverAnalyticsProfiles : Map.Map<Principal, AgentTypes.DriverAnalyticsProfile>,
  driverMemories : Map.Map<Principal, AgentTypes.DriverMemory>,
  driverMemoryEntries : Map.Map<Principal, List.List<AgentTypes.DriverMemoryEntry>>,
  ndunaRecommendations : List.List<AgentTypes.NdunaRecommendation>,
  ndunaOutcomes : Map.Map<Nat, AgentTypes.RecommendationOutcome>,
  ndunaPromptState : { var value : AgentTypes.NdunaSystemPromptState },
  driverRatings : Map.Map<Principal, Float>,
  behavioralEvents : Map.Map<Principal, List.List<AgentTypes.BehavioralEvent>>,
  outcomeEvents : Map.Map<Principal, List.List<AgentTypes.OutcomeEvent>>,
  elevenLabsAgentIdStore : { var value : Text },
  elevenLabsApiKeyStore : { var value : Text },
  orbisApiKeyStore : { var value : Text },
  pilotMode : { var value : Bool },
  documentsMap : Map.Map<Text, DocTypes.DocumentRecord>,
  driverDocIndex : Map.Map<Text, List.List<Text>>,
) {

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Persist a message exchange into the stable history map.
  /// Maintains a rolling window of max 200 messages per driver.
  func persistMessage(principal : Principal, role : Text, content : Text, timestamp : Int) {
    let msg : AgentTypes.AgentMessage = { role; content; timestamp };
    let existing = switch (hermesHistory.get(principal)) {
      case (null) { List.empty<AgentTypes.AgentMessage>() };
      case (?hist) { hist };
    };
    existing.add(msg);
    // Rolling window: keep only the last 200 messages
    if (existing.size() > 200) {
      let arr = existing.toArray();
      let dropCount = arr.size() - 200 : Nat;
      let trimmed = List.empty<AgentTypes.AgentMessage>();
      var i = dropCount;
      while (i < arr.size()) {
        trimmed.add(arr[i]);
        i += 1;
      };
      hermesHistory.add(principal, trimmed);
    } else {
      hermesHistory.add(principal, existing);
    };
  };

  /// Get the persisted history for a driver as an array.
  func getHistory(principal : Principal) : [AgentTypes.AgentMessage] {
    switch (hermesHistory.get(principal)) {
      case (null) { [] };
      case (?hist) { hist.toArray() };
    };
  };

  /// Rebuild and persist the analytics profile for a driver.
  func rebuildProfile(principal : Principal, now : Int) {
    let tripsArr = switch (trips.get(principal)) {
      case (null) { [] };
      case (?m) { m.values().toArray() };
    };
    let expensesArr = switch (expenses.get(principal)) {
      case (null) { [] };
      case (?m) { m.values().toArray() };
    };
    let fuelArr = switch (fuelLogs.get(principal)) {
      case (null) { [] };
      case (?m) { m.values().toArray() };
    };
    let analyticsProfile = AgentLib.computeAnalyticsProfile(tripsArr, expensesArr, fuelArr, now);
    driverAnalyticsProfiles.add(principal, analyticsProfile);
  };

  /// Get all memory entries for a driver as an array.
  func getMemoryEntries(principal : Principal) : [AgentTypes.DriverMemoryEntry] {
    switch (driverMemoryEntries.get(principal)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  /// Get current calendar month as a Nat (seconds-based approximation).
  func currentMonth(now : Int) : Nat {
    Int.abs(now / 1_000_000_000 / 2_592_000); // approx 30-day months
  };

  /// Increment Tavily call count, resetting if month has changed.
  func incrementTavilyCount(now : Int) {
    let month = currentMonth(now);
    if (tavilyMonthStore.value != month) {
      tavilyMonthStore.value := month;
      tavilyCallCountStore.value := 0;
    };
    tavilyCallCountStore.value += 1;
  };

  /// Assemble the full driver context string for Hermes — includes analytics + live data.
  func buildDriverContext(principal : Principal, now : Int) : Text {
    let profile = switch (profiles.get(principal)) {
      case (null) { { displayName = "Unknown"; currencyCode = "ZAR"; subscriptionTier = 3; vehicleName = "Unknown"; voiceEnabled = false; fuelConsumptionRate = 0.0 } };
      case (?p) { p };
    };

    // ── Analytics profile section ──────────────────────────────────────────
    let analyticsSection = switch (driverAnalyticsProfiles.get(principal)) {
      case (null) {
        let tripsArr = switch (trips.get(principal)) {
          case (null) { [] };
          case (?m) { m.values().toArray() };
        };
        let expensesArr = switch (expenses.get(principal)) {
          case (null) { [] };
          case (?m) { m.values().toArray() };
        };
        let fuelArr = switch (fuelLogs.get(principal)) {
          case (null) { [] };
          case (?m) { m.values().toArray() };
        };
        let ap = AgentLib.computeAnalyticsProfile(tripsArr, expensesArr, fuelArr, now);
        driverAnalyticsProfiles.add(principal, ap);
        AgentLib.buildAnalyticsContext(ap, profile.currencyCode);
      };
      case (?ap) { AgentLib.buildAnalyticsContext(ap, profile.currencyCode) };
    };

    // ── Next upcoming shift ────────────────────────────────────────────────
    var nextShiftText = "[no shift scheduled]";
    switch (shifts.get(principal)) {
      case (null) {};
      case (?userShifts) {
        var nextDate : Int = 0;
        var nextShiftStr = "";
        for (shift in userShifts.values()) {
          if (shift.date > now and (nextDate == 0 or shift.date < nextDate)) {
            nextDate := shift.date;
            nextShiftStr := shift.startTime # "–" # shift.endTime # " (target: " # profile.currencyCode # " " # shift.targetEarnings.toText() # ")";
          };
        };
        if (nextShiftStr != "") { nextShiftText := nextShiftStr };
      };
    };

    // ── Upcoming events (next 3) ────────────────────────────────────────────
    var upcomingEventsText = "[no upcoming events]";
    switch (events.get(principal)) {
      case (null) {};
      case (?userEvents) {
        var futureEvents : [(Int, Text)] = [];
        for (ev in userEvents.values()) {
          if (ev.date > now) {
            futureEvents := futureEvents.concat([(ev.date, ev.title # " @ " # ev.location)]);
          };
        };
        let sorted = futureEvents.sort(func((da, _ta), (db, _tb)) {
          if (da < db) { #less } else if (da > db) { #greater } else { #equal }
        });
        let take = if (sorted.size() < 3) { sorted.size() } else { 3 };
        if (take > 0) {
          var evText = "";
          var ei = 0;
          while (ei < take) {
            let (_, title) = sorted[ei];
            if (evText != "") { evText := evText # "; " };
            evText := evText # title;
            ei += 1;
          };
          upcomingEventsText := evText;
        };
      };
    };

    "TODAY'S DATE: " # AgentLib.formatDate(now) # "\n\n" #
    "Driver: " # profile.displayName #
    " | Tier: " # profile.subscriptionTier.toText() #
    " | Vehicle: " # profile.vehicleName #
    " | Currency: " # profile.currencyCode #
    "\n\n" # analyticsSection #
    "\nNext shift: " # nextShiftText #
    "\nUpcoming events: " # upcomingEventsText;
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Tier 3 only: send a message to the Nduna AI Agent.
  /// Nduna loads the driver's full conversation history, memory entries, and analytics data.
  /// Each exchange is persisted to stable state — Nduna remembers everything.
  /// contextData: optional behavioral context string injected after the date section.
  public shared ({ caller }) func queryAIAgent(message : Text, contextData : ?Text) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Must be logged in");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) { return #err("Profile not found. Please set up your profile first.") };
      case (?p) { p };
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    if (profile.subscriptionTier < 3 and not isAdmin) {
      return #err("Nduna AI requires Tier 3 (R800/month) subscription.");
    };

    let apiKey = switch (openClawApiKey.value) {
      case (null) {
        AnalyticsLog.logEvent(analyticsLog, "error", "queryAIAgent", caller.toText(), null, false, ?"API key not configured", "{}", null);
        return #err("Nduna AI is not configured yet. Ask the admin to set the OpenRouter API key.");
      };
      case (?k) {
        if (k == "") {
          AnalyticsLog.logEvent(analyticsLog, "error", "queryAIAgent", caller.toText(), null, false, ?"API key empty", "{}", null);
          return #err("Nduna AI is not configured yet. Ask the admin to set the OpenRouter API key.");
        };
        k;
      };
    };

    let now = Time.now();

    // ── Rate limiting (admin bypass) ──────────────────────────────────────────
    if (not isAdmin) {
      // Convert nanoseconds → milliseconds for the new DailyBucket API.
      let nowMs : Int = now / 1_000_000;
      switch (RateLimiter.checkAndIncrement(caller, profile.subscriptionTier, rateLimiterState.buckets, nowMs)) {
        case (#err(#LimitExceeded { tier = _; resetAtMidnight })) {
          let msg = "You've reached your daily query limit. Resets at " # resetAtMidnight # ".";
          AnalyticsLog.logEvent(analyticsLog, "rate_limit", "queryAIAgent", caller.toText(), null, false, ?msg, "{\"tier\":" # profile.subscriptionTier.toText() # "}", null);
          return #err(msg);
        };
        case (#err(#InvalidTier)) {
          let msg = "Invalid subscription tier. Please contact support.";
          AnalyticsLog.logEvent(analyticsLog, "rate_limit", "queryAIAgent", caller.toText(), null, false, ?msg, "{}", null);
          return #err(msg);
        };
        case (#ok(_remaining)) {};
      };
    };

    // Recalculate analytics profile to ensure Hermes always has fresh data
    rebuildProfile(caller, now);

    // Build full driver context including analytics
    let driverContext = buildDriverContext(caller, now);

    // Load memory entries and free-form memory
    let memEntries = getMemoryEntries(caller);
    let driverMem = driverMemories.get(caller);

    // Load full persisted history from stable state
    let persistedHistory = getHistory(caller);

    let apiUrl = openClawApiUrl.value;
    let model = openClawModel.value;

    // ── Pilot mode: restrict to free-tier OpenRouter models ──────────────────
    // When pilot_mode is ON, reject any paid model before making the HTTP call.
    let pilotFreeModels = [
      "deepseek/deepseek-chat-v3-0324:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen-2.5-72b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-2-9b-it:free",
    ];
    if (pilotMode.value) {
      let isAllowed = pilotFreeModels.filter(func(m : Text) : Bool { m == model }).size() > 0;
      if (not isAllowed) {
        return #err("pilot_mode: free models only");
      };
    };

    // Compute cohort for cohort-aware system prompt injection
    let analytics = driverAnalyticsProfiles.get(caller);
    let (tripsMonth, earningsMonth) = switch (analytics) {
      case (null) { (0, 0.0) };
      case (?ap) { (ap.totalTrips / 12, ap.totalEarnings / 12.0) };
    };
    let cohort = AgentLib.classifyDriver(tripsMonth, earningsMonth);
    let storedRating = switch (driverRatings.get(caller)) {
      case (null) { 4.5 };
      case (?r) { r };
    };

    // Persist the user message BEFORE the call so it's not lost if call fails
    persistMessage(caller, "user", message, now);

    // Compute full current date+time strings at request time from the IC system clock.
    // These are passed explicitly so Nduna can never hallucinate from training data.
    let (currentDate, currentTime) = AgentLib.formatDateTimeSAST(now);

    // ── Inject analytics context if message is analytics-related ──────────────
    let analyticsContext = if (AnalyticsLog.isAnalyticsQuery(message)) {
      let recentEvts = AnalyticsLog.getEventsByDriver(analyticsLog, caller.toText(), 20);
      AnalyticsLog.buildAnalyticsContext(recentEvts);
    } else { "" };

    // ── Inject optional behavioral context from frontend ──────────────────────
    let behavioralContextSection = switch (contextData) {
      case (null) { "" };
      case (?ctx) {
        if (ctx == "") { "" } else { "\n\nDRIVER CONTEXT: " # ctx }
      };
    };

    let enrichedDriverContext = driverContext # analyticsContext # behavioralContextSection;

    // ── Capture start time for duration tracking ──────────────────────────────
    let startTime = Time.now();

    // Pass gateway config so GatewayRouter can make the routing decision.
    // metricsState is always provided for fire-and-forget recording.
    // orbisApiKey is passed for PQS pre-flight + Orbis LLM fallback.
    let orbisKey : ?Text = if (orbisApiKeyStore.value == "") { null } else { ?orbisApiKeyStore.value };

    // ── Fetch Markdown-ready driver documents for Nduna context ──────────────
    let driverDocs : ?[DocTypes.DocumentRecord] = switch (driverDocIndex.get(caller.toText())) {
      case (null) { null };
      case (?docIds) {
        let readyDocs = List.empty<DocTypes.DocumentRecord>();
        for (docId in docIds.toArray().values()) {
          switch (documentsMap.get(docId)) {
            case (null) {};
            case (?doc) {
              if (not doc.deleted) {
                switch (doc.markdownStatus) {
                  case (?(#ready)) { readyDocs.add(doc) };
                  case (_) {};
                };
              };
            };
          };
        };
        if (readyDocs.size() > 0) { ?readyDocs.toArray() } else { null };
      };
    };

    let (reply, pqsScore) = await* AgentLib.queryAgent(
      apiKey, apiUrl, model, message, persistedHistory,
      currentDate, currentTime, enrichedDriverContext,
      memEntries, driverMem, driverDocs,
      ndunaPromptState.value.evolutionDelta,
      ?cohort, storedRating, now,
      aiGatewayUrl.value, aiGatewayApiKey.value, ?gatewayMetricsState,
      orbisKey,
    );

    let durationMs = (Time.now() - startTime) / 1_000_000;

    // Persist the assistant reply
    persistMessage(caller, "assistant", reply, now);

    // Tier label for analytics events
    let tierText = if (isAdmin) { ?"admin" }
                   else { ?(profile.subscriptionTier.toText()) };

    // ── Log PQS check result if available ─────────────────────────────────────
    switch (pqsScore) {
      case (null) {};
      case (?score) {
        let passed = score >= 40;
        AnalyticsLog.logEvent(
          analyticsLog,
          "pqs_check",
          "queryAIAgent",
          caller.toText(),
          null,
          passed,
          null,
          "{\"score\":" # score.toText() # ",\"passed\":" # (if (passed) { "true" } else { "false" }) # "}",
          tierText,
        );
      };
    };

    // ── Log the Nduna query event ──────────────────────────────────────────────
    AnalyticsLog.logEvent(
      analyticsLog,
      "nduna_query",
      "queryAIAgent",
      caller.toText(),
      ?durationMs,
      true,
      null,
      "{\"model\":\"" # model # "\",\"msgLen\":" # message.size().toText() # ",\"hasPqs\":" # (switch (pqsScore) { case (null) { "false" }; case (?_) { "true" } }) # "}",
      tierText,
    );

    #ok(reply);
  };

  /// Clear the caller's entire Nduna conversation history from persistent storage.
  public shared ({ caller }) func clearAgentConversation() : async () {
    hermesHistory.remove(caller);
    agentConversations.remove(caller);
  };

  /// Returns how many Nduna queries the caller has remaining today based on their tier.
  /// Admins always return 999 (unlimited).
  public query ({ caller }) func getRemainingNdunaQueries() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return 0;
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return 999;
    };
    let tier = switch (profiles.get(caller)) {
      case (null) { 1 };
      case (?p) { p.subscriptionTier };
    };
    RateLimiter.getRemainingQueries(caller, tier, rateLimiterState.buckets, Time.now() / 1_000_000);
  };

  /// Get the caller's full driver analytics profile as computed by Hermes.
  public query ({ caller }) func getDriverAnalyticsProfile() : async ?AgentTypes.DriverAnalyticsProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    driverAnalyticsProfiles.get(caller);
  };

  /// Trigger a full recalculation of the caller's driver analytics profile.
  public shared ({ caller }) func recalculateDriverProfile() : async AgentTypes.DriverAnalyticsProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return {
        totalTrips = 0; totalEarnings = 0.0; totalExpenses = 0.0;
        totalFuelCost = 0.0; avgEarningsPerHour = 0.0; topEarningDays = [];
        peakHourRanges = []; estimatedCarExposure = 0; totalKmsDriven = 0.0; lastCalculated = 0;
      };
    };
    let now = Time.now();
    rebuildProfile(caller, now);
    switch (driverAnalyticsProfiles.get(caller)) {
      case (null) {
        { totalTrips = 0; totalEarnings = 0.0; totalExpenses = 0.0;
          totalFuelCost = 0.0; avgEarningsPerHour = 0.0; topEarningDays = [];
          peakHourRanges = []; estimatedCarExposure = 0; totalKmsDriven = 0.0; lastCalculated = now }
      };
      case (?ap) { ap };
    };
  };

  /// Update the persistent free-form Nduna memory for the caller.
  /// Call this after conversations when important notes or profile info should be saved.
  public shared ({ caller }) func updateDriverMemory(notes : Text, userProfile : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return;
    };
    let mem : AgentTypes.DriverMemory = {
      agentNotes = notes;
      userProfile = userProfile;
      lastUpdated = Time.now();
    };
    driverMemories.add(caller, mem);
  };

  /// Get the caller's persistent Nduna memory.
  public query ({ caller }) func getDriverMemory() : async ?AgentTypes.DriverMemory {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    driverMemories.get(caller);
  };

  /// Add a structured memory entry — Nduna calls this when it learns a new preference, fact, goal, or learning.
  public shared ({ caller }) func addDriverMemoryEntry(entry : AgentTypes.DriverMemoryEntry) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized");
    };
    // Validate category
    let validCategories = ["preference", "fact", "goal", "learning"];
    let isValid = validCategories.filter(func(c : Text) : Bool { c == entry.category }).size() > 0;
    if (not isValid) {
      return #err("Invalid category. Must be one of: preference, fact, goal, learning");
    };
    let existing = switch (driverMemoryEntries.get(caller)) {
      case (null) { List.empty<AgentTypes.DriverMemoryEntry>() };
      case (?list) { list };
    };
    let entryWithTimestamp : AgentTypes.DriverMemoryEntry = {
      entry with timestamp = Time.now();
    };
    // Replace existing entry with same key+category if present
    var replaced = false;
    existing.mapInPlace(func(e : AgentTypes.DriverMemoryEntry) : AgentTypes.DriverMemoryEntry {
      if (e.key == entry.key and e.category == entry.category) {
        replaced := true;
        entryWithTimestamp;
      } else { e };
    });
    if (not replaced) {
      existing.add(entryWithTimestamp);
    };
    driverMemoryEntries.add(caller, existing);
    #ok("Memory entry saved");
  };

  /// Get all structured memory entries for the caller.
  public query ({ caller }) func getDriverMemoryEntries() : async [AgentTypes.DriverMemoryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };
    getMemoryEntries(caller);
  };

  // ── Custom MoneyDrive Skills ────────────────────────────────────────────────

  /// Returns last 7 days earnings snapshot as structured text for Hermes.
  public query ({ caller }) func getDriverEarningsSnapshot() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return "Unauthorized";
    };
    let now = Time.now();
    let sevenDaysAgo = now - 604_800_000_000_000; // 7 days in nanoseconds

    let currency = switch (profiles.get(caller)) {
      case (null) { "ZAR" };
      case (?p) { p.currencyCode };
    };

    let allTrips = switch (trips.get(caller)) {
      case (null) { [] };
      case (?m) { m.values().toArray() };
    };
    let recentTrips = allTrips.filter(func(t : { tripId : Text; date : Int; platform : Text; amount : Float; durationMinutes : Nat; notes : Text }) : Bool {
      t.date >= sevenDaysAgo;
    });

    var grossRevenue : Float = 0.0;
    var bestDay : Float = 0.0;
    var worstDay : Float = 999_999.0;
    let dayTotals = Array.tabulate(7, func(_) { 0.0 });
    let varDayTotals = dayTotals.toVarArray();

    for (t in recentTrips.values()) {
      grossRevenue := grossRevenue + t.amount;
      let dayIndex = Int.abs((now - t.date) / 86_400_000_000_000);
      if (dayIndex < 7) {
        varDayTotals[dayIndex] := varDayTotals[dayIndex] + t.amount;
      };
    };

    for (i in Nat.range(0, 7)) {
      if (varDayTotals[i] > bestDay) { bestDay := varDayTotals[i] };
      if (recentTrips.size() > 0 and varDayTotals[i] < worstDay) { worstDay := varDayTotals[i] };
    };
    if (recentTrips.size() == 0) { worstDay := 0.0 };

    let allExpenses = switch (expenses.get(caller)) {
      case (null) { [] };
      case (?m) { m.values().toArray() };
    };
    var totalExpenses : Float = 0.0;
    for (e in allExpenses.filter(func(ex : { expenseId : Text; category : Text; amount : Float; date : Int; notes : Text }) : Bool { ex.date >= sevenDaysAgo }).values()) {
      totalExpenses := totalExpenses + e.amount;
    };

    var fuelCost : Float = 0.0;
    switch (fuelLogs.get(caller)) {
      case (null) {};
      case (?m) {
        for (f in m.values()) {
          if (f.date >= sevenDaysAgo) { fuelCost := fuelCost + f.cost };
        };
      };
    };

    let netIncome = grossRevenue - totalExpenses - fuelCost;

    "LAST 7 DAYS EARNINGS SNAPSHOT:\n" #
    "Total trips: " # recentTrips.size().toText() # "\n" #
    "Gross revenue: " # currency # " " # grossRevenue.toText() # "\n" #
    "Total expenses: " # currency # " " # totalExpenses.toText() # "\n" #
    "Fuel cost: " # currency # " " # fuelCost.toText() # "\n" #
    "Net income: " # currency # " " # netIncome.toText() # "\n" #
    "Best single day: " # currency # " " # bestDay.toText() # "\n" #
    "Worst single day: " # currency # " " # worstDay.toText();
  };

  /// Detects top upcoming surge opportunities from stored events and driver peak hours.
  public query ({ caller }) func detectSurgeOpportunities() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return "Unauthorized";
    };
    let now = Time.now();
    let profile = switch (driverAnalyticsProfiles.get(caller)) {
      case (null) {
        return "No analytics data yet. Log some trips first so I can calculate your peak hours.";
      };
      case (?p) { p };
    };

    let userEvents = switch (events.get(caller)) {
      case (null) { [] };
      case (?m) {
        m.values().toArray().filter(func(e : { eventId : Text; title : Text; description : Text; date : Int; location : Text; category : Text; isUserCreated : Bool }) : Bool {
          e.date > now;
        });
      };
    };

    let peakHoursText = if (profile.peakHourRanges.size() == 0) {
      "peak hours not yet determined"
    } else {
      profile.peakHourRanges.values().toArray().foldLeft("", func(acc : Text, h : Text) : Text {
        if (acc == "") h else acc # ", " # h
      });
    };

    var result = "SURGE OPPORTUNITIES (based on your data):\n";
    result := result # "Your historical peak hours: " # peakHoursText # "\n\n";

    if (userEvents.size() == 0) {
      result := result # "No upcoming events in your calendar. Add events to get surge predictions.\n";
      result := result # "Tip: Fri/Sat 8pm–3am and weekday rush hours 6–9am and 4–8pm are always strong in SA cities.";
      return result;
    };

    let sorted = userEvents.sort(func(a : { date : Int }, b : { date : Int }) : { #less; #equal; #greater } {
      if (a.date < b.date) { #less } else if (a.date > b.date) { #greater } else { #equal }
    });
    let take = if (sorted.size() < 3) { sorted.size() } else { 3 };

    var i = 0;
    while (i < take) {
      let ev = sorted[i];
      let multiplier = if (ev.category == "concert" or ev.category == "sport") { "2–3x" }
                       else if (ev.category == "festival") { "1.5–2x" }
                       else { "1.2–1.5x" };
      result := result # (i + 1).toText() # ". " # ev.title # " @ " # ev.location # "\n" #
                "   Predicted surge: " # multiplier # " | Arrive 30–45 min before end\n";
      i += 1;
    };
    result;
  };

  /// Builds a structured advertising business case from driver's actual data.
  public query ({ caller }) func buildAdvertisingBusinessCase() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return "Unauthorized";
    };
    let profile = switch (profiles.get(caller)) {
      case (null) { { displayName = "Driver"; currencyCode = "ZAR"; subscriptionTier = 3; vehicleName = "Vehicle"; voiceEnabled = false; fuelConsumptionRate = 0.0 } };
      case (?p) { p };
    };
    let analytics = switch (driverAnalyticsProfiles.get(caller)) {
      case (null) {
        return "No trip data yet. Log trips first so I can build your advertising business case.";
      };
      case (?a) { a };
    };

    let monthlyTrips = analytics.totalTrips * 30 / 52; // rough monthly estimate from total
    let monthlyPassengers = monthlyTrips * 4;
    let monthlyRevenue = analytics.totalEarnings * 30.0 / 52.0;

    let topDays = if (analytics.topEarningDays.size() == 0) { "various days" }
                  else { analytics.topEarningDays.foldLeft("", func(acc : Text, d : Text) : Text {
                    if (acc == "") d else acc # ", " # d
                  }) };

    "ADVERTISING BUSINESS CASE FOR " # profile.displayName.toUpper() # ":\n\n" #
    "REACH DATA:\n" #
    "- Estimated monthly trips: " # monthlyTrips.toText() # "\n" #
    "- Estimated monthly passenger impressions: " # monthlyPassengers.toText() # " people\n" #
    "- Total career exposure: " # analytics.estimatedCarExposure.toText() # " people\n" #
    "- Vehicle: " # profile.vehicleName # "\n" #
    "- Peak routes: high-traffic urban zones on " # topDays # "\n\n" #
    "INCOME CONTEXT:\n" #
    "- Estimated monthly gross: " # profile.currencyCode # " " # monthlyRevenue.toText() # "\n" #
    "- Net after expenses and fuel: " # profile.currencyCode # " " # (monthlyRevenue - analytics.totalExpenses * 30.0 / 52.0 - analytics.totalFuelCost * 30.0 / 52.0).toText() # "\n\n" #
    "PITCH TEMPLATE:\n" #
    "'My car reaches approximately " # monthlyPassengers.toText() # " people per month through direct rides and street visibility in [your city]. " #
    "I am offering full car wrap advertising at R10,000–R50,000/month depending on brand requirements and contract length. " #
    "Target brands: MTN, Vodacom, FNB, Capitec, Nando's, KFC.'\n\n" #
    "NEXT STEPS:\n" #
    "1. Log 100+ trips to strengthen your data\n" #
    "2. Contact brand marketing departments directly (LinkedIn or brand website)\n" #
    "3. Ask Nduna to help draft an email pitch";
  };

  /// Scores an upcoming event for driver relevance (0–100) with strategy.
  public query ({ caller }) func getEventRelevanceScore(eventTitle : Text, eventDate : Int) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return "Unauthorized";
    };
    let analytics = switch (driverAnalyticsProfiles.get(caller)) {
      case (null) {
        return "No trip data yet. Log trips first to get personalised event relevance scores.";
      };
      case (?a) { a };
    };

    // Score based on: event day alignment with top earning days + peak hours
    let titleLower = eventTitle.toLower();
    var baseScore : Nat = 50;

    // Boost for high-demand event types
    if (titleLower.contains(#text "concert") or titleLower.contains(#text "stadium") or
        titleLower.contains(#text "festival") or titleLower.contains(#text "sport") or
        titleLower.contains(#text "rugby") or titleLower.contains(#text "soccer") or
        titleLower.contains(#text "fnb") or titleLower.contains(#text "dhl")) {
      baseScore := baseScore + 30;
    } else if (titleLower.contains(#text "conference") or titleLower.contains(#text "expo") or
               titleLower.contains(#text "market")) {
      baseScore := baseScore + 15;
    };

    // Boost if event falls on driver's top earning days
    let daysSinceEpoch : Int = eventDate / 86_400_000_000_000;
    let dayOfWeek : Nat = Int.abs((daysSinceEpoch + 4) % 7);
    let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let eventDayName = dayNames[dayOfWeek];
    let dayBoost = analytics.topEarningDays.filter(func(d : Text) : Bool { d == eventDayName }).size() > 0;
    if (dayBoost) { baseScore := baseScore + 15 };

    let score = if (baseScore > 100) { 100 } else { baseScore };

    let strategy = if (score >= 80) {
      "HIGH VALUE — Position at the venue 45 min before the event ends. Stay in the immediate area."
    } else if (score >= 60) {
      "MEDIUM VALUE — Worth positioning nearby. Monitor app for surge before committing."
    } else {
      "LOW VALUE — Standard driving strategy. Focus on your peak hours instead."
    };

    let dayLabel = if (dayBoost) { "top earning days" } else { "regular days" };
    "EVENT RELEVANCE SCORE: " # score.toText() # "/100\n" #
    "Event: " # eventTitle # "\n" #
    "Falls on: " # eventDayName # " (one of your " # dayLabel # ")\n" #
    "Strategy: " # strategy;
  };

  /// Returns full structured driver profile summary for Hermes.
  public query ({ caller }) func getDriverProfileSummary() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return "Unauthorized";
    };
    let profile = switch (profiles.get(caller)) {
      case (null) { return "No profile set up yet. Please complete your profile in settings." };
      case (?p) { p };
    };
    let analytics = driverAnalyticsProfiles.get(caller);

    let (totalTripsText, avgWeeklyTrips, peakHoursText, avgTripValue) = switch (analytics) {
      case (null) { ("0", "0", "[no data]", "0.00") };
      case (?a) {
        let weeklyAvg = a.totalTrips / 52;
        let peakH = if (a.peakHourRanges.size() == 0) { "[no data]" }
                    else { a.peakHourRanges.foldLeft("", func(acc : Text, h : Text) : Text {
                      if (acc == "") h else acc # ", " # h
                    }) };
        let avgVal = if (a.totalTrips == 0) { "0.00" }
                     else { (a.totalEarnings / a.totalTrips.toFloat()).toText() };
        (a.totalTrips.toText(), weeklyAvg.toText(), peakH, avgVal);
      };
    };

    let tierName = if (profile.subscriptionTier == 1) { "Tier 1 (R350/month)" }
                   else if (profile.subscriptionTier == 2) { "Tier 2 (R530/month)" }
                   else { "Tier 3 (R800/month — Nduna enabled)" };

    "DRIVER PROFILE SUMMARY:\n" #
    "Name: " # profile.displayName # "\n" #
    "Vehicle: " # profile.vehicleName # "\n" #
    "Subscription: " # tierName # "\n" #
    "Currency: " # profile.currencyCode # "\n" #
    "Total trips logged: " # totalTripsText # "\n" #
    "Avg weekly trips: " # avgWeeklyTrips # "\n" #
    "Avg trip value: " # profile.currencyCode # " " # avgTripValue # "\n" #
    "Peak hours: " # peakHoursText # "\n" #
    "Fuel consumption rate: " # profile.fuelConsumptionRate.toText() # " L/100km";
  };

  // ── Tavily Web Search ──────────────────────────────────────────────────────

  /// Admin only: set the Tavily API key for web search.
  public shared ({ caller }) func setTavilyApiKey(key : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return;
    };
    tavilyApiKeyStore.value := key;
  };

  /// Check whether Tavily is configured.
  public query func isTavilyConfigured() : async Bool {
    tavilyApiKeyStore.value != "";
  };

  /// Perform a Tavily web search (admin or Tier 3 users). Returns formatted results.
  public shared ({ caller }) func tavilySearch(searchQuery : Text, searchContext : Text) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized");
    };
    // ── Pilot mode guard — skip paid Tavily outcall ──────────────────────────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: Tavily tavilySearch");
      return #ok("[pilot_mode] Web search is disabled during the pilot period.");
    };
    if (tavilyApiKeyStore.value == "") {
      return #err("Web search not available. Admin needs to configure the Tavily API key.");
    };
    let combinedQuery = if (searchContext == "") { searchQuery }
                        else { searchQuery # " " # searchContext };
    let now = Time.now();
    incrementTavilyCount(now);
    let result = await* AgentLib.tavilySearch(tavilyApiKeyStore.value, combinedQuery);
    #ok(result);
  };

  /// Returns approximate Tavily search count for current month.
  public query ({ caller }) func getTavilyUsageEstimate() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return 0;
    };
    tavilyCallCountStore.value;
  };

  /// Get AI-powered event intelligence for a city using Tavily web search.
  /// Only fires if Tavily is configured. Returns structured event data with driver opportunity scores.
  public shared ({ caller }) func getEventsWithTavilyIntelligence(city : Text) : async { #ok : [AgentTypes.EventIntelligence]; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Must be logged in");
    };
    // ── Pilot mode guard — skip paid Tavily outcall ──────────────────────────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: Tavily getEventsWithTavilyIntelligence");
      return #ok([]);
    };
    if (tavilyApiKeyStore.value == "") {
      return #err("Tavily not configured. Ask an admin to set the Tavily API key.");
    };

    let searchQuery = "major events concerts festivals sporting events " # city # " South Africa this month";
    let now = Time.now();
    incrementTavilyCount(now);

    let raw = await* AgentLib.tavilySearchRaw(tavilyApiKeyStore.value, searchQuery);
    if (raw == "") {
      return #ok([]);
    };

    // Parse Tavily events into structured EventIntelligence records
    let parsed = AgentLib.parseTavilyEvents(raw);
    let results = List.empty<AgentTypes.EventIntelligence>();

    for (item in parsed.values()) {
      let name           = item.0;
      let dateText       = item.1;
      let attendanceText = item.2;
      let sourceUrl      = item.3;
      // Score driver opportunity: concerts/sport > festivals > conferences
      let nameLower = name.toLower();
      let oppScore : Nat = if (
        nameLower.contains(#text "concert") or nameLower.contains(#text "stadium") or
        nameLower.contains(#text "rugby") or nameLower.contains(#text "soccer") or
        nameLower.contains(#text "final") or nameLower.contains(#text "championship")
      ) { 90 } else if (
        nameLower.contains(#text "festival") or nameLower.contains(#text "expo") or
        nameLower.contains(#text "show") or nameLower.contains(#text "fair")
      ) { 70 } else if (
        nameLower.contains(#text "conference") or nameLower.contains(#text "summit") or
        nameLower.contains(#text "meeting") or nameLower.contains(#text "award")
      ) { 55 } else { 40 };

      let ev : AgentTypes.EventIntelligence = {
        name;
        date                   = if (dateText == "") { "See source" } else { dateText };
        expectedAttendance     = attendanceText;
        driverOpportunityScore = oppScore;
        sourceUrl;
      };
      results.add(ev);
    };

    #ok(results.toArray());
  };

  // ── Admin Functions ────────────────────────────────────────────────────────

  /// Admin only: set Nduna (OpenRouter) API key, URL, and model.
  /// Backward-compatible alias for setOpenClawApiKey.
  public shared ({ caller }) func setOpenClawApiKey(key : Text, apiUrl : Text, model : Text) : async { #ok : (); #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can set the Nduna API key");
    };
    openClawApiKey.value := if (key == "") { null } else { ?key };
    if (apiUrl != "") { openClawApiUrl.value := apiUrl };
    if (model != "") { openClawModel.value := model };
    #ok(());
  };

  /// Admin only: set Nduna + Tavily config in a single call.
  public shared ({ caller }) func setHermesConfig(openRouterKey : Text, tavilyKey : Text, model : Text) : async { #ok : (); #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can set Nduna config");
    };
    openClawApiKey.value := if (openRouterKey == "") { null } else { ?openRouterKey };
    if (tavilyKey != "") { tavilyApiKeyStore.value := tavilyKey };
    if (model != "") { openClawModel.value := model };
    #ok(());
  };

  /// Check whether the Nduna (OpenRouter) API key has been configured.
  public query func isOpenClawConfigured() : async Bool {
    switch (openClawApiKey.value) {
      case (null) { false };
      case (?k) { k != "" };
    };
  };

  /// Return the currently configured OpenRouter model ID.
  public query func getOpenClawModel() : async Text {
    openClawModel.value;
  };

  /// Admin only: reset all driver memory, conversation history, analytics profiles, and recommendation logs.
  public shared ({ caller }) func resetAllDriverMemory() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return;
    };
    hermesHistory.clear();
    driverAnalyticsProfiles.clear();
    driverMemories.clear();
    driverMemoryEntries.clear();
    agentConversations.clear();
  };

  // ── Nduna Learning Loop ────────────────────────────────────────────────────

  /// Log a Nduna recommendation for the learning loop.
  /// Returns the recommendation ID (index in the global list).
  public shared ({ caller }) func logRecommendation(rec : AgentTypes.NdunaRecommendation) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in to log recommendations");
    };
    let recId = ndunaRecommendations.size();
    ndunaRecommendations.add(rec);
    recId;
  };

  /// Record the outcome of a Nduna recommendation.
  /// Looks up the recommendation by ID and stores the outcome.
  /// Returns true if the ID is valid and the outcome was stored.
  public shared ({ caller }) func recordOutcome(recId : Nat, outcome : AgentTypes.RecommendationOutcome) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };
    if (recId >= ndunaRecommendations.size()) {
      return false;
    };
    let outcomeWithId : AgentTypes.RecommendationOutcome = { outcome with recommendationId = recId };
    ndunaOutcomes.add(recId, outcomeWithId);
    true;
  };

  /// Compute monthly stats from all stored recommendations and outcomes.
  /// Includes cohort distribution data and automatically writes the evolved delta
  /// back to Nduna's prompt state — closing the learning loop.
  public shared ({ caller }) func monthlyPromptEvolution() : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return "Unauthorized: Admin only";
    };
    let total = ndunaRecommendations.size();
    if (total == 0) {
      return "No recommendations logged yet. Nduna hasn't generated any tracked recommendations this period.";
    };

    var accepted : Nat = 0;
    var ignored : Nat = 0;
    var successful : Nat = 0;
    var totalRevenue : Nat = 0;

    // Count recommendation types
    var surgeCount : Nat = 0;
    var productCount : Nat = 0;
    var advertisingCount : Nat = 0;

    for (rec in ndunaRecommendations.values()) {
      if (rec.recommendationType == "surge") { surgeCount += 1 }
      else if (rec.recommendationType == "product") { productCount += 1 }
      else if (rec.recommendationType == "advertising") { advertisingCount += 1 };
    };

    for ((_, oc) in ndunaOutcomes.entries()) {
      switch (oc.driverAction) {
        case (?"accepted") { accepted += 1 };
        case (?"ignored") { ignored += 1 };
        case (_) {};
      };
      switch (oc.outcome) {
        case (?"successful") { successful += 1 };
        case (_) {};
      };
      switch (oc.revenue) {
        case (?r) { totalRevenue += r };
        case (null) {};
      };
    };

    let topType = if (advertisingCount >= surgeCount and advertisingCount >= productCount) { "advertising" }
                  else if (surgeCount >= productCount) { "surge" }
                  else { "product" };

    let acceptanceRate = if (total == 0) { 0 } else { accepted * 100 / total };

    // Gather cohort distribution for richer prompt evolution context
    var powerEarners : Nat = 0;
    var growthDrivers : Nat = 0;
    var newDrivers : Nat = 0;
    var powerEarnerRevenue : Float = 0.0;
    var growthDriverRevenue : Float = 0.0;

    for ((_, ap) in driverAnalyticsProfiles.entries()) {
      let tripsMonth = ap.totalTrips / 12;
      let earningsMonth = ap.totalEarnings / 12.0;
      let cohort = AgentLib.classifyDriver(tripsMonth, earningsMonth);
      switch (cohort) {
        case (#PowerEarner) {
          powerEarners += 1;
          powerEarnerRevenue := powerEarnerRevenue + earningsMonth;
        };
        case (#GrowthDriver) {
          growthDrivers += 1;
          growthDriverRevenue := growthDriverRevenue + earningsMonth;
        };
        case (#NewDriver) { newDrivers += 1 };
      };
    };

    let avgPowerEarnerRevenue = if (powerEarners == 0) { 0.0 } else { powerEarnerRevenue / powerEarners.toFloat() };
    let avgGrowthDriverRevenue = if (growthDrivers == 0) { 0.0 } else { growthDriverRevenue / growthDrivers.toFloat() };

    let cohortDistribution =
      "Current cohort distribution: " #
      powerEarners.toText() # " Power Earners (avg R" # roundFloat(avgPowerEarnerRevenue) # "/month), " #
      growthDrivers.toText() # " Growth Drivers (avg R" # roundFloat(avgGrowthDriverRevenue) # "/month), " #
      newDrivers.toText() # " New Drivers.";

    let evolutionDelta =
      "NDUNA MONTHLY LEARNING SUMMARY:\n" #
      "Total recommendations: " # total.toText() # "\n" #
      "Accepted: " # accepted.toText() # " (" # acceptanceRate.toText() # "% acceptance rate)\n" #
      "Ignored: " # ignored.toText() # "\n" #
      "Successful outcomes: " # successful.toText() # "\n" #
      "Total revenue tracked: R" # totalRevenue.toText() # "\n" #
      "Top recommendation type: " # topType # "\n\n" #
      cohortDistribution # "\n\n" #
      "PROMPT EVOLUTION HINT:\n" #
      "This month: " # acceptanceRate.toText() # "% acceptance rate, R" # totalRevenue.toText() # " revenue tracked, top recommendation type: " # topType # ".\n" #
      "Adjust confidence thresholds and recommendation frequency accordingly for the next period.\n" #
      "Power Earner advice emphasis: " # (if (powerEarners > growthDrivers) { "HIGH — majority are Power Earners" } else { "NORMAL" }) # ".\n" #
      "New Driver onboarding emphasis: " # (if (newDrivers > powerEarners + growthDrivers) { "HIGH — majority are New Drivers" } else { "NORMAL" }) # ".";

    // Auto-write the evolved delta back to Nduna's prompt state — closing the learning loop.
    ndunaPromptState.value := {
      ndunaPromptState.value with
      evolutionDelta;
      lastEvolved = ?Time.now();
      evolutionCount = ndunaPromptState.value.evolutionCount + 1;
    };

    evolutionDelta;
  };

  // ── Driver Cohort Analysis ─────────────────────────────────────────────────

  /// Returns the caller's driver cohort profile — cohort classification + Nduna's tailored advice.
  public query ({ caller }) func getDriverCohortProfile() : async AgentTypes.DriverCohortProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let analytics = switch (driverAnalyticsProfiles.get(caller)) {
      case (null) {
        {
          totalTrips = 0; totalEarnings = 0.0; totalExpenses = 0.0;
          totalFuelCost = 0.0; avgEarningsPerHour = 0.0; topEarningDays = [];
          peakHourRanges = []; estimatedCarExposure = 0; totalKmsDriven = 0.0; lastCalculated = 0;
        }
      };
      case (?ap) { ap };
    };

    // Estimate this month's trips and earnings (approx 1/12 of total — sufficient for cohort)
    let tripsThisMonth = analytics.totalTrips / 12;
    let earningsThisMonth = analytics.totalEarnings / 12.0;

    let cohort = AgentLib.classifyDriver(tripsThisMonth, earningsThisMonth);
    let (cohortAdvice, upgradeRecommendation) = AgentLib.getCohortAdvice(cohort);

    {
      cohort;
      tripsThisMonth;
      earningsThisMonth;
      rating = switch (driverRatings.get(caller)) { case (null) { 4.5 }; case (?r) { r } };
      cohortAdvice;
      upgradeRecommendation;
    };
  };

  /// Returns aggregate cohort counts across all drivers. Tier 3 / admin only.
  public query ({ caller }) func getCohortStats() : async { powerEarners : Nat; growthDrivers : Nat; newDrivers : Nat } {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isUser = AccessControl.hasPermission(accessControlState, caller, #user);
    if (not isUser) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Check tier 3 or admin
    if (not isAdmin) {
      let profile = switch (profiles.get(caller)) {
        case (null) { Runtime.trap("Profile not found") };
        case (?p) { p };
      };
      if (profile.subscriptionTier < 3) {
        Runtime.trap("Cohort stats require Tier 3 subscription");
      };
    };

    var powerEarners = 0;
    var growthDrivers = 0;
    var newDrivers = 0;

    for ((_, ap) in driverAnalyticsProfiles.entries()) {
      let tripsMonth = ap.totalTrips / 12;
      let earningsMonth = ap.totalEarnings / 12.0;
      let cohort = AgentLib.classifyDriver(tripsMonth, earningsMonth);
      switch (cohort) {
        case (#PowerEarner) { powerEarners += 1 };
        case (#GrowthDriver) { growthDrivers += 1 };
        case (#NewDriver) { newDrivers += 1 };
      };
    };

    { powerEarners; growthDrivers; newDrivers };
  };

  // ── Nduna Prompt State ─────────────────────────────────────────────────────

  /// Admin only: returns the current Nduna system prompt evolution state.
  public query ({ caller }) func getNdunaPromptState() : async AgentTypes.NdunaSystemPromptState {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    ndunaPromptState.value;
  };

  /// Admin only: manually set a new evolution delta for Nduna's system prompt.
  /// Called automatically by monthlyAnalysis() in advertising-api.mo — also available
  /// for admin override (e.g. to manually inject a curated learning delta).
  /// Returns #ok on success, #err if the caller is not an admin.
  public shared ({ caller }) func updateNdunaSystemPrompt(delta : Text) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can update Nduna's system prompt");
    };
    ndunaPromptState.value := {
      ndunaPromptState.value with
      evolutionDelta = delta;
      lastEvolved = ?Time.now();
      evolutionCount = ndunaPromptState.value.evolutionCount + 1;
    };
    #ok(());
  };

  /// Admin only: reset the Nduna evolution delta (manual override — starts fresh next month).
  public shared ({ caller }) func resetNdunaEvolution() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    ndunaPromptState.value := {
      ndunaPromptState.value with
      evolutionDelta = "";
      lastEvolved = ?Time.now();
    };
  };

  // ── Driver Rating Storage ──────────────────────────────────────────────────

  /// Driver saves their Uber/Bolt rating manually (1.0–5.0).
  /// Nduna cannot access Uber/Bolt APIs directly — drivers log their rating here.
  public shared ({ caller }) func updateDriverRating(rating : Float) : async { #ok : (); #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Must be logged in");
    };
    if (rating < 1.0 or rating > 5.0) {
      return #err("Invalid rating. Must be between 1.0 and 5.0");
    };
    driverRatings.add(caller, rating);
    #ok(());
  };

  /// Returns the caller's stored driver rating. Defaults to 4.5 if not yet set.
  public query ({ caller }) func getDriverRating() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (driverRatings.get(caller)) {
      case (null) { 4.5 };
      case (?r) { r };
    };
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Round a Float to 2 decimal places and return as Text.
  private func roundFloat(f : Float) : Text {
    let rounded = Float.nearest(f * 100.0) / 100.0;
    rounded.toText();
  };

  // ── Voice Agent — ElevenLabs Signed URL ────────────────────────────────────

  /// Tier 2+ only: get a signed ElevenLabs conversation URL for Nduna's voice agent.
  /// Makes a GET HTTP outcall to ElevenLabs /v1/convai/conversation/get-signed-url
  /// with the configured agent_id. Returns the signed URL as Text.
  /// API key is NEVER exposed to the frontend — returned value is a short-lived signed URL only.
  public shared ({ caller }) func getElevenLabsSignedUrl() : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Must be logged in");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tier = switch (profiles.get(caller)) {
      case (null) { return #err("Profile not found. Please set up your profile first.") };
      case (?p) {
        if (p.subscriptionTier < 2 and not isAdmin) {
          return #err("Voice agent requires Tier 2+ subscription (R530/month).");
        };
        p.subscriptionTier;
      };
    };
    ignore tier;

    let apiKey = elevenLabsApiKeyFromState();
    if (apiKey == "") {
      return #err("ElevenLabs is not configured. Ask an admin to set the API key.");
    };

    let agentId = elevenLabsAgentIdStore.value;
    if (agentId == "") {
      return #err("ElevenLabs agent ID not configured.");
    };

    let url = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=" # agentId;

    let httpRequest : IC.http_request_args = {
      url;
      max_response_bytes = ?4_000;
      headers = [
        { name = "xi-api-key"; value = apiKey },
        { name = "Content-Type"; value = "application/json" },
      ];
      body = null;
      method = #get;
      transform = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      AnalyticsLog.logEvent(analyticsLog, "error", "getElevenLabsSignedUrl", caller.toText(), null, false, ?e.message(), "{}", null);
      return #err("Failed to get signed URL: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode ElevenLabs response.") };
      case (?body) {
        // Parse signed_url from JSON: {"signed_url":"wss://..."}
        switch (AgentLib.splitOnFirst(body, "\"signed_url\":\"")) {
          case (null) {
            AnalyticsLog.logEvent(analyticsLog, "error", "getElevenLabsSignedUrl", caller.toText(), null, false, ?("Unexpected response: " # body), "{}", null);
            #err("ElevenLabs returned unexpected response. Check agent configuration.")
          };
          case (?(_, rest)) {
            let signedUrl = AgentLib.takeUntilQuote(rest);
            AnalyticsLog.logEvent(analyticsLog, "voice", "getElevenLabsSignedUrl", caller.toText(), null, true, null, "{}", null);
            #ok(signedUrl)
          };
        };
      };
    };
  };

  /// Private helper: get ElevenLabs API key from actor state.
  private func elevenLabsApiKeyFromState() : Text {
    elevenLabsApiKeyStore.value;
  };

  // ── Behavioral Event Logging ────────────────────────────────────────────────

  /// Log a behavioral event for the caller.
  /// Stores in a per-driver ring-buffer (max 200 events, auto-evicts events older than 7 days).
  /// eventType: page_view | feature_interact | trip_logged | lead_clicked |
  ///            deal_touched | recommendation_received | recommendation_acted | recommendation_dismissed
  public shared ({ caller }) func logBehavioralEvent(
    eventType : Text,
    page      : Text,
    details   : Text,
    timestamp : Int,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return;
    };

    let validTypes = [
      "page_view", "feature_interact", "trip_logged", "lead_clicked",
      "deal_touched", "recommendation_received", "recommendation_acted", "recommendation_dismissed",
    ];
    let isValid = validTypes.filter(func(t : Text) : Bool { t == eventType }).size() > 0;
    if (not isValid) { return };

    let now = Time.now();
    let sevenDaysNs : Int = 604_800_000_000_000;
    let cutoff = now - sevenDaysNs;

    let existing = switch (behavioralEvents.get(caller)) {
      case (null) { List.empty<AgentTypes.BehavioralEvent>() };
      case (?buf) { buf };
    };

    let event : AgentTypes.BehavioralEvent = { eventType; page; details; timestamp };
    existing.add(event);

    // Evict events older than 7 days and cap at 200
    let arr = existing.toArray();
    let filtered = arr.filter(func(e : AgentTypes.BehavioralEvent) : Bool { e.timestamp >= cutoff });
    let size = filtered.size();
    let start = if (size > 200) { size - 200 : Nat } else { 0 };
    let trimmed = List.fromArray<AgentTypes.BehavioralEvent>(filtered.sliceToArray(start, size));
    behavioralEvents.add(caller, trimmed);
  };

  // ── Context Summary ──────────────────────────────────────────────────────────

  /// Returns last 7-day behavioral context summary for the caller.
  /// Structured as a human-readable string for injection into queryAIAgent contextData.
  /// Includes top pages visited, recent actions, and outcome ratio.
  public query ({ caller }) func getContextSummary() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return "";
    };

    let now = Time.now();
    let sevenDaysNs : Int = 604_800_000_000_000;
    let cutoff = now - sevenDaysNs;

    let allEvents = switch (behavioralEvents.get(caller)) {
      case (null) { return "" };
      case (?buf) { buf.toArray() };
    };

    let recentEvents = allEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.timestamp >= cutoff
    });

    if (recentEvents.size() == 0) { return "" };

    // Count page visits
    var pageVisits : [(Text, Nat)] = [];
    for (ev in recentEvents.values()) {
      if (ev.eventType == "page_view") {
        var found = false;
        pageVisits := pageVisits.map<(Text, Nat), (Text, Nat)>(func(pair : (Text, Nat)) : (Text, Nat) {
          let (p, c) = pair;
          if (p == ev.page) { found := true; (p, c + 1) } else { (p, c) }
        });
        if (not found) { pageVisits := pageVisits.concat([(ev.page, 1)]) };
      };
    };

    // Sort pages by frequency descending
    let sortedPages = pageVisits.sort(func((_pa, ca) : (Text, Nat), (_pb, cb) : (Text, Nat)) : { #less; #equal; #greater } {
      if (ca > cb) { #less } else if (ca < cb) { #greater } else { #equal }
    });
    let topPagesCount = if (sortedPages.size() < 3) { sortedPages.size() } else { 3 };
    var topPagesText = "";
    var pi = 0;
    while (pi < topPagesCount) {
      let (pageName, _cnt) = sortedPages[pi];
      if (topPagesText != "") { topPagesText := topPagesText # ", " };
      topPagesText := topPagesText # pageName;
      pi += 1;
    };

    // Count action types
    var actedCount : Nat = 0;
    var dismissedCount : Nat = 0;
    var tripCount : Nat = 0;
    var leadClickCount : Nat = 0;
    var dealTouchCount : Nat = 0;

    for (ev in recentEvents.values()) {
      switch (ev.eventType) {
        case ("recommendation_acted")    { actedCount += 1 };
        case ("recommendation_dismissed") { dismissedCount += 1 };
        case ("trip_logged")             { tripCount += 1 };
        case ("lead_clicked")            { leadClickCount += 1 };
        case ("deal_touched")            { dealTouchCount += 1 };
        case (_)                         {};
      };
    };

    let totalRecs = actedCount + dismissedCount;
    let outcomeRatioText = if (totalRecs == 0) {
      "no recommendations acted on yet"
    } else {
      let rate = actedCount * 100 / totalRecs;
      rate.toText() # "% recommendation acceptance rate (" # actedCount.toText() # "/" # totalRecs.toText() # ")"
    };

    "Top pages (last 7 days): " # (if (topPagesText == "") { "none" } else { topPagesText }) # ". " #
    "Recent activity: " # tripCount.toText() # " trips logged, " #
    leadClickCount.toText() # " leads clicked, " #
    dealTouchCount.toText() # " deals touched. " #
    "Engagement: " # outcomeRatioText # ".";
  };

  // ── Outcome Event Logging ────────────────────────────────────────────────────

  /// Log the outcome of a recommendation for the caller.
  /// outcome: acted | dismissed | not_yet
  /// Stores in a per-driver ring-buffer (max 100 entries).
  public shared ({ caller }) func logOutcomeEvent(
    recommendationId : Text,
    outcome          : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return;
    };

    let validOutcomes = ["acted", "dismissed", "not_yet"];
    let isValid = validOutcomes.filter(func(o : Text) : Bool { o == outcome }).size() > 0;
    if (not isValid) { return };

    let event : AgentTypes.OutcomeEvent = {
      recommendationId;
      outcome;
      timestamp = Time.now();
    };

    let existing = switch (outcomeEvents.get(caller)) {
      case (null) { List.empty<AgentTypes.OutcomeEvent>() };
      case (?buf) { buf };
    };
    existing.add(event);

    // Cap at 100 entries
    if (existing.size() > 100) {
      let arr = existing.toArray();
      let start = arr.size() - 100 : Nat;
      let trimmed = List.fromArray<AgentTypes.OutcomeEvent>(arr.sliceToArray(start, arr.size()));
      outcomeEvents.add(caller, trimmed);
    } else {
      outcomeEvents.add(caller, existing);
    };
  };

  // ── Proactive Triggers ───────────────────────────────────────────────────────

  /// Returns proactive trigger conditions met for the caller based on their behavioral events.
  /// Triggers fire on specific page combinations (leads, earnings, advertising pages only).
  /// Returns an array of ProactiveTrigger — frontend surfaces these as Nduna nudges.
  public query ({ caller }) func getProactiveTriggers() : async [AgentTypes.ProactiveTrigger] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    let now = Time.now();
    let oneDayNs : Int = 86_400_000_000_000;
    let sevenDaysNs : Int = 604_800_000_000_000;
    let dayAgo = now - oneDayNs;
    let weekAgo = now - sevenDaysNs;

    let allEvents = switch (behavioralEvents.get(caller)) {
      case (null) { return [] };
      case (?buf) { buf.toArray() };
    };

    let recentEvents = allEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.timestamp >= weekAgo
    });

    // Check page views in last 24h
    let last24h = allEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.timestamp >= dayAgo
    });

    // Count trips logged in last 24h
    let tripsLast24h = last24h.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "trip_logged"
    }).size();

    // Check if driver visited earnings page in last 24h
    let visitedEarnings = last24h.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "page_view" and e.page == "earnings"
    }).size() > 0;

    // Check if driver visited leads page in last 7 days
    let visitedLeads = recentEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "page_view" and e.page == "leads"
    }).size() > 0;

    // Check if driver touched advertising page in last 7 days
    let visitedAdvertising = recentEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "page_view" and e.page == "advertising"
    }).size() > 0;

    // Check lead clicks in last 7 days
    let leadClicks = recentEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "lead_clicked"
    }).size();

    // Check deal touches in last 7 days
    let dealTouches = recentEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "deal_touched"
    }).size();

    // Count dismissed recommendations in last 7 days
    let dismissedRecs = recentEvents.filter(func(e : AgentTypes.BehavioralEvent) : Bool {
      e.eventType == "recommendation_dismissed"
    }).size();

    let triggers = List.empty<AgentTypes.ProactiveTrigger>();

    // Trigger 1: 0 trips in 24h AND visited earnings page → suggest leads
    if (tripsLast24h == 0 and visitedEarnings) {
      triggers.add({
        triggerType = "suggest_leads";
        message = "You haven't logged any trips today. Nduna found new companies looking for car advertising in your area — want to see them?";
        page = "leads";
      });
    };

    // Trigger 2: visited leads page but 0 lead clicks in 7 days → suggest action
    if (visitedLeads and leadClicks == 0) {
      triggers.add({
        triggerType = "suggest_lead_action";
        message = "You've been checking the leads page but haven't clicked through yet. Nduna can help you pick the 3 best companies to pitch this week.";
        page = "leads";
      });
    };

    // Trigger 3: visited advertising page but 0 deal touches in 7 days → suggest pitch
    if (visitedAdvertising and dealTouches == 0) {
      triggers.add({
        triggerType = "suggest_pitch";
        message = "You've been looking at the advertising section. Ask Nduna to help you draft your first pitch email — it takes 5 minutes.";
        page = "advertising";
      });
    };

    // Trigger 4: high dismissal rate (3+ dismissals in 7 days) → improve recommendations
    if (dismissedRecs >= 3) {
      triggers.add({
        triggerType = "improve_recommendations";
        message = "Nduna noticed you've been dismissing a few suggestions. Tell him what you're actually focused on and he'll tighten up his recommendations.";
        page = "earnings";
      });
    };

    // Trigger 5: has deal touches but no deals logged → suggest follow-up
    if (dealTouches >= 2 and visitedAdvertising) {
      triggers.add({
        triggerType = "suggest_followup";
        message = "You've been working on deals. Nduna can set up a follow-up reminder sequence so no opportunity slips through.";
        page = "advertising";
      });
    };

    triggers.toArray();
  };
};
