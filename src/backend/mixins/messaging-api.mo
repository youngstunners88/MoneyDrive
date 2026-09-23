import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Debug "mo:core/Debug";
import AccessControl "mo:caffeineai-authorization/access-control";
import IC "ic:aaaaa-aa";
import MsgTypes "../types/messaging";
import AgentTypes "../types/agent";
import AgentLib "../lib/agent";
import LeadTypes "../types/leads";
import BriefingLib "../lib/weekly-briefing";

/// Public API mixin for the WhatsApp / Telegram messaging gateway.
/// - 360dialog config stored securely (admin-only, never exposed to frontend)
/// - Drivers interact with Nduna via WhatsApp using the same logic as in-app chat
/// - All conversation history is synced to the canister for cross-channel continuity
mixin (
  accessControlState    : AccessControl.AccessControlState,
  whatsappMessages      : Map.Map<Text, MsgTypes.WhatsAppConversationEntry>,
  whatsappConfig        : { var value : ?MsgTypes.WhatsAppConfig },
  whisperConfigStore    : { var value : ?MsgTypes.WhisperConfig },
  rateLimits            : Map.Map<Text, MsgTypes.WhatsAppRateLimit>,
  // Agent state — injected to allow Nduna processing for inbound WhatsApp messages
  openClawApiKey        : { var value : ?Text },
  openClawApiUrl        : { var value : Text },
  openClawModel         : { var value : Text },
  // Driver data for Nduna context & command handling
  hermesHistory         : Map.Map<Principal, List.List<AgentTypes.AgentMessage>>,
  driverMemories        : Map.Map<Principal, AgentTypes.DriverMemory>,
  driverMemoryEntries   : Map.Map<Principal, List.List<AgentTypes.DriverMemoryEntry>>,
  driverAnalyticsProfiles : Map.Map<Principal, AgentTypes.DriverAnalyticsProfile>,
  profiles              : Map.Map<Principal, {
    displayName          : Text;
    currencyCode         : Text;
    subscriptionTier     : Nat;
    voiceEnabled         : Bool;
    fuelConsumptionRate  : Float;
    vehicleName          : Text;
  }>,
  // Phone-to-principal mapping — used to identify drivers by phone number
  phoneIndex            : Map.Map<Text, Principal>,
  // Leads — used for /leads command and weekly briefing
  leadsMap              : Map.Map<Text, LeadTypes.ScrapedLead>,
  // Weekly briefing scheduler state
  weeklyBriefingState   : { var value : MsgTypes.WeeklyBriefingState },
  // Tavily API key — used to fetch market intelligence for weekly briefing
  tavilyApiKey          : { var value : Text },
  // Driver ratings — manually stored, used for cohort-aware briefing content
  driverRatings         : Map.Map<Principal, Float>,
  /// Pilot mode flag — when true, 360dialog paid WhatsApp templates and Whisper outcalls are skipped.
  pilotMode             : { var value : Bool },
) {

  // ── Rate limiting constants ────────────────────────────────────────────────────
  let RATE_LIMIT_MAX : Nat = 10;
  let RATE_LIMIT_WINDOW_NS : Int = 60_000_000_000; // 60 seconds in nanoseconds

  // ── Private helpers ────────────────────────────────────────────────────────────

  /// Generate a unique message ID from phone + timestamp.
  func makeMessageId(phone : Text, ts : Int) : Text {
    "wa_" # phone # "_" # ts.toText();
  };

  /// Check and update rate limit for a phone number.
  /// Returns true if allowed, false if rate limit exceeded.
  func checkRateLimit(phone : Text, now : Int) : Bool {
    let existing = rateLimits.get(phone);
    switch (existing) {
      case (null) {
        rateLimits.add(phone, {
          phoneNumber   = phone;
          messageCount  = 1;
          windowStartMs = now;
        });
        true;
      };
      case (?rl) {
        if (now - rl.windowStartMs > RATE_LIMIT_WINDOW_NS) {
          // New window — reset
          rateLimits.add(phone, {
            phoneNumber   = phone;
            messageCount  = 1;
            windowStartMs = now;
          });
          true;
        } else if (rl.messageCount >= RATE_LIMIT_MAX) {
          false;
        } else {
          rateLimits.add(phone, { rl with messageCount = rl.messageCount + 1 });
          true;
        };
      };
    };
  };

  /// Validate 360dialog webhook signature (simple secret-token comparison).
  /// 360dialog sends the configured webhook secret as the X-D360-SIGNATURE header.
  func validateSignature(storedSecret : Text, incomingSignature : Text) : Bool {
    storedSecret == incomingSignature;
  };

  /// Extract a JSON field value (Text) from a flat JSON object.
  /// Handles: "field":"value" or "field": "value"
  func extractJsonField(json : Text, field : Text) : ?Text {
    let key = "\"" # field # "\":\"";
    switch (AgentLib.splitOnFirst(json, key)) {
      case (null) {
        // Try with a space after colon
        let keySpace = "\"" # field # "\": \"";
        switch (AgentLib.splitOnFirst(json, keySpace)) {
          case (null) { null };
          case (?(_, rest)) { ?AgentLib.takeUntilQuote(rest) };
        };
      };
      case (?(_, rest)) { ?AgentLib.takeUntilQuote(rest) };
    };
  };

  /// Extract phone number from a 360dialog webhook JSON payload.
  /// 360dialog format: { "messages": [{ "from": "27821234567", "text": { "body": "..." }, ... }] }
  func parseWebhookPayload(payload : Text) : ?(Text, Text, ?Text, ?Text) {
    // Extract "from" field
    let fromPhone = switch (extractJsonField(payload, "from")) {
      case (null) { return null };
      case (?p) { p };
    };

    // Extract message body from "body" field inside "text" object
    let body = switch (AgentLib.splitOnFirst(payload, "\"text\":{")) {
      case (null) {
        // Try direct "body" field
        switch (extractJsonField(payload, "body")) {
          case (null) { "" };
          case (?b) { b };
        };
      };
      case (?(_, rest)) {
        switch (extractJsonField(rest, "body")) {
          case (null) { "" };
          case (?b) { b };
        };
      };
    };

    // Extract optional media URL
    let mediaUrl : ?Text = switch (AgentLib.splitOnFirst(payload, "\"image\":{")) {
      case (?(_, rest)) { extractJsonField(rest, "link") };
      case (null) {
        switch (AgentLib.splitOnFirst(payload, "\"document\":{")) {
          case (?(_, rest)) { extractJsonField(rest, "link") };
          case (null) { null };
        };
      };
    };

    // Extract media type
    let mediaType : ?Text = switch (AgentLib.splitOnFirst(payload, "\"type\":\"")) {
      case (null) { null };
      case (?(_, rest)) {
        let t = AgentLib.takeUntilQuote(rest);
        if (t == "text" or t == "") { null } else { ?t };
      };
    };

    ?(fromPhone, body, mediaUrl, mediaType);
  };

  /// Parse a command from message body. Returns #unknown if not a command.
  func parseCommand(body : Text) : MsgTypes.WhatsAppCommand {
    if (not body.startsWith(#char '/')) { return #unknown(body) };

    let lower = body.toLower();
    if (lower == "/leads") { return #leads };
    if (lower == "/status") { return #status };
    if (lower == "/help") { return #help };

    // /coach [company]
    if (lower.startsWith(#text "/coach")) {
      let rest = body.size();
      if (rest > 6) {
        let company = body.trimStart(#text "/coach").trimStart(#char ' ');
        if (company != "") { return #coach(company) };
      };
      return #coach("");
    };

    #unknown(body);
  };

  /// Format the /help command response.
  func formatHelpResponse() : Text {
    "*MoneyDrive Nduna Commands*\n\n" #
    "📋 /leads — Top 10 companies to pitch this week\n" #
    "🎯 /coach [company] — Pitch strategy for a specific company\n" #
    "   Example: /coach MTN\n" #
    "📊 /status — Your earnings & deals summary\n" #
    "❓ /help — Show this menu\n\n" #
    "_Or just type a message to chat with Nduna directly._";
  };

  /// Format /leads response from stored leads for a driver.
  func formatLeadsResponse(driverId : Text) : Text {
    // Collect leads for this driver
    let driverLeads = List.empty<LeadTypes.ScrapedLead>();
    for ((_, lead) in leadsMap.entries()) {
      if (lead.driverId == driverId) {
        driverLeads.add(lead);
      };
    };

    let sorted = driverLeads.toArray().sort(
      func(a : LeadTypes.ScrapedLead, b : LeadTypes.ScrapedLead) : { #less; #equal; #greater } {
        if (a.compositeScore > b.compositeScore) { #less }
        else if (a.compositeScore < b.compositeScore) { #greater }
        else { #equal };
      }
    );

    let take = if (sorted.size() < 10) { sorted.size() } else { 10 };
    if (take == 0) {
      return "*No leads found this week.*\n\nYour weekly batch hasn't arrived yet. Reply with /coach [company] to manually get a pitch strategy for any company.";
    };

    var result = "*Your Top " # take.toText() # " Leads This Week:*\n\n";
    var i = 0;
    while (i < take) {
      let lead = sorted[i];
      result := result # (i + 1).toText() # ". *" # lead.companyName # "*\n";
      result := result # "   📍 " # lead.industry # " | " # lead.source # "\n";
      if (lead.website != "") {
        result := result # "   🌐 " # lead.website # "\n";
      };
      result := result # "   Score: " # lead.compositeScore.toText() # "/100\n\n";
      i += 1;
    };
    result := result # "_Reply /coach [company name] to get Nduna's pitch strategy_";
    result;
  };

  /// Get Nduna history for a driver as array.
  func getDriverHistory(principal : Principal) : [AgentTypes.AgentMessage] {
    switch (hermesHistory.get(principal)) {
      case (null) { [] };
      case (?hist) { hist.toArray() };
    };
  };

  /// Persist a message into the driver's Nduna history.
  func persistAgentMessage(principal : Principal, role : Text, content : Text, ts : Int) {
    let msg : AgentTypes.AgentMessage = { role; content; timestamp = ts };
    let existing = switch (hermesHistory.get(principal)) {
      case (null) { List.empty<AgentTypes.AgentMessage>() };
      case (?hist) { hist };
    };
    existing.add(msg);
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

  /// Build a minimal driver context string for WhatsApp Nduna queries.
  func buildWhatsAppDriverContext(principal : Principal) : Text {
    let profile = switch (profiles.get(principal)) {
      case (null) { { displayName = "Unknown"; currencyCode = "ZAR"; subscriptionTier = 1; vehicleName = ""; voiceEnabled = false; fuelConsumptionRate = 0.0 } };
      case (?p) { p };
    };
    let analyticsSection = switch (driverAnalyticsProfiles.get(principal)) {
      case (null) { "No analytics data yet." };
      case (?ap) { AgentLib.buildAnalyticsContext(ap, profile.currencyCode) };
    };
    "Driver: " # profile.displayName #
    " | Tier: " # profile.subscriptionTier.toText() #
    " | Vehicle: " # profile.vehicleName #
    " | Currency: " # profile.currencyCode #
    " | Channel: WhatsApp\n\n" # analyticsSection;
  };

  /// Call 360dialog Send Message API.
  func send360Message(apiKey : Text, toPhone : Text, body : Text) : async { #ok : Text; #err : Text } {
    let requestBody =
      "{\"messaging_product\":\"whatsapp\"," #
      "\"to\":\"" # AgentLib.escapeJson(toPhone) # "\"," #
      "\"type\":\"text\"," #
      "\"text\":{\"body\":\"" # AgentLib.escapeJson(body) # "\"}}";

    let httpRequest : IC.http_request_args = {
      url = "https://waba.360dialog.io/v1/messages";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "D360-API-KEY"; value = apiKey },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let httpResponse = await (with cycles = 50_000_000_000) IC.http_request(httpRequest);

    if (httpResponse.status == 200 or httpResponse.status == 201) {
      // Extract message ID from response
      let msgId = switch (httpResponse.body.decodeUtf8()) {
        case (null) { "unknown" };
        case (?text) {
          switch (extractJsonField(text, "id")) {
            case (null) { "sent" };
            case (?id) { id };
          };
        };
      };
      #ok(msgId);
    } else {
      let errBody = switch (httpResponse.body.decodeUtf8()) {
        case (null) { "HTTP " # httpResponse.status.toText() };
        case (?t) { t };
      };
      #err("360dialog error " # httpResponse.status.toText() # ": " # errBody);
    };
  };

  /// Store a conversation entry in the whatsappMessages map.
  func storeEntry(entry : MsgTypes.WhatsAppConversationEntry) {
    whatsappMessages.add(entry.messageId, entry);
  };

  // ── Admin: WhatsApp config ─────────────────────────────────────────────────────

  /// Admin-only: store 360dialog WhatsApp config securely.
  /// Never exposed to frontend — same pattern as ElevenLabs / Camofox keys.
  public shared ({ caller }) func setWhatsAppConfig(config : MsgTypes.WhatsAppConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set WhatsApp config");
    };
    whatsappConfig.value := ?config;
  };

  /// Admin-only: retrieve the stored WhatsApp config.
  public query ({ caller }) func getWhatsAppConfig() : async ?MsgTypes.WhatsAppConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view WhatsApp config");
    };
    whatsappConfig.value;
  };

  /// Returns whether 360dialog has been configured.
  public query func isWhatsAppConfigured() : async Bool {
    switch (whatsappConfig.value) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // ── Admin: Whisper config ──────────────────────────────────────────────────────

  /// Admin-only: store Whisper API key for media transcription in WhatsApp messages.
  public shared ({ caller }) func setWhisperConfig(config : MsgTypes.WhisperConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set Whisper config");
    };
    whisperConfigStore.value := ?config;
  };

  // ── Driver: register phone number ─────────────────────────────────────────────

  /// Authenticated: driver registers their WhatsApp phone number for inbound routing.
  /// Phone must be in E.164 format (e.g. "+27821234567" or "27821234567").
  public shared ({ caller }) func registerWhatsAppPhone(phone : Text) : async { #ok; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    if (phone == "") {
      return #err("Phone number cannot be empty");
    };
    phoneIndex.add(phone, caller);
    #ok;
  };

  // ── Webhook: incoming messages ─────────────────────────────────────────────────

  /// Public webhook endpoint called by 360dialog when a driver sends a WhatsApp message.
  /// Validates the webhook secret, parses the payload, routes to Nduna, and sends a reply.
  /// Returns "200" on success, "403" on signature failure, "429" on rate limit.
  public shared func receiveWhatsAppWebhook(payload : Text, signature : Text) : async Text {
    let cfg = switch (whatsappConfig.value) {
      case (null) { return "503" }; // Not configured
      case (?c) { c };
    };

    // Validate webhook signature
    if (not validateSignature(cfg.webhookSecret, signature)) {
      return "403";
    };

    let now = Time.now();

    // Parse the incoming payload
    let (fromPhone, body, mediaUrl, _mediaType) = switch (parseWebhookPayload(payload)) {
      case (null) { return "400" }; // Malformed payload
      case (?parsed) { parsed };
    };

    // Rate limiting
    if (not checkRateLimit(fromPhone, now)) {
      return "429";
    };

    // Identify driver by phone number
    let driverPrincipal = phoneIndex.get(fromPhone);

    // Use phone as driverId if no principal registered yet
    let driverId = switch (driverPrincipal) {
      case (null) { fromPhone };
      case (?p) { p.toText() };
    };

    // Store inbound message entry
    let inboundId = makeMessageId(fromPhone, now);
    storeEntry({
      channel         = #whatsapp;
      messageId       = inboundId;
      driverId        = driverId;
      direction       = #inbound;
      body            = body;
      mediaStorageRef = mediaUrl;
      timestamp       = now;
      deliveryStatus  = #delivered;
      errorMsg        = null;
    });

    // Build the Nduna response
    let replyBody = switch (driverPrincipal) {
      case (null) {
        // Unknown driver — send onboarding message
        "Welcome to MoneyDrive! 👋\n\nI'm Nduna, your earnings intelligence agent.\n\nTo get started, open the MoneyDrive app and register your WhatsApp number in Settings, then come back here.\n\nIn the meantime, reply /help to see what I can do.";
      };
      case (?principal) {
        // Parse for commands
        let cmd = parseCommand(body);
        switch (cmd) {
          case (#help) {
            formatHelpResponse();
          };
          case (#leads) {
            formatLeadsResponse(driverId);
          };
          case (#status) {
            // Build a brief status from analytics
            let analyticsText = switch (driverAnalyticsProfiles.get(principal)) {
              case (null) { "No analytics data yet. Log some trips in the app first." };
              case (?ap) {
                let profile = switch (profiles.get(principal)) {
                  case (null) { { currencyCode = "ZAR" } };
                  case (?p) { p };
                };
                "*Your MoneyDrive Status:*\n\n" #
                "📊 Total trips: " # ap.totalTrips.toText() # "\n" #
                "💰 Total earnings: " # profile.currencyCode # " " # ap.totalEarnings.toText() # "\n" #
                "🚗 Total kms: " # ap.totalKmsDriven.toText() # " km\n" #
                "👁️ Car exposure: ~" # ap.estimatedCarExposure.toText() # " people\n\n" #
                "_For full dashboard, open the MoneyDrive app_";
              };
            };
            analyticsText;
          };
          case (#coach(company)) {
            // Route to Nduna with context about coaching for this company
            let coachPrompt = if (company == "") {
              "Give me a general pitch strategy for approaching SA companies about car advertising deals."
            } else {
              "Give me a personalized pitch strategy for approaching " # company # " about an advertising deal for my car. Be specific and actionable."
            };
            switch (openClawApiKey.value) {
              case (null) { "Nduna AI is not configured yet. Ask the admin to set the OpenRouter API key." };
              case (?key) {
                if (key == "") {
                  "Nduna AI is not configured yet. Ask the admin to set the OpenRouter API key.";
                } else {
                  let driverContext = buildWhatsAppDriverContext(principal);
                  let memEntries = switch (driverMemoryEntries.get(principal)) {
                    case (null) { [] };
                    case (?list) { list.toArray() };
                  };
                  let driverMem = driverMemories.get(principal);
                  let history = getDriverHistory(principal);
                  persistAgentMessage(principal, "user", coachPrompt, now);
                  let waAnalytics = driverAnalyticsProfiles.get(principal);
                  let (waTripsMon, waEarningsMon) = switch (waAnalytics) { case (null) { (0, 0.0) }; case (?ap) { (ap.totalTrips / 12, ap.totalEarnings / 12.0) } };
                  let waCohort = AgentLib.classifyDriver(waTripsMon, waEarningsMon);
                  let waRating = switch (driverRatings.get(principal)) { case (null) { 4.5 }; case (?r) { r } };
                  let (waCurrentDate, waCurrentTime) = AgentLib.formatDateTimeSAST(now);
                   let (reply, _) = await* AgentLib.queryAgent(
                     key,
                     openClawApiUrl.value,
                     openClawModel.value,
                     coachPrompt,
                     history,
                     waCurrentDate,
                     waCurrentTime,
                     driverContext,
                     memEntries,
                     driverMem,
                     null, // no documents for WhatsApp channel
                     "", // WhatsApp channel uses empty evolution delta (no access to prompt state here)
                     ?waCohort,
                     waRating,
                     Time.now(),
                     null, // no gateway URL for WhatsApp channel
                     null, // no gateway key for WhatsApp channel
                     null, // no metrics state for WhatsApp channel
                     null, // no orbis API key for WhatsApp channel
                   );
                  persistAgentMessage(principal, "assistant", reply, Time.now());
                  reply;
                };
              };
            };
          };
          case (#unknown(_)) {
            // Route to Nduna as a regular chat message
            switch (openClawApiKey.value) {
              case (null) { "Nduna AI is not configured yet. Contact support." };
              case (?key) {
                if (key == "") {
                  "Nduna AI is not configured yet. Contact support.";
                } else {
                  let driverContext = buildWhatsAppDriverContext(principal);
                  let memEntries = switch (driverMemoryEntries.get(principal)) {
                    case (null) { [] };
                    case (?list) { list.toArray() };
                  };
                  let driverMem = driverMemories.get(principal);
                  let history = getDriverHistory(principal);
                  persistAgentMessage(principal, "user", body, now);
                  let waAnalytics2 = driverAnalyticsProfiles.get(principal);
                  let (waTripsMon2, waEarningsMon2) = switch (waAnalytics2) { case (null) { (0, 0.0) }; case (?ap) { (ap.totalTrips / 12, ap.totalEarnings / 12.0) } };
                  let waCohort2 = AgentLib.classifyDriver(waTripsMon2, waEarningsMon2);
                  let waRating2 = switch (driverRatings.get(principal)) { case (null) { 4.5 }; case (?r) { r } };
                  let (waCurrentDate2, waCurrentTime2) = AgentLib.formatDateTimeSAST(now);
                    let (reply, _) = await* AgentLib.queryAgent(
                     key,
                     openClawApiUrl.value,
                     openClawModel.value,
                     body,
                     history,
                     waCurrentDate2,
                     waCurrentTime2,
                     driverContext,
                     memEntries,
                     driverMem,
                     null, // no documents for WhatsApp channel
                     "", // WhatsApp channel uses empty evolution delta (no access to prompt state here)
                     ?waCohort2,
                     waRating2,
                     Time.now(),
                     null, // no gateway URL for WhatsApp channel
                     null, // no gateway key for WhatsApp channel
                     null, // no metrics state for WhatsApp channel
                     null, // no orbis API key for WhatsApp channel
                   );
                  persistAgentMessage(principal, "assistant", reply, Time.now());
                  reply;
                };
              };
            };
          };
        };
      };
    };

    // Store outbound entry (before sending, so it's persisted even on API failure)
    let outboundId = makeMessageId(cfg.phoneNumber, Time.now());
    let outboundEntry : MsgTypes.WhatsAppConversationEntry = {
      channel         = #whatsapp;
      messageId       = outboundId;
      driverId        = driverId;
      direction       = #outbound;
      body            = replyBody;
      mediaStorageRef = null;
      timestamp       = Time.now();
      deliveryStatus  = #sent;
      errorMsg        = null;
    };

    // Send via 360dialog API
    let sendResult = await send360Message(cfg.apiKey, fromPhone, replyBody);
    let finalEntry = switch (sendResult) {
      case (#ok(_)) { outboundEntry };
      case (#err(errMsg)) {
        // Store error on the outbound entry — visible in driver's WhatsApp history
        // No retry — per user instruction: "surface error to driver"
        { outboundEntry with
          deliveryStatus = #failed;
          errorMsg       = ?errMsg;
        };
      };
    };
    storeEntry(finalEntry);

    "200";
  };

  // ── Driver: send a WhatsApp message ───────────────────────────────────────────

  /// Authenticated: driver (or admin on behalf of driver) sends a WhatsApp message outbound.
  /// Primarily used for testing and for admin broadcasts.
  public shared ({ caller }) func sendWhatsAppMessage(
    toPhone : Text,
    body    : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can send outbound WhatsApp messages directly");
    };
    // ── Pilot mode guard — skip 360dialog paid template send ────────────────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: 360dialog sendWhatsAppMessage");
      return #err("[pilot_mode] WhatsApp messaging is disabled during the pilot period.");
    };
    let cfg = switch (whatsappConfig.value) {
      case (null) { return #err("WhatsApp not configured. Set config in admin panel.") };
      case (?c) { c };
    };
    let result = await send360Message(cfg.apiKey, toPhone, body);
    switch (result) {
      case (#ok(msgId)) {
        // Store outbound entry
        storeEntry({
          channel         = #whatsapp;
          messageId       = msgId;
          driverId        = caller.toText();
          direction       = #outbound;
          body            = body;
          mediaStorageRef = null;
          timestamp       = Time.now();
          deliveryStatus  = #sent;
          errorMsg        = null;
        });
        #ok(msgId);
      };
      case (#err(err)) { #err(err) };
    };
  };

  // ── Driver: conversation history ──────────────────────────────────────────────

  /// Authenticated: driver retrieves their full cross-channel conversation history.
  /// Returns entries sorted by timestamp descending (most recent first).
  public query ({ caller }) func getWhatsAppHistory(
    limit  : ?Nat,
    before : ?Int,
  ) : async [MsgTypes.WhatsAppConversationEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    let maxEntries = switch (limit) {
      case (null) { 50 };
      case (?l) { if (l == 0 or l > 200) { 50 } else { l } };
    };

    // Collect all entries for this driver
    let driverEntries = List.empty<MsgTypes.WhatsAppConversationEntry>();
    for ((_, entry) in whatsappMessages.entries()) {
      if (entry.driverId == driverId) {
        switch (before) {
          case (null) { driverEntries.add(entry) };
          case (?ts) {
            if (entry.timestamp < ts) { driverEntries.add(entry) };
          };
        };
      };
    };

    // Sort descending by timestamp
    let sorted = driverEntries.toArray().sort(
      func(a : MsgTypes.WhatsAppConversationEntry, b : MsgTypes.WhatsAppConversationEntry) : { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less }
        else if (a.timestamp < b.timestamp) { #greater }
        else { #equal };
      }
    );

    let take = if (sorted.size() < maxEntries) { sorted.size() } else { maxEntries };
    sorted.sliceToArray(0, take);
  };

  /// Authenticated: driver retrieves the number of unread inbound messages.
  public query ({ caller }) func getUnreadWhatsAppCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    var count = 0;
    for ((_, entry) in whatsappMessages.entries()) {
      if (entry.driverId == driverId and entry.direction == #inbound and entry.deliveryStatus == #delivered) {
        count += 1;
      };
    };
    count;
  };

  // ── Weekly Briefing API ────────────────────────────────────────────────────────

  /// Public query: returns the current weekly briefing scheduler state.
  public query func getWeeklyBriefingState() : async MsgTypes.WeeklyBriefingState {
    weeklyBriefingState.value;
  };

  /// Admin only: enable or disable the weekly briefing scheduler.
  public shared ({ caller }) func setWeeklyBriefingEnabled(enabled : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can configure weekly briefings");
    };
    weeklyBriefingState.value := { weeklyBriefingState.value with enabled };
  };

  /// Admin callable: iterate all drivers with registered WhatsApp numbers and send the weekly briefing.
  /// Returns { sent: Nat; failed: Nat }.
  /// Safe to call manually at any time — also auto-triggered by the heartbeat timer in main.mo.
  public shared ({ caller }) func triggerWeeklyBriefings() : async { sent : Nat; failed : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can trigger weekly briefings");
    };
    // ── Pilot mode guard — skip 360dialog paid WhatsApp template sends ───────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: 360dialog triggerWeeklyBriefings");
      return { sent = 0; failed = 0 };
    };
    let cfg = switch (whatsappConfig.value) {
      case (null) { return { sent = 0; failed = 0 } }; // WhatsApp not configured
      case (?c) { c };
    };

    let now = Time.now();
    var sent = 0;
    var failed = 0;

    // ── Tavily market intelligence (one call per briefing run, shared across all drivers) ──
    var marketIntelligence = "";
    if (tavilyApiKey.value != "") {
      let tavilyQuery = "top advertising opportunities for transport companies in South Africa 2025";
      let tavilyRaw = await* AgentLib.tavilySearchRaw(tavilyApiKey.value, tavilyQuery);
      if (tavilyRaw != "") {
        // Extract the 'answer' field as the market intelligence snippet
        let parsed = AgentLib.splitOnFirst(tavilyRaw, "\"answer\":\"");
        switch (parsed) {
          case (?(_, rest)) {
            let answer = AgentLib.takeUntilQuote(rest);
            if (answer.size() > 0 and answer != "null") {
              let arr = answer.toArray();
              let len = if (arr.size() < 200) { arr.size() } else { 200 };
              marketIntelligence := Text.fromArray(arr.sliceToArray(0, len));
            };
          };
          case (null) {};
        };
      };
    };

    // Iterate all registered phone → principal mappings
    for ((phone, principal) in phoneIndex.entries()) {
      // Build leads for this driver
      let driverLeads = List.empty<LeadTypes.ScrapedLead>();
      for ((_, lead) in leadsMap.entries()) {
        if (lead.driverId == principal.toText()) {
          driverLeads.add(lead);
        };
      };

      let analytics = driverAnalyticsProfiles.get(principal);

      // Determine cohort
      let (tripsMonth, earningsMonth) = switch (analytics) {
        case (null) { (0, 0.0) };
        case (?ap) { (ap.totalTrips / 12, ap.totalEarnings / 12.0) };
      };
      let cohort = AgentLib.classifyDriver(tripsMonth, earningsMonth);

      let currencyCode = switch (profiles.get(principal)) {
        case (null) { "ZAR" };
        case (?p) { p.currencyCode };
      };

      let message = BriefingLib.buildBriefingMessage(
        driverLeads.toArray(),
        analytics,
        cohort,
        currencyCode,
        marketIntelligence,
        switch (driverRatings.get(principal)) { case (null) { 4.5 }; case (?r) { r } },
      );

      let result = await send360Message(cfg.apiKey, phone, message);
      switch (result) {
        case (#ok(_)) { sent += 1 };
        case (#err(_)) { failed += 1 };
      };
    };

    // Update lastSentAt
    weeklyBriefingState.value := { weeklyBriefingState.value with lastSentAt = ?now };

    { sent; failed };
  };
};
