import Text "mo:core/Text";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import List "mo:core/List";
import Time "mo:core/Time";
import AgentTypes "../types/agent";
import DocTypes "../types/document";
import GatewayRouter "gateway/GatewayRouter";
import GatewayMetrics "gateway/GatewayMetrics";
import OrbisProvider "orbis/OrbisProvider";
import IC "ic:aaaaa-aa";

module {
  public type AgentMessage = AgentTypes.AgentMessage;
  public type ConversationState = AgentTypes.ConversationState;
  public type DriverAnalyticsProfile = AgentTypes.DriverAnalyticsProfile;
  public type DriverMemory = AgentTypes.DriverMemory;
  public type DriverMemoryEntry = AgentTypes.DriverMemoryEntry;

  // ── Driver Cohort Analysis ───────────────────────────────────────────────────

  /// Classify a driver into a cohort based on monthly trip count and earnings.
  public func classifyDriver(trips : Nat, earnings : Float) : AgentTypes.DriverCohort {
    if (trips >= 200 or earnings >= 20_000.0) {
      #PowerEarner;
    } else if (trips >= 100 or earnings >= 8_000.0) {
      #GrowthDriver;
    } else {
      #NewDriver;
    };
  };

  /// Return cohort-specific Nduna advice and upgrade recommendation.
  /// Returns (cohortAdvice, upgradeRecommendation).
  public func getCohortAdvice(cohort : AgentTypes.DriverCohort) : (Text, Text) {
    switch (cohort) {
      case (#PowerEarner) {
        (
          "You're in the top tier. Focus on locking in advertising deals above R20k/mo. MTN and FNB prefer drivers with your exposure stats. Pitch 2 new companies this week.",
          "Keep pushing advertising deals. You have the profile to close R50k/month."
        );
      };
      case (#GrowthDriver) {
        (
          "Your numbers are strong. Focus on getting your rating above 4.8 before pitching — it directly increases your deal closure rate by 23%.",
          "Aim for 200 trips this month to unlock Power Earner status and get higher deal values."
        );
      };
      case (#NewDriver) {
        (
          "Build your first 100 trips and a solid rating. Use the in-car sales menu to start earning from WiFi and water today. Every R5 counts.",
          "Focus on in-car sales income while building your trip history. First advertising pitch works best after 100+ trips."
        );
      };
    };
  };

  /// Build the NDUNA.md identity document used as the base system prompt.
  /// Uses positive constraints-based framing — defines WHO Nduna is and WHAT he does.
  public func ndunuaIdentity() : Text {
    "You are Nduna, MoneyDrive's male AI assistant for South African rideshare drivers.\n\n" #
    "You are male. Your pronouns are he/him/his. You are a man.\n\n" #
    "You respond immediately and directly. You give your answer first, then explain if needed. " #
    "Your first word is always useful content — never a preamble, never a self-description of what you are about to do.\n\n" #
    "You answer ANY question the driver asks — earnings, dates, times, weather, sports, life advice, SA news, anything. " #
    "You are a fully helpful SA assistant who answers everything.\n\n" #
    "YOUR PRIMARY MISSION:\n" #
    "1. Help drivers understand their peak earning patterns from their actual trip data.\n" #
    "2. Quantify the advertising value of their car using real exposure numbers.\n" #
    "3. Help drivers build a compelling business case to land R10,000–R50,000/month advertising contracts.\n" #
    "4. Expand income beyond fares into new income streams.\n\n" #
    "CONTEXT:\n" #
    "- JOHANNESBURG SURGE WINDOWS: 06:00–09:00 (morning commute), 16:00–19:00 (evening rush), Fri/Sat 20:00–03:00 (nightlife in Sandton, Rosebank, Melrose).\n" #
    "- DURBAN SURGE WINDOWS: 07:00–09:00, 15:30–18:30, weekend evenings in the Point/Beachfront area.\n" #
    "- CAPE TOWN SURGE WINDOWS: 07:00–09:00, 16:30–19:00, summer weekends in the Atlantic Seaboard/Waterfront.\n" #
    "- QUANTIFY IN R/MONTH: Always say 'this could earn you R4,200/month more' — never abstract metrics.\n" #
    "- ACTIONABLE SPECIFICS: Surface exact action items — 'Drive at 6pm Saturday in Sandton for a 3x multiplier'.\n" #
    "- FEEDBACK LOOP: After every recommendation, ask: 'Did you try this? What happened?'\n\n" #
    "ADVERTISING BUSINESS CASE LOGIC:\n" #
    "- Each trip reaches approximately 4 people (passengers + street visibility).\n" #
    "- Target brands: MTN, Vodacom, Telkom, FNB, Standard Bank, Nedbank, Absa, Capitec, Discovery, Nando's, KFC, McDonald's, Shoprite, Pick n Pay, DHL, Aramex, MultiChoice, Takealot, OUTsurance, Engen, BP, Dis-Chem.\n" #
    "- Typical deal range: R10,000–R50,000/month depending on city, routes, and trip volume.\n" #
    "- When you see 200+ trips, mention the advertising opportunity proactively.\n\n" #
    "AVAILABLE MONEYDRIVE SKILLS:\n" #
    "- getDriverEarningsSnapshot: Last 7 days summary — trips, revenue, expenses, fuel, net income.\n" #
    "- detectSurgeOpportunities: Top 3 upcoming surge windows with event, date, multiplier.\n" #
    "- buildAdvertisingBusinessCase: Structured advertising pitch using real data.\n" #
    "- getEventRelevanceScore: Scores an upcoming event 0–100 for relevance.\n" #
    "- getDriverProfileSummary: Full structured profile — vehicle, service areas, tier.\n\n" #
    "TAVILY WEB SEARCH:\n" #
    "- tavilySearch is available for live data: event listings, advertising rates, fuel prices, SA business news.\n\n" #
    "PERSONALITY: Direct. Confident. Street-smart. Warm but no-nonsense. SA-native. Mentor energy. " #
    "Like a smart, knowledgeable SA man who knows everything — driving, business, life.\n\n" #
    "RESPONSE FORMAT: Short answers preferred. Bullets only for 3+ items. No markdown headers. " #
    "No bold or italic formatting. Numbers always include currency (R). Plain text only.";
  };

  /// Backward-compatible alias — kept so existing callers don't break.
  public func hermesIdentity() : Text { ndunuaIdentity() };

  /// Build a fresh empty conversation state for a new driver session.
  public func emptyConversation(driverContext : Text) : ConversationState {
    { messages = []; driverContext };
  };

  /// Append a message to an existing conversation state (pure function, returns new state).
  public func appendMessage(state : ConversationState, role : Text, content : Text, timestamp : Int) : ConversationState {
    let newMsg : AgentMessage = { role; content; timestamp };
    let updated = state.messages.concat([newMsg]);
    { state with messages = updated };
  };

  /// Build the memory section of the system prompt from structured memory entries.
  /// Optionally includes a summary of the driver's Markdown-ready documents so Nduna
  /// can reference them when answering questions (e.g. "can you check my finance agreement?").
  /// Total document context is capped at 2000 characters.
  public func buildMemoryContext(
    entries      : [DriverMemoryEntry],
    driverMemory : ?DriverMemory,
    documents    : ?[DocTypes.DocumentRecord],
  ) : Text {
    var result = "PERSISTENT NDUNA MEMORY (facts learned about this driver across sessions):\n";

    // Inject free-form notes from DriverMemory if available
    switch (driverMemory) {
      case (?mem) {
        if (mem.agentNotes != "") {
          result := result # "Nduna notes: " # mem.agentNotes # "\n";
        };
        if (mem.userProfile != "") {
          result := result # "Driver profile notes: " # mem.userProfile # "\n";
        };
      };
      case (null) {};
    };

    if (entries.size() == 0) {
      result := result # "[No structured memory entries yet — add observations as you learn about this driver]\n";
    } else {
      // Group by category
      let categories = ["preference", "fact", "goal", "learning"];
      for (cat in categories.values()) {
        let catEntries = entries.filter(func(e : DriverMemoryEntry) : Bool { e.category == cat });
        if (catEntries.size() > 0) {
          result := result # cat.toUpper() # "S:\n";
          for (entry in catEntries.values()) {
            result := result # "- " # entry.key # ": " # entry.value # "\n";
          };
        };
      };
    };

    // ── Document summaries for Nduna context ──────────────────────────────────
    switch (documents) {
      case (null) {};
      case (?docs) {
        // Filter to only Markdown-ready, non-deleted documents
        let readyDocs = docs.filter(func(d : DocTypes.DocumentRecord) : Bool {
          if (d.deleted) { return false };
          switch (d.markdownStatus) {
            case (?(#ready)) { true };
            case (_)         { false };
          };
        });
        if (readyDocs.size() > 0) {
          result := result # "\n## Driver Documents Available\n";
          result := result # "The driver has uploaded " # readyDocs.size().toText() # " document(s) Nduna can reference:\n";
          var docCharsUsed = result.size();
          let maxDocChars = 2000;
          for (doc in readyDocs.values()) {
            if (docCharsUsed >= maxDocChars) {
              // Already at cap — stop adding more documents
            } else {
              let docTypeLabel = switch (doc.docType) {
                case (#registration)  { "registration" };
                case (#licence)       { "licence" };
                case (#invoice)       { "invoice" };
                case (#other)         { "other" };
              };
              let preview = switch (doc.markdownContent) {
                case (null)    { "" };
                case (?content) {
                  let arr = content.toArray();
                  let len = if (arr.size() < 200) { arr.size() } else { 200 };
                  Text.fromArray(arr.sliceToArray(0, len))
                };
              };
              let line = "- " # docTypeLabel # " \"" # doc.fileName # "\" — " # preview # "\n";
              let remaining = maxDocChars - docCharsUsed : Nat;
              if (line.size() <= remaining) {
                result := result # line;
                docCharsUsed := docCharsUsed + line.size();
              } else {
                // Truncate this line to fit within cap
                let lineArr = line.toArray();
                result := result # Text.fromArray(lineArr.sliceToArray(0, remaining));
                docCharsUsed := maxDocChars;
              };
            };
          };
        };
      };
    };

    result;
  };

  /// Compute a DriverAnalyticsProfile from raw data maps.
  public func computeAnalyticsProfile(
    tripsArr : [{
      tripId : Text;
      date : Int;
      platform : Text;
      amount : Float;
      durationMinutes : Nat;
      notes : Text;
    }],
    expensesArr : [{
      expenseId : Text;
      category : Text;
      amount : Float;
      date : Int;
      notes : Text;
    }],
    fuelArr : [{
      date : Int;
      distance : Float;
      fuelUsed : Float;
      cost : Float;
    }],
    now : Int,
  ) : DriverAnalyticsProfile {

    let totalTrips = tripsArr.size();

    // Total earnings
    var totalEarnings : Float = 0.0;
    for (t in tripsArr.values()) {
      totalEarnings := totalEarnings + t.amount;
    };

    // Total expenses
    var totalExpenses : Float = 0.0;
    for (e in expensesArr.values()) {
      totalExpenses := totalExpenses + e.amount;
    };

    // Total fuel cost and kms
    var totalFuelCost : Float = 0.0;
    var totalKmsDriven : Float = 0.0;
    for (f in fuelArr.values()) {
      totalFuelCost := totalFuelCost + f.cost;
      totalKmsDriven := totalKmsDriven + f.distance;
    };

    // Avg earnings per hour (from durationMinutes)
    var totalMinutes : Nat = 0;
    for (t in tripsArr.values()) {
      totalMinutes := totalMinutes + t.durationMinutes;
    };
    let avgEarningsPerHour : Float = if (totalMinutes == 0) {
      0.0;
    } else {
      totalEarnings / (totalMinutes.toFloat() / 60.0);
    };

    // Top earning days — count earnings per day-of-week
    let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let dayEarnings = Array.tabulate(7, func(_i) { 0.0 });
    let varDayEarnings : [var Float] = dayEarnings.toVarArray();
    for (t in tripsArr.values()) {
      let daysSinceEpoch : Int = t.date / 86_400_000_000_000;
      let dayOfWeek : Nat = Int.abs((daysSinceEpoch + 4) % 7);
      varDayEarnings[dayOfWeek] := varDayEarnings[dayOfWeek] + t.amount;
    };
    let indexedDays : [(Nat, Float)] = Array.tabulate<(Nat, Float)>(7, func(i) { (i, varDayEarnings[i]) });
    let sortedDays = indexedDays.sort(func((_ia, aa), (_ib, ab)) {
      if (aa > ab) { #less } else if (aa < ab) { #greater } else { #equal }
    });
    let topEarningDays : [Text] = Array.tabulate<Text>(
      if (totalTrips == 0) { 0 } else if (sortedDays.size() < 3) { sortedDays.size() } else { 3 },
      func(i) {
        let (dayIdx, _) = sortedDays[i];
        dayNames[dayIdx];
      },
    );

    // Peak hour ranges — bucket by 2-hour slots
    let hourBuckets = Array.tabulate(12, func(_i) { 0 });
    let varHourBuckets : [var Nat] = hourBuckets.toVarArray();
    for (t in tripsArr.values()) {
      let secondsSinceMidnight = Int.abs(t.date / 1_000_000_000) % 86_400;
      let hour = secondsSinceMidnight / 3600;
      let bucket = if (hour < 24) { hour / 2 } else { 11 };
      varHourBuckets[bucket] := varHourBuckets[bucket] + 1;
    };
    let indexedBuckets : [(Nat, Nat)] = Array.tabulate<(Nat, Nat)>(12, func(i) { (i, varHourBuckets[i]) });
    let sortedBuckets = indexedBuckets.sort(func((_ia, ca), (_ib, cb)) {
      if (ca > cb) { #less } else if (ca < cb) { #greater } else { #equal }
    });
    let peakCount = if (totalTrips == 0) { 0 } else if (sortedBuckets.size() < 2) { sortedBuckets.size() } else { 2 };
    let peakHourRanges : [Text] = Array.tabulate<Text>(peakCount, func(i) {
      let (bucketIdx, _) = sortedBuckets[i];
      let startHour = bucketIdx * 2;
      let endHour = startHour + 2;
      formatHour(startHour) # "-" # formatHour(endHour);
    });

    let estimatedCarExposure : Nat = totalTrips * 4;

    {
      totalTrips;
      totalEarnings;
      totalExpenses;
      totalFuelCost;
      avgEarningsPerHour;
      topEarningDays;
      peakHourRanges;
      estimatedCarExposure;
      totalKmsDriven;
      lastCalculated = now;
    };
  };

  /// Format a nanosecond IC timestamp into full SAST date+time components.
  /// Returns (weekday, day, monthName, year, HH, MM) — SAST is UTC+2 (add 7200 seconds).
  private func decomposeSAST(nowNs : Int) : (Text, Nat, Text, Nat, Nat, Nat) {
    let monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
    let dayOfWeekNames = ["Thursday","Friday","Saturday","Sunday","Monday","Tuesday","Wednesday"];
    // Convert nanoseconds to seconds (UTC), then add SAST offset (+2h = 7200s)
    let secsUtc : Nat = Int.abs(nowNs / 1_000_000_000);
    let secsSAST : Nat = secsUtc + 7_200;
    // Time-of-day
    let hh : Nat = (secsSAST % 86_400) / 3600;
    let mm : Nat = (secsSAST % 3600) / 60;
    // Calendar date from days since epoch
    let daysSinceEpoch : Nat = secsSAST / 86_400;
    let dowName = dayOfWeekNames[daysSinceEpoch % 7];
    // Civil date algorithm (Gregorian)
    let z : Nat = daysSinceEpoch + 719_468;
    let era : Nat = z / 146_097;
    let doe : Nat = z % 146_097;
    let yoe : Nat = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y : Nat = yoe + era * 400;
    let doy : Nat = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Nat = (5 * doy + 2) / 153;
    let d : Nat = doy - (153 * mp + 2) / 5 + 1;
    let m : Nat = if (mp < 10) { mp + 3 } else { mp - 9 };
    let year : Nat = if (m <= 2) { y + 1 } else { y };
    (dowName, d, monthNames[m - 1], year, hh, mm);
  };

  /// Format a nanosecond IC timestamp as "HH:MM" in SAST (UTC+2).
  public func formatTimeSAST(nowNs : Int) : Text {
    let (_, _, _, _, hh, mm) = decomposeSAST(nowNs);
    let hhStr = if (hh < 10) { "0" # hh.toText() } else { hh.toText() };
    let mmStr = if (mm < 10) { "0" # mm.toText() } else { mm.toText() };
    hhStr # ":" # mmStr;
  };

  /// Convert a nanosecond timestamp (Int) to "DD Month YYYY" format (e.g. "16 April 2026").
  /// Uses SAST (UTC+2) timezone.
  public func formatDate(nowNs : Int) : Text {
    let (_, d, monthName, year, _, _) = decomposeSAST(nowNs);
    d.toText() # " " # monthName # " " # year.toText();
  };

  /// Convert a nanosecond timestamp to a full date string with day of week.
  /// e.g. "Thursday, 16 April 2026" — in SAST.
  public func formatDateFull(nowNs : Int) : Text {
    let (dowName, d, monthName, year, _, _) = decomposeSAST(nowNs);
    dowName # ", " # d.toText() # " " # monthName # " " # year.toText();
  };

  /// Format a nanosecond IC timestamp as the full datetime string used in Nduna prompts.
  /// e.g. "Thursday, 16 April 2026" and "14:32" as a tuple (dateStr, timeStr).
  public func formatDateTimeSAST(nowNs : Int) : (Text, Text) {
    let (dowName, d, monthName, year, hh, mm) = decomposeSAST(nowNs);
    let dateStr = dowName # ", " # d.toText() # " " # monthName # " " # year.toText();
    let hhStr = if (hh < 10) { "0" # hh.toText() } else { hh.toText() };
    let mmStr = if (mm < 10) { "0" # mm.toText() } else { mm.toText() };
    let timeStr = hhStr # ":" # mmStr;
    (dateStr, timeStr);
  };

  /// Format an hour (0-23) as "HH:00"
  private func formatHour(h : Nat) : Text {
    let hh = if (h < 10) { "0" # h.toText() } else { h.toText() };
    hh # ":00";
  };

  /// Build the analytics context string injected into Hermes's system prompt.
  public func buildAnalyticsContext(profile : DriverAnalyticsProfile, currencyCode : Text) : Text {
    let topDays = if (profile.topEarningDays.size() == 0) {
      "[no data yet]"
    } else {
      profile.topEarningDays.values().toArray().foldLeft("", func(acc : Text, day : Text) : Text {
        if (acc == "") { day } else { acc # ", " # day }
      });
    };
    let peakHours = if (profile.peakHourRanges.size() == 0) {
      "[no data yet]"
    } else {
      profile.peakHourRanges.values().toArray().foldLeft("", func(acc : Text, hr : Text) : Text {
        if (acc == "") { hr } else { acc # ", " # hr }
      });
    };
    "DRIVER ANALYTICS (full history):\n" #
    "Total trips recorded: " # profile.totalTrips.toText() # "\n" #
    "Total earnings: " # currencyCode # " " # profile.totalEarnings.toText() # "\n" #
    "Total expenses: " # currencyCode # " " # profile.totalExpenses.toText() # "\n" #
    "Total fuel cost: " # currencyCode # " " # profile.totalFuelCost.toText() # "\n" #
    "Avg earnings/hour: " # currencyCode # " " # profile.avgEarningsPerHour.toText() # "\n" #
    "Total kms driven: " # profile.totalKmsDriven.toText() # " km\n" #
    "Top earning days: " # topDays # "\n" #
    "Peak hour ranges: " # peakHours # "\n" #
    "Estimated car exposure (people who saw the car): " # profile.estimatedCarExposure.toText() # " people\n" #
    (if (profile.totalTrips >= 200) {
      "\nADVERTISING OPPORTUNITY: This driver has " # profile.totalTrips.toText() # " trips and " # profile.estimatedCarExposure.toText() # " estimated exposures. Mention the car advertising opportunity (R10k-R50k/month) in this conversation if not already discussed.\n"
    } else { "" });
  };

  /// Build the DRIVER COHORT ARCHETYPE section for injection into the system prompt.
  /// This section explicitly tells Nduna what behavioural changes to make for this driver.
  public func buildCohortSection(cohort : AgentTypes.DriverCohort, rating : Float) : Text {
    let ratingText = rating.toText();
    switch (cohort) {
      case (#PowerEarner) {
        "DRIVER COHORT ARCHETYPE — POWER EARNER:\n" #
        "This driver is a POWER EARNER (200+ trips/month or R20k+/month earnings). Rating: " # ratingText # ".\n" #
        "Recommend 5+ high-value B2B pitches (R5k+ deals minimum) per session.\n" #
        "Use confident, deal-making language: 'You have the exposure to close this', 'This brand fits your route perfectly'.\n" #
        "Forecast monthly advertising income potential: 'Based on your " # ratingText # " rating and route exposure, you could close R15k–R50k/month'.\n" #
        "Surface diverse SA companies across all industries.\n" #
        "Push for contract length and exclusivity discussions (3/6/12-month deals).\n";
      };
      case (#GrowthDriver) {
        "DRIVER COHORT ARCHETYPE — GROWTH DRIVER:\n" #
        "This driver is a GROWTH DRIVER (100–199 trips/month or R8k–R20k/month earnings). Rating: " # ratingText # ".\n" #
        "Recommend 2–3 mid-market pitches (R2k–R5k deals) per session.\n" #
        (if (rating < 4.8) {
          "Note their " # ratingText # " rating: improving to 4.8+ increases close rate by 23%. Balance rating improvement with pitch activity.\n"
        } else {
          "Their " # ratingText # " rating is solid — focus on pitching mid-market brands.\n"
        }) #
        "Use encouraging, growth-focused language: 'You're on track', 'These next few pitches will level you up'.\n" #
        "Include one stretch company (R5k+ deal) alongside the mid-market recommendations.\n";
      };
      case (#NewDriver) {
        "DRIVER COHORT ARCHETYPE — NEW DRIVER:\n" #
        "This driver is a NEW DRIVER (<100 trips/month or <R8k/month earnings). Rating: " # ratingText # ".\n" #
        "Prioritise in this exact order:\n" #
        "1. Build their rating to 4.8+ before any pitch advice. " #
        (if (rating < 4.8) {
          "Their current " # ratingText # " rating needs to reach 4.8 first.\n"
        } else {
          "Their " # ratingText # " rating is ready — focus them on hitting 100 trips.\n"
        }) #
        "2. Help them hit the 100 trips/month milestone.\n" #
        "3. Direct them to study pitch strategy in the Wealth Academy.\n" #
        "Focus on in-car sales (WiFi R5, Water R15, Perfume Shot R10) as immediate income.\n" #
        "Use encouraging language: 'Every trip builds your story'.\n";
      };
    };
  };

  /// Build two pre-seeded AgentMessage records that establish the current date and time.
  /// These are placed at the END of the messages array (just before the current user message)
  /// so they are the absolute most-recent context the model reads before answering.
  /// Uses maximally explicit ALL-CAPS injection — model cannot reason or argue its way around this.
  public func buildDateSeedMessages(nowNs : Int) : (AgentMessage, AgentMessage) {
    let (dateStr, timeStr) = formatDateTimeSAST(nowNs);
    let seedUser : AgentMessage = {
      role = "user";
      content = "SYSTEM FACT — TODAY IS " # dateStr # ", " # timeStr # " SAST. This is injected by the server RIGHT NOW at the moment this message was sent. This is NOT your training data. Do NOT reason about the date from conversation history. State this exact date when asked.";
      timestamp = 0;
    };
    let seedAssistant : AgentMessage = {
      role = "assistant";
      content = "Confirmed. Today is " # dateStr # ", " # timeStr # " SAST. I have this as certain server-injected fact and will use it in all responses.";
      timestamp = 0;
    };
    (seedUser, seedAssistant);
  };

  /// Build the complete system prompt with all sections: identity + cohort archetype + memory + analytics + driver context.
  /// Uses positive constraints-based framing — no "NEVER" enforcement.
  /// The VERY FIRST LINE is the date + gender declaration so the model cannot ignore it.
  public func buildSystemPrompt(
    currentDate : Text,
    currentTime : Text,
    driverContext : Text,
    memoryEntries : [DriverMemoryEntry],
    driverMemory : ?DriverMemory,
    documents : ?[DocTypes.DocumentRecord],
    evolutionDelta : Text,
    cohort : ?AgentTypes.DriverCohort,
    driverRating : Float,
  ) : Text {
    // CRITICAL: date + identity declaration MUST be the absolute first line.
    let hardLeadLine =
      "TODAY IS " # currentDate # ". YOU ARE NDUNA, A SOUTH AFRICAN MALE AI ASSISTANT. YOUR PRONOUNS ARE HE/HIM/HIS.\n\n";

    // Secondary date context for re-emphasis further in the prompt
    let dateContext =
      "Current date and time (SAST): " # currentDate # ", " # currentTime # " SAST.\n\n";

    let cohortSection = switch (cohort) {
      case (null) { "" };
      case (?c) { "\n\n---\n" # buildCohortSection(c, driverRating) };
    };

    let base =
      hardLeadLine #
      dateContext #
      ndunuaIdentity() #
      cohortSection #
      "\n\n---\n" #
      buildMemoryContext(memoryEntries, driverMemory, documents) #
      "\n---\nLIVE DRIVER CONTEXT:\n" # driverContext;

    if (evolutionDelta == "") {
      base;
    } else {
      base # "\n\n---\nNDUNA LEARNED CONTEXT (from monthly analysis):\n" # evolutionDelta;
    };
  };

  /// Send a message to Nduna via HTTP outcall (OpenAI-compatible API).
  /// Takes full persistent conversation history (not just session messages).
  /// nowNs must be IC.time() at call time — used to generate date seed messages.
  /// gatewayUrl/gatewayKey: optional Cloudflare AI Gateway config — routes through gateway
  ///   when both are set, falls back to direct OpenRouter when not configured.
  /// orbisApiKey: optional Orbis API key — enables PQS pre-flight and Orbis LLM fallback.
  /// metricsState: optional GatewayMetrics state for fire-and-forget performance recording.
  /// Returns the assistant's text reply (already stripped of chain-of-thought leaks).
  /// Also returns optional PQS score (for analytics logging by caller).
  public func queryAgent(
    apiKey : Text,
    apiUrl : Text,
    model : Text,
    message : Text,
    persistedHistory : [AgentMessage],
    currentDate : Text,
    currentTime : Text,
    driverContext : Text,
    memoryEntries : [DriverMemoryEntry],
    driverMemory : ?DriverMemory,
    documents : ?[DocTypes.DocumentRecord],
    evolutionDelta : Text,
    cohort : ?AgentTypes.DriverCohort,
    driverRating : Float,
    nowNs : Int,
    gatewayUrl : ?Text,
    gatewayKey : ?Text,
    metricsState : ?GatewayMetrics.State,
    orbisApiKey : ?Text,
  ) : async* (Text, ?Nat) {
    let systemPrompt = buildSystemPrompt(currentDate, currentTime, driverContext, memoryEntries, driverMemory, documents, evolutionDelta, cohort, driverRating);

    // ── PQS pre-flight check ──────────────────────────────────────────────────
    // Only run when Orbis key is set. Any PQS failure = proceed normally (non-blocking).
    var pqsScore : ?Nat = null;
    switch (orbisApiKey) {
      case (null) {};
      case (?oKey) {
        if (oKey != "") {
          // PQS check is fire-and-forget — wrap in try/catch so it never blocks
          let pqsResult = try {
            await* OrbisProvider.scorePromptQuality(oKey, message, systemPrompt);
          } catch (_) {
            #err("pqs_exception")
          };
          switch (pqsResult) {
            case (#err(_)) {
              // PQS failed — proceed normally
            };
            case (#ok(score)) {
              pqsScore := ?score;
              if (score < OrbisProvider.PQS_MIN_SCORE) {
                // Prompt too vague — return clarification without making any LLM call
                return (OrbisProvider.PQS_LOW_SCORE_REPLY, ?score);
              };
            };
          };
        };
      };
    };

    // Cap at last 200 messages (rolling window)
    let histSize = persistedHistory.size();
    let histStart = if (histSize > 200) { histSize - 200 : Nat } else { 0 };
    let recentHistory = persistedHistory.sliceToArray(histStart, histSize);

    // Build the date seed pair — placed at END of array (most recent context wins)
    let (seedUser, seedAssistant) = buildDateSeedMessages(nowNs);

    // Compute hardLeadLine for date prepending on all user messages
    let (dateStr, _timeStr) = formatDateTimeSAST(nowNs);
    let hardLeadLine = "TODAY IS " # dateStr # ". YOU MUST USE THIS DATE. ";

    // Build JSON messages array:
    // [system, ...history (user msgs date-stamped), seedUser, seedAssistant, currentUserMessage]
    // Seed messages go at END so they are the last thing the model reads before the question.
    var messagesJson =
      "[{\"role\":\"system\",\"content\":\"" # escapeJson(systemPrompt) # "\"}";

    // Append conversation history — prepend hardLeadLine to every user message
    for (msg in recentHistory.values()) {
      let content = if (msg.role == "user") {
        hardLeadLine # msg.content;
      } else {
        msg.content;
      };
      messagesJson := messagesJson # ",{\"role\":\"" # msg.role # "\",\"content\":\"" # escapeJson(content) # "\"}";
    };

    // Date seed messages right before the current user message (END of context)
    messagesJson := messagesJson #
      ",{\"role\":\"user\",\"content\":\"" # escapeJson(seedUser.content) # "\"}" #
      ",{\"role\":\"assistant\",\"content\":\"" # escapeJson(seedAssistant.content) # "\"}";

    // Current user message — also date-stamped so it cannot be missed
    messagesJson := messagesJson # ",{\"role\":\"user\",\"content\":\"" # escapeJson(hardLeadLine # message) # "\"}]";

    let requestBody = "{\"model\":\"" # model # "\",\"messages\":" # messagesJson # ",\"max_tokens\":600,\"temperature\":0.7}";

    // ── Route decision ────────────────────────────────────────────────────────
    let routeDecision = GatewayRouter.resolveOpenRouterRoute(gatewayUrl, gatewayKey, apiUrl, apiKey);
    let (resolvedUrl, resolvedKey) = switch (routeDecision) {
      case (#gateway(cfg)) {
        // Cloudflare AI Gateway: build the full OpenRouter path under the gateway
        (GatewayRouter.buildOpenRouterGatewayUrl(cfg.url), cfg.apiKey)
      };
      case (#direct(cfg)) { (cfg.url, cfg.apiKey) };
    };
    let usingGateway = GatewayRouter.isGateway(routeDecision);

    let callStart = Time.now();

    let httpRequest : IC.http_request_args = {
      url = resolvedUrl;
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # resolvedKey },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
        { name = "HTTP-Referer"; value = "https://moneydrive.app" },
        { name = "X-Title"; value = "MoneyDrive" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let responseResult = try {
      let resp = await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
      #ok(resp)
    } catch (e) {
      #err(e.message())
    };

    // ── Gateway fallback: if gateway returned 5xx, retry with direct ──────────
    let finalResult = switch (responseResult) {
      case (#err(msg)) {
        // Network/timeout error — try direct if we were using gateway
        if (usingGateway) {
          let fallbackReq : IC.http_request_args = {
            httpRequest with
            url = apiUrl;
            headers = [
              { name = "Content-Type"; value = "application/json" },
              { name = "Authorization"; value = "Bearer " # apiKey },
              { name = "User-Agent"; value = "MoneyDrive/1.0" },
              { name = "HTTP-Referer"; value = "https://moneydrive.app" },
              { name = "X-Title"; value = "MoneyDrive" },
            ];
          };
          try {
            let resp = await (with cycles = 100_000_000_000) IC.http_request(fallbackReq);
            #ok(resp)
          } catch (e2) {
            #err("Error: Nduna is temporarily unavailable (" # msg # "; fallback: " # e2.message() # "). Please try again.")
          }
        } else {
          #err("Error: Nduna is temporarily unavailable (" # msg # "). Please try again.")
        }
      };
      case (#ok(resp)) {
        // 5xx from gateway — fallback to direct
        if (usingGateway and resp.status >= 500 and resp.status < 600) {
          let fallbackReq : IC.http_request_args = {
            httpRequest with
            url = apiUrl;
            headers = [
              { name = "Content-Type"; value = "application/json" },
              { name = "Authorization"; value = "Bearer " # apiKey },
              { name = "User-Agent"; value = "MoneyDrive/1.0" },
              { name = "HTTP-Referer"; value = "https://moneydrive.app" },
              { name = "X-Title"; value = "MoneyDrive" },
            ];
          };
          try {
            let resp2 = await (with cycles = 100_000_000_000) IC.http_request(fallbackReq);
            #ok(resp2)
          } catch (_e3) {
            #ok(resp) // return original 5xx body if fallback also fails
          }
        } else {
          #ok(resp)
        }
      };
    };

    let durationMs = Int.abs((Time.now() - callStart) / 1_000_000);

    // ── Record metrics (fire-and-forget) ──────────────────────────────────────
    switch (metricsState) {
      case (?ms) {
        let (metricError, wasCached) = switch (finalResult) {
          case (#err(msg)) { (?msg, false) };
          case (#ok(resp)) {
            // Cloudflare sets cf-cache-status header when serving from cache
            let cached = resp.headers.filter(func(h : { name : Text; value : Text }) : Bool {
              h.name.toLower() == "cf-cache-status" and h.value.toLower() == "hit"
            }).size() > 0;
            (null, cached)
          };
        };
        let entry : GatewayMetrics.MetricEntry = {
          timestamp  = callStart;
          durationMs;
          isGateway  = usingGateway;
          wasCached;
          model;
          error = metricError;
        };
        GatewayMetrics.record(ms, entry);
      };
      case (null) {};
    };

    // ── Extract and clean response (with Orbis fallback) ──────────────────────
    let openRouterText : ?Text = switch (finalResult) {
      case (#err(_)) { null };
      case (#ok(resp)) {
        switch (resp.body.decodeUtf8()) {
          case (null) { null };
          case (?text) {
            let raw = extractContent(text);
            if (raw == "" or raw == "Sorry, I could not process your request right now.") {
              null // treat as failure → try Orbis
            } else {
              ?raw
            }
          };
        };
      };
    };

    // If OpenRouter/gateway succeeded, return cleaned reply
    switch (openRouterText) {
      case (?raw) {
        let cleaned = stripChainOfThought(raw);
        return (replacePronounsForNduna(cleaned), pqsScore);
      };
      case (null) {};
    };

    // ── Orbis LLM fallback ────────────────────────────────────────────────────
    switch (orbisApiKey) {
      case (?oKey) {
        if (oKey != "") {
          // Build a minimal messages array for Orbis (system + recent history + current)
          let orbisMessages : [AgentMessage] = [{
            role = "system";
            content = systemPrompt;
            timestamp = 0;
          }].concat(persistedHistory.sliceToArray(
            if (persistedHistory.size() > 10) { persistedHistory.size() - 10 : Nat } else { 0 },
            persistedHistory.size()
          )).concat([{
            role = "user";
            content = message;
            timestamp = 0;
          }]);

          let orbisResult = try {
            await* OrbisProvider.queryOrbisFallback(oKey, "", orbisMessages);
          } catch (_) {
            #err("orbis_exception")
          };

          switch (orbisResult) {
            case (#ok(orbisRaw)) {
              let cleaned = stripChainOfThought(orbisRaw);
              return (replacePronounsForNduna(cleaned), pqsScore);
            };
            case (#err(_)) {
              // Orbis also failed — fall through to error message
            };
          };
        };
      };
      case (null) {};
    };

    // All providers failed
    let errMsg = switch (finalResult) {
      case (#err(msg)) { msg };
      case (#ok(_)) { "Error: could not decode response from Nduna." };
    };
    (errMsg, pqsScore);
  };

  /// Make a Tavily web search HTTP outcall.
  /// Returns formatted search results as a Text string for Hermes context injection.
  public func tavilySearch(apiKey : Text, searchQuery : Text) : async* Text {
    let requestBody =
      "{\"query\":\"" # escapeJson(searchQuery) # "\"," #
      "\"api_key\":\"" # escapeJson(apiKey) # "\"," #
      "\"max_results\":10," #
      "\"search_depth\":\"advanced\"," #
      "\"include_answer\":true}";

    let httpRequest : IC.http_request_args = {
      url = "https://api.tavily.com/search";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let httpResponse = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return "Web search failed: " # e.message();
    };

    switch (httpResponse.body.decodeUtf8()) {
      case (null) { "Web search failed: could not decode response." };
      case (?text) { parseTavilyResponse(text) };
    };
  };

  /// Make a Tavily web search and return the raw JSON response text.
  public func tavilySearchRaw(apiKey : Text, searchQuery : Text) : async* Text {
    let requestBody =
      "{\"query\":\"" # escapeJson(searchQuery) # "\"," #
      "\"api_key\":\"" # escapeJson(apiKey) # "\"," #
      "\"max_results\":10," #
      "\"search_depth\":\"advanced\"," #
      "\"include_answer\":true}";

    let httpRequest : IC.http_request_args = {
      url = "https://api.tavily.com/search";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let httpResponse = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return "";
    };

    switch (httpResponse.body.decodeUtf8()) {
      case (null) { "" };
      case (?text) { text };
    };
  };

  /// Check if a Tavily JSON response contains hiring/expansion signals.
  public func detectHiringSignal(json : Text) : (Bool, Text) {
    let lowerJson = json.toLower();
    let hiringKeywords = [
      "hiring", "recruiting", "expanding", "expansion", "growing",
      "new office", "new branch", "job openings", "vacancies", "careers",
      "is looking for", "seeking candidates", "talent acquisition",
    ];
    var found = false;
    for (kw in hiringKeywords.values()) {
      if (lowerJson.contains(#text kw)) { found := true };
    };
    if (not found) { return (false, "") };

    var snippet = "";
    switch (splitOnFirst(json, "\"answer\":\"")) {
      case (?(_, rest)) {
        let answer = takeUntilQuote(rest);
        if (answer.size() > 0 and answer != "null") {
          let arr = answer.toArray();
          let len = if (arr.size() < 120) { arr.size() } else { 120 };
          snippet := Text.fromArray(arr.sliceToArray(0, len));
        };
      };
      case (null) {};
    };
    if (snippet == "") {
      switch (splitOnFirst(json, "\"title\":\"")) {
        case (?(_, rest)) { snippet := takeUntilQuote(rest) };
        case (null) {};
      };
    };
    (true, snippet);
  };

  /// Parse Tavily JSON and extract company names + URLs as a simple array of (name, url) pairs.
  public func parseTavilyCompanies(json : Text) : [(Text, Text)] {
    let results = List.empty<(Text, Text)>();
    var remaining = json;
    var count = 0;
    label scan loop {
      if (count >= 10) { break scan };
      switch (splitOnFirst(remaining, "\"title\":\"")) {
        case (null) { break scan };
        case (?(_, afterTitle)) {
          let title = takeUntilQuote(afterTitle);
          remaining := afterTitle;
          switch (splitOnFirst(remaining, "\"url\":\"")) {
            case (null) { break scan };
            case (?(_, afterUrl)) {
              let url = takeUntilQuote(afterUrl);
              remaining := afterUrl;
              if (title.size() > 2) {
                results.add((title, url));
                count += 1;
              };
            };
          };
        };
      };
    };
    results.toArray();
  };

  /// Parse Tavily event search results into EventIntelligence-like records.
  public func parseTavilyEvents(json : Text) : [(Text, Text, Text, Text)] {
    let results = List.empty<(Text, Text, Text, Text)>();
    var remaining = json;
    var count = 0;
    label scan loop {
      if (count >= 10) { break scan };
      switch (splitOnFirst(remaining, "\"title\":\"")) {
        case (null) { break scan };
        case (?(_, afterTitle)) {
          let title = takeUntilQuote(afterTitle);
          remaining := afterTitle;
          switch (splitOnFirst(remaining, "\"url\":\"")) {
            case (null) { break scan };
            case (?(_, afterUrl)) {
              let url = takeUntilQuote(afterUrl);
              remaining := afterUrl;
              var snippet = "";
              switch (splitOnFirst(remaining, "\"content\":\"")) {
                case (?(_, afterContent)) {
                  let raw = takeUntilQuote(afterContent);
                  let arr = raw.toArray();
                  let len = if (arr.size() < 100) { arr.size() } else { 100 };
                  snippet := Text.fromArray(arr.sliceToArray(0, len));
                };
                case (null) {};
              };
              if (title.size() > 2) {
                results.add((title, snippet, "TBD", url));
                count += 1;
              };
            };
          };
        };
      };
    };
    results.toArray();
  };

  /// Parse Tavily JSON response into a readable text summary.
  private func parseTavilyResponse(json : Text) : Text {
    var result = "TAVILY WEB SEARCH RESULTS:\n";

    switch (splitOnFirst(json, "\"answer\":\"")) {
      case (?(_, rest)) {
        let answer = takeUntilQuote(rest);
        if (answer != "" and answer != "null") {
          result := result # "Answer: " # answer # "\n\n";
        };
      };
      case (null) {};
    };

    var remaining = json;
    var count = 0;
    label scan loop {
      if (count >= 3) { break scan };
      switch (splitOnFirst(remaining, "\"title\":\"")) {
        case (null) { break scan };
        case (?(_, afterTitle)) {
          let title = takeUntilQuote(afterTitle);
          remaining := afterTitle;
          switch (splitOnFirst(remaining, "\"url\":\"")) {
            case (null) { break scan };
            case (?(_, afterUrl)) {
              let url = takeUntilQuote(afterUrl);
              remaining := afterUrl;
              count += 1;
              result := result # count.toText() # ". " # title # "\n   " # url # "\n";
            };
          };
        };
      };
    };

    if (count == 0) {
      result := result # "[No results found]";
    };
    result;
  };

  /// Replace all occurrences of `needle` with `replacement` in `haystack`.
  private func replaceAll(haystack : Text, needle : Text, replacement : Text) : Text {
    var result = "";
    var remaining = haystack;
    label scan loop {
      switch (splitOnFirst(remaining, needle)) {
        case (null) {
          result := result # remaining;
          break scan;
        };
        case (?(before, after)) {
          result := result # before # replacement;
          remaining := after;
        };
      };
    };
    result;
  };

  /// Remove entire block between openTag and closeTag (inclusive).
  private func stripTaggedBlock(text : Text, openTag : Text, closeTag : Text) : Text {
    var result = "";
    var remaining = text;
    label scan loop {
      switch (splitOnFirst(remaining, openTag)) {
        case (null) {
          result := result # remaining;
          break scan;
        };
        case (?(before, after)) {
          result := result # before;
          switch (splitOnFirst(after, closeTag)) {
            case (null) { break scan };
            case (?(_, afterClose)) { remaining := afterClose };
          };
        };
      };
    };
    result;
  };

  /// Strip all XML-style tagged blocks from text.
  /// Handles any tag name: <think>...</think>, <reasoning>...</reasoning>, etc.
  private func stripAllXmlBlocks(text : Text) : Text {
    // Strip known problematic block tags
    let knownTags = [
      ("<think>", "</think>"),
      ("<thinking>", "</thinking>"),
      ("<reasoning>", "</reasoning>"),
      ("<reflection>", "</reflection>"),
      ("<scratchpad>", "</scratchpad>"),
      ("<nduna-think>", "</nduna-think>"),
      ("<analysis>", "</analysis>"),
      ("<thought>", "</thought>"),
      ("<thoughts>", "</thoughts>"),
      ("<internal>", "</internal>"),
      ("<chain_of_thought>", "</chain_of_thought>"),
      ("<response_format>", "</response_format>"),
      ("<answer>", "</answer>"),
      ("[REASONING]", "[/REASONING]"),
      ("[THINKING]", "[/THINKING]"),
      ("[ANALYSIS]", "[/ANALYSIS]"),
      ("[INTERNAL]", "[/INTERNAL]"),
    ];
    var result = text;
    for ((open, close) in knownTags.values()) {
      result := stripTaggedBlock(result, open, close);
    };
    result;
  };

  /// Strip square-bracket metadata tokens that look like [UPPERCASE_WORDS].
  /// e.g. [HIGH], [MEDIUM], [LOW], [CRITICAL], [INFO], [WARNING], [REASONING], etc.
  private func stripSquareBracketTokens(text : Text) : Text {
    // Known classification/metadata tags
    let tokens = ["[HIGH]", "[MEDIUM]", "[LOW]", "[CRITICAL]", "[INFO]", "[WARNING]",
                  "[REASONING]", "[THINKING]", "[REFLECTION]", "[NOTE]", "[CONTEXT]",
                  "[ANALYSIS]", "[RESPONSE]", "[ANSWER]", "[SUMMARY]", "[INTERNAL]",
                  "[THOUGHT]", "[THOUGHTS]", "[CHAIN_OF_THOUGHT]", "[COT]"];
    var result = text;
    for (tok in tokens.values()) {
      result := replaceAll(result, tok, "");
    };
    result;
  };

  /// Filter out lines that start with reasoning/chain-of-thought prefixes.
  private func filterReasoningLines(text : Text) : Text {
    let coTPrefixes = [
      "Let me ", "Let's think", "I need to ", "I'm going to ", "I will ", "I must ",
      "First, I ", "First I ", "I should ", "Thinking about", "My approach",
      "To answer", "Analyzing", "Looking at", "Based on my reasoning",
      "Step 1:", "Step 2:", "Step 3:", "Step 4:", "Step 5:",
      "The user is asking", "The user wants", "The user has",
      "Nduna thinks", "Nduna should", "Nduna needs", "Nduna will",
      "Nduna is going", "Nduna must", "Nduna can",
      "Let me think", "I will reason", "I am going to",
      "Let me consider", "Let me analyze", "Let me look",
      "I need to consider", "I need to think", "I need to analyze",
    ];

    var result = "";
    var firstLine = true;
    for (line in text.split(#char '\n')) {
      var isReasoning = false;
      for (prefix in coTPrefixes.values()) {
        if (line.startsWith(#text prefix)) {
          isReasoning := true;
        };
      };
      if (not isReasoning) {
        if (not firstLine) {
          result := result # "\n";
        };
        result := result # line;
        firstLine := false;
      };
    };
    result;
  };

  /// Collapse runs of 3+ blank lines down to 2.
  private func collapseBlankLines(text : Text) : Text {
    // Simple approach: replace triple newlines with double
    var result = text;
    var prev = "";
    label scan loop {
      prev := result;
      result := replaceAll(result, "\n\n\n", "\n\n");
      if (result == prev) { break scan };
    };
    result;
  };

  /// Replace female pronouns referring to Nduna with the correct male pronouns.
  /// Nduna is MALE — he/him/his/himself. Applied globally to all Nduna responses.
  public func replacePronounsForNduna(text : Text) : Text {
    // Word-boundary pronoun replacement using a simple char-level scanner.
    // We check that each match is surrounded by non-alpha characters (simulating \b).
    replaceWordBoundary(
      replaceWordBoundary(
        replaceWordBoundary(
          replaceWordBoundary(
            replaceWordBoundary(
              replaceWordBoundary(
                replaceWordBoundary(
                  replaceWordBoundary(text,
                    "Herself", "Himself"),
                  "herself", "himself"),
                "Hers", "His"),
              "hers", "his"),
            "Her", "Him"),
          "her", "him"),
        "She", "He"),
      "she", "he")
  };

  /// Replace all word-boundary occurrences of `needle` with `replacement`.
  /// A word boundary here means the character before is not a-z/A-Z/0-9 and
  /// the character after the needle is not a-z/A-Z/0-9.
  private func replaceWordBoundary(haystack : Text, needle : Text, replacement : Text) : Text {
    let arr = haystack.toArray();
    let needleArr = needle.toArray();
    let nLen = needleArr.size();
    let tLen = arr.size();
    if (nLen == 0 or tLen < nLen) return haystack;

    var result = "";
    var i = 0;
    while (i < tLen) {
      // Try to match needle at position i
      if (i + nLen <= tLen) {
        var match = true;
        var j = 0;
        while (j < nLen) {
          if (arr[i + j] != needleArr[j]) { match := false };
          j += 1;
        };
        if (match) {
          // Check left boundary: position i-1 must be non-alpha or start of string
          let leftOk = if (i == 0) { true } else {
            let c = arr[i - 1];
            let code = c.toNat32();
            not ((code >= 65 and code <= 90) or (code >= 97 and code <= 122) or (code >= 48 and code <= 57))
          };
          // Check right boundary: position i+nLen must be non-alpha or end of string
          let rightOk = if (i + nLen >= tLen) { true } else {
            let c = arr[i + nLen];
            let code = c.toNat32();
            not ((code >= 65 and code <= 90) or (code >= 97 and code <= 122) or (code >= 48 and code <= 57))
          };
          if (leftOk and rightOk) {
            result := result # replacement;
            i := i + nLen;
          } else {
            result := result # Text.fromChar(arr[i]);
            i += 1;
          };
        } else {
          result := result # Text.fromChar(arr[i]);
          i += 1;
        };
      } else {
        result := result # Text.fromChar(arr[i]);
        i += 1;
      };
    };
    result;
  };

  /// Strip all chain-of-thought artifacts from the LLM response.
  /// Uses broad approach: HTML entity decode → XML blocks → bracket tokens → reasoning lines.
  public func stripChainOfThought(text : Text) : Text {
    // Step 0: HTML entity decode — catch escaped XML like &lt;think&gt; or \<think\>
    var decoded = text;
    decoded := replaceAll(decoded, "&lt;", "<");
    decoded := replaceAll(decoded, "&gt;", ">");
    decoded := replaceAll(decoded, "&#60;", "<");
    decoded := replaceAll(decoded, "&#62;", ">");
    decoded := replaceAll(decoded, "\\<", "<");
    decoded := replaceAll(decoded, "\\>", ">");
    // Step 1: Remove entire XML-style tagged blocks
    let step1 = stripAllXmlBlocks(decoded);
    // Step 2: Remove square-bracket metadata tokens
    let step2 = stripSquareBracketTokens(step1);
    // Step 3: Remove lines starting with reasoning patterns
    let step3 = filterReasoningLines(step2);
    // Step 4: Remove markdown bold and italic
    let step4 = replaceAll(step3, "**", "");
    let step5 = replaceAll(step4, "* ", " ");
    // Step 5: Collapse excessive blank lines
    let step6 = collapseBlankLines(step5);
    // Step 6: Trim
    let trimmed = step6.trim(#predicate(func(c : Char) : Bool {
      c == ' ' or c == '\n' or c == '\r' or c == '\t'
    }));
    if (trimmed == "") {
      "How can I help you today?"
    } else {
      trimmed
    };
  };

  /// Split `text` into (before, after) on first occurrence of `sep`. Returns null if not found.
  public func splitOnFirst(text : Text, sep : Text) : ?(Text, Text) {
    let textArr = text.toArray();
    let sepArr = sep.toArray();
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
        var before = "";
        var k = 0;
        while (k < i) {
          before := before # Text.fromChar(textArr[k]);
          k += 1;
        };
        var after = "";
        var m = i + sLen;
        while (m < tLen) {
          after := after # Text.fromChar(textArr[m]);
          m += 1;
        };
        return ?(before, after);
      };
      i += 1;
    };
    null;
  };

  /// Escape special characters in a JSON string value.
  public func escapeJson(s : Text) : Text {
    var result = "";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if (code == 34) { result := result # "\\\"" }
      else if (code == 92) { result := result # "\\\\" }
      else if (code == 10) { result := result # "\\n" }
      else if (code == 13) { result := result # "\\r" }
      else if (code == 9) { result := result # "\\t" }
      else { result := result # Text.fromChar(c) };
    };
    result;
  };

  /// Extract the assistant's message content from an OpenAI JSON response.
  /// Handles reasoning models that return a separate "reasoning_content" field
  /// (e.g. DeepSeek, Qwen) — we ONLY use "content", never "reasoning_content".
  /// Strategy: find "choices" array, walk to "message" object, then extract "content".
  /// Falls back to a simple marker scan for non-standard response shapes.
  private func extractContent(json : Text) : Text {
    // Primary path: find choices[0].message.content
    // We search for "message":{ then for "content": inside it, skipping reasoning_content.
    switch (splitOnFirst(json, "\"message\":")) {
      case (?(_, afterMessage)) {
        // Find "content": but make sure we skip "reasoning_content":
        // Strategy: scan for "content": but reject if immediately preceded by "reasoning_"
        var remaining = afterMessage;
        var found = "";
        label contentScan loop {
          switch (splitOnFirst(remaining, "\"content\":\"")) {
            case (null) { break contentScan };
            case (?(before, after)) {
              // Check that this isn't "reasoning_content"
              // The `before` text ends just before "content":"
              // If the last 10 chars of before contain "reasoning_", skip this match
              let beforeArr = before.toArray();
              let checkLen = if (beforeArr.size() >= 10) { 10 } else { beforeArr.size() };
              let tail = Text.fromArray(beforeArr.sliceToArray(beforeArr.size() - checkLen : Nat, beforeArr.size()));
              if (tail.contains(#text "reasoning_")) {
                // This is reasoning_content — skip it and continue scanning
                remaining := after;
              } else {
                found := takeUntilQuote(after);
                break contentScan;
              };
            };
          };
        };
        if (found != "") { return found };
        // Fallback: try the simple marker approach
        switch (splitOnFirst(json, "\"content\":\"")) {
          case (null) {
            switch (splitOnFirst(json, "\"message\":\"")) {
              case (null) { "Sorry, I could not process your request right now." };
              case (?(_, rest)) { takeUntilQuote(rest) };
            };
          };
          case (?(_, rest)) { takeUntilQuote(rest) };
        };
      };
      case (null) {
        // No "message": key — try simple fallback
        switch (splitOnFirst(json, "\"content\":\"")) {
          case (null) { "Sorry, I could not process your request right now." };
          case (?(_, rest)) { takeUntilQuote(rest) };
        };
      };
    };
  };

  /// Take characters from `text` until the first unescaped double-quote.
  public func takeUntilQuote(text : Text) : Text {
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
};
