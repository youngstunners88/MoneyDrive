import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Error "mo:core/Error";
import AccessControl "mo:caffeineai-authorization/access-control";
import HFTypes "../types/hyperframes";
import AgentLib "../lib/agent";
import IC "ic:aaaaa-aa";

/// Public API mixin for the Hyperframes video generation engine.
/// Tier 3 drivers can request Nduna-composed HTML5 slideshows rendered to MP4 via VPS sidecar.
/// Admin stores the VPS URL and bearer key — never exposed to the frontend.
mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, {
    displayName : Text;
    currencyCode : Text;
    subscriptionTier : Nat;
    voiceEnabled : Bool;
    fuelConsumptionRate : Float;
    vehicleName : Text;
  }>,
  openClawApiKey : { var value : ?Text },
  openClawApiUrl : { var value : Text },
  openClawModel  : { var value : Text },
  hfVpsUrl       : { var value : Text },
  hfVpsKey       : { var value : Text },
  hfJobs         : Map.Map<Text, HFTypes.HyperframesJob>,
  hfDriverIndex  : Map.Map<Text, List.List<Text>>,
  hfDayRateKey   : { var value : Text },
  hfDayRateCounts : Map.Map<Text, Nat>,
) {

  // ─── Rate limit constants ────────────────────────────────────────────────────
  let MAX_RENDERS_PER_DAY : Nat = 5;
  let MAX_JOBS_HISTORY    : Nat = 20;

  // ─── Admin: configure VPS sidecar ───────────────────────────────────────────

  /// Store the Hyperframes VPS sidecar URL (admin only).
  public shared ({ caller }) func setHyperframesVpsUrl(url : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the Hyperframes VPS URL");
    };
    hfVpsUrl.value := url;
  };

  /// Store the Hyperframes VPS bearer auth key (admin only, never returned).
  public shared ({ caller }) func setHyperframesVpsKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the Hyperframes VPS key");
    };
    hfVpsKey.value := key;
  };

  /// Return whether the VPS sidecar is configured (admin only, never returns the key).
  public query ({ caller }) func getHyperframesConfig() : async { configured : Bool } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view Hyperframes config");
    };
    { configured = hfVpsUrl.value != "" and hfVpsKey.value != "" };
  };

  // ─── Driver: request slideshow generation ───────────────────────────────────

  /// Generate an HTML5 Hyperframes slideshow via Nduna + VPS sidecar render.
  /// Tier 3 only. Rate limited to MAX_RENDERS_PER_DAY per driver.
  /// Returns job metadata — poll getHyperframesJob(id) to track completion.
  public shared ({ caller }) func generateHyperframesSlideshow(topic : Text) : async {
    #ok : HFTypes.HyperframesJob;
    #err : Text;
  } {
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
      return #err("Hyperframes video generation requires Tier 3 subscription.");
    };

    // ── Validation ─────────────────────────────────────────────────────────────
    if (topic.size() == 0) {
      return #err("Topic cannot be empty.");
    };
    if (topic.size() > 200) {
      return #err("Topic is too long (max 200 characters).");
    };

    // ── Config check ──────────────────────────────────────────────────────────
    let apiKey = switch (openClawApiKey.value) {
      case (null)  { return #err("Nduna AI is not configured. Ask your admin to set the OpenRouter API key.") };
      case (?key)  { key };
    };
    if (hfVpsUrl.value == "") {
      return #err("Video render server not configured. Ask your admin to set the VPS URL.");
    };
    if (hfVpsKey.value == "") {
      return #err("Video render server not authenticated. Ask your admin to set the VPS key.");
    };

    // ── Rate limit check ──────────────────────────────────────────────────────
    let driverIdText = caller.toText();
    let currentDayKey = (Time.now() / 86_400_000_000_000).toText();
    if (currentDayKey != hfDayRateKey.value) {
      hfDayRateKey.value := currentDayKey;
      hfDayRateCounts.clear();
    };
    let todayCount = switch (hfDayRateCounts.get(driverIdText)) {
      case (null) { 0 };
      case (?n)   { n };
    };
    if (todayCount >= MAX_RENDERS_PER_DAY) {
      return #err("Daily render limit reached (" # MAX_RENDERS_PER_DAY.toText() # " slideshows/day). Try again tomorrow.");
    };

    // ── Generate job ID ────────────────────────────────────────────────────────
    let jobId = "hf_" # driverIdText # "_" # Int.abs(Time.now()).toText();

    // ── Step 1: Ask Nduna to compose the HTML slideshow ──────────────────────
    let slideshowPrompt = buildSlideshowPrompt(topic);
    let (htmlComposition, _) = await* AgentLib.queryAgent(
      apiKey,
      openClawApiUrl.value,
      openClawModel.value,
      slideshowPrompt,
      [],          // no conversation history — standalone composition request
      AgentLib.formatDate(Time.now()),
      AgentLib.formatTimeSAST(Time.now()),
      "Driver is generating a Hyperframes slideshow about: " # topic,
      [],          // no memory entries needed for composition
      null,        // no driver memory
      null,        // no documents needed for composition
      "",          // no evolution delta
      null,        // no cohort
      0.0,         // no rating
      Time.now(),
      null,        // no gateway URL for composition calls
      null,        // no gateway key for composition calls
      null,        // no metrics state for composition calls
      null,        // no orbis API key for composition calls
    );

    // ── Step 2: Create job record in pending state ─────────────────────────────
    let pendingJob : HFTypes.HyperframesJob = {
      id              = jobId;
      driverId        = driverIdText;
      topic           = topic;
      compositionHtml = htmlComposition;
      renderStatus    = #rendering;
      mp4Url          = null;
      errorMsg        = null;
      createdAt       = Time.now();
    };
    hfJobs.add(jobId, pendingJob);
    addJobToDriverIndex(driverIdText, jobId);
    hfDayRateCounts.add(driverIdText, todayCount + 1);

    // ── Step 3: Call VPS sidecar to render HTML → MP4 ─────────────────────────
    let renderResult = await* callVpsRender(jobId, driverIdText, htmlComposition);

    // ── Step 4: Update job with render result ─────────────────────────────────
    let finalJob : HFTypes.HyperframesJob = switch (renderResult) {
      case (#ok(mp4Url)) {
        { pendingJob with renderStatus = #ready; mp4Url = ?mp4Url }
      };
      case (#err(errMsg)) {
        { pendingJob with renderStatus = #failed; errorMsg = ?errMsg }
      };
    };
    hfJobs.add(jobId, finalJob);

    #ok(finalJob);
  };

  // ─── Driver: poll / list jobs ────────────────────────────────────────────────

  /// Retrieve a single job record by ID (caller must own the job).
  public query ({ caller }) func getHyperframesJob(id : Text) : async ?HFTypes.HyperframesJob {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let driverIdText = caller.toText();
    switch (hfJobs.get(id)) {
      case (null)   { null };
      case (?job) {
        // Only return jobs owned by this driver (or admin)
        if (job.driverId == driverIdText or AccessControl.isAdmin(accessControlState, caller)) {
          ?job
        } else {
          null
        };
      };
    };
  };

  /// Return the driver's last 20 job records, most recent first.
  public query ({ caller }) func getHyperframesJobs() : async [HFTypes.HyperframesJob] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let driverIdText = caller.toText();
    let jobIds = switch (hfDriverIndex.get(driverIdText)) {
      case (null) { return [] };
      case (?ids) { ids.toArray() };
    };
    // Collect jobs in reverse order (most recent last in list = first in reversed)
    let result = List.empty<HFTypes.HyperframesJob>();
    for (jid in jobIds.values()) {
      switch (hfJobs.get(jid)) {
        case (null)  {};
        case (?job)  { result.add(job) };
      };
    };
    // Return most recent first, capped at MAX_JOBS_HISTORY
    let arr = result.toArray();
    let size = arr.size();
    let start = if (size > MAX_JOBS_HISTORY) { size - MAX_JOBS_HISTORY : Nat } else { 0 };
    arr.sliceToArray(start, size).reverse();
  };

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /// Build the specialised Nduna prompt for HTML5 1080×1920 slideshow composition.
  /// Includes FFmpeg render hints so the VPS sidecar can extract correct encoding parameters.
  private func buildSlideshowPrompt(topic : Text) : Text {
    "You are generating a Hyperframes HTML5 slideshow composition for a South African rideshare driver.\n\n" #
    "OUTPUT FORMAT: Return ONLY valid HTML — no explanation, no markdown, no preamble. Just the HTML.\n\n" #
    "SPECIFICATIONS:\n" #
    "- Canvas size: 1080px wide × 1920px tall (TikTok/Instagram vertical format)\n" #
    "- 6 slides total, each in a <section> tag with class 'slide'\n" #
    "- Each slide must have a full-bleed background (gradient or solid), a dark overlay (rgba 0,0,0,0.52), and white bold text\n" #
    "- Font: system-ui, sans-serif. Text shadow: 2px 2px 8px rgba(0,0,0,0.8)\n" #
    "- Brand colours: burnt orange (#D4580A), gold (#F4B942), navy (#1A2744)\n\n" #
    "SLIDE STRUCTURE:\n" #
    "Slide 1 — HOOK: Strongest opening statement about the topic. Short. Attention-grabbing.\n" #
    "Slide 2 — PROBLEM/SETUP: What problem or situation the topic addresses.\n" #
    "Slide 3 — POINT 1: First key insight or tip. One clear sentence.\n" #
    "Slide 4 — POINT 2: Second key insight or tip. One clear sentence.\n" #
    "Slide 5 — POINT 3: Third key insight or tip. One clear sentence.\n" #
    "Slide 6 — CTA: Call to action. Examples: 'Follow for more', 'Save this for later', 'Comment your thoughts'.\n\n" #
    "FFMPEG RENDER HINTS:\n" #
    "Include an HTML comment block at the very top of the document (after <!DOCTYPE html>) with the following\n" #
    "metadata that the VPS render engine will use to invoke FFmpeg with the correct parameters:\n" #
    "<!--\n" #
    "  ffmpeg-hints:\n" #
    "    resolution: 1080x1920\n" #
    "    codec: libx264\n" #
    "    pix_fmt: yuv420p\n" #
    "    fps: 30\n" #
    "    crf: 18\n" #
    "    preset: veryslow\n" #
    "    movflags: +faststart\n" #
    "    audio_codec: aac\n" #
    "    slide_duration_sec: 4\n" #
    "    transition: xfade=transition=fade:duration=0.5\n" #
    "    watermark_text: MoneyDrive\n" #
    "    watermark_position: x=(w-text_w)/2:y=h-60\n" #
    "    watermark_style: fontsize=36:fontcolor=white:alpha=0.85:shadowx=2:shadowy=2:shadowcolor=black\n" #
    "-->\n\n" #
    "VIDEO QUALITY GUIDANCE (so your composition decisions map correctly to FFmpeg output):\n" #
    "- Each slide section should be exactly 4 seconds of screen time at 30fps (120 frames per slide).\n" #
    "- Slide transitions use xfade=transition=fade with 0.5 second duration — keep 0.5s overlap budget.\n" #
    "- Background gradients render accurately in H.264 yuv420p — use CSS gradients freely.\n" #
    "- Text with font-size 48px–80px renders cleanly at 1080×1920 H.264 crf=18.\n" #
    "- Drop shadows and semi-transparent overlays work correctly — use them for legibility.\n" #
    "- The MoneyDrive watermark will be burned in by FFmpeg drawtext — do NOT add it as HTML text.\n" #
    "- The final MP4 will use -movflags +faststart for fast web playback.\n\n" #
    "TOPIC: " # topic # "\n\n" #
    "Generate the HTML now. Start with <!DOCTYPE html>.";
  };

  /// Make the HTTP outcall to the VPS sidecar with up to 3 retry attempts.
  private func callVpsRender(jobId : Text, driverId : Text, html : Text) : async* {
    #ok : Text;
    #err : Text;
  } {
    let maxAttempts = 3;
    var attempt = 0;
    var lastError = "Unknown render error";

    label retryLoop while (attempt < maxAttempts) {
      attempt += 1;
      let result = await* attemptVpsRender(jobId, driverId, html);
      switch (result) {
        case (#ok(url)) { return #ok(url) };
        case (#err(msg)) {
          lastError := msg;
          // Only retry on transient errors (not 4xx client errors)
          if (msg.contains(#text "400") or msg.contains(#text "401") or
              msg.contains(#text "403") or msg.contains(#text "422")) {
            return #err(msg);  // Non-retryable
          };
          // Brief pause before retry (we just continue — no sleep available in Motoko)
        };
      };
    };
    #err("Video render failed after " # maxAttempts.toText() # " attempts. Last error: " # lastError # ". Please try again later.");
  };

  /// Single attempt at calling the VPS render endpoint.
  private func attemptVpsRender(jobId : Text, driverId : Text, html : Text) : async* {
    #ok : Text;
    #err : Text;
  } {
    let requestBody =
      "{\"html\":\"" # AgentLib.escapeJson(html) # "\"," #
      "\"format\":\"mp4\"," #
      "\"jobId\":\"" # AgentLib.escapeJson(jobId) # "\"," #
      "\"driverId\":\"" # AgentLib.escapeJson(driverId) # "\"}";

    let httpRequest : IC.http_request_args = {
      url              = hfVpsUrl.value # "/render";
      max_response_bytes = ?5_000_000;    // 5 MB — enough for JSON response with mp4 URL
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # hfVpsKey.value },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body         = ?requestBody.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let httpResponse = try {
      await (with cycles = 120_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Network error reaching render server: " # e.message());
    };

    if (httpResponse.status != 200) {
      let bodyText = switch (httpResponse.body.decodeUtf8()) {
        case (null) { "" };
        case (?t)   { t };
      };
      return #err("Render server returned error " # httpResponse.status.toText() # ": " # bodyText);
    };

    switch (httpResponse.body.decodeUtf8()) {
      case (null) {
        #err("Render server returned unreadable response.")
      };
      case (?text) {
        // Parse JSON: {"status":"ok","mp4Url":"...","renderSeconds":N}
        switch (hfExtractJsonField(text, "status")) {
          case (null) {
            #err("Render server response missing 'status' field.")
          };
          case (?status) {
            if (status != "ok") {
              let errDetail = switch (hfExtractJsonField(text, "error")) {
                case (null)  { status };
                case (?msg)  { msg };
              };
              #err("Render failed: " # errDetail)
            } else {
              switch (hfExtractJsonField(text, "mp4Url")) {
                case (null)     { #err("Render succeeded but no MP4 URL returned.") };
                case (?mp4Url)  { #ok(mp4Url) };
              };
            };
          };
        };
      };
    };
  };

  /// Maintain per-driver job ID index (rolling window of MAX_JOBS_HISTORY).
  private func addJobToDriverIndex(driverIdText : Text, jobId : Text) {
    let existing = switch (hfDriverIndex.get(driverIdText)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };
    existing.add(jobId);
    // Keep only the last MAX_JOBS_HISTORY entries (oldest at front — drop from front).
    let size = existing.size();
    if (size > MAX_JOBS_HISTORY) {
      let arr = existing.toArray();
      let start = size - MAX_JOBS_HISTORY : Nat;
      let trimmed = List.fromArray(arr.sliceToArray(start, size));
      hfDriverIndex.add(driverIdText, trimmed);
    } else {
      hfDriverIndex.add(driverIdText, existing);
    };
  };

  /// Extract a string field value from a simple JSON object (Hyperframes-scoped).
  /// Named hfExtractJsonField to avoid collision with messaging-api.mo's extractJsonField.
  private func hfExtractJsonField(json : Text, fieldName : Text) : ?Text {
    let needle = "\"" # fieldName # "\":\"";
    switch (AgentLib.splitOnFirst(json, needle)) {
      case (null)        { null };
      case (?(_, after)) { ?AgentLib.takeUntilQuote(after) };
    };
  };
};
