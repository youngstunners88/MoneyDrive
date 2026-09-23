import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import AMTypes "../types/agentmail";
import IC "ic:aaaaa-aa";

/// Nduna's email identity and automation layer via AgentMail REST API.
/// Nduna (he/him) sends pitch emails, onboarding sequences, weekly briefings,
/// lead follow-ups, and website delivery emails on behalf of MoneyDrive drivers.
/// All credentials stored only in backend state — never returned to the frontend.
mixin (
  accessControlState   : AccessControl.AccessControlState,
  /// Mutable config wrapper — API key + inbox ID + feature toggles
  agentMailConfigStore : { var value : AMTypes.AgentMailConfig },
  /// All email log entries keyed by log ID
  emailLogs            : Map.Map<Text, AMTypes.EmailLog>,
  /// Per-driver index: driverId (Text) → List of log IDs
  driverEmailLogs      : Map.Map<Text, List.List<Text>>,
  /// Cached list of messages from Nduna's inbox (refreshed on demand)
  ndunaInboxMessages   : { var value : [AMTypes.NdunaEmail] },
) {

  // ─── Private helpers ────────────────────────────────────────────────────────

  /// POST to AgentMail REST API with a JSON body.
  /// Returns #ok(responseText) or #err(errorMessage).
  private func agentMailPost(path : Text, bodyJson : Text) : async { #ok : Text; #err : Text } {
    let apiKey = agentMailConfigStore.value.apiKey;
    if (apiKey == "") {
      return #err("AgentMail API key not configured");
    };
    let req : IC.http_request_args = {
      url               = "https://api.agentmail.to/v0" # path;
      max_response_bytes = ?100_000;
      headers           = [
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "Content-Type";  value = "application/json" },
        { name = "Accept";        value = "application/json" },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body              = ?bodyJson.encodeUtf8();
      method            = #post;
      transform         = null;
      is_replicated     = ?false;
    };
    let resp = await (with cycles = 50_000_000_000) IC.http_request(req);
    switch (resp.body.decodeUtf8()) {
      case (null)  { #err("Failed to decode AgentMail response") };
      case (?text) {
        if (resp.status >= 200 and resp.status < 300) { #ok(text) }
        else { #err("AgentMail error " # resp.status.toText() # ": " # text) };
      };
    };
  };

  /// GET from AgentMail REST API.
  /// Returns #ok(responseText) or #err(errorMessage).
  private func agentMailGet(path : Text) : async { #ok : Text; #err : Text } {
    let apiKey = agentMailConfigStore.value.apiKey;
    if (apiKey == "") {
      return #err("AgentMail API key not configured");
    };
    let req : IC.http_request_args = {
      url               = "https://api.agentmail.to/v0" # path;
      max_response_bytes = ?200_000;
      headers           = [
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "Accept";        value = "application/json" },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body              = null;
      method            = #get;
      transform         = null;
      is_replicated     = ?false;
    };
    let resp = await (with cycles = 50_000_000_000) IC.http_request(req);
    switch (resp.body.decodeUtf8()) {
      case (null)  { #err("Failed to decode AgentMail response") };
      case (?text) {
        if (resp.status >= 200 and resp.status < 300) { #ok(text) }
        else { #err("AgentMail error " # resp.status.toText() # ": " # text) };
      };
    };
  };

  /// Extract a JSON string field value using simple text search.
  /// Looks for: "fieldName":"value" pattern in the response JSON.
  private func amExtractJsonField(json : Text, fieldName : Text) : ?Text {
    let needle = "\"" # fieldName # "\":\"";
    let parts  = json.split(#text(needle));
    let arr    = parts.toArray();
    if (arr.size() < 2) { return null };
    let afterField = arr[1];
    let valueParts = afterField.split(#text("\""));
    let valueArr   = valueParts.toArray();
    if (valueArr.size() == 0) { return null };
    ?valueArr[0];
  };

  /// Escape a text value for safe embedding in a JSON string.
  private func escapeJson(s : Text) : Text {
    var result = "";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if      (code == 34) { result := result # "\\\"" }
      else if (code == 92) { result := result # "\\\\" }
      else if (code == 10) { result := result # "\\n"  }
      else if (code == 13) { result := result # "\\r"  }
      else if (code == 9)  { result := result # "\\t"  }
      else                 { result := result # Text.fromChar(c) };
    };
    result;
  };

  /// Generate a simple log ID from current timestamp + suffix.
  private func makeLogId(suffix : Text) : Text {
    Time.now().toText() # "_" # suffix;
  };

  /// Append an EmailLog entry for the given driver.
  private func appendLog(log : AMTypes.EmailLog) {
    emailLogs.add(log.id, log);
    let existing = switch (driverEmailLogs.get(log.driverId)) {
      case (null) { List.empty<Text>() };
      case (?l)   { l };
    };
    existing.add(log.id);
    driverEmailLogs.add(log.driverId, existing);
  };

  // ─── Branded HTML email builder ─────────────────────────────────────────────

  /// Build a full mobile-responsive HTML email with Nduna's branding.
  /// header: short title shown under the Nduna avatar.
  /// body: main content HTML inserted into the styled body panel.
  private func buildHtmlEmail(header : Text, body : Text) : Text {
    "<!DOCTYPE html>" #
    "<html lang=\"en\"><head><meta charset=\"UTF-8\">" #
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" #
    "<title>" # escapeJson(header) # "</title></head>" #
    "<body style=\"margin:0;padding:0;background:#0d1929;font-family:Arial,sans-serif;\">" #
    "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">" #
    "<tr><td align=\"center\" style=\"padding:20px 10px;\">" #
    "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" " #
    "style=\"max-width:600px;width:100%;\">" #
    "<tr><td style=\"background:#D55C2E;border-radius:12px 12px 0 0;" #
    "padding:24px 32px;text-align:center;\">" #
    "<img src=\"https://i.imgur.com/u98U7S6.png\" alt=\"Nduna\" width=\"64\" height=\"64\" " #
    "style=\"border-radius:50%;border:3px solid #fff;margin:0 auto 12px;display:block;\">" #
    "<h1 style=\"color:#fff;margin:0;font-size:22px;font-weight:700;\">" #
    escapeJson(header) # "</h1>" #
    "<p style=\"color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;\">" #
    "Nduna from MoneyDrive</p>" #
    "</td></tr>" #
    "<tr><td style=\"background:#1a2a4a;padding:32px;color:#fff;" #
    "font-size:15px;line-height:1.6;\">" #
    body #
    "</td></tr>" #
    "<tr><td style=\"background:#0d1929;border-radius:0 0 12px 12px;" #
    "padding:20px 32px;text-align:center;\">" #
    "<p style=\"color:#CFA537;margin:0;font-size:12px;font-weight:600;\">" #
    "Nduna | MoneyDrive</p>" #
    "<p style=\"color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:11px;\">" #
    "Making SA Drivers Wealthier | " #
    "<a href=\"https://moneydriver-2oj.caffeine.xyz\" style=\"color:#CFA537;\">" #
    "moneydriver-2oj.caffeine.xyz</a></p>" #
    "</td></tr>" #
    "</table></td></tr></table></body></html>";
  };

  // ─── Admin: configuration ────────────────────────────────────────────────────

  /// Admin-only: store the AgentMail API key securely in canister state.
  public shared ({ caller }) func setAgentMailApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the AgentMail API key");
    };
    agentMailConfigStore.value := { agentMailConfigStore.value with apiKey = key };
  };

  /// Admin-only: provision Nduna's inbox via POST /v0/inboxes.
  /// Returns the provisioned inbox email address.
  public shared ({ caller }) func provisionNdunaInbox() : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can provision the Nduna inbox");
    };
    let result = await agentMailPost("/inboxes", "{\"username\":\"nduna\"}");
    switch (result) {
      case (#err(e)) { #err(e) };
      case (#ok(json)) {
        // Try "email" field first (provisioned address), then "inbox_id"
        switch (amExtractJsonField(json, "email")) {
          case (?email) {
            agentMailConfigStore.value := { agentMailConfigStore.value with ndunaInboxId = ?(email) };
            #ok(email);
          };
          case (null) {
            switch (amExtractJsonField(json, "inbox_id")) {
              case (?inboxId) {
                agentMailConfigStore.value := { agentMailConfigStore.value with ndunaInboxId = ?(inboxId) };
                #ok(inboxId);
              };
              case (null) { #err("Could not parse inbox ID from response: " # json) };
            };
          };
        };
      };
    };
  };

  /// Admin-only: return the provisioned Nduna inbox ID.
  public query ({ caller }) func getNdunaInboxId() : async ?Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view the Nduna inbox ID");
    };
    agentMailConfigStore.value.ndunaInboxId;
  };

  /// Admin-only: enable or disable automated onboarding emails.
  public shared ({ caller }) func setOnboardingEmailEnabled(enabled : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can change email settings");
    };
    agentMailConfigStore.value := { agentMailConfigStore.value with onboardingEmailEnabled = enabled };
  };

  /// Admin-only: enable or disable weekly briefing emails.
  public shared ({ caller }) func setWeeklyBriefingEmailEnabled(enabled : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can change email settings");
    };
    agentMailConfigStore.value := { agentMailConfigStore.value with weeklyBriefingEmailEnabled = enabled };
  };

  /// Admin-only: enable or disable lead follow-up emails.
  public shared ({ caller }) func setLeadFollowupEmailEnabled(enabled : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can change email settings");
    };
    agentMailConfigStore.value := { agentMailConfigStore.value with leadFollowupEmailEnabled = enabled };
  };

  /// Admin-only: return current email config with API key masked as "***".
  public query ({ caller }) func getEmailConfig() : async AMTypes.AgentMailConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view email config");
    };
    { agentMailConfigStore.value with apiKey = "***" };
  };

  // ─── Driver: email sending ───────────────────────────────────────────────────

  /// Send a professional pitch email to a company on behalf of the calling driver.
  public shared ({ caller }) func sendPitchEmail(
    companyEmail  : Text,
    companyName   : Text,
    pitchContent  : Text,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to send pitch emails");
    };
    let inboxId = switch (agentMailConfigStore.value.ndunaInboxId) {
      case (null) { return #err("Nduna inbox not yet provisioned — ask your admin to provision it first") };
      case (?id)  { id };
    };
    let driverId = caller.toText();
    let subject  = "Partnership Opportunity from MoneyDrive | " # companyName;
    let bodyHtml = buildHtmlEmail(
      "Partnership Opportunity",
      "<p>Hi " # escapeJson(companyName) # " Team,</p>" #
      "<p>" # escapeJson(pitchContent) # "</p>" #
      "<p style=\"margin-top:24px;\">Best regards,<br>" #
      "<strong style=\"color:#CFA537;\">Nduna</strong><br>" #
      "<em>Your MoneyDrive Earnings Coach</em></p>",
    );
    let bodyJson =
      "{\"to\":[\"" # escapeJson(companyEmail) # "\"]," #
      "\"subject\":\"" # escapeJson(subject) # "\"," #
      "\"text\":\"" # escapeJson(pitchContent) # "\"," #
      "\"html\":\"" # escapeJson(bodyHtml) # "\"}";
    let logId  = makeLogId("pitch_" # driverId);
    let result = await agentMailPost("/inboxes/" # inboxId # "/messages", bodyJson);
    let (status, errMsg) = switch (result) {
      case (#ok(_))  { ("sent",   null)  };
      case (#err(e)) { ("failed", ?(e)) };
    };
    appendLog({
      id        = logId;
      driverId  = driverId;
      emailType = "pitch";
      recipient = companyEmail;
      subject   = subject;
      sentAt    = Time.now();
      status    = status;
      errorMsg  = errMsg;
    });
    switch (result) {
      case (#ok(_))  { #ok(()) };
      case (#err(e)) { #err(e) };
    };
  };

  /// Send a driver's built website as an email delivery notification.
  public shared ({ caller }) func sendWebsiteByEmail(
    jobId       : Text,
    websiteHtml : Text,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let inboxId = switch (agentMailConfigStore.value.ndunaInboxId) {
      case (null) { return #err("Nduna inbox not yet provisioned") };
      case (?id)  { id };
    };
    let driverId = caller.toText();
    let subject  = "Your Driver Website is Ready — From Nduna";
    let bodyHtml = buildHtmlEmail(
      "Your Website is Ready!",
      "<p>Hi Driver,</p>" #
      "<p>Your driver website has been built and is ready to use. " #
      "Share it with passengers and businesses to attract advertising deals.</p>" #
      "<p style=\"margin-top:16px;\"><strong style=\"color:#CFA537;\">Job ID:</strong> " #
      escapeJson(jobId) # "</p>" #
      "<p>— Nduna, your MoneyDrive earnings coach</p>",
    );
    // websiteHtml is referenced to satisfy the parameter but we only embed job reference
    // (full HTML would exceed message size limits — the URL/job ID is the delivery mechanism)
    let _ignored = websiteHtml.size();
    let bodyJson =
      "{\"subject\":\"" # escapeJson(subject) # "\"," #
      "\"text\":\"Your driver website (job " # escapeJson(jobId) # ") is ready.\"," #
      "\"html\":\"" # escapeJson(bodyHtml) # "\"}";
    let logId  = makeLogId("website_" # driverId);
    let result = await agentMailPost("/inboxes/" # inboxId # "/messages", bodyJson);
    let (status, errMsg) = switch (result) {
      case (#ok(_))  { ("sent",   null)  };
      case (#err(e)) { ("failed", ?(e)) };
    };
    appendLog({
      id        = logId;
      driverId  = driverId;
      emailType = "website_delivery";
      recipient = inboxId;
      subject   = subject;
      sentAt    = Time.now();
      status    = status;
      errorMsg  = errMsg;
    });
    switch (result) {
      case (#ok(_))  { #ok(()) };
      case (#err(e)) { #err(e) };
    };
  };

  /// Send a personalised weekly earnings briefing email to a driver.
  public shared ({ caller }) func sendWeeklyBriefingEmail(
    driverEmail     : Text,
    briefingContent : Text,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (not agentMailConfigStore.value.weeklyBriefingEmailEnabled) {
      return #err("Weekly briefing emails are currently disabled");
    };
    let inboxId = switch (agentMailConfigStore.value.ndunaInboxId) {
      case (null) { return #err("Nduna inbox not yet provisioned") };
      case (?id)  { id };
    };
    let driverId = caller.toText();
    let subject  = "Your Weekly MoneyDrive Briefing from Nduna";
    let bodyHtml = buildHtmlEmail(
      "Your Weekly Briefing",
      "<p>Hey Driver,</p>" #
      "<p>Here's your personalised earnings briefing for the week:</p>" #
      "<div style=\"background:#0d1929;border-left:4px solid #CFA537;" #
      "padding:16px;border-radius:4px;margin:16px 0;\">" #
      "<p style=\"margin:0;\">" # escapeJson(briefingContent) # "</p>" #
      "</div>" #
      "<p>Keep pushing — every trip is one step closer to your goal.</p>" #
      "<p>— Nduna</p>",
    );
    let bodyJson =
      "{\"to\":[\"" # escapeJson(driverEmail) # "\"]," #
      "\"subject\":\"" # escapeJson(subject) # "\"," #
      "\"text\":\"" # escapeJson(briefingContent) # "\"," #
      "\"html\":\"" # escapeJson(bodyHtml) # "\"}";
    let logId  = makeLogId("briefing_" # driverId);
    let result = await agentMailPost("/inboxes/" # inboxId # "/messages", bodyJson);
    let (status, errMsg) = switch (result) {
      case (#ok(_))  { ("sent",   null)  };
      case (#err(e)) { ("failed", ?(e)) };
    };
    appendLog({
      id        = logId;
      driverId  = driverId;
      emailType = "briefing";
      recipient = driverEmail;
      subject   = subject;
      sentAt    = Time.now();
      status    = status;
      errorMsg  = errMsg;
    });
    switch (result) {
      case (#ok(_))  { #ok(()) };
      case (#err(e)) { #err(e) };
    };
  };

  /// Send an automated onboarding email on day 1, 3, or 7 of a driver's journey.
  public shared ({ caller }) func sendOnboardingEmail(
    driverEmail : Text,
    dayNumber   : Nat,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (not agentMailConfigStore.value.onboardingEmailEnabled) {
      return #err("Onboarding emails are currently disabled");
    };
    let inboxId = switch (agentMailConfigStore.value.ndunaInboxId) {
      case (null) { return #err("Nduna inbox not yet provisioned") };
      case (?id)  { id };
    };
    let driverId = caller.toText();
    let (subject, emailBody) = if (dayNumber == 1) {
      (
        "Welcome to MoneyDrive — Let's Get You Earning More",
        "<p>Hey Driver,</p>" #
        "<p>Welcome to <strong>MoneyDrive</strong> — I'm Nduna, your personal earnings coach. " #
        "I'm here to help you make more money, land advertising deals, and build real income streams.</p>" #
        "<h2 style=\"color:#CFA537;\">First up: Set Up Your SnapScan</h2>" #
        "<p>Your SnapScan merchant ID unlocks the in-car sales system — sell water, Wi-Fi, " #
        "mints, and more directly to passengers.</p>" #
        "<ol style=\"padding-left:20px;\">" #
        "<li>Visit <a href=\"https://merchant.getsnapscan.com\" style=\"color:#CFA537;\">" #
        "merchant.getsnapscan.com</a> to create your account</li>" #
        "<li>Find your <strong>SnapCode</strong> (it's in the email SnapScan sends you)</li>" #
        "<li>Add it to your MoneyDrive profile under Payment Settings</li>" #
        "</ol>" #
        "<p>Your QR menu will be live for passengers to scan immediately.</p>" #
        "<p>Any questions — just ask me inside the app. I'm here 24/7.</p>" #
        "<p>— Nduna</p>",
      )
    } else if (dayNumber == 3) {
      (
        "Here's How to Land Your First Advertising Deal",
        "<p>Hey Driver,</p>" #
        "<p>Three days in — you're doing great. Now let's talk about the biggest income opportunity: " #
        "<strong style=\"color:#CFA537;\">advertising deals</strong>.</p>" #
        "<ol style=\"padding-left:20px;\">" #
        "<li>Go to the <strong>Leads</strong> section — I've already found companies near you</li>" #
        "<li>Use the <strong>Pitch Deck Generator</strong> to build your proposal</li>" #
        "<li>Send the pitch email directly from the app with one click</li>" #
        "<li>I'll remind you to follow up in 3, 7, and 14 days automatically</li>" #
        "</ol>" #
        "<p>The average driver lands their first deal within 2 weeks of sending 5 pitches.</p>" #
        "<p>Go get that first deal.</p>" #
        "<p>— Nduna</p>",
      )
    } else {
      (
        "Your First Week Check-In + Top Earning Tips from Nduna",
        "<p>Hey Driver,</p>" #
        "<p>One week with MoneyDrive — let's look at what's working.</p>" #
        "<h2 style=\"color:#CFA537;\">Top Tips from Nduna for Week Two</h2>" #
        "<ul style=\"padding-left:20px;\">" #
        "<li><strong>Log every trip</strong> — your earnings intelligence only works with complete data</li>" #
        "<li><strong>Peak hours</strong> — Friday and Saturday nights earn 40% more per hour</li>" #
        "<li><strong>In-car products</strong> — drivers with 3+ products earn an extra R200–600/month</li>" #
        "<li><strong>Follow up on pitches</strong> — 80% of deals close on the 2nd or 3rd contact</li>" #
        "</ul>" #
        "<p>Keep going — you're building something real.</p>" #
        "<p>— Nduna</p>",
      )
    };
    let bodyHtml = buildHtmlEmail(subject, emailBody);
    let bodyJson =
      "{\"to\":[\"" # escapeJson(driverEmail) # "\"]," #
      "\"subject\":\"" # escapeJson(subject) # "\"," #
      "\"text\":\"" # escapeJson(emailBody) # "\"," #
      "\"html\":\"" # escapeJson(bodyHtml) # "\"}";
    let logId  = makeLogId("onboarding_" # dayNumber.toText() # "_" # driverId);
    let result = await agentMailPost("/inboxes/" # inboxId # "/messages", bodyJson);
    let (status, errMsg) = switch (result) {
      case (#ok(_))  { ("sent",   null)  };
      case (#err(e)) { ("failed", ?(e)) };
    };
    appendLog({
      id        = logId;
      driverId  = driverId;
      emailType = "onboarding";
      recipient = driverEmail;
      subject   = subject;
      sentAt    = Time.now();
      status    = status;
      errorMsg  = errMsg;
    });
    switch (result) {
      case (#ok(_))  { #ok(()) };
      case (#err(e)) { #err(e) };
    };
  };

  /// Send a follow-up email to a company after an initial pitch.
  /// Tone escalates: day 3 = polite, day 7 = concise value prop, day 14 = final.
  public shared ({ caller }) func sendLeadFollowupEmail(
    companyEmail : Text,
    companyName  : Text,
    driverName   : Text,
    followupDay  : Nat,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (not agentMailConfigStore.value.leadFollowupEmailEnabled) {
      return #err("Lead follow-up emails are currently disabled");
    };
    let inboxId = switch (agentMailConfigStore.value.ndunaInboxId) {
      case (null) { return #err("Nduna inbox not yet provisioned") };
      case (?id)  { id };
    };
    let driverId = caller.toText();
    let (subject, emailBody) = if (followupDay <= 3) {
      (
        "Following Up: Partnership Opportunity — " # companyName,
        "<p>Hi " # escapeJson(companyName) # " Team,</p>" #
        "<p>I wanted to follow up on the partnership proposal I sent from <strong>" #
        escapeJson(driverName) # "</strong> via MoneyDrive.</p>" #
        "<p>Placing your brand inside a rideshare vehicle reaches hundreds of commuters each week " #
        "with zero ad spend. Happy to answer questions or adjust the proposal.</p>" #
        "<p>Would a quick 10-minute call work this week?</p>" #
        "<p>— Nduna, MoneyDrive</p>",
      )
    } else if (followupDay <= 7) {
      (
        "Last Week's Proposal — Still Interested? | " # companyName,
        "<p>Hi " # escapeJson(companyName) # " Team,</p>" #
        "<p>I'll keep this short. <strong>" # escapeJson(driverName) # "</strong> drives routes " #
        "through your area daily — your brand in front of local commuters every day, " #
        "for less than the cost of one social post.</p>" #
        "<p>If now isn't right, just reply with a better month and we'll pick it up then.</p>" #
        "<p>— Nduna, MoneyDrive</p>",
      )
    } else {
      (
        "Final Note: " # companyName # " x MoneyDrive",
        "<p>Hi " # escapeJson(companyName) # " Team,</p>" #
        "<p>This is my last follow-up on the partnership proposal for <strong>" #
        escapeJson(driverName) # "</strong>.</p>" #
        "<p>The offer stands whenever the timing is right. Reply anytime and we'll pick it back up.</p>" #
        "<p>— Nduna, MoneyDrive</p>",
      )
    };
    let bodyHtml = buildHtmlEmail(subject, emailBody);
    let bodyJson =
      "{\"to\":[\"" # escapeJson(companyEmail) # "\"]," #
      "\"subject\":\"" # escapeJson(subject) # "\"," #
      "\"text\":\"" # escapeJson(emailBody) # "\"," #
      "\"html\":\"" # escapeJson(bodyHtml) # "\"}";
    let logId  = makeLogId("followup_" # followupDay.toText() # "_" # driverId);
    let result = await agentMailPost("/inboxes/" # inboxId # "/messages", bodyJson);
    let (status, errMsg) = switch (result) {
      case (#ok(_))  { ("sent",   null)  };
      case (#err(e)) { ("failed", ?(e)) };
    };
    appendLog({
      id        = logId;
      driverId  = driverId;
      emailType = "followup";
      recipient = companyEmail;
      subject   = subject;
      sentAt    = Time.now();
      status    = status;
      errorMsg  = errMsg;
    });
    switch (result) {
      case (#ok(_))  { #ok(()) };
      case (#err(e)) { #err(e) };
    };
  };

  // ─── Driver: log access ──────────────────────────────────────────────────────

  /// Return all email logs for the calling driver, newest first.
  public query ({ caller }) func getEmailLogs() : async [AMTypes.EmailLog] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    let logIds = switch (driverEmailLogs.get(driverId)) {
      case (null) { return [] };
      case (?ids) { ids };
    };
    let result = List.empty<AMTypes.EmailLog>();
    logIds.reverseForEach(func(logId) {
      switch (emailLogs.get(logId)) {
        case (null) {};
        case (?log) { result.add(log) };
      };
    });
    result.toArray();
  };

  // ─── Admin: inbox messages ────────────────────────────────────────────────────

  /// Admin-only: fetch messages from Nduna's provisioned inbox via GET /v0/inboxes/{id}/messages.
  public shared ({ caller }) func getNdunaInboxMessages() : async [AMTypes.NdunaEmail] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can read Nduna's inbox");
    };
    let inboxId = switch (agentMailConfigStore.value.ndunaInboxId) {
      case (null) { return [] };
      case (?id)  { id };
    };
    let result = await agentMailGet("/inboxes/" # inboxId # "/messages");
    switch (result) {
      case (#err(_)) { ndunaInboxMessages.value };
      case (#ok(json)) {
        // Parse each message by splitting on "message_id":"  occurrences
        let messages = List.empty<AMTypes.NdunaEmail>();
        let parts = json.split(#text("\"message_id\":\""));
        let arr   = parts.toArray();
        var i = 1; // skip index 0 (content before first message_id)
        while (i < arr.size()) {
          let segment = arr[i];
          // message_id value is the text before the next quote
          let idParts = segment.split(#text("\""));
          let idArr   = idParts.toArray();
          let msgId   = if (idArr.size() > 0) idArr[0] else "";
          let fromVal = switch (amExtractJsonField(segment, "from")) {
            case (?v) v;
            case null "";
          };
          let subjectVal = switch (amExtractJsonField(segment, "subject")) {
            case (?v) v;
            case null "(no subject)";
          };
          let previewVal = switch (amExtractJsonField(segment, "preview")) {
            case (?v) v;
            case null "";
          };
          let receivedAt : Int = switch (amExtractJsonField(segment, "received_at")) {
            case (null) { Time.now() };
            case (?ts) {
              switch (Int.fromText(ts)) {
                case (?n) { n };
                case null { Time.now() };
              };
            };
          };
          if (msgId != "") {
            messages.add({
              inboxId    = inboxId;
              messageId  = msgId;
              from       = fromVal;
              subject    = subjectVal;
              preview    = previewVal;
              receivedAt = receivedAt;
              isRead     = false;
            });
          };
          i += 1;
        };
        let parsed = messages.toArray();
        ndunaInboxMessages.value := parsed;
        parsed;
      };
    };
  };

};
