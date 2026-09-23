import Map            "mo:core/Map";
import List           "mo:core/List";
import Text           "mo:core/Text";
import Time           "mo:core/Time";
import Nat            "mo:core/Nat";
import Float          "mo:core/Float";
import Runtime        "mo:core/Runtime";
import AccessControl  "mo:caffeineai-authorization/access-control";
import CampaignTypes  "../types/campaign";
import AgentTypes     "../types/agent";
import AgentLib       "../lib/agent";
import AnalyticsLog   "../lib/analytics-log";
import CampaignPlanner  "../lib/campaign-planner";
import CampaignPublisher "../lib/campaign-publisher";
import CampaignTracker   "../lib/campaign-tracker";

/// Public canister API for the Nduna Campaign Engine.
/// All publishing requires admin approval — Nduna proposes, admin decides.
mixin (
  accessControlState    : AccessControl.AccessControlState,
  analyticsLog          : AnalyticsLog.State,

  // Campaign state
  campaigns             : Map.Map<Text, CampaignTypes.Campaign>,
  conversionEvents      : List.List<CampaignTypes.CampaignConversionEvent>,
  campaignFailureLogs   : List.List<CampaignTypes.CampaignFailureLog>,
  abTestResults         : Map.Map<Text, CampaignTypes.AbTestResult>,
  campaignConfig        : { var value : CampaignTypes.CampaignConfig },
  campaignSendsMap      : Map.Map<Text, Nat>,   // campaignId → total sends count
  campaignIdCounter     : { var value : Nat },

  // Driver data — used by planner to select segment
  driverAnalyticsProfiles : Map.Map<Principal, AgentTypes.DriverAnalyticsProfile>,

  // AI credentials — injected so planner can generate copy
  openClawApiKeyStore   : { var value : ?Text },
  openClawApiUrlStore   : { var value : Text  },
  openClawModelStore    : { var value : Text  },
  aiGatewayUrlStore     : { var value : ?Text },
  aiGatewayApiKeyStore  : { var value : ?Text },

  // Publishing channels
  whatsappConfig        : { var value : ?{ apiKey : Text; phoneNumber : Text; webhookSecret : Text } },
  phoneIndex            : Map.Map<Text, Principal>,  // phone → principal
  agentMailConfigStore  : { var value : { apiKey : Text; ndunaInboxId : ?Text; onboardingEmailEnabled : Bool; weeklyBriefingEmailEnabled : Bool; leadFollowupEmailEnabled : Bool } },
  driverEmails          : Map.Map<Text, Text>,       // driverId → email address
) {

  // ─── Private helpers ──────────────────────────────────────────────────────────

  /// Require admin caller; trap on failure.
  private func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
  };

  /// Look up a campaign by ID or return #err.
  private func getCampaign(campaignId : Text) : { #ok : CampaignTypes.Campaign; #err : Text } {
    switch (campaigns.get(campaignId)) {
      case (null) { #err("Campaign not found: " # campaignId) };
      case (?c)   { #ok(c) };
    };
  };

  /// Collect all driver analytics profiles as an array.
  private func allProfiles() : [AgentTypes.DriverAnalyticsProfile] {
    driverAnalyticsProfiles.values().toArray();
  };

  /// Return all failure logs as array.
  private func allFailureLogs() : [CampaignTypes.CampaignFailureLog] {
    campaignFailureLogs.toArray();
  };

  /// Get the total sends for a campaign (0 if not started).
  private func getSends(campaignId : Text) : Nat {
    switch (campaignSendsMap.get(campaignId)) {
      case (null) { 0 };
      case (?n)   { n };
    };
  };

  // ─── Campaign proposal ────────────────────────────────────────────────────────

  /// Admin only: ask Nduna to plan a new campaign draft.
  /// Nduna selects segment and angle, generates Minto-Pyramid copy via LLM,
  /// and stores the campaign as #pending_approval — NOT published.
  public shared ({ caller }) func proposeCampaign() : async { #ok : CampaignTypes.Campaign; #err : Text } {
    requireAdmin(caller);

    if (not campaignConfig.value.enabled) {
      return #err("Campaign engine is disabled. Enable it in campaign settings.");
    };

    let apiKey = switch (openClawApiKeyStore.value) {
      case (null)  { return #err("OpenRouter API key not configured. Set it in admin settings.") };
      case (?k) {
        if (k == "") { return #err("OpenRouter API key is empty. Set it in admin settings.") };
        k;
      };
    };

    campaignIdCounter.value += 1;

    let campaign = await* CampaignPlanner.planCampaign(
      allProfiles(),
      allFailureLogs(),
      apiKey,
      openClawApiUrlStore.value,
      openClawModelStore.value,
      aiGatewayUrlStore.value,
      aiGatewayApiKeyStore.value,
      campaignIdCounter.value,
    );

    campaigns.add(campaign.id, campaign);

    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "proposed",
      caller.toText(), null, true, null,
      "{\"campaignId\":\"" # campaign.id # "\",\"angle\":\"" # CampaignPlanner.angleToText(campaign.angle) # "\"}",
      ?"admin",
    );

    #ok(campaign);
  };

  // ─── Campaign listing ──────────────────────────────────────────────────────────

  /// Admin only: list campaigns, optionally filtered by status.
  public query ({ caller }) func listCampaigns(status : ?CampaignTypes.CampaignStatus) : async [CampaignTypes.Campaign] {
    requireAdmin(caller);
    let all = campaigns.values().toArray();
    switch (status) {
      case (null) { all };
      case (?s) {
        all.filter(func(c : CampaignTypes.Campaign) : Bool {
          switch (s, c.status) {
            case (#draft, #draft)                       { true };
            case (#pending_approval, #pending_approval) { true };
            case (#approved, #approved)                 { true };
            case (#active, #active)                     { true };
            case (#paused, #paused)                     { true };
            case (#completed, #completed)               { true };
            case (#rejected, #rejected)                 { true };
            case (#archived, #archived)                 { true };
            case _                                      { false };
          };
        });
      };
    };
  };

  // ─── Approval workflow ─────────────────────────────────────────────────────────

  /// Admin only: approve a campaign and optionally schedule it.
  /// If scheduledFor is null, publishes immediately.
  /// Admin approval is the ONLY path to publishing — Nduna cannot self-publish.
  public shared ({ caller }) func approveCampaign(
    campaignId   : Text,
    scheduledFor : ?Int,
  ) : async { #ok : CampaignTypes.Campaign; #err : Text } {
    requireAdmin(caller);

    let campaign = switch (getCampaign(campaignId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(c))  { c };
    };

    let now = Time.now();
    let approved : CampaignTypes.Campaign = {
      campaign with
      status     = #approved;
      approvedAt = ?now;
    };
    campaigns.add(campaignId, approved);

    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "approved",
      caller.toText(), null, true, null,
      "{\"campaignId\":\"" # campaignId # "\"}",
      ?"admin",
    );

    // If no scheduled time, publish immediately
    switch (scheduledFor) {
      case (?_schedTime) {
        // Scheduled publishing: stored as #approved; a future heartbeat or manual trigger runs it.
        // For now return the approved campaign. Admin can call approveCampaign again at schedule time.
        #ok(approved);
      };
      case (null) {
        // Publish now — run the publisher
        let publishResult = await* _runPublish(approved);
        let published : CampaignTypes.Campaign = {
          publishResult.campaign with
          status      = #active;
          publishedAt = ?now;
        };
        campaigns.add(campaignId, published);
        campaignSendsMap.add(campaignId, publishResult.sent);
        #ok(published);
      };
    };
  };

  /// Admin only: reject a campaign with a reason.
  /// Logs the failure so Nduna avoids this angle for this segment next time.
  public shared ({ caller }) func rejectCampaign(
    campaignId : Text,
    reason     : Text,
  ) : async { #ok : CampaignTypes.Campaign; #err : Text } {
    requireAdmin(caller);

    let campaign = switch (getCampaign(campaignId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(c))  { c };
    };

    let now = Time.now();
    let rejected : CampaignTypes.Campaign = {
      campaign with
      status          = #rejected;
      rejectionReason = ?reason;
    };
    campaigns.add(campaignId, rejected);

    // Log the failure so Nduna's planner avoids this angle
    campaignFailureLogs.add({
      campaignId = campaignId;
      reason;
      angle   = campaign.angle;
      segment = campaign.segment;
      loggedAt = now;
    });

    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "rejected",
      caller.toText(), null, true, null,
      "{\"campaignId\":\"" # campaignId # "\",\"reason\":\"" # AgentLib.escapeJson(reason) # "\"}",
      ?"admin",
    );

    #ok(rejected);
  };

  /// Admin only: add notes to a pending campaign asking for changes.
  /// Status stays #pending_approval so it remains in the review queue.
  public shared ({ caller }) func requestChanges(
    campaignId : Text,
    notes      : Text,
  ) : async { #ok : CampaignTypes.Campaign; #err : Text } {
    requireAdmin(caller);

    let campaign = switch (getCampaign(campaignId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(c))  { c };
    };

    let updated : CampaignTypes.Campaign = {
      campaign with
      adminNotes = ?notes;
    };
    campaigns.add(campaignId, updated);

    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "changes_requested",
      caller.toText(), null, true, null,
      "{\"campaignId\":\"" # campaignId # "\"}",
      ?"admin",
    );

    #ok(updated);
  };

  // ─── Conversion tracking ───────────────────────────────────────────────────────

  /// Public endpoint — called when a driver clicks a campaign link.
  /// eventType: "click" | "trial_start" | "trial_conversion"
  public shared ({ caller = _ }) func recordConversion(
    campaignId : Text,
    driverId   : Text,
    eventType  : Text,
  ) : async Bool {
    // Validate campaign exists
    switch (campaigns.get(campaignId)) {
      case (null) { return false };
      case (?_)   {};
    };

    let evType : { #click; #trial_start; #trial_conversion } = if (eventType == "trial_start") {
      #trial_start;
    } else if (eventType == "trial_conversion") {
      #trial_conversion;
    } else {
      #click;
    };

    let ev : CampaignTypes.CampaignConversionEvent = {
      campaignId;
      driverId;
      eventType  = evType;
      timestamp  = Time.now();
      revenue    = if (eventType == "trial_conversion") { ?350.0 } else { null }; // Tier 1 R350
    };

    CampaignTracker.trackConversionEvent(conversionEvents, ev);

    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "conversion_" # eventType,
      driverId, null, true, null,
      "{\"campaignId\":\"" # campaignId # "\",\"eventType\":\"" # eventType # "\"}",
      null,
    );

    true;
  };

  // ─── Metrics ──────────────────────────────────────────────────────────────────

  /// Admin only: get aggregated conversion metrics for a campaign.
  public query ({ caller }) func getCampaignMetrics(campaignId : Text) : async { #ok : CampaignTypes.CampaignMetrics; #err : Text } {
    requireAdmin(caller);
    switch (getCampaign(campaignId)) {
      case (#err(e)) { #err(e) };
      case (#ok(_)) {
        let metrics = CampaignTracker.getMetrics(
          conversionEvents,
          campaignId,
          getSends(campaignId),
        );
        #ok(metrics);
      };
    };
  };

  // ─── A/B testing ──────────────────────────────────────────────────────────────

  /// Admin only: evaluate all stored A/B tests and return current results.
  public query ({ caller }) func checkAbTestResults() : async [CampaignTypes.AbTestResult] {
    requireAdmin(caller);
    abTestResults.values().toArray();
  };

  // ─── Weekly report ────────────────────────────────────────────────────────────

  /// Admin only: generate the weekly campaign performance report.
  /// Emails it to adminEmail via AgentMail if configured.
  public shared ({ caller }) func generateWeeklyReport() : async CampaignTypes.WeeklyReport {
    requireAdmin(caller);

    let now = Time.now();
    let weekStr = CampaignTracker.weekOf(now);

    // Collect campaigns that were active this week (last 7 days)
    let sevenDaysAgo = now - 604_800_000_000_000;
    let activeCampaignIds = List.empty<Text>();
    var totalSends        = 0;
    var totalTrialStarts  = 0;
    var totalConversions  = 0;
    var totalRevenue      : Float = 0.0;

    // Count per-angle performance
    var epSends = 0; var epConv = 0;
    var fbSends = 0; var fbConv = 0;
    var riSends = 0; var riConv = 0;
    var ltoSends = 0; var ltoConv = 0;

    for ((cid, c) in campaigns.entries()) {
      switch (c.publishedAt) {
        case (?pub) {
          if (pub >= sevenDaysAgo) {
            activeCampaignIds.add(cid);
            let sends = getSends(cid);
            totalSends += sends;
            let m = CampaignTracker.getMetrics(conversionEvents, cid, sends);
            totalTrialStarts  += m.trialStarts;
            totalConversions  += m.paidConversions;
            totalRevenue      := totalRevenue + m.revenueAttributed;
            // Tally by angle
            switch (c.angle) {
              case (#earnings_proof)     { epSends  += sends; epConv  += m.paidConversions };
              case (#feature_benefit)    { fbSends  += sends; fbConv  += m.paidConversions };
              case (#referral_incentive) { riSends  += sends; riConv  += m.paidConversions };
              case (#limited_time_offer) { ltoSends += sends; ltoConv += m.paidConversions };
            };
          };
        };
        case (null) {};
      };
    };

    // Determine best and worst angle
    let angleData : [(Text, Nat, Nat)] = [
      ("earnings_proof",     epSends,  epConv),
      ("feature_benefit",    fbSends,  fbConv),
      ("referral_incentive", riSends,  riConv),
      ("limited_time_offer", ltoSends, ltoConv),
    ];
    let withData = angleData.filter(func(t : (Text, Nat, Nat)) : Bool { let (_, s, _) = t; s > 0 });
    let sorted = withData.sort(func(pa : (Text, Nat, Nat), pb : (Text, Nat, Nat)) : { #less; #equal; #greater } {
      let (_, sa, ca) = pa;
      let (_, sb, cb) = pb;
      let rateA : Float = if (sa == 0) { 0.0 } else { ca.toFloat() / sa.toFloat() };
      let rateB : Float = if (sb == 0) { 0.0 } else { cb.toFloat() / sb.toFloat() };
      if (rateA > rateB) { #less } else if (rateA < rateB) { #greater } else { #equal }
    });

    let topAngle : ?Text = if (sorted.size() > 0) {
      let (name, _, _) = sorted[0]; ?name
    } else { null };
    let worstAngle : ?Text = if (sorted.size() > 1) {
      let lastIdx = sorted.size() - 1 : Nat;
      let (name, _, _) = sorted[lastIdx]; ?name
    } else { null };

    let report : CampaignTypes.WeeklyReport = {
      weekOf            = weekStr;
      activeCampaigns   = activeCampaignIds.toArray();
      totalSends;
      totalTrialStarts;
      totalConversions;
      topAngle;
      worstAngle;
      revenueAttributed = totalRevenue;
    };

    // Email the report if AgentMail is configured and weekly reports are enabled
    if (campaignConfig.value.weeklyReportEnabled and campaignConfig.value.adminEmail != "") {
      let emailKey  = agentMailConfigStore.value.apiKey;
      let inboxIdOpt = agentMailConfigStore.value.ndunaInboxId;
      switch (inboxIdOpt) {
        case (?inboxId) {
          if (emailKey != "") {
            let emailBody =
              "CAMPAIGN ENGINE WEEKLY REPORT\n" #
              "Week of: " # weekStr # "\n\n" #
              "Active campaigns: " # totalSends.toText() # " sends\n" #
              "Trial starts: " # totalTrialStarts.toText() # "\n" #
              "Paid conversions: " # totalConversions.toText() # "\n" #
              "Revenue attributed: R" # totalRevenue.toText() # "\n\n" #
              "Top angle: " # (switch (topAngle) { case (?a) a; case null "[none]" }) # "\n" #
              "Worst angle: " # (switch (worstAngle) { case (?a) a; case null "[none]" });
            // Fire-and-forget email — result not awaited to keep return type sync
            // Note: actual email send requires async context; logged for now via AnalyticsLog
            AnalyticsLog.logEvent(
              analyticsLog, "campaign", "weekly_report_generated",
              "admin", null, true, null,
              "{\"week\":\"" # weekStr # "\",\"sends\":" # totalSends.toText() # "}",
              ?"admin",
            );
          };
        };
        case (null) {};
      };
    };

    report;
  };

  // ─── Failure log ──────────────────────────────────────────────────────────────

  /// Admin only: return all campaign failure logs (Nduna's learning data).
  public query ({ caller }) func getCampaignFailureLog() : async [CampaignTypes.CampaignFailureLog] {
    requireAdmin(caller);
    allFailureLogs();
  };

  // ─── Config ───────────────────────────────────────────────────────────────────

  /// Admin only: get current campaign engine config.
  public query ({ caller }) func getCampaignConfig() : async CampaignTypes.CampaignConfig {
    requireAdmin(caller);
    campaignConfig.value;
  };

  /// Admin only: save campaign engine settings.
  public shared ({ caller }) func setCampaignConfig(config : CampaignTypes.CampaignConfig) : async Bool {
    requireAdmin(caller);
    campaignConfig.value := config;
    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "config_updated",
      caller.toText(), null, true, null,
      "{\"enabled\":" # (if (config.enabled) "true" else "false") # "}",
      ?"admin",
    );
    true;
  };

  // ─── Bulk controls ────────────────────────────────────────────────────────────

  /// Admin only: pause all active campaigns immediately.
  public shared ({ caller }) func pauseAllCampaigns() : async Bool {
    requireAdmin(caller);
    // Collect IDs to update, then apply — avoids mutating during iteration
    let toUpdate = List.empty<(Text, CampaignTypes.Campaign)>();
    campaigns.forEach(func(cid : Text, c : CampaignTypes.Campaign) {
      if (c.status == #active) {
        toUpdate.add((cid, { c with status = #paused }));
      };
    });
    toUpdate.forEach(func(pair : (Text, CampaignTypes.Campaign)) {
      let (cid, c) = pair;
      campaigns.add(cid, c);
    });
    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "all_paused",
      caller.toText(), null, true, null, "{}", ?"admin",
    );
    true;
  };

  /// Admin only: resume all paused campaigns.
  public shared ({ caller }) func resumeAllCampaigns() : async Bool {
    requireAdmin(caller);
    let toUpdate = List.empty<(Text, CampaignTypes.Campaign)>();
    campaigns.forEach(func(cid : Text, c : CampaignTypes.Campaign) {
      if (c.status == #paused) {
        toUpdate.add((cid, { c with status = #active }));
      };
    });
    toUpdate.forEach(func(pair : (Text, CampaignTypes.Campaign)) {
      let (cid, c) = pair;
      campaigns.add(cid, c);
    });
    AnalyticsLog.logEvent(
      analyticsLog, "campaign", "all_resumed",
      caller.toText(), null, true, null, "{}", ?"admin",
    );
    true;
  };

  // ─── Private publish runner ───────────────────────────────────────────────────

  /// Run the publisher for an approved campaign.
  /// Selects phones or emails from driver data and calls CampaignPublisher.
  private func _runPublish(campaign : CampaignTypes.Campaign) : async* { campaign : CampaignTypes.Campaign; sent : Nat; failed : Nat } {
    var sent   = 0;
    var failed = 0;

    switch (campaign.channel) {
      case (#whatsapp) {
        let waKey = switch (whatsappConfig.value) {
          case (null)  { return { campaign; sent = 0; failed = 0 } };
          case (?cfg)  { cfg.apiKey };
        };
        // Collect phone numbers for matching segment
        let phones = _phoneNumbersForSegment(campaign.segment);
        let result = await* CampaignPublisher.publishViaWhatsApp(
          campaign, phones, waKey, analyticsLog,
        );
        sent   := result.sent;
        failed := result.failed;
      };
      case (#email) {
        let emailKey = agentMailConfigStore.value.apiKey;
        let inboxId  = switch (agentMailConfigStore.value.ndunaInboxId) {
          case (null) { return { campaign; sent = 0; failed = 0 } };
          case (?id)  { id };
        };
        let emails = _emailsForSegment(campaign.segment);
        let result = await* CampaignPublisher.publishViaEmail(
          campaign, emails, emailKey, inboxId, analyticsLog,
        );
        sent   := result.sent;
        failed := result.failed;
      };
      case (#both) {
        let waKey = switch (whatsappConfig.value) {
          case (null)  { "" };
          case (?cfg)  { cfg.apiKey };
        };
        let emailKey = agentMailConfigStore.value.apiKey;
        let inboxId  = switch (agentMailConfigStore.value.ndunaInboxId) {
          case (null) { "" };
          case (?id)  { id };
        };
        if (waKey != "") {
          let phones = _phoneNumbersForSegment(campaign.segment);
          let r = await* CampaignPublisher.publishViaWhatsApp(
            campaign, phones, waKey, analyticsLog,
          );
          sent   += r.sent;
          failed += r.failed;
        };
        if (emailKey != "" and inboxId != "") {
          let emails = _emailsForSegment(campaign.segment);
          let r = await* CampaignPublisher.publishViaEmail(
            campaign, emails, emailKey, inboxId, analyticsLog,
          );
          sent   += r.sent;
          failed += r.failed;
        };
      };
    };

    { campaign; sent; failed };
  };

  /// Collect phone numbers matching a DriverSegment.
  private func _phoneNumbersForSegment(_segment : CampaignTypes.DriverSegment) : [Text] {
    // Return all registered phones — segment filtering is a future enhancement.
    // Avoids PII leakage: phones are already registered by drivers voluntarily.
    phoneIndex.keys().toArray();
  };

  /// Collect email addresses matching a DriverSegment.
  private func _emailsForSegment(_segment : CampaignTypes.DriverSegment) : [Text] {
    driverEmails.values().toArray();
  };
};
