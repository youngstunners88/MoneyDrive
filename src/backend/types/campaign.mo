module {

  /// Lifecycle states of a campaign. Campaigns always require admin approval before publishing.
  public type CampaignStatus = {
    #draft;           // Nduna has proposed — not yet submitted for review
    #pending_approval; // Submitted to admin for review
    #approved;        // Admin approved — ready to publish or scheduled
    #active;          // Currently sending
    #paused;          // Admin manually paused
    #completed;       // All sends done, tracking window active
    #rejected;        // Admin rejected — reason stored in rejectionReason
    #archived;        // Manually archived after the campaign lifecycle
  };

  /// SA-localized driver segment for campaign targeting.
  public type DriverSegment = {
    archetype : Text;        // "PowerEarner" | "GrowthDriver" | "NewDriver"
    city      : Text;        // "Johannesburg" | "Cape Town" | "Durban" | "Pretoria" | "All"
    platform  : Text;        // "Uber" | "Bolt" | "InDrive" | "All"
    tier      : Nat;         // minimum subscription tier (0 = all tiers)
    estimatedCount : Nat;    // estimated driver count matching this segment
  };

  /// Which channel(s) the campaign will use.
  public type CampaignChannel = {
    #whatsapp;
    #email;
    #both;
  };

  /// The Minto-Pyramid message angle — answer-first, proof, CTA.
  public type MessageAngle = {
    #earnings_proof;        // Lead with a driver's earning improvement stat
    #feature_benefit;       // Lead with a specific feature benefit (e.g. in-car sales)
    #referral_incentive;    // Lead with R50 referral reward
    #limited_time_offer;    // Lead with a time-bound offer or trial
  };

  /// All creative assets for a campaign.
  public type CampaignCreative = {
    copySubjectLine : Text;  // Email subject / WhatsApp opening hook
    copyHook        : Text;  // First sentence — the Minto answer (what the driver gets)
    copyBody        : Text;  // Proof point + CTA (Minto pyramid: answer → why → what)
    imageUrl        : Text;  // Image URL (Orbis Image Gen or empty)
    videoUrl        : ?Text; // Optional rendered video URL from Hyperframes
    videoJobId      : ?Text; // Hyperframes job ID if video is being generated
  };

  /// A full campaign record. Immutable once approved (except status + admin fields).
  public type Campaign = {
    id              : Text;
    status          : CampaignStatus;
    segment         : DriverSegment;
    channel         : CampaignChannel;
    angle           : MessageAngle;
    creative        : ?CampaignCreative;
    createdAt       : Int;
    approvedAt      : ?Int;
    publishedAt     : ?Int;
    adminNotes      : ?Text;   // Set by requestChanges() — visible to Nduna on next proposal
    rejectionReason : ?Text;   // Set by rejectCampaign()
    trackingUtm     : Text;    // utm_source=nduna_campaign&utm_medium=…&utm_campaign={id}
    isAbTest        : Bool;    // True when this campaign is one of two A/B variants
    abVariantId     : ?Text;   // "A" or "B" when isAbTest = true
    abWinner        : ?Bool;   // true = this variant won; false = lost; null = undecided
  };

  /// A single conversion event attributed to a campaign.
  public type CampaignConversionEvent = {
    campaignId : Text;
    driverId   : Text;
    eventType  : { #click; #trial_start; #trial_conversion };
    timestamp  : Int;
    revenue    : ?Float;  // Rand value if trackable (e.g. trial → paid)
  };

  /// Aggregated performance metrics for a campaign.
  public type CampaignMetrics = {
    campaignId        : Text;
    sends             : Nat;
    trialStarts       : Nat;
    paidConversions   : Nat;
    conversionRate    : Float;  // paidConversions / sends
    revenueAttributed : Float;  // sum of revenue events in Rand
    lastUpdated       : Int;
  };

  /// A/B test result comparing two campaign variants.
  public type AbTestResult = {
    campaignAId      : Text;
    campaignBId      : Text;
    winnerCampaignId : ?Text;    // null until a winner is determined
    decidedAt        : ?Int;
    aConversionRate  : Float;
    bConversionRate  : Float;
  };

  /// A failure log entry — Nduna uses this to avoid repeating bad angles.
  public type CampaignFailureLog = {
    campaignId : Text;
    reason     : Text;
    angle      : MessageAngle;
    segment    : DriverSegment;
    loggedAt   : Int;
  };

  /// Admin-configurable global settings for the campaign engine.
  public type CampaignConfig = {
    maxActiveCampaignsPerDay      : Nat;   // default 3
    maxMessagesPerSegmentPerWeek  : Nat;   // default 1 — prevents over-messaging drivers
    enabled                       : Bool;  // master kill-switch
    weeklyReportEnabled           : Bool;  // send weekly AgentMail report to adminEmail
    adminEmail                    : Text;  // where weekly reports are sent
  };

  /// Weekly summary report generated every Monday morning.
  public type WeeklyReport = {
    weekOf            : Text;   // e.g. "2026-04-21"
    activeCampaigns   : [Text]; // campaign IDs that ran this week
    totalSends        : Nat;
    totalTrialStarts  : Nat;
    totalConversions  : Nat;
    topAngle          : ?Text;  // best-performing MessageAngle as Text
    worstAngle        : ?Text;  // worst-performing MessageAngle as Text
    revenueAttributed : Float;
  };
};
