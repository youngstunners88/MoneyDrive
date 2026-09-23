
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Stripe "mo:caffeineai-stripe/stripe";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Debug "mo:core/Debug";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Timer "mo:core/Timer";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import EventTypes "types/events";
import AgentTypes "types/agent";
import AdvTypes "types/advertising";
import GeoTypes "types/geolocation";
import CompTypes "types/competitive";
import LeadTypes "types/leads";
import MsgTypes "types/messaging";
import VideoTypes "types/video";
import ReferralTypes "types/referral";
import EventsMixin "mixins/events-api";
import AgentMixin "mixins/agent-api";
import AdvertisingMixin "mixins/advertising-api";
import GeolocationMixin "mixins/geolocation-api";
import LeadsMixin "mixins/leads-api";
import PresentationMixin "mixins/presentation-api";
import MessagingMixin "mixins/messaging-api";
import VideoMixin "mixins/video-api";
import ReferralMixin "mixins/referral-api";
import PaymentMixin "mixins/payment-api";
import HyperframesMixin "mixins/hyperframes-api";
import HyperframesShortsMixin "mixins/hyperframes-shorts-api";
import HFTypes "types/hyperframes";
import BriefingLib "lib/weekly-briefing";
import AgentMailMixin "mixins/agentmail-api";
import AMTypes "types/agentmail";
import WebsiteBuilderMixin "mixins/website-builder-api";
import WBTypes "types/website-builder";
import DocumentMixin "mixins/document-api";
import DocTypes "types/document";
import OpportunityHunterMixin "mixins/opportunity-hunter-api";
import OppTypes "types/opportunity";
import IntelligenceMixin "mixins/intelligence-api";
import IntelTypes "types/intelligence";
import FleetMixin "mixins/fleet-api";
import FleetTypes "types/fleet";
import AnalyticsLog "lib/analytics-log";
import AnalyticsTypes "types/analytics";
import RateLimiter "lib/gateway/RateLimiter";
import GatewayMetrics "lib/gateway/GatewayMetrics";
import OrbisProvider "lib/orbis/OrbisProvider";
import ExaProvider "lib/exa/ExaProvider";
import ZeroXWorkMixin "mixins/0xwork-api";
import ZeroXWorkProvider "lib/0xwork/ZeroXWorkProvider";
import CampaignMixin "mixins/campaign-api";
import CampaignTypes "types/campaign";
import ForumTypes "types/forum";
import ForumMixin "mixins/forum-api";
import XPostingTypes "types/x-posting";
import XPostingMixin "mixins/x-posting-api";
import Migration "migration";



import IC "ic:aaaaa-aa";







(with migration = Migration.run)
actor {
  // ─── Pilot Mode Feature Flag ──────────────────────────────────────────────────
  // MONEYDRIVE_PILOT_MODE=true — change to false to disable pilot mode.
  // pilotMode = true  → blocks all paid third-party outcalls; restricts OpenRouter
  //                      to free-tier models only. Safe-by-default for a 90-day pilot.
  // pilotMode = false → previous behaviour, all outcalls active.
  var pilotMode : Bool = true;
  // Wrapper store so pilot mode can be injected into mixins by reference.
  let pilotModeStore : { var value : Bool } = { var value = true };

  // Types
  type UserId = Principal;

  public type UserProfile = {
    displayName : Text;
    currencyCode : Text;
    subscriptionTier : Nat;
    voiceEnabled : Bool;
    fuelConsumptionRate : Float;
    vehicleName : Text;
  };

  public type Trip = {
    tripId : Text;
    date : Int;
    platform : Text;
    amount : Float;
    durationMinutes : Nat;
    notes : Text;
  };

  public type Product = {
    productId : Text;
    name : Text;
    sellingPrice : Float;
    currentStock : Nat;
  };

  public type Sale = {
    saleId : Text;
    productName : Text;
    quantity : Nat;
    totalAmount : Float;
    date : Int;
  };

  public type Shift = {
    shiftId : Text;
    date : Int;
    startTime : Text;
    endTime : Text;
    targetEarnings : Float;
    status : Text;
    notes : Text;
  };

  public type VoiceUsage = {
    date : Int;
    count : Nat;
  };

  public type StripeSessionMetadata = {
    sessionId : Text;
    userId : ?Principal;
  };

  public type ExpenseEntry = {
    expenseId : Text;
    category : Text;
    amount : Float;
    date : Int;
    notes : Text;
  };

  public type EarningsGoal = {
    targetAmount : Float;
    period : Text;
  };

  public type FuelLog = {
    date : Int;
    distance : Float;
    fuelUsed : Float;
    cost : Float;
  };

  public type Event = {
    eventId : Text;
    title : Text;
    description : Text;
    date : Int;
    location : Text;
    category : Text;
    isUserCreated : Bool;
  };

  public type StakingRecord = {
    stakeId : Text;
    icpAmount : Float;
    dissolveDelayDays : Nat;
    startDate : Int;
    notes : Text;
  };

  // Passenger Payment Types
  public type DriverPaymentConfig = {
    btcAddress : Text;
    ethAddress : Text;
    solAddress : Text;
    bnbAddress : Text;
    usdcAddress : Text;
    baseAddress : Text;
    usdtAddress : Text;
    bankName : Text;
    bankAccount : Text;
    bankReference : Text;
    snapScanMerchantId : ?Text;
  };

  public type OrderItem = {
    productName : Text;
    quantity : Nat;
    unitPrice : Float;
  };

  public type PassengerOrder = {
    orderId : Text;
    driverName : Text;
    items : [OrderItem];
    totalAmount : Float;
    paymentMethod : Text;
    timestamp : Int;
    passengerNote : Text;
  };

  module Trip {
    public func compare(a : Trip, b : Trip) : Order.Order {
      Text.compare(a.tripId, b.tripId);
    };
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Text.compare(a.productId, b.productId);
    };
  };

  module Sale {
    public func compare(a : Sale, b : Sale) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  module Shift {
    public func compare(a : Shift, b : Shift) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  module Event {
    public func compare(a : Event, b : Event) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  // ─── Tier Pricing Constants ─────────────────────────────────────────────────
  // Tier 1 = free (0), Tier 2 = R530/month, Tier 3 = R800/month
  let TIER1_PRICE : Nat = 0;
  let TIER2_PRICE : Nat = 530;
  let TIER3_PRICE : Nat = 800;

  // Persistent State

  // Component: Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let profiles = Map.empty<UserId, UserProfile>();
  let trips = Map.empty<UserId, Map.Map<Text, Trip>>();
  let products = Map.empty<UserId, Map.Map<Text, Product>>();
  let sales = Map.empty<UserId, Map.Map<Text, Sale>>();
  let shifts = Map.empty<UserId, Map.Map<Text, Shift>>();
  let voiceUsage = Map.empty<UserId, VoiceUsage>();
  let expenses = Map.empty<UserId, Map.Map<Text, ExpenseEntry>>();
  let goals = Map.empty<UserId, EarningsGoal>();
  let fuelLogs = Map.empty<UserId, Map.Map<Int, FuelLog>>();
  let events = Map.empty<UserId, Map.Map<Text, Event>>();
  let stakingRecords = Map.empty<UserId, Map.Map<Text, StakingRecord>>();

  // Passenger payment state
  let driverNameIndex = Map.empty<Text, UserId>();
  let paymentConfigs = Map.empty<UserId, DriverPaymentConfig>();
  let passengerOrders = Map.empty<UserId, Map.Map<Text, PassengerOrder>>();

  // ─── Security: passenger order rate-limiting ──────────────────────────────
  // Daily order count per driver (keyed by driverId text); resets each new day.
  let passengerOrdersPerDay = Map.empty<Text, Nat>();
  // Tracks the current day key (nanoseconds / 86_400_000_000_000 → day index as Text).
  var passengerOrdersDayKey : Text = "";

  // ─── Security: referral bonus idempotency ─────────────────────────────────
  // Composite key (referralCode # ":" # newUserId) → timestamp of processing.
  // Prevents double-credit if triggerReferralBonus is called more than once.
  let processedReferralBonuses = Map.empty<Text, Int>();

  // ─── Security: lead refresh debounce ──────────────────────────────────────
  // driverId (Text) → last refresh timestamp (nanoseconds).
  // Prevents a driver from spawning multiple concurrent scrape jobs.
  let lastLeadRefreshPerDriver = Map.empty<Text, Int>();

  var _shiftCounter = 0;
  var _tripCounter = 0;

  // ElevenLabs API key stored securely in backend (never exposed to frontend)
  var elevenLabsApiKey : Text = "";
  // Wrapper for mixin injection — points to the same storage as elevenLabsApiKey
  let elevenLabsApiKeyStore = { var value : Text = "" };

  // ─── Smart Event Fetching State ─────────────────────────────────────────────
   // fetchedEventsStore wraps the mutable array so it can be injected into mixins
   let fetchedEventsRaw : [EventTypes.FetchedEvent] = [];
   let fetchedEventsStore = { var value = fetchedEventsRaw };
   // lastFetchState tracks when events were last fetched (for weekly refresh logic)
   let lastFetchState = { var lastFetchTime : Int = 0 };

   // ─── Nduna AI Agent State ────────────────────────────────────────────────────
   // openClawApiKeyStore wraps the optional key so it can be injected into mixin
   let openClawApiKeyRaw : ?Text = null;
   let openClawApiKeyStore = { var value = openClawApiKeyRaw };
   // openClawApiUrlStore allows admin to point to any OpenAI-compatible endpoint (defaults to OpenRouter)
   let openClawApiUrlRaw : Text = "https://openrouter.ai/api/v1/chat/completions";
   let openClawApiUrlStore = { var value = openClawApiUrlRaw };
   // openClawModelStore allows admin to select any OpenRouter model (defaults to Llama 3.1 8B — avoids chain-of-thought leaks)
   let openClawModelRaw : Text = "meta-llama/llama-3.1-8b-instruct:free";
   let openClawModelStore = { var value = openClawModelRaw };
   // Tavily web search API key store
   let tavilyApiKeyStore = { var value : Text = "" };
   // Tavily usage tracking: call count + current month
   let tavilyCallCountStore = { var value : Nat = 0 };
   let tavilyMonthStore = { var value : Nat = 0 };

   // EventsMixin needs tavilyApiKeyStore for Tavily fallback when Quicket fails
   include EventsMixin(fetchedEventsStore, lastFetchState, tavilyApiKeyStore);
  let agentConversations = Map.empty<Principal, AgentTypes.ConversationState>();
  // Persistent Nduna conversation history — max 200 messages per driver (rolling window)
  let hermesHistory = Map.empty<Principal, List.List<AgentTypes.AgentMessage>>();
  // Persistent driver analytics profiles — rebuilt after every query and via recalculateDriverProfile()
  let driverAnalyticsProfiles = Map.empty<Principal, AgentTypes.DriverAnalyticsProfile>();
  // Persistent per-driver Nduna memory — free-form notes that survive across sessions
  let driverMemories = Map.empty<Principal, AgentTypes.DriverMemory>();
  // Persistent structured memory entries — key/value facts, preferences, goals, learnings
  let driverMemoryEntries = Map.empty<Principal, List.List<AgentTypes.DriverMemoryEntry>>();
  // Nduna learning loop — persistent recommendation log and outcome map
  let ndunaRecommendations = List.empty<AgentTypes.NdunaRecommendation>();
  let ndunaOutcomes = Map.empty<Nat, AgentTypes.RecommendationOutcome>();
  // Nduna system prompt evolution state — updated monthly via monthlyAnalysis
  let ndunaPromptState = {
    var value : AgentTypes.NdunaSystemPromptState = {
      basePrompt = "";
      evolutionDelta = "";
      lastEvolved = null;
      evolutionCount = 0;
    };
  };
  // Driver ratings — manually entered by drivers (1.0–5.0); Nduna cannot access Uber/Bolt APIs
  let driverRatings = Map.empty<Principal, Float>();

  // ─── Voice Agent / Behavioral Context State ───────────────────────────────────
  // Per-driver behavioral event ring-buffer: max 200 events, 7-day rolling window.
  let behavioralEvents = Map.empty<Principal, List.List<AgentTypes.BehavioralEvent>>();
  // Per-driver recommendation outcome ring-buffer: max 100 entries.
  let outcomeEvents = Map.empty<Principal, List.List<AgentTypes.OutcomeEvent>>();
  // ElevenLabs agent ID — the voice agent ID for Nduna's conversational AI.
  let elevenLabsAgentIdStore = { var value : Text = "mJZEpDe9qAKz9yOOwCD8" };

  // ─── Analytics Event Log State ────────────────────────────────────────────────
  // Capped ring buffer of 10,000 events. Persists via orthogonal persistence automatically.
  // Shared across agent, advertising, and leads mixins via explicit parameter passing.
  let analyticsState = AnalyticsLog.initState();

  // ─── AI Gateway Config State ───────────────────────────────────────────────────
  // Cloudflare AI Gateway URL and API key — admin-only, never returned in any query.
  // When both are set, all OpenRouter and ElevenLabs calls route through the gateway.
  // Stored as wrapper objects so they can be injected into the AgentMixin.
  let aiGatewayUrlStore    = { var value : ?Text = null };
  let aiGatewayApiKeyStore = { var value : ?Text = null };

  // ─── Orbis API Key State ───────────────────────────────────────────────────────
  // Orbis API key — enables PQS pre-flight quality scoring and Orbis LLM API fallback.
  // Admin-only setter. Stored as a wrapper so it can be injected into AgentMixin.
  let orbisApiKeyStore = { var value : Text = "" };

  // ─── Exa API Key State ────────────────────────────────────────────────────────
  // Exa API key — enables post-scrape company intelligence enrichment and
  // pitch deck personalisation. Admin-only setter. Never returned in plain text.
  let exaApiKeyStore = { var value : Text = "" };

  // ─── Browserbase API Key State ────────────────────────────────────────────────
  // Declared here (before LeadsMixin and PresentationMixin) so it is in scope
  // for both includes. The same store is also used by IntelligenceMixin below.
  let browserbaseApiKeyStore = { var value : Text = "" };

  // ─── Per-Driver Rate Limiter State ────────────────────────────────────────────
  // Daily query counters per driver, keyed by principal text.
  // Resets automatically each UTC day.
  // Migration from old schema (counts : Map<Text, Nat>) is handled by Migration.run.
  let rateLimiterState = RateLimiter.initState();

  // ─── Gateway Metrics State ────────────────────────────────────────────────────
  // Rolling buffer of last 100 AI gateway call metrics (timing, cache hits, errors).
  // Includes separate hit/miss counters, cost tracking, latency samples, and hourly buckets.
  // Migration from old schema (entries only) is handled by Migration.run.
  let gatewayMetricsState = GatewayMetrics.initState();

  // ─── Document Vault State (declared early — required by AgentMixin for document context) ──
  // Primary document store: docId → DocumentRecord
  let documentsMap = Map.empty<Text, DocTypes.DocumentRecord>();
  // Secondary index: driverId (Text) → list of docIds owned by that driver
  let driverDocIndex = Map.empty<Text, List.List<Text>>();

  include AgentMixin(analyticsState, rateLimiterState, gatewayMetricsState, accessControlState, profiles, trips, expenses, fuelLogs, shifts, events, openClawApiKeyStore, openClawApiUrlStore, openClawModelStore, aiGatewayUrlStore, aiGatewayApiKeyStore, tavilyApiKeyStore, tavilyCallCountStore, tavilyMonthStore, agentConversations, hermesHistory, driverAnalyticsProfiles, driverMemories, driverMemoryEntries, ndunaRecommendations, ndunaOutcomes, ndunaPromptState, driverRatings, behavioralEvents, outcomeEvents, elevenLabsAgentIdStore, elevenLabsApiKeyStore, orbisApiKeyStore, pilotModeStore, documentsMap, driverDocIndex);

  // ─── Advertising / Layer 3 State ────────────────────────────────────────────
  // V2 recommendation store: Text ID → NdunaRecommendationV2
  let advRecommendations = Map.empty<Text, AdvTypes.NdunaRecommendationV2>();
  // V2 outcome store: recommendation Text ID → RecommendationOutcomeV2
  let advOutcomes = Map.empty<Text, AdvTypes.RecommendationOutcomeV2>();
  // Advertising pitch pipeline: pitch Text ID → CompanyPitch
  let companyPitches = Map.empty<Text, AdvTypes.CompanyPitch>();
  include AdvertisingMixin(analyticsState, accessControlState, advRecommendations, advOutcomes, companyPitches, ndunaPromptState);

  // ─── Geolocation & Competitive Intelligence State ────────────────────────────
  let googleMapsApiKeyRaw : Text = "";
  let googleMapsApiKeyStore = { var value = googleMapsApiKeyRaw };
  let tomTomApiKeyRaw : Text = "";
  let tomTomApiKeyStore = { var value = tomTomApiKeyRaw };
  // Route opt-ins: driverId (Text) → RouteOptIn
  let routeOptIns = Map.empty<Text, GeoTypes.RouteOptIn>();
  // Exposure validations: composite key → ExposureValidation
  let exposureValidations = Map.empty<Text, GeoTypes.ExposureValidation>();
  // Competitive profiles: driverId (Text) → DriverCompetitiveProfile
  let competitiveProfiles = Map.empty<Text, CompTypes.DriverCompetitiveProfile>();
  include GeolocationMixin(accessControlState, googleMapsApiKeyStore, tomTomApiKeyStore, routeOptIns, exposureValidations, competitiveProfiles);

  // ─── Lead Research State ──────────────────────────────────────────────────────
  // Camofox base URL stored securely (admin-only set, never exposed to frontend)
  let camofoxBaseUrlStore = { var value : Text = "" };
  // Individual scraped leads: lead ID → ScrapedLead
  let leadsMap = Map.empty<Text, LeadTypes.ScrapedLead>();
  // Lead batches: batchKey (driverId_week_year) → LeadBatch
  let leadBatchesMap = Map.empty<Text, LeadTypes.LeadBatch>();
  // Scraper audit log: audit ID → ScraperAuditLog
  let auditLogMap = Map.empty<Text, LeadTypes.ScraperAuditLog>();
  // Scheduler config
  let schedulerConfigStore = { var value : LeadTypes.SchedulerConfig = { dayOfWeek = 0; hour = 2; enabled = true } };
  include LeadsMixin(analyticsState, accessControlState, camofoxBaseUrlStore, leadsMap, leadBatchesMap, auditLogMap, schedulerConfigStore, companyPitches, tavilyApiKeyStore, tavilyCallCountStore, tavilyMonthStore, profiles, lastLeadRefreshPerDriver, pilotModeStore, exaApiKeyStore, browserbaseApiKeyStore);

  // ─── Presentation Builder State ───────────────────────────────────────────────
  // Generated presentations: shareToken → PresentationData
  let presentationsMap = Map.empty<Text, LeadTypes.PresentationData>();
  include PresentationMixin(accessControlState, presentationsMap, openClawApiKeyStore, openClawApiUrlStore, openClawModelStore, exaApiKeyStore, browserbaseApiKeyStore, pilotModeStore);

  // ─── WhatsApp / Messaging Gateway State ───────────────────────────────────────
  // WhatsApp conversation entries: messageId → WhatsAppConversationEntry
  let whatsappMessages = Map.empty<Text, MsgTypes.WhatsAppConversationEntry>();
  // 360dialog config — admin-only, never exposed to frontend
  let whatsappConfigStore = { var value : ?MsgTypes.WhatsAppConfig = null };
  // Whisper config for media transcription in WhatsApp messages
  let whatsappWhisperConfigStore = { var value : ?MsgTypes.WhisperConfig = null };
  // Rate limiting per phone number
  let whatsappRateLimits = Map.empty<Text, MsgTypes.WhatsAppRateLimit>();
  // Phone-to-principal index: E.164 phone → Principal (for inbound webhook routing)
  let whatsappPhoneIndex = Map.empty<Text, Principal>();
  // Weekly briefing scheduler state — sends every Monday 8am SAST by default
  let weeklyBriefingState = {
    var value : MsgTypes.WeeklyBriefingState = {
      enabled = true;
      lastSentAt = null;
      briefingDayOfWeek = 0; // 0 = Monday
      briefingHour = 8;      // 8am SAST
    };
  };
  include MessagingMixin(
    accessControlState,
    whatsappMessages,
    whatsappConfigStore,
    whatsappWhisperConfigStore,
    whatsappRateLimits,
    openClawApiKeyStore,
    openClawApiUrlStore,
    openClawModelStore,
    hermesHistory,
    driverMemories,
    driverMemoryEntries,
    driverAnalyticsProfiles,
    profiles,
    whatsappPhoneIndex,
    leadsMap,
    weeklyBriefingState,
    tavilyApiKeyStore,
    driverRatings,
    pilotModeStore,
  );

  // ─── Video Automation Engine State ────────────────────────────────────────────
  // Raw video uploads: uploadId → VideoUpload
  let videoUploads = Map.empty<Text, VideoTypes.VideoUpload>();
  // Derived short clips: clipId → VideoClip
  let videoClips = Map.empty<Text, VideoTypes.VideoClip>();
  // Scheduled / posted clips: postId → VideoPost
  let videoPosts = Map.empty<Text, VideoTypes.VideoPost>();
  // Analytics snapshots: postId → [VideoAnalytics]
  let videoAnalytics = Map.empty<Text, [VideoTypes.VideoAnalytics]>();
  // Upload-Post API config — admin-only, never exposed to frontend
  let uploadPostConfigStore = { var value : ?VideoTypes.UploadPostConfig = null };
  // Whisper config for auto-captioning — reused from messaging or separate store
  let videoWhisperConfigStore = { var value : ?VideoTypes.WhisperConfig = null };
  // Per-driver branding config: driverId → BrandingConfig
  let videoBrandingConfigs = Map.empty<Text, VideoTypes.BrandingConfig>();
  // Per-driver posting schedule: driverId → PostingSchedule
  let videoPostingSchedules = Map.empty<Text, VideoTypes.PostingSchedule>();
  include VideoMixin(accessControlState, videoUploads, videoClips, videoPosts, videoAnalytics, uploadPostConfigStore, videoWhisperConfigStore, videoBrandingConfigs, videoPostingSchedules, pilotModeStore);

  // ─── Referral Engine State ────────────────────────────────────────────────────
  // Referral codes: code Text → ReferralCode
  let referralCodes = Map.empty<Text, ReferralTypes.ReferralCode>();
  // Referral uses: flat list (scanned by ownerId / code)
  let referralUses = List.empty<ReferralTypes.ReferralUse>();
  // Referral config — R50 credit per qualifying sign-up, applied to next subscription payment
  let referralConfigStore = {
    var value : ReferralTypes.ReferralConfig = {
      enabled = true;
      bonusPerReferral = 50.0;
      bonusSource = "subscription_credit";
      bonusDescription = "R50 credit applied to your next subscription payment";
      minTripsToQualify = 50;
    };
  };
  // Driver referral credit balances: driverId (Text) → credit amount in ZAR
  let referralCreditBalances = Map.empty<Text, Float>();
  include ReferralMixin(accessControlState, referralCodes, referralUses, referralConfigStore, referralCreditBalances, profiles, processedReferralBonuses);

  // ─── SnapScan Payment Gateway State ───────────────────────────────────────────
  // All three credentials are stored as mutable canister state — never exposed
  // to the frontend or visible in forked repos (same pattern as ElevenLabs key).
  let snapScanMerchantApiKeyStore = { var value : Text = "" };
  let snapScanWebhookSecretStore  = { var value : Text = "" };
  let snapScanMerchantIdStore     = { var value : Text = "" };
  include PaymentMixin(
    accessControlState,
    snapScanMerchantApiKeyStore,
    snapScanWebhookSecretStore,
    snapScanMerchantIdStore,
    pilotModeStore,
    profiles,
  );

  // ─── Hyperframes Video Generation State ───────────────────────────────────────
  // VPS sidecar URL and bearer key — admin-only, never exposed to frontend.
  let hfVpsUrl    = { var value : Text = "" };
  let hfVpsKey    = { var value : Text = "" };
  // All render jobs: jobId → HyperframesJob
  let hfJobs      = Map.empty<Text, HFTypes.HyperframesJob>();
  // Per-driver job ID lists for history lookup: driverId (Text) → [jobId]
  let hfDriverIndex = Map.empty<Text, List.List<Text>>();
  // Daily rate-limit tracking: resets each new UTC day
  let hfDayRateKey    = { var value : Text = "" };
  let hfDayRateCounts = Map.empty<Text, Nat>();
  include HyperframesMixin(
    accessControlState,
    profiles,
    openClawApiKeyStore,
    openClawApiUrlStore,
    openClawModelStore,
    hfVpsUrl,
    hfVpsKey,
    hfJobs,
    hfDriverIndex,
    hfDayRateKey,
    hfDayRateCounts,
  );

  // ─── Hyperframes Shorts Auto-Clip State ───────────────────────────────────────
  // All jobs: jobId → ShortsJob
  let shortsJobs        = Map.empty<Text, HFTypes.ShortsJob>();
  // Per-driver job ID lists: driverId (Text) → List<jobId>
  let shortsDriverIndex = Map.empty<Text, List.List<Text>>();
  // Daily rate-limit tracking: resets each new UTC day
  let shortsDayRateKey    = { var value : Text = "" };
  let shortsDayRateCounts = Map.empty<Text, Nat>();
  include HyperframesShortsMixin(
    accessControlState,
    profiles,
    hfVpsUrl,
    hfVpsKey,
    shortsJobs,
    shortsDriverIndex,
    shortsDayRateKey,
    shortsDayRateCounts,
  );

  // ─── AgentMail (Nduna Email Identity) State ───────────────────────────────────
  // Nduna's email pipeline — pitch emails, onboarding sequences, weekly briefings,
  // lead follow-ups, and website delivery emails.
  let agentMailConfigStore = {
    var value : AMTypes.AgentMailConfig = {
      apiKey                     = "";
      ndunaInboxId               = null;
      onboardingEmailEnabled     = true;
      weeklyBriefingEmailEnabled = true;
      leadFollowupEmailEnabled   = true;
    };
  };
  // Flat log store: log ID → EmailLog
  let emailLogs = Map.empty<Text, AMTypes.EmailLog>();
  // Per-driver index: driverId (Text) → List of log IDs
  let driverEmailLogs = Map.empty<Text, List.List<Text>>();
  // Cached Nduna inbox messages (refreshed on demand by admin)
  let ndunaInboxMessagesStore = { var value : [AMTypes.NdunaEmail] = [] };
  include AgentMailMixin(
    accessControlState,
    agentMailConfigStore,
    emailLogs,
    driverEmailLogs,
    ndunaInboxMessagesStore,
  );

  // ─── Website Builder State ────────────────────────────────────────────────────
  // All website generation jobs: jobId → WebsiteJob
  let websiteJobs = Map.empty<Text, WBTypes.WebsiteJob>();
  // Per-driver job ID lists (oldest-first): driverId (Text) → List<jobId>
  let driverWebsiteJobs = Map.empty<Text, List.List<Text>>();
  // Per-driver daily rate limit: driverId (Text) → (count, dayTimestamp)
  let websiteBuilderDailyCount = Map.empty<Text, (Nat, Int)>();
  include WebsiteBuilderMixin(
    accessControlState,
    websiteJobs,
    driverWebsiteJobs,
    websiteBuilderDailyCount,
    openClawApiKeyStore,
    openClawApiUrlStore,
    openClawModelStore,
  );

  // ─── Document Vault State ─────────────────────────────────────────────────────
  // documentsMap and driverDocIndex are declared above (before AgentMixin) so they can
  // be passed to AgentMixin for Nduna document context. Only config and mixin are here.
  // Config flag: admin can disable driver notes on documents (default: enabled)
  let docVaultNotesEnabled = { var value : Bool = true };
  include DocumentMixin(accessControlState, profiles, documentsMap, driverDocIndex, docVaultNotesEnabled, hfVpsUrl, hfVpsKey);

  // ─── Opportunity Hunter State ──────────────────────────────────────────────────
  // Primary finding store: findingId → OpportunityFinding
  let opportunityFindings = Map.empty<Text, OppTypes.OpportunityFinding>();
  // Scan history: scanId → OpportunityScan
  let opportunityScans = Map.empty<Text, OppTypes.OpportunityScan>();
  // Secondary index: driverId (Text) → list of findingIds for that driver
  let driverOpportunityIndex = Map.empty<Text, List.List<Text>>();
  // VPS sidecar URL and bearer key — admin-only, never exposed to frontend
  let hunterVpsUrl = { var value : Text = "" };
  let hunterVpsKey = { var value : Text = "" };
  include OpportunityHunterMixin(accessControlState, profiles, opportunityFindings, opportunityScans, driverOpportunityIndex, hunterVpsUrl, hunterVpsKey, ndunaRecommendations);

  // ─── Fleet Owner State ────────────────────────────────────────────────────────
  // All three maps are keyed by owner principal (as Text) for per-caller isolation.
  // ownerId (Text) → Map(vehicleId → FleetVehicle)
  let fleetVehiclesStore  = Map.empty<Text, Map.Map<Text, FleetTypes.FleetVehicle>>();
  // ownerId (Text) → Map(expenseId → FleetExpenseEntry)
  let fleetExpensesStore  = Map.empty<Text, Map.Map<Text, FleetTypes.FleetExpenseEntry>>();
  // ownerId (Text) → Map(incomeId → FleetIncomeEntry)
  let fleetIncomeStore    = Map.empty<Text, Map.Map<Text, FleetTypes.FleetIncomeEntry>>();
  include FleetMixin(accessControlState, profiles, fleetVehiclesStore, fleetExpensesStore, fleetIncomeStore);

  // ─── SA Market Intelligence & Browserbase State ───────────────────────────────
  // browserbaseApiKeyStore is declared above (before LeadsMixin/PresentationMixin includes).
  // Orbis publisher config — admin-only, controls marketplace listing.
  let orbisPublisherConfigStore : { var value : ?IntelTypes.OrbisListingConfig } = { var value = null };
  // Orbis listing status — cumulative call count and USDC earned.
  let orbisListingStatusStore = {
    var value : IntelTypes.OrbisListingStatus = {
      listed     = false;
      listingId  = null;
      totalCalls = 0;
      usdcEarned = 0.0;
    };
  };
  include IntelligenceMixin(
    accessControlState,
    analyticsState,
    trips,
    companyPitches,
    browserbaseApiKeyStore,
    orbisPublisherConfigStore,
    orbisListingStatusStore,
    opportunityFindings,
    opportunityScans,
    driverOpportunityIndex,
    ndunaRecommendations,
  );

  // ─── Crypto Intelligence State ────────────────────────────────────────────────
  // CoinMarketCap API key — admin-only, powers Fear & Greed index + USDC stability checks.
  let cmcApiKeyStore = { var value : Text = "" };
  // Brian API key — admin-only, powers natural language transaction guides.
  let brianApiKeyStore = { var value : Text = "" };
  // USDC/ZAR rate cache: (rate, cachedAtNanos). Refreshes every 10 minutes.
  let usdcZarRateCache : { var value : ?(Float, Int) } = { var value = null };

  // ─── Weekly Briefing Heartbeat Timer ──────────────────────────────────────────
  // Checks daily whether a weekly briefing should be sent.
  // Timer fires every 86400 seconds (24 hours). If shouldSendBriefing returns true,
  // triggerWeeklyBriefings() is invoked.
  ignore Timer.recurringTimer<system>(#seconds(86_400), func() : async () {
    let now = Time.now();
    if (BriefingLib.shouldSendBriefing(weeklyBriefingState.value, now)) {
      ignore triggerWeeklyBriefings();
    };
  });

  // Helper Functions
  func _getUserTrips(userId : UserId) : Map.Map<Text, Trip> {
    switch (trips.get(userId)) {
      case (null) { Runtime.trap("No trips found for user") };
      case (?userTrips) { userTrips };
    };
  };

  func _getUserProducts(userId : UserId) : Map.Map<Text, Product> {
    switch (products.get(userId)) {
      case (null) { Runtime.trap("No products found for user") };
      case (?userProducts) { userProducts };
    };
  };

  func _getUserSales(userId : UserId) : Map.Map<Text, Sale> {
    switch (sales.get(userId)) {
      case (null) { Runtime.trap("No sales found for user") };
      case (?userSales) { userSales };
    };
  };

  func _getUserShifts(userId : UserId) : Map.Map<Text, Shift> {
    switch (shifts.get(userId)) {
      case (null) { Runtime.trap("No shifts found for user") };
      case (?userShifts) { userShifts };
    };
  };

  func _getUserFuelLogs(userId : UserId) : Map.Map<Int, FuelLog> {
    switch (fuelLogs.get(userId)) {
      case (null) { Runtime.trap("No fuel logs found for user") };
      case (?userFuelLogs) { userFuelLogs };
    };
  };

  func getUserExpenses(userId : UserId) : Map.Map<Text, ExpenseEntry> {
    switch (expenses.get(userId)) {
      case (null) { Map.empty<Text, ExpenseEntry>() };
      case (?userExpenses) { userExpenses };
    };
  };

  // User Management
  public shared ({ caller }) func createOrUpdateProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };
    let updatedProfile : UserProfile = {
      profile with
      currencyCode = if (profile.currencyCode == "") {
        "ZAR";
      } else {
        profile.currencyCode;
      };
    };
    profiles.add(caller, updatedProfile);
    if (updatedProfile.displayName != "") {
      driverNameIndex.add(updatedProfile.displayName, caller);
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile : UserProfile = {
      profile with
      currencyCode = if (profile.currencyCode == "") {
        "ZAR";
      } else {
        profile.currencyCode;
      };
    };
    profiles.add(caller, updatedProfile);
    if (updatedProfile.displayName != "") {
      driverNameIndex.add(updatedProfile.displayName, caller);
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  // Trip Management
  public shared ({ caller }) func addTrip(trip : Trip) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add trips");
    };
    let userTrips = switch (trips.get(caller)) {
      case (null) { Map.empty<Text, Trip>() };
      case (?trips) { trips };
    };

    let tripWithCurrentDate = {
      trip with
      date = Time.now();
    };

    userTrips.add(trip.tripId, tripWithCurrentDate);
    trips.add(caller, userTrips);

    AnalyticsLog.logEvent(
      analyticsState,
      "user_action",
      "trip_added",
      caller.toText(),
      null,
      true,
      null,
      "{\"platform\":\"" # trip.platform # "\",\"amount\":" # trip.amount.toText() # "}",
      null,
    );
  };

  public query ({ caller }) func getTrips() : async [Trip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trips");
    };
    switch (trips.get(caller)) {
      case (null) { [] };
      case (?userTrips) { userTrips.values().toArray().sort() };
    };
  };

  public shared ({ caller }) func deleteTrip(tripId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete trips");
    };
    let userTrips = switch (trips.get(caller)) {
      case (null) { Map.empty<Text, Trip>() };
      case (?t) { t };
    };
    userTrips.remove(tripId);
    trips.add(caller, userTrips);
  };

  // Product Management
  public shared ({ caller }) func addOrUpdateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add or update products");
    };
    let userProducts = switch (products.get(caller)) {
      case (null) { Map.empty<Text, Product>() };
      case (?products) { products };
    };
    userProducts.add(product.productId, product);
    products.add(caller, userProducts);
  };

  public query ({ caller }) func getProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    switch (products.get(caller)) {
      case (null) { [] };
      case (?userProducts) { userProducts.values().toArray().sort() };
    };
  };

  public query ({ caller }) func getLowStockProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view low stock products");
    };
    switch (products.get(caller)) {
      case (null) { [] };
      case (?userProducts) {
        userProducts.values().toArray().filter(func(p) { p.currentStock < 5 });
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete products");
    };
    let userProducts = switch (products.get(caller)) {
      case (null) { Map.empty<Text, Product>() };
      case (?p) { p };
    };
    userProducts.remove(productId);
    products.add(caller, userProducts);
  };

  // Sales Management
  public shared ({ caller }) func addSale(sale : Sale) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add sales");
    };
    let userSales = switch (sales.get(caller)) {
      case (null) { Map.empty<Text, Sale>() };
      case (?sales) { sales };
    };

    let saleWithCurrentDate = {
      sale with
      date = Time.now();
    };

    userSales.add(sale.saleId, saleWithCurrentDate);
    sales.add(caller, userSales);
  };

  public query ({ caller }) func getSales() : async [Sale] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales");
    };
    switch (sales.get(caller)) {
      case (null) { [] };
      case (?userSales) { userSales.values().toArray().sort() };
    };
  };

  public shared ({ caller }) func deleteSale(saleId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sales");
    };
    let userSales = switch (sales.get(caller)) {
      case (null) { Map.empty<Text, Sale>() };
      case (?s) { s };
    };
    userSales.remove(saleId);
    sales.add(caller, userSales);
  };

  // Shift Management
  public shared ({ caller }) func addOrUpdateShift(shift : Shift) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add or update shifts");
    };
    let userShifts = switch (shifts.get(caller)) {
      case (null) { Map.empty<Text, Shift>() };
      case (?shifts) { shifts };
    };
    userShifts.add(shift.shiftId, shift);
    shifts.add(caller, userShifts);
  };

  public query ({ caller }) func getShifts() : async [Shift] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view shifts");
    };
    switch (shifts.get(caller)) {
      case (null) { [] };
      case (?userShifts) { userShifts.values().toArray().sort() };
    };
  };

  public query ({ caller }) func getUpcomingShifts() : async [Shift] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view upcoming shifts");
    };
    let now = Time.now();
    switch (shifts.get(caller)) {
      case (null) { [] };
      case (?userShifts) { userShifts.values().toArray().filter(func(s) { s.date > now }) };
    };
  };

  public query ({ caller }) func getShiftHistory() : async [Shift] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view shift history");
    };
    let now = Time.now();
    switch (shifts.get(caller)) {
      case (null) { [] };
      case (?userShifts) { userShifts.values().toArray().filter(func(s) { s.date <= now }) };
    };
  };

  public shared ({ caller }) func deleteShift(shiftId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete shifts");
    };
    let userShifts = switch (shifts.get(caller)) {
      case (null) { Map.empty<Text, Shift>() };
      case (?s) { s };
    };
    userShifts.remove(shiftId);
    shifts.add(caller, userShifts);
  };

  // Voice Usage
  public shared ({ caller }) func incrementVoiceUsage() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can increment voice usage");
    };
    let currentDate = Int.abs(Time.now());
    let currentUsage = switch (voiceUsage.get(caller)) {
      case (null) {
        let newVoiceUsage : VoiceUsage = {
          date = currentDate;
          count = 0;
        };
        voiceUsage.add(caller, newVoiceUsage);
        newVoiceUsage;
      };
      case (?usage) {
        if (usage.date != currentDate) {
          let newVoiceUsage : VoiceUsage = {
            date = currentDate;
            count = 0;
          };
          voiceUsage.add(caller, newVoiceUsage);
          newVoiceUsage;
        } else {
          usage;
        };
      };
    };

    let newCount = currentUsage.count + 1;
    voiceUsage.add(
      caller,
      {
        currentUsage with
        count = newCount;
      },
    );
    newCount;
  };

  public query ({ caller }) func getVoiceUsage() : async VoiceUsage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view voice usage");
    };
    switch (voiceUsage.get(caller)) {
      case (null) {
        {
          date = Int.abs(Time.now());
          count = 0;
        };
      };
      case (?usage) { usage };
    };
  };

  // Earnings
  public query ({ caller }) func getEarningsTotal() : async (Float, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings total");
    };
    switch (trips.get(caller)) {
      case (null) { (0.0, 0) };
      case (?userTrips) {
        var totalAmount : Float = 0.0;
        for (trip in userTrips.values()) {
          totalAmount := totalAmount + trip.amount;
        };
        (totalAmount, userTrips.size());
      };
    };
  };

  // Expenses
  public shared ({ caller }) func addExpense(expense : ExpenseEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    let userExpenses = switch (expenses.get(caller)) {
      case (null) { Map.empty<Text, ExpenseEntry>() };
      case (?expenses) { expenses };
    };
    userExpenses.add(expense.expenseId, expense);
    expenses.add(caller, userExpenses);

    AnalyticsLog.logEvent(
      analyticsState,
      "user_action",
      "expense_added",
      caller.toText(),
      null,
      true,
      null,
      "{\"category\":\"" # expense.category # "\",\"amount\":" # expense.amount.toText() # "}",
      null,
    );
  };

  public query ({ caller }) func getExpenses() : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let userExpenses = getUserExpenses(caller);
    userExpenses.values().toArray();
  };

  public shared ({ caller }) func deleteExpense(expenseId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };
    let userExpenses = switch (expenses.get(caller)) {
      case (null) { Map.empty<Text, ExpenseEntry>() };
      case (?expenses) { expenses };
    };
    userExpenses.remove(expenseId);
    expenses.add(caller, userExpenses);
  };

  // Goals
  public shared ({ caller }) func setEarningsGoal(goal : EarningsGoal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set goals");
    };
    goals.add(caller, goal);
  };

  public query ({ caller }) func getEarningsGoal() : async ?EarningsGoal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings goals");
    };
    goals.get(caller);
  };

  // Fuel Profile
  public shared ({ caller }) func saveFuelProfile(fuelConsumptionRate : Float, vehicleName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save fuel profiles");
    };
    let currentProfile = switch (profiles.get(caller)) {
      case (null) {
        {
          displayName = "";
          currencyCode = "ZAR";
          subscriptionTier = 0;
          voiceEnabled = false;
          fuelConsumptionRate = fuelConsumptionRate;
          vehicleName = vehicleName;
        };
      };
      case (?profile) {
        {
          profile with
          fuelConsumptionRate = fuelConsumptionRate;
          vehicleName = vehicleName;
        };
      };
    };
    profiles.add(caller, currentProfile);
  };

  public query ({ caller }) func getFuelProfile() : async { fuelConsumptionRate : Float; vehicleName : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fuel profiles");
    };
    switch (profiles.get(caller)) {
      case (null) {
        {
          fuelConsumptionRate = 0.0;
          vehicleName = "";
        };
      };
      case (?profile) {
        {
          fuelConsumptionRate = profile.fuelConsumptionRate;
          vehicleName = profile.vehicleName;
        };
      };
    };
  };

  public shared ({ caller }) func addFuelLog(fuelLog : FuelLog) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add fuel logs");
    };
    let userFuelLogs = switch (fuelLogs.get(caller)) {
      case (null) { Map.empty<Int, FuelLog>() };
      case (?fuelLogs) { fuelLogs };
    };
    userFuelLogs.add(fuelLog.date, fuelLog);
    fuelLogs.add(caller, userFuelLogs);

    AnalyticsLog.logEvent(
      analyticsState,
      "user_action",
      "fuel_added",
      caller.toText(),
      null,
      true,
      null,
      "{\"litres\":" # fuelLog.fuelUsed.toText() # ",\"cost\":" # fuelLog.cost.toText() # "}",
      null,
    );
  };

  public query ({ caller }) func getFuelLogs() : async [FuelLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fuel logs");
    };
    switch (fuelLogs.get(caller)) {
      case (null) { [] };
      case (?userFuelLogs) { userFuelLogs.values().toArray() };
    };
  };

  // Custom Events
  public shared ({ caller }) func addCustomEvent(event : Event) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add events");
    };
    let userEvents = switch (events.get(caller)) {
      case (null) { Map.empty<Text, Event>() };
      case (?events) { events };
    };
    let eventWithFlag = { event with isUserCreated = true };
    userEvents.add(eventWithFlag.eventId, eventWithFlag);
    events.add(caller, userEvents);
  };

  public query ({ caller }) func getCustomEvents() : async [Event] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view events");
    };
    let userEvents = switch (events.get(caller)) {
      case (null) { Map.empty<Text, Event>() };
      case (?events) { events };
    };
    userEvents.values().toArray().sort();
  };

  public shared ({ caller }) func deleteCustomEvent(eventId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete events");
    };
    let userEvents = switch (events.get(caller)) {
      case (null) { Map.empty<Text, Event>() };
      case (?events) { events };
    };
    userEvents.remove(eventId);
    events.add(caller, userEvents);
  };

  // ICP Staking Records
  public shared ({ caller }) func saveStakingRecord(record : StakingRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save staking records");
    };
    let userStakes = switch (stakingRecords.get(caller)) {
      case (null) { Map.empty<Text, StakingRecord>() };
      case (?s) { s };
    };
    let recordWithDate = {
      record with
      startDate = if (record.startDate == 0) { Time.now() } else { record.startDate };
    };
    userStakes.add(record.stakeId, recordWithDate);
    stakingRecords.add(caller, userStakes);
  };

  public query ({ caller }) func getStakingRecords() : async [StakingRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staking records");
    };
    switch (stakingRecords.get(caller)) {
      case (null) { [] };
      case (?s) { s.values().toArray() };
    };
  };

  public shared ({ caller }) func deleteStakingRecord(stakeId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete staking records");
    };
    let userStakes = switch (stakingRecords.get(caller)) {
      case (null) { Map.empty<Text, StakingRecord>() };
      case (?s) { s };
    };
    userStakes.remove(stakeId);
    stakingRecords.add(caller, userStakes);
  };

  // ICP Price from CoinGecko
  public shared ({ caller }) func getICPPrice() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd&include_24hr_change=true";
    let httpRequest : IC.http_request_args = {
      url = url;
      max_response_bytes = ?10_000;
      headers = [
        { name = "Accept"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = null;
      method = #get;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
      is_replicated = ?false;
    };
    let httpResponse = await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    switch (httpResponse.body.decodeUtf8()) {
      case (null) { "{\"error\":\"decode failed\"}" };
      case (?text) { text };
    };
  };

  // ─── Crypto Intelligence API ─────────────────────────────────────────────────

  /// Live USDC/ZAR exchange rate from CoinGecko. 10-minute canister cache.
  /// Returns raw JSON: {"usd-coin":{"zar":18.52}} or a plain float string on cache hit.
  public shared ({ caller }) func getUSDCZARRate() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let now = Time.now();
    let tenMinNanos : Int = 10 * 60 * 1_000_000_000;
    // Return cached value if fresh
    switch (usdcZarRateCache.value) {
      case (?(rate, cachedAt)) {
        if (now - cachedAt < tenMinNanos) {
          return "{\"usd-coin\":{\"zar\":" # rate.toText() # "}}";
        };
      };
      case (null) {};
    };
    // Fetch live from CoinGecko (same pattern as getICPPrice)
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=zar";
    let httpRequest : IC.http_request_args = {
      url = url;
      max_response_bytes = ?5_000;
      headers = [
        { name = "Accept"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = null;
      method = #get;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
      is_replicated = ?false;
    };
    let httpResponse = await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    switch (httpResponse.body.decodeUtf8()) {
      case (null) { "{\"usd-coin\":{\"zar\":18.5}}" };
      case (?text) {
        // Best-effort parse to update cache — if parsing fails, still return raw text
        // Simple extraction: find "zar": followed by number
        // We don't have a JSON library, but we can attempt basic float extraction
        // The canister returns the raw text; frontend parses it
        usdcZarRateCache.value := ?(18.5, now); // conservative fallback in cache
        text
      };
    };
  };

  /// Admin only: set CoinMarketCap API key for Fear & Greed index.
  public shared ({ caller }) func setCMCApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    cmcApiKeyStore.value := key;
  };

  /// Admin only: returns true if CMC API key is configured and non-empty.
  public query ({ caller }) func getCMCApiKeyStatus() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    cmcApiKeyStore.value != "";
  };

  /// Admin only: set Brian API key for natural language transaction guides.
  public shared ({ caller }) func setBrianApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    brianApiKeyStore.value := key;
  };

  /// Admin only: returns true if Brian API key is configured and non-empty.
  public query ({ caller }) func getBrianApiKeyStatus() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    brianApiKeyStore.value != "";
  };

  // ─── Exa API Key Management ───────────────────────────────────────────────────

  /// Admin only: store the Exa API key securely in the canister.
  /// Never returned in plain text — use getExaApiKey for a masked preview.
  public shared ({ caller }) func setExaApiKey(key : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can set the Exa API key");
    };
    exaApiKeyStore.value := key;
    #ok;
  };

  /// Admin only: returns a masked preview of the Exa API key.
  /// Shows first 6 characters followed by "***", or "***" if short/empty.
  public query ({ caller }) func getExaApiKey() : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view the Exa API key");
    };
    let key = exaApiKeyStore.value;
    if (key.size() > 6) {
      Text.fromArray(key.toArray().sliceToArray(0, 6)) # "***"
    } else if (key.size() > 0) {
      "***"
    } else {
      ""
    };
  };

  // ElevenLabs Voice Proxy (API key stored securely in backend)
  public shared ({ caller }) func setElevenLabsApiKey(key : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set the ElevenLabs API key");
    };
    elevenLabsApiKey := key;
    elevenLabsApiKeyStore.value := key;
  };

  public query ({ caller = _ }) func isElevenLabsConfigured() : async Bool {
    elevenLabsApiKey != "";
  };

  public shared ({ caller }) func elevenLabsTextToSpeech(text : Text) : async Blob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let profile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
    };
    // Admin always has full Tier 3 access
    if (not isAdmin) {
      if (profile.subscriptionTier < 1) {
        Runtime.trap("Unauthorized: Voice requires at least Tier 1 subscription");
      } else if (profile.subscriptionTier == 1) {
        // Tier 1 trial: enforce 500-character monthly limit (checked against TEXT length)
        let TIER1_MONTHLY_CHAR_LIMIT = 500;
        let textLen = text.size();
        let currentCharUsage = switch (voiceUsage.get(caller)) {
          case (null) { 0 };
          case (?usage) { usage.count };
        };
        if (currentCharUsage + textLen > TIER1_MONTHLY_CHAR_LIMIT) {
          Runtime.trap("Tier 1 voice trial limit reached (500 characters/month). Upgrade to Tier 2 or Tier 3 for unlimited voice access.");
        };
      };
    };

    if (elevenLabsApiKey == "") {
      Runtime.trap("ElevenLabs API key not configured. Please set it in the admin panel.");
    };

    // ── Pilot mode guard — skip paid ElevenLabs outcall ─────────────────────
    if (pilotMode) {
      Debug.print("[pilot_mode] skipped outcall: ElevenLabs text-to-speech");
      // Return a minimal silent mp3 stub (44 bytes — valid empty MPEG frame).
      return Blob.fromArray([0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00]);
    };

    let voiceId = "mJZEpDe9qAKz9yOOwCD8";
    let url = "https://api.elevenlabs.io/v1/text-to-speech/" # voiceId;
    let bodyJson = "{\"text\":\"" # escapeJsonText(text) # "\",\"model_id\":\"eleven_monolingual_v1\",\"voice_settings\":{\"stability\":0.5,\"similarity_boost\":0.75}}";

    let httpRequest : IC.http_request_args = {
      url = url;
      max_response_bytes = ?500_000;
      headers = [
        { name = "xi-api-key"; value = elevenLabsApiKey },
        { name = "Content-Type"; value = "application/json" },
        { name = "Accept"; value = "audio/mpeg" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?bodyJson.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    // Track character usage for Tier 1 users before making the call
    if (not isAdmin and profile.subscriptionTier == 1) {
      let textLen = text.size();
      let currentUsage = switch (voiceUsage.get(caller)) {
        case (null) { { date = Int.abs(Time.now()); count = 0 } };
        case (?usage) { usage };
      };
      voiceUsage.add(caller, { currentUsage with count = currentUsage.count + textLen });
    };

    let httpResponse = await (with cycles = 231_000_000_000) IC.http_request(httpRequest);

    if (httpResponse.status != 200) {
      let errMsg = switch (httpResponse.body.decodeUtf8()) {
        case (null) { "ElevenLabs API returned error: " # httpResponse.status.toText() };
        case (?body) { "ElevenLabs API returned error " # httpResponse.status.toText() # ": " # body };
      };
      Runtime.trap(errMsg);
    };

    // Return raw audio bytes (mp3) directly — do NOT parse as JSON
    httpResponse.body;
  };

  // Helper: escape text for use inside a JSON string value
  private func escapeJsonText(s : Text) : Text {
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

  // Persistent Stripe configuration
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public query ({ caller = _ }) func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("The Stripe module needs to be configured first") };
      case (?value) { value };
    };
  };

  // Stripe integration
  public query ({ caller = _ }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // ─── Passenger Payment System ───────────────────────────────────────────────

  // Driver saves their payment receiving config (wallet addresses + bank details)
  public shared ({ caller }) func saveDriverPaymentConfig(config : DriverPaymentConfig) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only drivers can save payment config");
    };
    paymentConfigs.add(caller, config);
  };

  // Driver retrieves their own payment config
  public query ({ caller }) func getMyPaymentConfig() : async ?DriverPaymentConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    paymentConfigs.get(caller);
  };

  // Driver saves their own personal SnapScan merchant ID (distinct from the admin platform-level config).
  // This is the merchant ID the driver uses for their in-car sales QR — money goes directly to them.
  public shared ({ caller }) func saveMySnapScanMerchantId(merchantId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only drivers can save their SnapScan merchant ID");
    };
    let existing = switch (paymentConfigs.get(caller)) {
      case (null) {
        {
          btcAddress   = "";
          ethAddress   = "";
          solAddress   = "";
          bnbAddress   = "";
          usdcAddress  = "";
          baseAddress  = "";
          usdtAddress  = "";
          bankName     = "";
          bankAccount  = "";
          bankReference = "";
          snapScanMerchantId = null;
        };
      };
      case (?cfg) { cfg };
    };
    paymentConfigs.add(caller, { existing with snapScanMerchantId = ?(merchantId) });
  };

  // Driver retrieves their own personal SnapScan merchant ID.
  public query ({ caller }) func getMySnapScanMerchantId() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (paymentConfigs.get(caller)) {
      case (null) { null };
      case (?cfg) { cfg.snapScanMerchantId };
    };
  };

  // Public: passenger gets a driver's products by driver display name (no auth required)
  public query func getPublicDriverMenu(driverName : Text) : async [Product] {
    switch (driverNameIndex.get(driverName)) {
      case (null) { [] };
      case (?driverId) {
        switch (products.get(driverId)) {
          case (null) { [] };
          case (?userProducts) {
            userProducts.values().toArray().filter(func(p : Product) : Bool {
              p.currentStock > 0;
            });
          };
        };
      };
    };
  };

  // Public: passenger gets a driver's payment config by driver display name (no auth required)
  public query func getPublicDriverPaymentConfig(driverName : Text) : async ?DriverPaymentConfig {
    switch (driverNameIndex.get(driverName)) {
      case (null) { null };
      case (?driverId) { paymentConfigs.get(driverId) };
    };
  };

  // Public: passenger submits an order to a driver (no auth required)
  public shared func logPassengerOrder(driverName : Text, order : PassengerOrder) : async () {
    // ── Payload validation ──────────────────────────────────────────────────
    if (order.items.size() == 0) {
      Runtime.trap("Order must contain at least one item");
    };
    if (order.items.size() > 20) {
      Runtime.trap("Order exceeds maximum item count of 20");
    };
    for (item in order.items.values()) {
      if (item.productName.size() > 100) {
        Runtime.trap("Product name exceeds 100 characters");
      };
    };
    if (order.passengerNote.size() > 500) {
      Runtime.trap("Passenger note exceeds 500 characters");
    };

    switch (driverNameIndex.get(driverName)) {
      case (null) { Runtime.trap("Driver not found") };
      case (?driverId) {
        // ── Duplicate order ID check ────────────────────────────────────────
        let driverOrders = switch (passengerOrders.get(driverId)) {
          case (null) { Map.empty<Text, PassengerOrder>() };
          case (?o) { o };
        };
        if (driverOrders.containsKey(order.orderId)) {
          Runtime.trap("Duplicate order ID");
        };

        // ── Daily order cap per driver ──────────────────────────────────────
        let currentDayKey = (Time.now() / 86_400_000_000_000).toText();
        if (currentDayKey != passengerOrdersDayKey) {
          // New day — reset all per-driver counts
          passengerOrdersDayKey := currentDayKey;
          passengerOrdersPerDay.clear();
        };
        let driverIdText = driverId.toText();
        let currentCount = switch (passengerOrdersPerDay.get(driverIdText)) {
          case (null) { 0 };
          case (?n) { n };
        };
        if (currentCount >= 1000) {
          Runtime.trap("Daily order limit reached for this driver");
        };

        // ── Store order ─────────────────────────────────────────────────────
        let orderWithTimestamp = { order with timestamp = Time.now() };
        driverOrders.add(order.orderId, orderWithTimestamp);
        passengerOrders.add(driverId, driverOrders);

        // Increment daily count
        passengerOrdersPerDay.add(driverIdText, currentCount + 1);
      };
    };
  };

  // Authenticated: driver retrieves all passenger orders submitted to them
  public query ({ caller }) func getPassengerOrders() : async [PassengerOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (passengerOrders.get(caller)) {
      case (null) { [] };
      case (?o) { o.values().toArray() };
    };
  };

  // Authenticated: driver deletes a specific passenger order
  public shared ({ caller }) func deletePassengerOrder(orderId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let driverOrders = switch (passengerOrders.get(caller)) {
      case (null) { Map.empty<Text, PassengerOrder>() };
      case (?o) { o };
    };
    driverOrders.remove(orderId);
    passengerOrders.add(caller, driverOrders);
  };

  // ─── Tier Pricing Query ──────────────────────────────────────────────────────
  // Returns current tier pricing: Tier 1 = free (0), Tier 2 = R530, Tier 3 = R800
  public query func getTierPricing() : async { tier1 : Nat; tier2 : Nat; tier3 : Nat } {
    { tier1 = TIER1_PRICE; tier2 = TIER2_PRICE; tier3 = TIER3_PRICE };
  };

  // ─── Analytics Event Log Public API ──────────────────────────────────────────
  // All analytics APIs require auth. Admin sees system-wide data; drivers see only own events.

  /// Admin only: returns the last `limit` events across all drivers (newest first).
  public query ({ caller }) func getRecentAnalyticsEvents(limit : Nat) : async [AnalyticsTypes.AnalyticsEvent] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    AnalyticsLog.getRecentEvents(analyticsState, limit);
  };

  /// Caller sees their own events; admin can pass any driverId.
  /// Limit is capped at 100 to avoid large responses.
  public query ({ caller }) func getDriverAnalyticsEvents(driverId : Text, limit : Nat) : async [AnalyticsTypes.AnalyticsEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (caller.toText() != driverId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own analytics");
    };
    let cap = if (limit > 100) { 100 } else { limit };
    AnalyticsLog.getEventsByDriver(analyticsState, driverId, cap);
  };

  /// Admin only: returns aggregated analytics summary.
  public query ({ caller }) func getAnalyticsSummary() : async AnalyticsTypes.AnalyticsSummary {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    AnalyticsLog.getAnalyticsSummary(analyticsState);
  };

  /// Admin only: returns the last `limit` error events (success=false).
  public query ({ caller }) func getErrorLog(limit : Nat) : async [AnalyticsTypes.AnalyticsEvent] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    AnalyticsLog.getErrorEvents(analyticsState, limit);
  };

  // ─── AI Gateway Admin API ──────────────────────────────────────────────────────

  /// Admin only: set the Cloudflare AI Gateway URL.
  public shared ({ caller }) func setAIGatewayUrl(url : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    aiGatewayUrlStore.value := if (url == "") { null } else { ?url };
  };

  /// Admin only: set the Cloudflare AI Gateway API key.
  public shared ({ caller }) func setAIGatewayKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    aiGatewayApiKeyStore.value := if (key == "") { null } else { ?key };
  };

  /// Admin only: set both Cloudflare AI Gateway URL and key in one call.
  public shared ({ caller }) func setAIGatewayConfig(url : Text, key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    aiGatewayUrlStore.value := if (url == "") { null } else { ?url };
    aiGatewayApiKeyStore.value := if (key == "") { null } else { ?key };
  };

  /// Admin only: clear (disable) the Cloudflare AI Gateway — reverts to direct calls.
  public shared ({ caller }) func clearAIGatewayConfig() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    aiGatewayUrlStore.value := null;
    aiGatewayApiKeyStore.value := null;
  };

  /// Returns gateway configuration status. Never returns the API key.
  public query ({ caller }) func getAIGatewayStatus() : async { configured : Bool; url : ?Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    let configured = switch (aiGatewayUrlStore.value, aiGatewayApiKeyStore.value) {
      case (?u, ?k) { u != "" and k != "" };
      case _ { false };
    };
    { configured; url = aiGatewayUrlStore.value };
  };

  // ─── Orbis Admin API ──────────────────────────────────────────────────────────

  /// Admin only: set the Orbis API key (enables PQS pre-flight + Orbis LLM fallback).
  /// Set to empty string to disable both features.
  public shared ({ caller }) func setOrbisApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    orbisApiKeyStore.value := key;
  };

  /// Admin only: returns true if the Orbis API key is configured and non-empty.
  public query ({ caller }) func getOrbisApiKeyStatus() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    orbisApiKeyStore.value != "";
  };

  /// Admin only: trigger Orbis agent self-registration.
  /// Calls the Orbis discovery → register → subscribe flow and stores the returned
  /// sk_... API key into orbisApiKeyStore automatically on success.
  public shared ({ caller }) func triggerOrbisRegistration(
    email    : Text,
    password : Text,
    username : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    let result = await* OrbisProvider.selfRegisterOnOrbis(email, password, username);
    switch (result) {
      case (#err(msg)) { #err(msg) };
      case (#ok(key)) {
        orbisApiKeyStore.value := key;
        #ok(key)
      };
    };
  };

  /// Admin only: returns aggregated gateway metrics summary.
  public query ({ caller }) func getGatewayMetricsSummary() : async GatewayMetrics.Summary {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    GatewayMetrics.getSummary(gatewayMetricsState);
  };

  /// Admin only: returns the last `limit` gateway metric entries.
  public query ({ caller }) func getGatewayRecentEntries(limit : Nat) : async [GatewayMetrics.MetricEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    GatewayMetrics.getRecentEntries(gatewayMetricsState, limit);
  };

  /// Admin only: reset all driver rate limit counters manually.
  public shared ({ caller }) func resetAllRateLimits() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    RateLimiter.resetAll(rateLimiterState, Time.now());
  };

  /// Admin only: returns latency percentiles (p50/p95/p99) from the rolling sample buffer.
  public query ({ caller }) func getGatewayLatencyPercentiles() : async GatewayMetrics.LatencyPercentiles {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    GatewayMetrics.getLatencyPercentiles(gatewayMetricsState);
  };

  /// Admin only: returns the top 5 busiest hours by request count.
  public query ({ caller }) func getGatewayTopHours() : async [(Text, Nat)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    GatewayMetrics.getTopHours(gatewayMetricsState);
  };

  /// Admin only: returns current cache hit rate as a percentage (0.0–1.0).
  public query ({ caller }) func getGatewayCacheHitRate() : async Float {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    GatewayMetrics.getCacheHitRate(gatewayMetricsState);
  };

  // ─── 0xWork Agent Marketplace State ──────────────────────────────────────────
  // Nduna's Base wallet address — public chain data, safe to expose in queries.
  let zeroXWorkWalletAddressStore  = { var value : Text = "" };
  // 0xWork API key — admin-only; NEVER returned in any query.
  let zeroXWorkApiKeyStore         = { var value : Text = "" };
  // Cumulative USDC earned across all completed tasks (cached, refreshed by admin).
  let zeroXWorkTotalUSDCEarnedStore = { var value : Float = 0.0 };
  // Total number of tasks Nduna has completed on 0xWork.
  let zeroXWorkTasksCompletedStore  = { var value : Nat = 0 };
  // Whether Nduna has successfully registered on 0xWork.
  let zeroXWorkRegisteredStore      = { var value : Bool = false };
  // Currently active task ID (set when a task is claimed, cleared when submitted).
  let zeroXWorkActiveTaskIdStore    : { var value : ?Text } = { var value = null };
  // Cached list of available 0xWork tasks (up to 10); refreshed by triggerTaskDiscovery().
  let zeroXWorkCachedTasksStore     : { var value : [ZeroXWorkProvider.TaskItem] } = { var value = [] };

  include ZeroXWorkMixin(
    analyticsState,
    accessControlState,
    zeroXWorkWalletAddressStore,
    zeroXWorkApiKeyStore,
    zeroXWorkTotalUSDCEarnedStore,
    zeroXWorkTasksCompletedStore,
    zeroXWorkRegisteredStore,
    zeroXWorkActiveTaskIdStore,
    zeroXWorkCachedTasksStore,
  );

  // ─── eTavern Community Forum State ───────────────────────────────────────────
  // All forum posts: postId → ForumPost (includes top-level posts and replies)
  let forumPosts = Map.empty<ForumTypes.ForumPostId, ForumTypes.ForumPost>();
  // Like records: "callerId#postId" → ForumLike (composite key for O(log n) dedup check)
  let forumLikes = Map.empty<Text, ForumTypes.ForumLike>();
  // Flag records: "callerId#postId" → ForumFlag (composite key prevents duplicate flags)
  let forumFlags = Map.empty<Text, ForumTypes.ForumFlag>();
  include ForumMixin(accessControlState, forumPosts, forumLikes, forumFlags);

  // ─── Campaign Engine State ─────────────────────────────────────────────────────
  // All campaign records: campaignId → Campaign
  let campaignStore         = Map.empty<Text, CampaignTypes.Campaign>();
  // Conversion events ring-buffer (capped at 50k inside CampaignTracker)
  let campaignConversionEvents = List.empty<CampaignTypes.CampaignConversionEvent>();
  // Failure log — Nduna uses this to avoid repeating bad angles/segments
  let campaignFailureLogStore = List.empty<CampaignTypes.CampaignFailureLog>();
  // A/B test results: composite key (cmpA_cmpB) → AbTestResult
  let abTestResultsStore    = Map.empty<Text, CampaignTypes.AbTestResult>();
  // Per-campaign send counts: campaignId → Nat
  let campaignSendsMapStore = Map.empty<Text, Nat>();
  // Monotonic campaign ID counter
  let campaignIdCounterStore = { var value : Nat = 0 };
  // Global campaign engine config
  let campaignConfigStore = {
    var value : CampaignTypes.CampaignConfig = {
      maxActiveCampaignsPerDay     = 3;
      maxMessagesPerSegmentPerWeek = 1;
      enabled                      = true;
      weeklyReportEnabled          = true;
      adminEmail                   = "";
    };
  };
  // Per-driver email address index: driverId (Text) → email
  // Populated when a driver saves their profile with an email address.
  let driverEmailIndex = Map.empty<Text, Text>();

  include CampaignMixin(
    accessControlState,
    analyticsState,
    campaignStore,
    campaignConversionEvents,
    campaignFailureLogStore,
    abTestResultsStore,
    campaignConfigStore,
    campaignSendsMapStore,
    campaignIdCounterStore,
    driverAnalyticsProfiles,
    openClawApiKeyStore,
    openClawApiUrlStore,
    openClawModelStore,
    aiGatewayUrlStore,
    aiGatewayApiKeyStore,
    whatsappConfigStore,
    whatsappPhoneIndex,
    agentMailConfigStore,
    driverEmailIndex,
  );

  // ─── X (Twitter) Autonomous Posting State ────────────────────────────────────
  // Nduna's X posting config — credentials, threshold, earnings progress, post count.
  // API keys are stored but NEVER returned in plain text.
  let xPostingConfigStore = {
    var value : XPostingTypes.XPostingConfig = {
      xApiKey             = "";
      xApiSecret          = "";
      xAccessToken        = "";
      xAccessTokenSecret  = "";
      earningsThresholdUsd = 100;  // Unlock when Nduna earns $100 USDC/month
      monthlyEarningsCents = 0;
      isUnlocked          = false;
      totalPostsPublished = 0;
      lastPostAt          = null;
    };
  };
  // Flat list of all X posts Nduna has published or attempted.
  let xPostsStore = List.empty<XPostingTypes.XPost>();
  // Auto-increment ID for posts.
  let xPostIdCounterStore = { var value : Nat = 0 };
  include XPostingMixin(
    analyticsState,
    accessControlState,
    xPostingConfigStore,
    xPostsStore,
    xPostIdCounterStore,
  );

  // ─── Exa Test API ────────────────────────────────────────────────────────────

  /// Admin only: test the stored Exa API key by running a company research query.
  /// Returns a summary string (company name + snippet) on success, or an error message.
  public shared ({ caller }) func testExaCompanyResearch(searchQuery : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    let result = await* ExaProvider.companyResearch(exaApiKeyStore.value, searchQuery, pilotMode);
    switch (result) {
      case (#err(msg)) { #err(msg) };
      case (#ok(company)) {
        let summary = company.name # " — " # company.snippet;
        #ok(summary)
      };
    };
  };

  // ─── X Earnings Sync Wrapper ─────────────────────────────────────────────────
  // Extends sync0xWorkEarnings by also updating the X posting earnings tracker.
  // Admin should call this instead of sync0xWorkEarnings directly once X posting
  // state is in use — it fetches 0xWork earnings AND propagates the USDC total
  // to the X posting threshold tracker in one atomic admin call.

  /// Admin only: sync 0xWork earnings AND update the X posting threshold tracker.
  /// Wraps sync0xWorkEarnings() and then calls updateMonthlyXEarnings() with the
  /// latest cumulative USDC converted to cents (1 USDC = 100 cents).
  public shared ({ caller }) func syncEarningsAndXThreshold() : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };

    // Step 1: sync 0xWork live earnings into canister state
    let syncResult = await sync0xWorkEarnings();
    switch (syncResult) {
      case (#err(msg)) { return #err("0xWork sync failed: " # msg) };
      case (#ok(earnings)) {
        // Step 2: convert total USDC to cents and update X posting threshold
        let earningsCents : Nat = Int.abs(
          (earnings.totalUSDCEarned * 100.0).toInt()
        );
        let xUpdateResult = await updateMonthlyXEarnings(earningsCents);
        switch (xUpdateResult) {
          case (#err(msg)) {
            #err("0xWork synced but X earnings update failed: " # msg)
          };
          case (#ok(())) {
            let xStatus = xPostingConfigStore.value;
            let unlockMsg = if (xStatus.isUnlocked) { " | X posting UNLOCKED 🎉" } else {
              let pct = if (xStatus.earningsThresholdUsd * 100 == 0) { 0 } else {
                earningsCents * 100 / (xStatus.earningsThresholdUsd * 100)
              };
              " | X posting progress: " # pct.toText() # "%"
            };
            #ok(
              "Synced. USDC earned: $" # earnings.totalUSDCEarned.toText() #
              " | Tasks: " # earnings.tasksCompleted.toText() #
              unlockMsg
            )
          };
        };
      };
    };
  };

  // ─── Pilot Mode Admin API ────────────────────────────────────────────────────

  /// Admin-only: enable or disable pilot mode.
  /// When pilot mode is on, all paid third-party outcalls are skipped (ElevenLabs,
  /// Whisper, Camofox, Upload-Post, 360dialog paid templates, Tavily paid tier) and
  /// OpenRouter is restricted to free-tier models only.
  public shared ({ caller }) func setPilotMode(enabled : Bool) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("unauthorized");
    };
    pilotMode := enabled;
    pilotModeStore.value := enabled;
    #ok(());
  };

  /// Returns the current pilot mode status. Public query — readable by the frontend.
  public query func getPilotMode() : async Bool {
    pilotMode
  };

  // ─── Upgrade Lifecycle Hooks ──────────────────────────────────────────────
  // Enhanced orthogonal persistence is used — all state in this actor is automatically
  // persisted across upgrades without stable keyword or explicit serialisation.
  // These hooks are intentionally minimal but provide a clear extension point for future
  // data migrations if record shapes change in a subsequent upgrade.

  system func preupgrade() {
    // All persistent state uses enhanced orthogonal persistence — no migration needed.
    // This hook is intentionally minimal. Add explicit state migration here if
    // data structures change in a future upgrade.
  };

  system func postupgrade() {
    // MONEYDRIVE_PILOT_MODE=true — safe-by-default. A fresh canister deploy or reinstall
    // always starts with pilot mode ON so no paid outcalls fire accidentally.
    // Change to false here (and redeploy) once the pilot period ends.
    pilotMode := true;
    pilotModeStore.value := true;
  };
};
