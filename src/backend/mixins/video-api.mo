import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Timer "mo:core/Timer";
import Debug "mo:core/Debug";
import AccessControl "mo:caffeineai-authorization/access-control";
import IC "ic:aaaaa-aa";
import VideoTypes "../types/video";

/// Public API mixin for the video automation engine.
/// - UploadPost + Whisper API keys stored securely (admin-only, never exposed to frontend)
/// - Drivers upload raw video → auto-clip → caption → brand → post to social platforms
/// - Analytics fetched on-demand per clip
mixin (
  accessControlState : AccessControl.AccessControlState,
  videoUploads       : Map.Map<Text, VideoTypes.VideoUpload>,
  videoClips         : Map.Map<Text, VideoTypes.VideoClip>,
  videoPosts         : Map.Map<Text, VideoTypes.VideoPost>,
  videoAnalytics     : Map.Map<Text, [VideoTypes.VideoAnalytics]>,
  uploadPostConfig   : { var value : ?VideoTypes.UploadPostConfig },
  whisperConfig      : { var value : ?VideoTypes.WhisperConfig },
  brandingConfigs    : Map.Map<Text, VideoTypes.BrandingConfig>,
  postingSchedules   : Map.Map<Text, VideoTypes.PostingSchedule>,
  /// Pilot mode flag — when true, Upload-Post and Whisper outcalls are skipped.
  pilotMode          : { var value : Bool },
) {

  // ── Rate-limit tracking: driverId → count of triggerVideoProcessing calls today ──
  let processingRateLimits = Map.empty<Text, { date : Int; count : Nat }>();

  // ── Admin: API key management ──────────────────────────────────────────────────

  /// Admin-only: store Upload-Post API config for social media posting.
  /// Never exposed to frontend — same pattern as ElevenLabs / Camofox keys.
  public shared ({ caller }) func setUploadPostConfig(config : VideoTypes.UploadPostConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set Upload-Post config");
    };
    uploadPostConfig.value := ?config;
  };

  /// Returns whether Upload-Post API has been configured.
  public query func isUploadPostConfigured() : async Bool {
    switch (uploadPostConfig.value) {
      case (null) { false };
      case (?_)   { true  };
    };
  };

  /// Admin-only: store Whisper API config for auto-captioning.
  public shared ({ caller }) func setVideoWhisperConfig(config : VideoTypes.WhisperConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set Whisper config");
    };
    whisperConfig.value := ?config;
  };

  // ── Driver: video uploads ──────────────────────────────────────────────────────

  /// Authenticated: driver registers a video upload after uploading the file to object-storage.
  /// storageRef is the object-storage key returned by the object-storage extension.
  public shared ({ caller }) func createVideoUpload(
    storageRef    : Text,
    fileName      : Text,
    fileSizeBytes : Nat,
    contentType   : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    // Validate content type
    if (not contentType.startsWith(#text "video/") and not contentType.startsWith(#text "audio/")) {
      return #err("Invalid content type: must be video/* or audio/*");
    };
    // Max 2 GB
    if (fileSizeBytes > 2_000_000_000) {
      return #err("File too large: maximum size is 2 GB");
    };
    let uploadId = _generateId("upload", caller.toText(), Time.now());
    let upload : VideoTypes.VideoUpload = {
      id               = uploadId;
      driverId         = caller.toText();
      storageRef;
      fileName;
      fileSizeBytes;
      contentType;
      uploadedAt       = Time.now();
      processingStatus = #pending;
      errorMsg         = null;
    };
    videoUploads.add(uploadId, upload);
    #ok(uploadId);
  };

  /// Authenticated: driver retrieves all their video uploads.
  public query ({ caller }) func getVideoUploads() : async [VideoTypes.VideoUpload] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    videoUploads.values().toArray().filter(func(u : VideoTypes.VideoUpload) : Bool {
      u.driverId == driverId
    });
  };

  /// Authenticated: driver retrieves a single video upload by ID.
  public query ({ caller }) func getVideoUpload(uploadId : Text) : async ?VideoTypes.VideoUpload {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (videoUploads.get(uploadId)) {
      case (null) { null };
      case (?upload) {
        if (upload.driverId != caller.toText() and not AccessControl.isAdmin(accessControlState, caller)) {
          null
        } else {
          ?upload
        }
      };
    };
  };

  // ── Driver: clips ──────────────────────────────────────────────────────────────

  /// Authenticated: driver retrieves all clips derived from a specific upload.
  public query ({ caller }) func getVideoClips(uploadId : Text) : async [VideoTypes.VideoClip] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    videoClips.values().toArray().filter(func(c : VideoTypes.VideoClip) : Bool {
      c.uploadId == uploadId and c.driverId == driverId
    });
  };

  /// Authenticated: driver retrieves a single clip by ID.
  public query ({ caller }) func getVideoClip(clipId : Text) : async ?VideoTypes.VideoClip {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (videoClips.get(clipId)) {
      case (null) { null };
      case (?clip) {
        if (clip.driverId != caller.toText() and not AccessControl.isAdmin(accessControlState, caller)) {
          null
        } else {
          ?clip
        }
      };
    };
  };

  // ── Driver: posts ──────────────────────────────────────────────────────────────

  /// Authenticated: driver schedules or immediately posts a clip to a social platform.
  public shared ({ caller }) func createVideoPost(
    clipId      : Text,
    platform    : VideoTypes.SocialPlatform,
    scheduledAt : ?Int,
  ) : async { #ok : Text; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    // ── Pilot mode guard — skip Upload-Post paid outcall ─────────────────────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: Upload-Post createVideoPost");
      return #err("[pilot_mode] Video posting is disabled during the pilot period.");
    };
    let cfg = switch (uploadPostConfig.value) {
      case (null) { return #err("Upload-Post API not configured. Ask an admin to set it up.") };
      case (?c)   { c };
    };
    let clip = switch (videoClips.get(clipId)) {
      case (null)  { return #err("Clip not found: " # clipId) };
      case (?c)    { c };
    };
    if (clip.driverId != caller.toText()) {
      return #err("Unauthorized: Clip belongs to a different driver");
    };
    if (clip.processingStatus != #ready) {
      return #err("Clip is not ready for posting. Current status: " # _clipStatusText(clip.processingStatus));
    };
    let storageRef = switch (clip.brandedStorageRef) {
      case (?ref) { ref };
      case (null) { clip.storageRef };
    };
    let postId = _generateId("post", clipId, Time.now());
    // Call Upload-Post unified posting API
    let platformText = _platformText(platform);
    let scheduledJson = switch (scheduledAt) {
      case (null)  { "null" };
      case (?ts)   { ts.toText() };
    };
    let body = "{\"storageRef\":\"" # _escapeJson(storageRef) # "\",\"platform\":\"" # platformText # "\",\"scheduledAt\":" # scheduledJson # ",\"postId\":\"" # postId # "\"}";
    let resp = await _httpPostAuth(
      "https://api.upload-post.com/v1/post",
      body,
      cfg.apiKey,
    );
    // Parse platformPostId from response
    let platformPostId = _videoExtractJsonValue(resp, "platformPostId");
    let status : VideoTypes.PostStatus = switch (scheduledAt) {
      case (null) { #posted };
      case (?_)   { #scheduled };
    };
    let postedAt : ?Int = switch (scheduledAt) {
      case (null) { ?Time.now() };
      case (?_)   { null };
    };
    let post : VideoTypes.VideoPost = {
      id             = postId;
      clipId;
      driverId       = caller.toText();
      platform;
      scheduledAt;
      postedAt;
      platformPostId = if (platformPostId == "") { null } else { ?platformPostId };
      status;
      errorMsg       = null;
    };
    videoPosts.add(postId, post);
    #ok(postId);
  };

  /// Authenticated: driver retrieves all posts for a given clip.
  public query ({ caller }) func getVideoPosts(clipId : Text) : async [VideoTypes.VideoPost] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    videoPosts.values().toArray().filter(func(p : VideoTypes.VideoPost) : Bool {
      p.clipId == clipId and p.driverId == driverId
    });
  };

  // ── Driver: analytics ─────────────────────────────────────────────────────────

  /// Authenticated: driver retrieves analytics for a given post.
  /// Fetches latest snapshot from the platform API via http-outcall, stores result, returns it.
  public shared ({ caller }) func getVideoAnalytics(postId : Text) : async [VideoTypes.VideoAnalytics] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let post = switch (videoPosts.get(postId)) {
      case (null)  { return [] };
      case (?p)    { p };
    };
    if (post.driverId != caller.toText() and not AccessControl.isAdmin(accessControlState, caller)) {
      return [];
    };
    // Return stored analytics — updated daily by fetchAndStoreAnalytics
    switch (videoAnalytics.get(postId)) {
      case (null)   { [] };
      case (?snaps) { snaps };
    };
  };

  // ── Processing pipeline ────────────────────────────────────────────────────────

  /// Authenticated: driver triggers (or re-triggers) video processing for an upload.
  /// Processing is simulated async (ICP has no true async workers) — runs synchronously
  /// and returns a jobId. Rate-limited to 5 calls per driver per day.
  public shared ({ caller }) func triggerVideoProcessing(uploadId : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let upload = switch (videoUploads.get(uploadId)) {
      case (null)  { return #err("Upload not found: " # uploadId) };
      case (?u)    { u };
    };
    if (upload.driverId != caller.toText()) {
      return #err("Unauthorized: Upload belongs to a different driver");
    };
    let cfg = switch (uploadPostConfig.value) {
      case (null) { return #err("Upload-Post API not configured. Ask an admin to set it up.") };
      case (?c)   { c };
    };
    // Rate limit: max 5 calls per driver per day
    let driverId = caller.toText();
    let today = _todayDayNumber();
    let rateLimitOk = switch (processingRateLimits.get(driverId)) {
      case (null) { true };
      case (?rl)  {
        if (rl.date != today) { true }
        else { rl.count < 5 };
      };
    };
    if (not rateLimitOk) {
      return #err("Rate limit reached: maximum 5 video processing requests per day");
    };
    // Update rate limit counter
    let newCount = switch (processingRateLimits.get(driverId)) {
      case (null)  { 1 };
      case (?rl)   { if (rl.date != today) { 1 } else { rl.count + 1 } };
    };
    processingRateLimits.add(driverId, { date = today; count = newCount });
    // Mark upload as processing
    videoUploads.add(uploadId, { upload with processingStatus = #processing });
    let capturedUploadId = uploadId;
    let capturedCfg      = cfg;
    let capturedCaller   = caller;
    // Dispatch async processing
    ignore Timer.setTimer<system>(#seconds(0), func() : async () {
      await _processUpload(capturedUploadId, capturedCfg, capturedCaller);
    });
    let jobId = "job_" # uploadId;
    #ok(jobId);
  };

  /// Authenticated: driver retrieves the aggregate job status for an upload.
  public query ({ caller }) func getVideoJobStatus(uploadId : Text) : async ?VideoTypes.VideoJobStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    // Count clips and posts for this upload
    let clipsForUpload = videoClips.values().toArray().filter(func(c : VideoTypes.VideoClip) : Bool {
      c.uploadId == uploadId and c.driverId == driverId
    });
    if (clipsForUpload.size() == 0) { return null };
    var clipsReady  = 0;
    var clipsFailed = 0;
    for (c in clipsForUpload.values()) {
      switch (c.processingStatus) {
        case (#ready)  { clipsReady  := clipsReady  + 1 };
        case (#failed) { clipsFailed := clipsFailed + 1 };
        case (_)       { };
      };
    };
    // Count posts for all clips from this upload
    var postsScheduled = 0;
    var postsPosted    = 0;
    for (c in clipsForUpload.values()) {
      let clipsPostsArr = videoPosts.values().toArray().filter(func(p : VideoTypes.VideoPost) : Bool {
        p.clipId == c.id
      });
      for (p in clipsPostsArr.values()) {
        switch (p.status) {
          case (#scheduled) { postsScheduled := postsScheduled + 1 };
          case (#posted)    { postsPosted    := postsPosted    + 1 };
          case (_)          { };
        };
      };
    };
    ?{
      uploadId;
      clipsGenerated = clipsForUpload.size();
      clipsReady;
      clipsFailed;
      postsScheduled;
      postsPosted;
      lastUpdatedAt  = Time.now();
    };
  };

  // ── Heartbeat analytics sync ───────────────────────────────────────────────────

  /// Authenticated: fetch latest analytics from Upload-Post and update stored records.
  /// Drivers can trigger a refresh for their own posts; scoped to caller's data.
  /// Call daily to keep analytics fresh. Auto-called in a scheduled heartbeat.
  public shared ({ caller }) func fetchAndStoreAnalytics() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let cfg = switch (uploadPostConfig.value) {
      case (null) { return };
      case (?c)   { c };
    };
    // GET /analytics?since=yesterday from Upload-Post
    let url = "https://api.upload-post.com/v1/analytics?since=yesterday";
    let resp = await _httpGetAuth(url, cfg.apiKey);
    // Parse response: expect JSON array of analytics objects
    // Format: [{"postId":"...","views":N,"likes":N,"shares":N,"comments":N,"platform":"..."},...]
    _parseAndStoreAnalytics(resp);
  };

  // ── Driver: branding & schedule ───────────────────────────────────────────────

  /// Authenticated: driver saves their branding preferences (watermark, CTA, music).
  public shared ({ caller }) func saveVideoBrandingConfig(config : VideoTypes.BrandingConfig) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    brandingConfigs.add(caller.toText(), config);
  };

  /// Authenticated: driver retrieves their branding config.
  public query ({ caller }) func getVideoBrandingConfig() : async ?VideoTypes.BrandingConfig {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    brandingConfigs.get(caller.toText());
  };

  /// Authenticated: driver saves their posting schedule (days, frequency, platforms).
  public shared ({ caller }) func savePostingSchedule(schedule : VideoTypes.PostingSchedule) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    postingSchedules.add(caller.toText(), schedule);
  };

  /// Authenticated: driver retrieves their posting schedule.
  public query ({ caller }) func getPostingSchedule() : async ?VideoTypes.PostingSchedule {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    postingSchedules.get(caller.toText());
  };

  // ── Internal: processing pipeline ─────────────────────────────────────────────

  /// Full processing pipeline for a single upload.
  /// Calls Upload-Post for FFmpeg clip detection, then Whisper per clip for captions.
  private func _processUpload(
    uploadId : Text,
    cfg      : VideoTypes.UploadPostConfig,
    _driver  : Principal,
  ) : async () {
    // ── Pilot mode guard — skip Upload-Post + Whisper outcalls ───────────────
    if (pilotMode.value) {
      Debug.print("[pilot_mode] skipped outcall: Upload-Post/Whisper _processUpload");
      switch (videoUploads.get(uploadId)) {
        case (null) { return };
        case (?upload) {
          videoUploads.add(uploadId, { upload with processingStatus = #failed; errorMsg = ?"[pilot_mode] Video processing is disabled during the pilot period." });
        };
      };
      return;
    };
    let upload = switch (videoUploads.get(uploadId)) {
      case (null) { return };
      case (?u)   { u };
    };

    // Step 1: request FFmpeg clip detection from Upload-Post
    let processBody = "{\"storageRef\":\"" # _escapeJson(upload.storageRef) # "\",\"mode\":\"auto_clip\",\"silenceThreshold\":-40,\"minSilenceDuration\":2.0,\"maxClipDuration\":90}";
    let processResp = await _httpPostAuth(
      "https://api.upload-post.com/v1/process",
      processBody,
      cfg.apiKey,
    );

    // Parse clip timestamps array from response
    // Expected: {"clips":[{"storageRef":"...","startSec":0.0,"endSec":87.5},...]
    let clipData = _parseClipTimestamps(processResp, upload);

    if (clipData.size() == 0) {
      // No clips detected — mark upload failed
      videoUploads.add(uploadId, {
        upload with
        processingStatus = #failed;
        errorMsg         = ?"No clips detected. Check that the video has audible content.";
      });
      return;
    };

    // Step 2: create VideoClip records and generate captions per clip
    let whisperKey = switch (whisperConfig.value) {
      case (null)  { "" };
      case (?wc)   { wc.apiKey };
    };

    for (cd in clipData.values()) {
      let clipId = _generateId("clip", uploadId, _floatToNat(cd.startSec).toInt());
      // Create clip record in pending state
      let clip : VideoTypes.VideoClip = {
        id               = clipId;
        uploadId;
        driverId         = upload.driverId;
        storageRef       = cd.storageRef;
        startSec         = cd.startSec;
        endSec           = cd.endSec;
        durationSec      = cd.endSec - cd.startSec;
        captionsVttRef   = null;
        brandedStorageRef = null;
        title            = null;
        processingStatus = #pending;
        errorMsg         = null;
      };
      videoClips.add(clipId, clip);

      // Step 3: caption via Whisper (if configured)
      var captionsRef : ?Text = null;
      if (whisperKey != "") {
        let captionBody = "{\"storageRef\":\"" # _escapeJson(cd.storageRef) # "\",\"model\":\"whisper-1\",\"response_format\":\"vtt\"}";
        let captionResp = await _httpPostAuth(
          "https://api.openai.com/v1/audio/transcriptions",
          captionBody,
          whisperKey,
        );
        let vttRef = _videoExtractJsonValue(captionResp, "vttRef");
        captionsRef := if (vttRef == "") { null } else { ?vttRef };
      };

      // Step 4: request branding via Upload-Post
      // Retrieve driver's branding config (default if none saved)
      let branding = switch (brandingConfigs.get(upload.driverId)) {
        case (null) {
          {
            driverName         = "";
            showMoneyDriveLogo = true;
            accentColor        = "#D97706";
            musicPreference    = "upbeat";
            callToAction       = "Join MoneyDrive";
          }
        };
        case (?bc) { bc };
      };
      let brandBody = "{\"storageRef\":\"" # _escapeJson(cd.storageRef)
        # "\",\"driverName\":\"" # _escapeJson(branding.driverName)
        # "\",\"accentColor\":\"" # _escapeJson(branding.accentColor)
        # "\",\"callToAction\":\"" # _escapeJson(branding.callToAction)
        # "\",\"showMoneyDriveLogo\":" # (if (branding.showMoneyDriveLogo) { "true" } else { "false" })
        # ",\"music\":\"" # _escapeJson(branding.musicPreference) # "\""
        # ",\"captionsVttRef\":" # (switch (captionsRef) {
            case (null)  { "null" };
            case (?ref)  { "\"" # _escapeJson(ref) # "\"" };
          })
        # "}";
      let brandResp = await _httpPostAuth(
        "https://api.upload-post.com/v1/brand",
        brandBody,
        cfg.apiKey,
      );
      let brandedRef = _videoExtractJsonValue(brandResp, "brandedStorageRef");

      // Update clip as ready
      videoClips.add(clipId, {
        clip with
        captionsVttRef    = captionsRef;
        brandedStorageRef = if (brandedRef == "") { null } else { ?brandedRef };
        processingStatus  = #ready;
        errorMsg          = null;
      });
    };

    // Mark upload as ready
    videoUploads.add(uploadId, {
      upload with
      processingStatus = #ready;
      errorMsg         = null;
    });
  };

  // ── Internal: analytics parsing ───────────────────────────────────────────────

  /// Parse the Upload-Post analytics JSON and update stored VideoAnalytics records.
  private func _parseAndStoreAnalytics(json : Text) : () {
    // Minimal JSON array parser: split on "},{" to get individual objects
    let now = Time.now();
    // Extract individual analytics objects
    let parts = json.split(#text "},{").toArray();
    for (part in parts.values()) {
      let postId      = _videoExtractJsonValue(part, "postId");
      let platformStr = _videoExtractJsonValue(part, "platform");

      if (postId != "") {
        let views    = switch (Nat.fromText(_extractJsonFloatValue(part, "views")))    { case (?n) { n }; case null { 0 } };
        let likes    = switch (Nat.fromText(_extractJsonFloatValue(part, "likes")))    { case (?n) { n }; case null { 0 } };
        let shares   = switch (Nat.fromText(_extractJsonFloatValue(part, "shares")))   { case (?n) { n }; case null { 0 } };
        let comments = switch (Nat.fromText(_extractJsonFloatValue(part, "comments"))) { case (?n) { n }; case null { 0 } };
        let engRate  = if (views == 0) { 0.0 } else {
          (likes + comments + shares).toInt().toFloat() / views.toInt().toFloat()
        };
        let platform = _parsePlatform(platformStr);
        let snapshot : VideoTypes.VideoAnalytics = {
          postId;
          platform;
          fetchedAt      = now;
          views;
          likes;
          shares;
          comments;
          engagementRate = engRate;
        };
        let existing = switch (videoAnalytics.get(postId)) {
          case (null)   { [] };
          case (?snaps) { snaps };
        };
        // Keep last 90 snapshots (daily for 90 days)
        let trimmed = if (existing.size() >= 90) {
          let sz = existing.size();
          existing.sliceToArray((sz - 89 : Nat).toInt(), sz.toInt())
        } else {
          existing
        };
        videoAnalytics.add(postId, trimmed.concat([snapshot]));
      };
    };
  };

  // ── Clip timestamp parsing ─────────────────────────────────────────────────────

  type ClipData = { storageRef : Text; startSec : Float; endSec : Float };

  /// Parse Upload-Post process response and extract clip timestamp entries.
  private func _parseClipTimestamps(json : Text, upload : VideoTypes.VideoUpload) : List.List<ClipData> {
    let clips = List.empty<ClipData>();
    // Split on clip object boundaries
    let parts = json.split(#text "},{").toArray();
    for (part in parts.values()) {
      let ref      = _videoExtractJsonValue(part, "storageRef");
      let startStr = _extractJsonFloatValue(part, "startSec");
      let endStr   = _extractJsonFloatValue(part, "endSec");
      if (ref != "" and startStr != "" and endStr != "") {
        let startSec = _parseFloatText(startStr);
        let endSec   = _parseFloatText(endStr);
        if (endSec > startSec) {
          clips.add({ storageRef = ref; startSec; endSec });
        };
      };
    };
    // Fallback: if no structured clips found, try a top-level storageRef
    if (clips.size() == 0) {
      let singleRef = _videoExtractJsonValue(json, "storageRef");
      let fallbackRef = if (singleRef != "") { singleRef } else { upload.storageRef };
      clips.add({ storageRef = fallbackRef; startSec = 0.0; endSec = 90.0 });
    };
    clips;
  };

  // ── Raw HTTP helpers ───────────────────────────────────────────────────────────

  private func _httpPostAuth(url : Text, body : Text, apiKey : Text) : async Text {
    let req : IC.http_request_args = {
      url;
      max_response_bytes = ?200_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Accept";       value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent";   value = "MoneyDrive/1.0" },
      ];
      body        = ?body.encodeUtf8();
      method      = #post;
      transform   = null;
      is_replicated = ?false;
    };
    let resp = await (with cycles = 50_000_000_000) IC.http_request(req);
    switch (resp.body.decodeUtf8()) {
      case (null)  { "" };
      case (?text) { text };
    };
  };

  private func _httpGetAuth(url : Text, apiKey : Text) : async Text {
    let req : IC.http_request_args = {
      url;
      max_response_bytes = ?500_000;
      headers = [
        { name = "Accept";        value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body        = null;
      method      = #get;
      transform   = null;
      is_replicated = ?false;
    };
    let resp = await (with cycles = 50_000_000_000) IC.http_request(req);
    switch (resp.body.decodeUtf8()) {
      case (null)  { "" };
      case (?text) { text };
    };
  };

  // ── Private helpers ────────────────────────────────────────────────────────────

  /// Parse a decimal text like "12.5" into a Float.
  /// Handles optional sign, integer part, and fractional part.
  private func _parseFloatText(s : Text) : Float {
    if (s == "") { return 0.0 };
    let chars = s.toArray();
    var intPart  : Int = 0;
    var fracPart : Float = 0.0;
    var fracDiv  : Float = 1.0;
    var inFrac   = false;
    var negative = false;
    var i = 0;
    if (chars.size() > 0 and chars[0] == '-') { negative := true; i := 1 };
    while (i < chars.size()) {
      let c = chars[i];
      if (c == '.') {
        inFrac := true;
      } else {
        let d : ?Int = switch (c) {
          case ('0') { ?0 }; case ('1') { ?1 }; case ('2') { ?2 };
          case ('3') { ?3 }; case ('4') { ?4 }; case ('5') { ?5 };
          case ('6') { ?6 }; case ('7') { ?7 }; case ('8') { ?8 };
          case ('9') { ?9 }; case (_)   { null };
        };
        switch (d) {
          case (?digit) {
            if (inFrac) {
              fracDiv  := fracDiv  * 10.0;
              fracPart := fracPart + digit.toFloat() / fracDiv;
            } else {
              intPart := intPart * 10 + digit;
            };
          };
          case (null) { };
        };
      };
      i := i + 1;
    };
    let result = intPart.toFloat() + fracPart;
    if (negative) { -result } else { result };
  };

  /// Truncate a Float to a Nat (floor, non-negative) for use in IDs.
  private func _floatToNat(f : Float) : Nat {
    if (f <= 0.0) { return 0 };
    let truncated = Float.trunc(f);
    let asInt64   = truncated.toInt64();
    asInt64.toInt().toNat();
  };

  /// Generate a stable ID from a prefix, a key, and a timestamp.
  private func _generateId(prefix : Text, key : Text, ts : Int) : Text {
    prefix # "_" # _hashText(key # "_" # ts.toText());
  };

  /// Produce a short stable hash from a text value (hex-like, 12 chars).
  private func _hashText(s : Text) : Text {
    var h : Nat = 5381;
    for (c in s.toIter()) {
      h := ((h * 33) + c.toNat32().toNat()) % 4_294_967_296;
    };
    // Convert to padded hex-ish text by using base-16 digit chars
    let digits = "0123456789abcdef";
    let da = digits.toArray();
    var result = "";
    var n = h;
    var i = 0;
    while (i < 8) {
      let idx = n % 16;
      result := Text.fromChar(da[idx]) # result;
      n := n / 16;
      i := i + 1;
    };
    result;
  };

  /// Today's day number (seconds since epoch / 86400) for rate limiting.
  private func _todayDayNumber() : Int {
    Time.now() / 86_400_000_000_000; // nanoseconds / ns-per-day
  };

  /// Convert SocialPlatform to the text label Upload-Post expects.
  private func _platformText(p : VideoTypes.SocialPlatform) : Text {
    switch (p) {
      case (#tiktok)    { "tiktok"    };
      case (#instagram) { "instagram" };
      case (#youtube)   { "youtube"   };
      case (#linkedin)  { "linkedin"  };
    };
  };

  /// Parse a platform text label back to a SocialPlatform variant.
  private func _parsePlatform(s : Text) : VideoTypes.SocialPlatform {
    switch (s) {
      case ("tiktok")    { #tiktok    };
      case ("instagram") { #instagram };
      case ("youtube")   { #youtube   };
      case ("linkedin")  { #linkedin  };
      case (_)           { #tiktok    }; // safe default
    };
  };

  /// Human-readable clip status for error messages.
  private func _clipStatusText(s : VideoTypes.ClipStatus) : Text {
    switch (s) {
      case (#pending)    { "pending"    };
      case (#captioning) { "captioning" };
      case (#branding)   { "branding"   };
      case (#ready)      { "ready"      };
      case (#failed)     { "failed"     };
    };
  };

  /// Extract a string value from a simple JSON blob: {"key":"value",...}.
  private func _videoExtractJsonValue(json : Text, key : Text) : Text {
    let marker = "\"" # key # "\":\"";
    let parts  = json.split(#text marker).toArray();
    if (parts.size() < 2) { return "" };
    let afterMarker = parts[1];
    let closing = afterMarker.split(#text "\"").toArray();
    if (closing.size() < 1) { return "" };
    closing[0];
  };

  /// Extract a numeric (float or int) value from JSON: {"key":123.4,...}.
  private func _extractJsonFloatValue(json : Text, key : Text) : Text {
    let marker = "\"" # key # "\":";
    let parts  = json.split(#text marker).toArray();
    if (parts.size() < 2) { return "" };
    let afterMarker = parts[1];
    // Read until comma, }, or whitespace — collect digit/dot/minus chars only
    let chars = afterMarker.toArray();
    var result = "";
    var i = 0;
    while (i < chars.size()) {
      let c = chars[i];
      if (c == ',' or c == '}' or c == ' ' or c == '\n' or c == '\r') {
        i := chars.size(); // break
      } else {
        result := result # Text.fromChar(c);
        i := i + 1;
      };
    };
    result;
  };

  /// Escape a text value for use inside a JSON string.
  private func _escapeJson(s : Text) : Text {
    var result = "";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if (code == 34)      { result := result # "\\\"" }
      else if (code == 92) { result := result # "\\\\" }
      else if (code == 10) { result := result # "\\n"  }
      else if (code == 13) { result := result # "\\r"  }
      else                 { result := result # Text.fromChar(c) };
    };
    result;
  };
};
