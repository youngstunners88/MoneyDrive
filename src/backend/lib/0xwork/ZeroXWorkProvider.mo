import Text "mo:core/Text";
import Nat "mo:core/Nat";
import IC "ic:aaaaa-aa";

/// 0xWork decentralised task marketplace provider.
/// All functions are stateless — callers supply credentials on every call.
/// Follows MoneyDrive HTTP outcall pattern:
///   is_replicated = ?false, cycles = 50_000_000_000, transform = null
///
/// NOTE: The 0xWork API (0xwork.org) is an emerging platform. If endpoints
/// are unavailable or return errors, all functions gracefully degrade and
/// return #err with a descriptive message so the frontend can display
/// "pending connection" status without breaking the build.
module {

  // ── Public types ─────────────────────────────────────────────────────────────

  public type RegisterResult = {
    walletAddress : Text;
    apiKey        : Text;
  };

  public type EarningsResult = {
    totalUSDC       : Float;
    tasksCompleted  : Nat;
    activeTaskId    : ?Text;
  };

  public type TaskItem = {
    taskId      : Text;
    title       : Text;
    description : Text;
    reward      : Float;
    capability  : Text;
  };

  // ── initWallet ──────────────────────────────────────────────────────────────

  /// Register Nduna on 0xWork and obtain a Base wallet address + API key.
  /// POST https://0xwork.org/api/agents/register
  /// Body: { name, bio, capabilities }
  /// Returns the walletAddress and apiKey on success, or #err with reason.
  public func initWallet() : async { #ok : RegisterResult; #err : Text } {
    let body =
      "{\"name\":\"Nduna\"," #
      "\"bio\":\"SA driver income agent — Writing, Research, Data, Creative tasks for MoneyDrive\"," #
      "\"capabilities\":[\"writing\",\"research\",\"data\",\"creative\"]}";

    let httpRequest : IC.http_request_args = {
      url               = "https://0xwork.org/api/agents/register";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent";   value = "MoneyDrive/1.0" },
      ];
      body          = ?body.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("0xWork register request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode 0xWork register response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("0xWork register HTTP " # response.status.toText() # ": " # json);
        };
        let walletAddress = extractTextField(json, "walletAddress");
        let apiKey        = extractTextField(json, "apiKey");
        if (walletAddress == "" and apiKey == "") {
          // Gracefully degrade — platform may not yet be fully live
          return #err("0xWork register: unexpected response (platform may be unavailable): " # json);
        };
        #ok({ walletAddress; apiKey });
      };
    };
  };

  // ── stakeAxobotl ────────────────────────────────────────────────────────────

  /// Request free $AXOBOTL tokens from the faucet for the initial stake.
  /// POST https://0xwork.org/api/faucet/axobotl
  /// Body: { walletAddress }
  public func stakeAxobotl(walletAddress : Text) : async { #ok : Text; #err : Text } {
    if (walletAddress == "") {
      return #err("walletAddress is required to request $AXOBOTL from faucet");
    };

    let body = "{\"walletAddress\":\"" # escapeJson(walletAddress) # "\"}";

    let httpRequest : IC.http_request_args = {
      url               = "https://0xwork.org/api/faucet/axobotl";
      max_response_bytes = ?5_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent";   value = "MoneyDrive/1.0" },
      ];
      body          = ?body.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("0xWork faucet request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode 0xWork faucet response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("0xWork faucet HTTP " # response.status.toText() # ": " # json);
        };
        let txHash = extractTextField(json, "txHash");
        if (txHash != "") {
          #ok("$AXOBOTL staked. TX: " # txHash)
        } else {
          #ok("Faucet request submitted: " # json)
        };
      };
    };
  };

  // ── getEarnings ─────────────────────────────────────────────────────────────

  /// Fetch current earnings stats for the registered Nduna agent.
  /// GET https://0xwork.org/api/agents/earnings
  public func getEarnings(apiKey : Text) : async { #ok : EarningsResult; #err : Text } {
    if (apiKey == "") {
      return #err("0xWork API key not configured");
    };

    let httpRequest : IC.http_request_args = {
      url               = "https://0xwork.org/api/agents/earnings";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body          = null;
      method        = #get;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("0xWork earnings request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode 0xWork earnings response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("0xWork earnings HTTP " # response.status.toText() # ": " # json);
        };
        let totalUSDC      = extractFloatField(json, "totalUSDC");
        let tasksCompleted = extractNatField(json, "tasksCompleted");
        let activeTaskId   = extractOptTextField(json, "activeTaskId");
        #ok({ totalUSDC; tasksCompleted; activeTaskId });
      };
    };
  };

  // ── getAvailableTasks ────────────────────────────────────────────────────────

  /// Fetch available tasks matching Nduna's capabilities.
  /// GET https://0xwork.org/api/tasks/available?capabilities=writing,research,data,creative
  public func getAvailableTasks(apiKey : Text) : async { #ok : [TaskItem]; #err : Text } {
    if (apiKey == "") {
      return #err("0xWork API key not configured");
    };

    let httpRequest : IC.http_request_args = {
      url               = "https://0xwork.org/api/tasks/available?capabilities=writing,research,data,creative";
      max_response_bytes = ?50_000;
      headers = [
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body          = null;
      method        = #get;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("0xWork tasks request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode 0xWork tasks response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("0xWork tasks HTTP " # response.status.toText() # ": " # json);
        };
        let tasks = parseTaskArray(json);
        #ok(tasks);
      };
    };
  };

  // ── claimTask ───────────────────────────────────────────────────────────────

  /// Claim an available task for Nduna to work on.
  /// POST https://0xwork.org/api/tasks/{taskId}/claim
  public func claimTask(apiKey : Text, taskId : Text) : async { #ok : Text; #err : Text } {
    if (apiKey == "") {
      return #err("0xWork API key not configured");
    };
    if (taskId == "") {
      return #err("taskId is required");
    };

    let httpRequest : IC.http_request_args = {
      url               = "https://0xwork.org/api/tasks/" # taskId # "/claim";
      max_response_bytes = ?5_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body          = ?"{}".encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("0xWork claim request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode 0xWork claim response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("0xWork claim HTTP " # response.status.toText() # ": " # json);
        };
        let status = extractTextField(json, "status");
        #ok(if (status != "") { "Task claimed: " # status } else { "Task claimed successfully" });
      };
    };
  };

  // ── submitTask ──────────────────────────────────────────────────────────────

  /// Submit a completed task deliverable.
  /// POST https://0xwork.org/api/tasks/{taskId}/submit
  public func submitTask(apiKey : Text, taskId : Text, deliverable : Text) : async { #ok : Text; #err : Text } {
    if (apiKey == "") {
      return #err("0xWork API key not configured");
    };
    if (taskId == "") {
      return #err("taskId is required");
    };

    let body = "{\"deliverable\":\"" # escapeJson(deliverable) # "\"}";

    let httpRequest : IC.http_request_args = {
      url               = "https://0xwork.org/api/tasks/" # taskId # "/submit";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body          = ?body.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("0xWork submit request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode 0xWork submit response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("0xWork submit HTTP " # response.status.toText() # ": " # json);
        };
        let reward = extractTextField(json, "reward");
        #ok(if (reward != "") { "Task submitted. Reward: " # reward # " USDC" } else { "Task submitted successfully" });
      };
    };
  };

  // ── Private helpers ──────────────────────────────────────────────────────────

  /// Extract a named text field from a JSON string.
  private func extractTextField(json : Text, fieldName : Text) : Text {
    let marker = "\"" # fieldName # "\":\"";
    switch (splitOnFirst(json, marker)) {
      case (null) { "" };
      case (?(_, rest)) { takeUntilQuote(rest) };
    };
  };

  /// Extract an optional text field — returns null if field is missing or "null".
  private func extractOptTextField(json : Text, fieldName : Text) : ?Text {
    let v = extractTextField(json, fieldName);
    if (v == "" or v == "null") { null } else { ?v };
  };

  /// Extract a numeric float field from JSON.
  private func extractFloatField(json : Text, fieldName : Text) : Float {
    let marker = "\"" # fieldName # "\":";
    switch (splitOnFirst(json, marker)) {
      case (null) { 0.0 };
      case (?(_, rest)) {
        let trimmed = rest.trim(#predicate(func(c : Char) : Bool {
          c == ' ' or c == '\n' or c == '\r' or c == '\t'
        }));
        // Parse digits manually — no Float.fromText in mo:core
        var intPart  : Nat   = 0;
        var fracNum  : Nat   = 0;
        var fracDen  : Nat   = 1;
        var sawDot   = false;
        var hasDigit = false;
        var done     = false;
        for (c in trimmed.toIter()) {
          if (not done) {
            let code = Nat.fromNat32(c.toNat32());
            if (code >= 48 and code <= 57) {
              hasDigit := true;
              let d : Nat = if (code >= 48) { code - 48 } else { 0 };
              if (sawDot) {
                fracNum := fracNum * 10 + d;
                fracDen := fracDen * 10;
              } else {
                intPart := intPart * 10 + d;
              };
            } else if (code == 46 and not sawDot) {
              sawDot := true;
            } else if (hasDigit) {
              done := true;
            };
          };
        };
        intPart.toFloat() + fracNum.toFloat() / fracDen.toFloat();
      };
    };
  };

  /// Extract a numeric Nat field from JSON.
  private func extractNatField(json : Text, fieldName : Text) : Nat {
    let marker = "\"" # fieldName # "\":";
    switch (splitOnFirst(json, marker)) {
      case (null) { 0 };
      case (?(_, rest)) {
        let trimmed = rest.trim(#predicate(func(c : Char) : Bool {
          c == ' ' or c == '\n' or c == '\r' or c == '\t'
        }));
        var digits = "";
        var done   = false;
        for (c in trimmed.toIter()) {
          if (not done) {
            let code = c.toNat32();
            if (code >= 48 and code <= 57) {
              digits := digits # Text.fromChar(c);
            } else if (digits != "") {
              done := true;
            };
          };
        };
        switch (Nat.fromText(digits)) {
          case (null) { 0 };
          case (?n)   { n };
        };
      };
    };
  };

  /// Parse a JSON array of task objects into TaskItem records.
  /// Scans for up to 10 repeated { "taskId":"...", ... } objects.
  private func parseTaskArray(json : Text) : [TaskItem] {
    var items : [TaskItem] = [];
    var remaining = json;
    let MAX_TASKS = 10;

    label outer loop {
      if (items.size() >= MAX_TASKS) { break outer };
      switch (splitOnFirst(remaining, "\"taskId\":\"")) {
        case (null) { break outer };
        case (?(objHead, afterId)) {
          let taskId = takeUntilQuote(afterId);
          if (taskId == "") { break outer };

          // Build a context window covering the current JSON object for field extraction.
          // We take text from afterId forward (up to next "taskId" marker or end).
          let objContext = objHead # "\"taskId\":\"" # afterId;
          let title       = extractTextField(objContext, "title");
          let description = extractTextField(objContext, "description");
          let reward      = extractFloatField(objContext, "reward");
          let capability  = extractTextField(objContext, "capability");

          let task : TaskItem = { taskId; title; description; reward; capability };
          items := items.concat([task]);

          // Advance remaining past this taskId value to find the next object
          switch (splitOnFirst(afterId, "\"taskId\":\"")) {
            case (null) { break outer };
            case (?(_, rest)) { remaining := "\"taskId\":\"" # rest };
          };
        };
      };
    };
    items;
  };

  /// Split text on the first occurrence of sep. Returns ?(before, after) or null.
  private func splitOnFirst(text : Text, sep : Text) : ?(Text, Text) {
    let textArr = text.toArray();
    let sepArr  = sep.toArray();
    let tLen    = textArr.size();
    let sLen    = sepArr.size();
    if (sLen == 0 or tLen < sLen) return null;

    var i = 0;
    while (i + sLen <= tLen) {
      var match = true;
      var j = 0;
      while (j < sLen) {
        if (textArr[i + j] != sepArr[j]) { match := false };
        j += 1;
      };
      if (match) {
        let before = Text.fromArray(textArr.sliceToArray(0, i));
        let after  = Text.fromArray(textArr.sliceToArray(i + sLen, tLen));
        return ?(before, after);
      };
      i += 1;
    };
    null;
  };

  /// Take characters from text until the first unescaped double-quote.
  private func takeUntilQuote(text : Text) : Text {
    var result  = "";
    var escaped = false;
    for (c in text.toIter()) {
      let code = c.toNat32();
      if (escaped) {
        if      (code == 110) { result := result # "\n" }
        else if (code == 116) { result := result # "\t" }
        else if (code == 114) { result := result # "\r" }
        else { result := result # Text.fromChar(c) };
        escaped := false;
      } else if (code == 92) {
        escaped := true;
      } else if (code == 34) {
        return result;
      } else {
        result := result # Text.fromChar(c);
      };
    };
    result;
  };

  /// Escape special characters for JSON string values.
  private func escapeJson(s : Text) : Text {
    var result = "";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if      (code == 34) { result := result # "\\\"" }
      else if (code == 92) { result := result # "\\\\" }
      else if (code == 10) { result := result # "\\n" }
      else if (code == 13) { result := result # "\\r" }
      else if (code == 9)  { result := result # "\\t" }
      else { result := result # Text.fromChar(c) };
    };
    result;
  };
};
