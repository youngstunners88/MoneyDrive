import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import HFTypes "../types/hyperframes";
import AgentLib "../lib/agent";
import IC "ic:aaaaa-aa";

/// Public API mixin for the Hyperframes YouTube Shorts Auto-Clip feature.
/// Tier 3 drivers can submit YouTube URLs or uploaded video references for automatic
/// Whisper transcription → GPT segment selection → FFmpeg 9:16 crop + subtitle burn.
/// The VPS sidecar handles all heavy processing; this mixin manages job state and proxies.
mixin (
  accessControlState  : AccessControl.AccessControlState,
  profiles            : Map.Map<Principal, {
    displayName       : Text;
    currencyCode      : Text;
    subscriptionTier  : Nat;
    voiceEnabled      : Bool;
    fuelConsumptionRate : Float;
    vehicleName       : Text;
  }>,
  hfVpsUrl            : { var value : Text },
  hfVpsKey            : { var value : Text },
  shortsJobs          : Map.Map<Text, HFTypes.ShortsJob>,
  shortsDriverIndex   : Map.Map<Text, List.List<Text>>,
  shortsDayRateKey    : { var value : Text },
  shortsDayRateCounts : Map.Map<Text, Nat>,
) {

  // ─── Rate limit constants ────────────────────────────────────────────────────
  let MAX_SHORTS_PER_DAY : Nat = 3;
  let MAX_SHORTS_HISTORY : Nat = 20;

  // ─── Admin: VPS config ───────────────────────────────────────────────────────

  /// Set the Shorts VPS URL (admin only).
  /// Reuses the same VPS sidecar as the Hyperframes slideshow renderer.
  public shared ({ caller }) func setShortsVpsConfig(vpsUrl : Text, vpsKey : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can configure the Shorts VPS");
    };
    hfVpsUrl.value := vpsUrl;
    hfVpsKey.value := vpsKey;
    #ok;
  };

  /// Return the Shorts VPS config status (admin only — key is masked).
  public query ({ caller }) func getShortsConfig() : async HFTypes.ShortsConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view Shorts config");
    };
    {
      vpsUrl = if (hfVpsUrl.value != "") { ?hfVpsUrl.value } else { null };
      vpsKey = if (hfVpsKey.value != "") { ?"***" } else { null };
    };
  };

  // ─── Driver: submit a clip job ───────────────────────────────────────────────

  /// Submit a YouTube URL or uploaded video for automatic Shorts clip generation.
  /// Tier 3 only. Rate limited to MAX_SHORTS_PER_DAY per driver.
  /// The VPS handles: Whisper transcription → GPT clip selection → FFmpeg 9:16 + subtitles.
  /// Returns the jobId for polling via getShortsJob().
  public shared ({ caller }) func submitShortsJob(req : HFTypes.ShortsRequest) : async { #ok : Text; #err : Text } {
    // ── Auth: Tier 3 only ──────────────────────────────────────────────────────
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found — create your profile first") };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin and profile.subscriptionTier < 3) {
      return #err("YouTube Shorts auto-clipping requires a Tier 3 subscription.");
    };

    // ── Validation ─────────────────────────────────────────────────────────────
    if (req.sourceUrl.size() == 0) {
      return #err("Source URL cannot be empty.");
    };
    if (req.sourceUrl.size() > 500) {
      return #err("Source URL is too long (max 500 characters).");
    };

    // ── Config check ──────────────────────────────────────────────────────────
    if (hfVpsUrl.value == "") {
      return #err("Video render server not configured. Ask your admin to set the VPS URL.");
    };
    if (hfVpsKey.value == "") {
      return #err("Video render server not authenticated. Ask your admin to set the VPS key.");
    };

    // ── Rate limit check ──────────────────────────────────────────────────────
    let driverIdText = caller.toText();
    let currentDayKey = (Time.now() / 86_400_000_000_000).toText();
    if (currentDayKey != shortsDayRateKey.value) {
      shortsDayRateKey.value := currentDayKey;
      shortsDayRateCounts.clear();
    };
    let todayCount = switch (shortsDayRateCounts.get(driverIdText)) {
      case (null) { 0 };
      case (?n)   { n };
    };
    if (todayCount >= MAX_SHORTS_PER_DAY) {
      return #err("Daily Shorts limit reached (" # MAX_SHORTS_PER_DAY.toText() # " clips/day). Try again tomorrow.");
    };

    // ── Generate job ID ────────────────────────────────────────────────────────
    let jobId = "shorts_" # driverIdText # "_" # Int.abs(Time.now()).toText();

    // ── Create job record in pending state ─────────────────────────────────────
    let pendingJob : HFTypes.ShortsJob = {
      id                   = jobId;
      driverId             = caller;
      sourceUrl            = req.sourceUrl;
      sourceType           = req.sourceType;
      clipStatus           = #pending;
      outputMp4Url         = null;
      selectedSegmentStart = null;
      selectedSegmentEnd   = null;
      errorMsg             = null;
      createdAt            = Time.now();
    };
    shortsJobs.add(jobId, pendingJob);
    shortsAddJobToDriverIndex(driverIdText, jobId);
    shortsDayRateCounts.add(driverIdText, todayCount + 1);

    // ── Dispatch to VPS sidecar (fire-and-forget; VPS will callback updateShortsJobStatus) ─
    let sourceTypeText = switch (req.sourceType) {
      case (#youtube) { "youtube" };
      case (#upload)  { "upload" };
    };
    let requestBody =
      "{\"jobId\":\"" # AgentLib.escapeJson(jobId) # "\"," #
      "\"sourceUrl\":\"" # AgentLib.escapeJson(req.sourceUrl) # "\"," #
      "\"sourceType\":\"" # sourceTypeText # "\"," #
      "\"driverId\":\"" # AgentLib.escapeJson(driverIdText) # "\"}";

    let httpRequest : IC.http_request_args = {
      url               = hfVpsUrl.value # "/shorts/submit";
      max_response_bytes = ?50_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # hfVpsKey.value },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body          = ?requestBody.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    // Attempt the dispatch; if the VPS is temporarily unreachable, leave job as #pending
    // and the driver can retry. The VPS callback (updateShortsJobStatus) will update
    // the status once processing completes.
    try {
      let httpResponse = await (with cycles = 50_000_000) IC.http_request(httpRequest);
      if (httpResponse.status >= 400) {
        let bodyText = switch (httpResponse.body.decodeUtf8()) {
          case (null) { "" };
          case (?t)   { t };
        };
        // Update job to failed status on dispatch error
        let failedJob : HFTypes.ShortsJob = { pendingJob with clipStatus = #failed; errorMsg = ?("VPS dispatch failed (" # httpResponse.status.toText() # "): " # bodyText) };
        shortsJobs.add(jobId, failedJob);
        return #err("Failed to submit to render server: HTTP " # httpResponse.status.toText());
      };
    } catch (e) {
      // Network error — leave as #pending so admin can investigate
      let failedJob : HFTypes.ShortsJob = { pendingJob with clipStatus = #failed; errorMsg = ?("Network error: " # e.message()) };
      shortsJobs.add(jobId, failedJob);
      return #err("Network error reaching render server: " # e.message());
    };

    #ok(jobId);
  };

  // ─── Driver / admin: poll job ────────────────────────────────────────────────

  /// Return a single Shorts job by ID.
  /// Only the job owner (driverId) or an admin can fetch.
  public query ({ caller }) func getShortsJob(jobId : Text) : async ?HFTypes.ShortsJob {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let driverIdText = caller.toText();
    switch (shortsJobs.get(jobId)) {
      case (null) { null };
      case (?job) {
        if (Principal.equal(job.driverId, caller) or AccessControl.isAdmin(accessControlState, caller)) {
          ?job
        } else {
          null
        };
      };
    };
  };

  /// Return all Shorts jobs for the calling driver, sorted by createdAt desc.
  public query ({ caller }) func listShortsJobs() : async [HFTypes.ShortsJob] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let driverIdText = caller.toText();
    let jobIds = switch (shortsDriverIndex.get(driverIdText)) {
      case (null) { return [] };
      case (?ids) { ids.toArray() };
    };
    let result = List.empty<HFTypes.ShortsJob>();
    for (jid in jobIds.values()) {
      switch (shortsJobs.get(jid)) {
        case (null) {};
        case (?job) { result.add(job) };
      };
    };
    let arr  = result.toArray();
    let size = arr.size();
    let start = if (size > MAX_SHORTS_HISTORY) { size - MAX_SHORTS_HISTORY : Nat } else { 0 };
    arr.sliceToArray(start, size).reverse();
  };

  // ─── VPS callback: update job status ────────────────────────────────────────

  /// Called by the VPS sidecar once processing is complete.
  /// Admin-only — the VPS authenticates via the admin principal configured in the canister.
  public shared ({ caller }) func updateShortsJobStatus(
    jobId     : Text,
    status    : HFTypes.ShortsStatus,
    outputUrl : ?Text,
    errorMsg  : ?Text,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can update Shorts job status");
    };
    switch (shortsJobs.get(jobId)) {
      case (null) {
        #err("Shorts job not found: " # jobId)
      };
      case (?job) {
        let updatedJob : HFTypes.ShortsJob = {
          job with
          clipStatus   = status;
          outputMp4Url = outputUrl;
          errorMsg     = errorMsg;
        };
        shortsJobs.add(jobId, updatedJob);
        #ok;
      };
    };
  };

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /// Maintain per-driver job ID index (rolling window of MAX_SHORTS_HISTORY).
  private func shortsAddJobToDriverIndex(driverIdText : Text, jobId : Text) {
    let existing = switch (shortsDriverIndex.get(driverIdText)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };
    existing.add(jobId);
    let size = existing.size();
    if (size > MAX_SHORTS_HISTORY) {
      let arr   = existing.toArray();
      let start = size - MAX_SHORTS_HISTORY : Nat;
      let trimmed = List.fromArray(arr.sliceToArray(start, size));
      shortsDriverIndex.add(driverIdText, trimmed);
    } else {
      shortsDriverIndex.add(driverIdText, existing);
    };
  };
};
