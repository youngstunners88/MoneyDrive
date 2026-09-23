module {
  /// A single message in an AI agent conversation.
  public type AgentMessage = {
    role : Text;
    content : Text;
    timestamp : Int;
  };

  /// Per-driver conversation state for the Hermes AI Agent (in-memory session).
  public type ConversationState = {
    messages : [AgentMessage];
    driverContext : Text;
  };

  /// Minimal driver profile fields needed by the agent mixin.
  public type AgentDriverProfile = {
    displayName : Text;
    currencyCode : Text;
    subscriptionTier : Nat;
    vehicleName : Text;
  };

  /// Minimal trip fields needed by the agent mixin.
  public type AgentTrip = {
    tripId : Text;
    date : Int;
    amount : Float;
  };

  /// Persistent analytics profile for a driver — computed from all stored data.
  /// Hermes uses this to help drivers understand their earning patterns and
  /// build business cases for car advertising deals (R10k–R50k/month).
  public type DriverAnalyticsProfile = {
    totalTrips : Nat;
    totalEarnings : Float;
    totalExpenses : Float;
    totalFuelCost : Float;
    avgEarningsPerHour : Float;
    topEarningDays : [Text];         // e.g. ["Friday", "Saturday", "Sunday"]
    peakHourRanges : [Text];         // e.g. ["07:00-09:00", "17:00-19:00"]
    estimatedCarExposure : Nat;      // trips × avg_passengers estimate (4 per trip default)
    totalKmsDriven : Float;
    lastCalculated : Int;            // timestamp of last recalculation
  };

  /// Persistent per-driver memory — analogous to HERMES MEMORY.md + USER.md.
  /// Hermes writes to this after conversations with key learnings about the driver.
  public type DriverMemory = {
    agentNotes : Text;   // Hermes's running notes about this driver
    userProfile : Text;  // What Hermes has learned about the driver (goals, preferences, context)
    lastUpdated : Int;
  };

  /// Structured memory entry — a single fact, preference, goal, or learning.
  /// Nduna adds entries when it discovers something important about a driver.
  public type DriverMemoryEntry = {
    key : Text;
    value : Text;
    category : Text;   // 'preference' | 'fact' | 'goal' | 'learning'
    timestamp : Int;
  };

  /// A single Nduna recommendation logged for learning loop tracking.
  /// recommendationType: "surge" | "product" | "advertising"
  /// confidence: "HIGH" | "MEDIUM" | "LOW"
  public type NdunaRecommendation = {
    driverId : Text;
    timestamp : Nat64;
    recommendationType : Text;
    content : Text;
    confidence : Text;
  };

  /// The outcome recorded after a driver acts (or doesn't) on a Nduna recommendation.
  /// driverAction: "accepted" | "ignored" | "in-progress"
  /// outcome: "successful" | "partial" | "failed"
  /// revenue: R value in Rands if trackable
  public type RecommendationOutcome = {
    recommendationId : Nat;
    driverAction : ?Text;
    outcome : ?Text;
    revenue : ?Nat;
    timestamp : Nat64;
  };

  /// Aggregate monthly stats computed from the Nduna recommendation + outcome log.
  /// Used by monthlyPromptEvolution() to feed back into the system prompt.
  public type NdunaMonthlyStats = {
    totalRecommendations : Nat;
    acceptedCount : Nat;
    ignoredCount : Nat;
    successfulCount : Nat;
    totalRevenueTracked : Nat;   // in Rands
    topRecommendationType : Text;
  };

  /// Driver cohort classification — used for cohort-specific Nduna advice.
  public type DriverCohort = {
    #PowerEarner;  // 200+ trips/month or R20k+/month earnings
    #GrowthDriver; // 100-199 trips/month or R8k-R20k/month
    #NewDriver;    // <100 trips/month or <R8k/month
  };

  /// Full cohort profile returned to the driver — includes cohort, context, and Nduna advice.
  public type DriverCohortProfile = {
    cohort : DriverCohort;
    tripsThisMonth : Nat;
    earningsThisMonth : Float;
    rating : Float;                    // 4.8 = good (default 4.5 if not set)
    cohortAdvice : Text;               // Nduna's tailored advice for this cohort
    upgradeRecommendation : Text;      // What to focus on next to level up
  };

  /// State for the Nduna system prompt evolution — tracks the base prompt and the learned delta.
  public type NdunaSystemPromptState = {
    basePrompt : Text;       // Original hardcoded system prompt (set at init or admin override)
    evolutionDelta : Text;   // Current month's learned adjustments (appended to base prompt at chat time)
    lastEvolved : ?Int;      // Timestamp (nanoseconds) of last auto-update; null = never evolved
    evolutionCount : Nat;    // How many times the prompt has been evolved
  };

  /// Structured event intelligence returned by getEventsWithTavilyIntelligence.
  /// Tavily-sourced event data enriched with a driver earning opportunity score.
  public type EventIntelligence = {
    name                   : Text;
    date                   : Text;   // free-text date from Tavily, e.g. "15 June 2025"
    expectedAttendance     : Text;   // free-text estimate, e.g. "10,000+"
    driverOpportunityScore : Nat;    // 0–100 scored by Nduna heuristic
    sourceUrl              : Text;
  };

  // ── Voice Agent / Behavioral Context Types ──────────────────────────────────

  /// A single behavioral event logged for a driver session.
  /// eventType: page_view | feature_interact | trip_logged | lead_clicked |
  ///            deal_touched | recommendation_received | recommendation_acted |
  ///            recommendation_dismissed
  public type BehavioralEvent = {
    eventType : Text;
    page      : Text;
    details   : Text;
    timestamp : Int;
  };

  /// A recommendation outcome logged for Nduna's learning loop.
  /// outcome: acted | dismissed | not_yet
  public type OutcomeEvent = {
    recommendationId : Text;
    outcome          : Text;
    timestamp        : Int;
  };

  /// A proactive trigger condition returned by getProactiveTriggers.
  public type ProactiveTrigger = {
    triggerType : Text;   // e.g. "suggest_leads", "suggest_surges", "suggest_profile"
    message     : Text;   // Human-readable trigger message for Nduna to surface
    page        : Text;   // Page where the trigger should fire: "leads" | "earnings" | "advertising"
  };
};
