import Text  "mo:core/Text";
import List  "mo:core/List";
import Time  "mo:core/Time";
import Nat   "mo:core/Nat";
import Int   "mo:core/Int";
import Array "mo:core/Array";
import IC    "ic:aaaaa-aa";
import CampaignTypes "../types/campaign";
import AgentTypes    "../types/agent";
import AgentLib      "../lib/agent";
import GatewayRouter "../lib/gateway/GatewayRouter";

/// Nduna's campaign planning intelligence.
/// Stateless — all mutable state is passed in from main.mo via the mixin.
/// Applies Minto Pyramid Principle: answer first, proof, CTA.
module {

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /// Generate a short campaign ID from timestamp + counter.
  public func makeCampaignId(now : Int, counter : Nat) : Text {
    "cmp_" # Int.abs(now / 1_000_000).toText() # "_" # counter.toText();
  };

  /// Build a UTM tracking string for a campaign.
  public func buildTrackingUtm(campaignId : Text, channel : CampaignTypes.CampaignChannel) : Text {
    let medium = switch (channel) {
      case (#whatsapp) { "whatsapp" };
      case (#email)    { "email"    };
      case (#both)     { "multi"    };
    };
    "utm_source=nduna_campaign&utm_medium=" # medium # "&utm_campaign=" # campaignId;
  };

  /// Convert a MessageAngle variant to a Text label for prompts and logging.
  public func angleToText(angle : CampaignTypes.MessageAngle) : Text {
    switch (angle) {
      case (#earnings_proof)     { "earnings_proof"     };
      case (#feature_benefit)    { "feature_benefit"    };
      case (#referral_incentive) { "referral_incentive" };
      case (#limited_time_offer) { "limited_time_offer" };
    };
  };

  /// Convert a Text label back to a MessageAngle (defaults to #feature_benefit).
  public func textToAngle(t : Text) : CampaignTypes.MessageAngle {
    if      (t == "earnings_proof")     { #earnings_proof     }
    else if (t == "referral_incentive") { #referral_incentive }
    else if (t == "limited_time_offer") { #limited_time_offer }
    else                                { #feature_benefit    };
  };

  /// Select the best angle that is NOT in the failure log.
  /// Preference order: earnings_proof > feature_benefit > referral_incentive > limited_time_offer.
  public func selectAngle(failureLogs : [CampaignTypes.CampaignFailureLog]) : CampaignTypes.MessageAngle {
    let failedAngles = failureLogs.map(func(fl : CampaignTypes.CampaignFailureLog) : Text { angleToText(fl.angle) });
    let preference = [#earnings_proof, #feature_benefit, #referral_incentive, #limited_time_offer];
    for (angle in preference.values()) {
      let angleName = angleToText(angle);
      let alreadyFailed = failedAngles.find(func(a : Text) : Bool { a == angleName });
      if (alreadyFailed == null) {
        return angle;
      };
    };
    // All angles have failed — reset and use earnings_proof (best performer historically)
    #earnings_proof;
  };

  /// Select the best driver segment based on lowest recent trial conversion.
  /// Returns a broad "All" segment when no conversion data is available (cold start).
  public func selectSegment(profiles : [AgentTypes.DriverAnalyticsProfile]) : CampaignTypes.DriverSegment {
    // Heuristic: target New Drivers first (they convert best on trial offers)
    // Refined with actual conversion data in a future iteration.
    let newDriverCount = profiles.filter(func(ap : AgentTypes.DriverAnalyticsProfile) : Bool {
      let tripsMonth    = ap.totalTrips / 12;
      let earningsMonth = ap.totalEarnings / 12.0;
      tripsMonth < 100 and earningsMonth < 8_000.0;
    }).size();

    if (newDriverCount > 10) {
      {
        archetype      = "NewDriver";
        city           = "All";
        platform       = "All";
        tier           = 0;
        estimatedCount = newDriverCount;
      };
    } else {
      {
        archetype      = "All";
        city           = "All";
        platform       = "All";
        tier           = 0;
        estimatedCount = profiles.size();
      };
    };
  };

  // ─── LLM-powered copy generation ──────────────────────────────────────────────

  /// Build the SA-localised Minto Pyramid campaign copy prompt.
  /// Uses answer-first structure: headline benefit → proof point → CTA.
  private func buildCopyPrompt(
    segment : CampaignTypes.DriverSegment,
    angle   : CampaignTypes.MessageAngle,
  ) : Text {
    let archetypeDesc = if (segment.archetype == "NewDriver") {
      "new South African rideshare driver (Uber, Bolt, or InDrive) who has fewer than 100 trips"
    } else if (segment.archetype == "PowerEarner") {
      "high-earning South African rideshare driver with 200+ trips per month"
    } else {
      "South African rideshare driver"
    };

    let angleInstruction = switch (angle) {
      case (#earnings_proof) {
        "Lead with a concrete earning improvement stat. Example: 'Drivers using MoneyDrive earn R2,400 more per month on average.'"
      };
      case (#feature_benefit) {
        "Lead with the most valuable feature for this driver. Example: 'MoneyDrive's in-car sales menu lets you sell water and Wi-Fi to passengers — drivers earn an extra R500-R800/month.'"
      };
      case (#referral_incentive) {
        "Lead with the R50 referral reward. Example: 'Earn R50 for every driver you refer to MoneyDrive — no limit.'"
      };
      case (#limited_time_offer) {
        "Lead with the 14-day free trial. Example: '14 days free — no card needed. Start earning more with MoneyDrive today.'"
      };
    };

    "You are Nduna, MoneyDrive's SA-localised marketing AI. Write a short, direct marketing message for a " # archetypeDesc # ".\n\n" #
    "MINTO PYRAMID RULE: Answer first. Give the benefit in the first sentence. Then one proof point. Then one CTA.\n\n" #
    "MESSAGE ANGLE: " # angleInstruction # "\n\n" #
    "TARGET PLATFORM: " # (if (segment.platform == "All") { "Uber, Bolt, and InDrive drivers" } else { segment.platform # " drivers" }) # "\n" #
    "TARGET CITY: " # (if (segment.city == "All") { "South Africa" } else { segment.city }) # "\n\n" #
    "FORMAT: Return a JSON object with exactly these three fields:\n" #
    "{\"subjectLine\": \"<email subject or WhatsApp opener, max 10 words>\", " #
    "\"hook\": \"<first sentence — the answer — max 20 words>\", " #
    "\"body\": \"<proof point + CTA, 2-3 sentences, plain SA English, no jargon>\"}\n\n" #
    "Use ZAR (R) currency. Write in a direct, warm, street-smart SA tone. No emojis. No markdown. JSON only.";
  };

  /// Parse a JSON response from the LLM into (subjectLine, hook, body).
  /// Falls back to sensible defaults if parsing fails.
  private func parseCopyResponse(json : Text) : (Text, Text, Text) {
    let subjectLine = extractJsonField(json, "subjectLine");
    let hook        = extractJsonField(json, "hook");
    let body        = extractJsonField(json, "body");
    (subjectLine, hook, body);
  };

  /// Extract a JSON string field value (simple scanner, no library dependency).
  private func extractJsonField(json : Text, fieldName : Text) : Text {
    let needle = "\"" # fieldName # "\":\"";
    switch (AgentLib.splitOnFirst(json, needle)) {
      case (null) {
        // Try with space after colon
        let needle2 = "\"" # fieldName # "\": \"";
        switch (AgentLib.splitOnFirst(json, needle2)) {
          case (null) { "" };
          case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
        };
      };
      case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
    };
  };

  /// Generate creative copy for a campaign via LLM call.
  /// Returns (subjectLine, hook, body).
  /// Calls GatewayRouter → OpenRouter (or fallback). is_replicated = ?false.
  public func generateCreativeCopy(
    segment  : CampaignTypes.DriverSegment,
    angle    : CampaignTypes.MessageAngle,
    apiKey   : Text,
    apiUrl   : Text,
    model    : Text,
    gatewayUrl : ?Text,
    gatewayKey : ?Text,
  ) : async* (Text, Text, Text) {
    let prompt = buildCopyPrompt(segment, angle);

    let messagesJson =
      "[{\"role\":\"system\",\"content\":\"You are Nduna, MoneyDrive's marketing AI. Return only valid JSON.\"}," #
      "{\"role\":\"user\",\"content\":\"" # AgentLib.escapeJson(prompt) # "\"}]";

    let requestBody =
      "{\"model\":\"" # model # "\",\"messages\":" # messagesJson #
      ",\"max_tokens\":300,\"temperature\":0.7}";

    let routeDecision = GatewayRouter.resolveOpenRouterRoute(gatewayUrl, gatewayKey, apiUrl, apiKey);
    let (resolvedUrl, resolvedKey) = switch (routeDecision) {
      case (#gateway(cfg)) { (GatewayRouter.buildOpenRouterGatewayUrl(cfg.url), cfg.apiKey) };
      case (#direct(cfg))  { (cfg.url, cfg.apiKey) };
    };

    let httpReq : IC.http_request_args = {
      url               = resolvedUrl;
      max_response_bytes = ?10_000;
      headers           = [
        { name = "Content-Type";  value = "application/json"     },
        { name = "Authorization"; value = "Bearer " # resolvedKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0"       },
      ];
      body          = ?requestBody.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let result = try {
      await (with cycles = 50_000_000) IC.http_request(httpReq);
    } catch (_) {
      return defaultCopy(angle);
    };

    if (result.status < 200 or result.status >= 300) {
      return defaultCopy(angle);
    };

    switch (result.body.decodeUtf8()) {
      case (null)  { defaultCopy(angle) };
      case (?raw) {
        // Extract content field from OpenRouter response
        let content = switch (AgentLib.splitOnFirst(raw, "\"content\":\"")) {
          case (null) { raw };
          case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
        };
        let (s, h, b) = parseCopyResponse(content);
        // Fallback to defaults if any field is empty
        let subjectLine = if (s == "") { defaultSubjectLine(angle) } else { s };
        let hook        = if (h == "") { defaultHook(angle)        } else { h };
        let body        = if (b == "") { defaultBody(angle)        } else { b };
        (subjectLine, hook, body);
      };
    };
  };

  // ─── Default copy fallbacks ───────────────────────────────────────────────────

  private func defaultCopy(angle : CampaignTypes.MessageAngle) : (Text, Text, Text) {
    (defaultSubjectLine(angle), defaultHook(angle), defaultBody(angle));
  };

  private func defaultSubjectLine(angle : CampaignTypes.MessageAngle) : Text {
    switch (angle) {
      case (#earnings_proof)     { "Earn R2,400 more per month — here's how" };
      case (#feature_benefit)    { "Sell to your passengers — R500/month extra" };
      case (#referral_incentive) { "Earn R50 for every driver you refer" };
      case (#limited_time_offer) { "14 days free — start earning more today" };
    };
  };

  private func defaultHook(angle : CampaignTypes.MessageAngle) : Text {
    switch (angle) {
      case (#earnings_proof)     { "MoneyDrive drivers earn R2,400 more per month on average." };
      case (#feature_benefit)    { "Sell water, Wi-Fi, and mints to your passengers and earn R500-R800 extra per month." };
      case (#referral_incentive) { "Refer a driver to MoneyDrive and earn R50 — no limit on how many you refer." };
      case (#limited_time_offer) { "Try MoneyDrive free for 14 days — no card needed." };
    };
  };

  private func defaultBody(angle : CampaignTypes.MessageAngle) : Text {
    switch (angle) {
      case (#earnings_proof) {
        "Our top drivers use surge windows, in-car sales, and advertising deals to add R2,400 to their monthly income. " #
        "MoneyDrive shows you exactly when and where to drive for maximum earnings. " #
        "Sign up today and start earning smarter: moneydriver-2oj.caffeine.xyz";
      };
      case (#feature_benefit) {
        "The in-car sales menu lets passengers scan a QR code and buy products directly from you. " #
        "Payments go straight to your SnapScan — no middlemen, no delays. " #
        "Set up in 5 minutes: moneydriver-2oj.caffeine.xyz";
      };
      case (#referral_incentive) {
        "Every driver you refer who signs up earns you R50, applied to your next subscription. " #
        "Share your referral link from your profile page — it takes 30 seconds. " #
        "Start referring: moneydriver-2oj.caffeine.xyz";
      };
      case (#limited_time_offer) {
        "Tier 1 gives you Nduna's AI coaching, surge windows, and the earnings tracker — all free for 14 days. " #
        "No card required. Cancel anytime. " #
        "Start your trial: moneydriver-2oj.caffeine.xyz";
      };
    };
  };

  // ─── Campaign plan assembly ───────────────────────────────────────────────────

  /// Plan a new campaign draft using driver analytics to select segment and angle.
  /// Does NOT publish — returns a #draft campaign for admin review.
  public func planCampaign(
    profiles     : [AgentTypes.DriverAnalyticsProfile],
    failureLogs  : [CampaignTypes.CampaignFailureLog],
    apiKey       : Text,
    apiUrl       : Text,
    model        : Text,
    gatewayUrl   : ?Text,
    gatewayKey   : ?Text,
    idCounter    : Nat,
  ) : async* CampaignTypes.Campaign {
    let now       = Time.now();
    let segment   = selectSegment(profiles);
    let angle     = selectAngle(failureLogs);
    let channel   : CampaignTypes.CampaignChannel = #whatsapp; // default; admin can change
    let campaignId = makeCampaignId(now, idCounter);
    let utm        = buildTrackingUtm(campaignId, channel);

    let (subjectLine, hook, body) = await* generateCreativeCopy(
      segment, angle, apiKey, apiUrl, model, gatewayUrl, gatewayKey,
    );

    let creative : CampaignTypes.CampaignCreative = {
      copySubjectLine = subjectLine;
      copyHook        = hook;
      copyBody        = body;
      imageUrl        = "";
      videoUrl        = null;
      videoJobId      = null;
    };

    {
      id              = campaignId;
      status          = #pending_approval;
      segment;
      channel;
      angle;
      creative        = ?creative;
      createdAt       = now;
      approvedAt      = null;
      publishedAt     = null;
      adminNotes      = null;
      rejectionReason = null;
      trackingUtm     = utm;
      isAbTest        = false;
      abVariantId     = null;
      abWinner        = null;
    };
  };
};
