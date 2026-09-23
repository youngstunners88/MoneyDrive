import Text  "mo:core/Text";
import List  "mo:core/List";
import Time  "mo:core/Time";
import Nat   "mo:core/Nat";
import Int   "mo:core/Int";
import Map   "mo:core/Map";
import IC    "ic:aaaaa-aa";
import CampaignTypes "../types/campaign";
import AgentLib      "../lib/agent";
import AnalyticsLog  "../lib/analytics-log";

/// Campaign publishing logic.
/// Stateless — all state (driver maps, analytics, WhatsApp config) is injected.
/// Sends via 360dialog (WhatsApp) and/or AgentMail (email).
module {

  // ─── UTM append helper ─────────────────────────────────────────────────────────

  /// Append the campaign UTM to a URL if the URL contains a '?'.
  private func _appendUtm(url : Text, utm : Text) : Text {
    if (url.contains(#text "?")) {
      url # "&" # utm;
    } else {
      url # "?" # utm;
    };
  };

  // ─── 360dialog WhatsApp send ───────────────────────────────────────────────────

  /// POST a single WhatsApp message via the 360dialog API.
  /// Returns #ok(messageId) or #err(reason).
  private func send360dialog(
    apiKey  : Text,
    toPhone : Text,
    body    : Text,
  ) : async* { #ok : Text; #err : Text } {
    let requestBody =
      "{\"messaging_product\":\"whatsapp\"," #
      "\"to\":\"" # AgentLib.escapeJson(toPhone) # "\"," #
      "\"type\":\"text\"," #
      "\"text\":{\"body\":\"" # AgentLib.escapeJson(body) # "\"}}";

    let req : IC.http_request_args = {
      url               = "https://waba.360dialog.io/v1/messages";
      max_response_bytes = ?10_000;
      headers           = [
        { name = "Content-Type"; value = "application/json"  },
        { name = "D360-API-KEY"; value = apiKey              },
        { name = "User-Agent";   value = "MoneyDrive/1.0"    },
      ];
      body          = ?requestBody.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let result = try {
      await (with cycles = 50_000_000) IC.http_request(req);
    } catch (e) {
      return #err("360dialog exception: " # e.message());
    };

    if (result.status == 200 or result.status == 201) {
      #ok("sent");
    } else {
      let errBody = switch (result.body.decodeUtf8()) {
        case (null) { "HTTP " # result.status.toText() };
        case (?t)   { t };
      };
      #err("360dialog error " # result.status.toText() # ": " # errBody);
    };
  };

  // ─── AgentMail email send ──────────────────────────────────────────────────────

  /// POST a campaign email via the AgentMail API.
  private func sendAgentMailCampaign(
    agentMailKey : Text,
    inboxId      : Text,
    toEmail      : Text,
    subject      : Text,
    textBody     : Text,
  ) : async* { #ok; #err : Text } {
    let bodyJson =
      "{\"to\":[\"" # AgentLib.escapeJson(toEmail) # "\"]," #
      "\"subject\":\"" # AgentLib.escapeJson(subject) # "\"," #
      "\"text\":\"" # AgentLib.escapeJson(textBody) # "\"}";

    let req : IC.http_request_args = {
      url               = "https://api.agentmail.to/v0/inboxes/" # inboxId # "/messages";
      max_response_bytes = ?10_000;
      headers           = [
        { name = "Authorization"; value = "Bearer " # agentMailKey },
        { name = "Content-Type";  value = "application/json"       },
        { name = "User-Agent";    value = "MoneyDrive/1.0"         },
      ];
      body          = ?bodyJson.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let result = try {
      await (with cycles = 50_000_000) IC.http_request(req);
    } catch (e) {
      return #err("AgentMail exception: " # e.message());
    };

    if (result.status >= 200 and result.status < 300) {
      #ok;
    } else {
      let errBody = switch (result.body.decodeUtf8()) {
        case (null) { "HTTP " # result.status.toText() };
        case (?t)   { t };
      };
      #err("AgentMail error " # result.status.toText() # ": " # errBody);
    };
  };

  // ─── Message body builder ──────────────────────────────────────────────────────

  /// Build the full message body from campaign creative with UTM appended.
  public func buildMessageBody(campaign : CampaignTypes.Campaign) : Text {
    switch (campaign.creative) {
      case (null) {
        "MoneyDrive — earn more from every trip. Visit: https://moneydriver-2oj.caffeine.xyz?" # campaign.trackingUtm;
      };
      case (?c) {
        c.copyHook # "\n\n" # c.copyBody # "\n\nhttps://moneydriver-2oj.caffeine.xyz?" # campaign.trackingUtm;
      };
    };
  };

  // ─── A/B split helper ──────────────────────────────────────────────────────────

  /// Deterministic 50/50 split of a driver ID for A/B testing.
  /// Returns true for variant A, false for variant B.
  public func isVariantA(driverId : Text) : Bool {
    // Simple hash: sum char codes mod 2
    var sum : Nat = 0;
    for (c in driverId.toIter()) {
      sum := sum + Nat.fromNat32(c.toNat32());
    };
    sum % 2 == 0;
  };

  // ─── Core publish functions ────────────────────────────────────────────────────

  /// Publish a campaign to the given phone numbers (WhatsApp channel).
  /// Returns { sent; failed }.
  public func publishViaWhatsApp(
    campaign     : CampaignTypes.Campaign,
    phoneNumbers : [Text],
    whatsAppKey  : Text,
    analyticsLog : AnalyticsLog.State,
  ) : async* { sent : Nat; failed : Nat } {
    var sent   = 0;
    var failed = 0;
    let body   = buildMessageBody(campaign);

    for (phone in phoneNumbers.values()) {
      let result = await* send360dialog(whatsAppKey, phone, body);
      switch (result) {
        case (#ok(_)) {
          sent += 1;
          AnalyticsLog.logEvent(
            analyticsLog, "campaign", "whatsapp_sent",
            campaign.id, null, true, null,
            "{\"phone\":\"" # AgentLib.escapeJson(phone) # "\",\"campaignId\":\"" # campaign.id # "\"}",
            null,
          );
        };
        case (#err(e)) {
          failed += 1;
          AnalyticsLog.logEvent(
            analyticsLog, "campaign", "whatsapp_failed",
            campaign.id, null, false, ?e,
            "{\"campaignId\":\"" # campaign.id # "\"}",
            null,
          );
        };
      };
    };
    { sent; failed };
  };

  /// Publish a campaign via AgentMail email to a list of email addresses.
  /// Returns { sent; failed }.
  public func publishViaEmail(
    campaign      : CampaignTypes.Campaign,
    emails        : [Text],
    agentMailKey  : Text,
    agentMailInbox : Text,
    analyticsLog  : AnalyticsLog.State,
  ) : async* { sent : Nat; failed : Nat } {
    var sent   = 0;
    var failed = 0;

    let subject = switch (campaign.creative) {
      case (null) { "MoneyDrive — Earn More From Every Trip" };
      case (?c)   { c.copySubjectLine };
    };
    let body = buildMessageBody(campaign);

    for (email in emails.values()) {
      let result = await* sendAgentMailCampaign(
        agentMailKey, agentMailInbox, email, subject, body,
      );
      switch (result) {
        case (#ok) {
          sent += 1;
          AnalyticsLog.logEvent(
            analyticsLog, "campaign", "email_sent",
            campaign.id, null, true, null,
            "{\"campaignId\":\"" # campaign.id # "\"}",
            null,
          );
        };
        case (#err(e)) {
          failed += 1;
          AnalyticsLog.logEvent(
            analyticsLog, "campaign", "email_failed",
            campaign.id, null, false, ?e,
            "{\"campaignId\":\"" # campaign.id # "\"}",
            null,
          );
        };
      };
    };
    { sent; failed };
  };

  /// Schedule and execute an A/B test across two variants.
  /// Splits the phone list 50/50 by deterministic hash of driverId.
  /// Returns { sent; failed } for the combined run.
  public func scheduleAbTest(
    variantA     : CampaignTypes.Campaign,
    variantB     : CampaignTypes.Campaign,
    phoneNumbers : [(Text, Text)],  // [(driverId, phone)]
    whatsAppKey  : Text,
    analyticsLog : AnalyticsLog.State,
  ) : async* { sent : Nat; failed : Nat } {
    let aPhones = phoneNumbers.filter(func(pair : (Text, Text)) : Bool { let (did, _p) = pair;  isVariantA(did) }).map(func(pair : (Text, Text)) : Text { let (_did, p) = pair; p });
    let bPhones = phoneNumbers.filter(func(pair : (Text, Text)) : Bool { let (did, _p) = pair; not isVariantA(did) }).map(func(pair : (Text, Text)) : Text { let (_did, p) = pair; p });

    let aResult = await* publishViaWhatsApp(variantA, aPhones, whatsAppKey, analyticsLog);
    let bResult = await* publishViaWhatsApp(variantB, bPhones, whatsAppKey, analyticsLog);

    {
      sent   = aResult.sent   + bResult.sent;
      failed = aResult.failed + bResult.failed;
    };
  };
};
