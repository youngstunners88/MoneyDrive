import Text "mo:core/Text";
import Nat "mo:core/Nat";
import IC "ic:aaaaa-aa";
import AgentTypes "../../types/agent";

/// Orbis API integration module.
/// Provides:
///   - queryOrbisFallback   — OpenAI-compatible chat via Orbis free LLM API
///   - scorePromptQuality   — PQS pre-flight quality score (0–100)
///   - selfRegisterOnOrbis  — Agent self-registration + free-tier subscribe
///
/// All HTTP calls follow MoneyDrive pattern:
///   is_replicated = ?false, cycles = 100_000_000_000, transform = null
module {

  public type AgentMessage = AgentTypes.AgentMessage;

  // ── Constants ──────────────────────────────────────────────────────────────

  /// Default fallback model — Llama 3.3 70B on Orbis free tier.
  let DEFAULT_MODEL : Text = "llama-3.3-70b";

  /// Minimum PQS score to pass through — queries below this get a clarification prompt.
  public let PQS_MIN_SCORE : Nat = 40;

  /// Response returned to the user when their prompt scores below PQS_MIN_SCORE.
  public let PQS_LOW_SCORE_REPLY : Text =
    "I want to help — could you share a bit more detail so I can give you the most useful answer?";

  // ── queryOrbisFallback ─────────────────────────────────────────────────────

  /// Send a chat request to the Orbis LLM API as an OpenAI-compatible fallback.
  /// Uses the free Orbis tier (llama-3.3-70b by default).
  /// Returns the assistant text reply on success, or a readable #err on failure.
  public func queryOrbisFallback(
    apiKey   : Text,
    model    : Text,
    messages : [AgentMessage],
  ) : async* {#ok : Text; #err : Text} {
    if (apiKey == "") {
      return #err("Orbis API key not configured");
    };

    let resolvedModel = if (model == "") { DEFAULT_MODEL } else { model };

    // Build JSON messages array
    var messagesJson = "[";
    var first = true;
    for (msg in messages.values()) {
      if (not first) { messagesJson := messagesJson # "," };
      first := false;
      messagesJson := messagesJson #
        "{\"role\":\"" # escapeJson(msg.role) # "\"," #
        "\"content\":\"" # escapeJson(msg.content) # "\"}";
    };
    messagesJson := messagesJson # "]";

    let requestBody =
      "{\"model\":\"" # escapeJson(resolvedModel) # "\"," #
      "\"messages\":" # messagesJson # "," #
      "\"max_tokens\":600,\"temperature\":0.7}";

    let httpRequest : IC.http_request_args = {
      url = "https://orbisapi.com/api/v1/chat/completions";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "x-orbis-key"; value = apiKey },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Orbis request failed: " # e.message());
    };

    if (response.status < 200 or response.status >= 300) {
      return #err("Orbis returned HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode Orbis response") };
      case (?text) {
        let content = extractContent(text);
        if (content == "") {
          #err("Orbis returned empty content")
        } else {
          #ok(content)
        }
      };
    };
  };

  // ── scorePromptQuality ─────────────────────────────────────────────────────

  /// Score a prompt using the Orbis Prompt Quality Score (PQS) endpoint.
  /// Evaluates across 8 dimensions: clarity, specificity, context, actionability,
  /// safety, relevance, format, completeness.
  /// Returns overall score (0–100) on success, or #err on any failure.
  /// Errors are intentionally graceful — callers MUST NOT block on PQS failure.
  public func scorePromptQuality(
    apiKey       : Text,
    prompt       : Text,
    systemPrompt : Text,
  ) : async* {#ok : Nat; #err : Text} {
    if (apiKey == "") {
      return #err("Orbis API key not configured");
    };

    let requestBody =
      "{\"prompt\":\"" # escapeJson(prompt) # "\"," #
      "\"systemPrompt\":\"" # escapeJson(systemPrompt) # "\"," #
      "\"dimensions\":[\"clarity\",\"specificity\",\"context\",\"actionability\"," #
      "\"safety\",\"relevance\",\"format\",\"completeness\"]}";

    let httpRequest : IC.http_request_args = {
      url = "https://orbisapi.com/api/pqs";
      max_response_bytes = ?4_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "x-orbis-key"; value = apiKey },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("PQS request failed: " # e.message());
    };

    if (response.status < 200 or response.status >= 300) {
      return #err("PQS returned HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode PQS response") };
      case (?text) {
        let score = extractOverallScore(text);
        switch (score) {
          case (null) { #err("Could not parse PQS score from response") };
          case (?s)   { #ok(s) };
        };
      };
    };
  };

  // ── selfRegisterOnOrbis ────────────────────────────────────────────────────

  /// Agent self-registration on Orbis:
  ///   1. GET /api/agents/discovery  → find free tier ID
  ///   2. POST /api/agents/register  → create agent account
  ///   3. POST /api/agents/subscribe → subscribe to free tier, get sk_... key
  ///
  /// Returns the sk_... API key string on success, or #err on failure.
  public func selfRegisterOnOrbis(
    email    : Text,
    password : Text,
    username : Text,
  ) : async* {#ok : Text; #err : Text} {

    // Step 1: discover free tier ID
    let discoveryReq : IC.http_request_args = {
      url = "https://orbisapi.com/api/agents/discovery";
      max_response_bytes = ?10_000;
      headers = [
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
        { name = "Accept"; value = "application/json" },
      ];
      body = null;
      method = #get;
      transform = null;
      is_replicated = ?false;
    };

    let discoveryResp = try {
      await (with cycles = 50_000_000_000) IC.http_request(discoveryReq);
    } catch (e) {
      return #err("Discovery request failed: " # e.message());
    };

    let discoveryJson = switch (discoveryResp.body.decodeUtf8()) {
      case (null) { return #err("Could not decode discovery response") };
      case (?t)   { t };
    };

    // Extract the first free tier ID
    let tierId = extractFreeTierId(discoveryJson);

    // Step 2: register agent account
    let registerBody =
      "{\"email\":\"" # escapeJson(email) # "\"," #
      "\"password\":\"" # escapeJson(password) # "\"," #
      "\"username\":\"" # escapeJson(username) # "\"}";

    let registerReq : IC.http_request_args = {
      url = "https://orbisapi.com/api/agents/register";
      max_response_bytes = ?4_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?registerBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let registerResp = try {
      await (with cycles = 50_000_000_000) IC.http_request(registerReq);
    } catch (e) {
      return #err("Registration request failed: " # e.message());
    };

    let registerJson = switch (registerResp.body.decodeUtf8()) {
      case (null) { return #err("Could not decode registration response") };
      case (?t)   { t };
    };

    if (registerResp.status < 200 or registerResp.status >= 300) {
      return #err("Registration failed (HTTP " # registerResp.status.toText() # "): " # registerJson);
    };

    // Extract auth token from registration response for subscription call
    let authToken = extractTextField(registerJson, "token");

    // Step 3: subscribe to free tier
    let subscribeBody =
      "{\"tierId\":\"" # escapeJson(tierId) # "\"}";

    let subscribeHeaders : [IC.http_header] = if (authToken == "") {
      [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ]
    } else {
      [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # authToken },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ]
    };

    let subscribeReq : IC.http_request_args = {
      url = "https://orbisapi.com/api/agents/subscribe";
      max_response_bytes = ?4_000;
      headers = subscribeHeaders;
      body = ?subscribeBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let subscribeResp = try {
      await (with cycles = 50_000_000_000) IC.http_request(subscribeReq);
    } catch (e) {
      return #err("Subscribe request failed: " # e.message());
    };

    let subscribeJson = switch (subscribeResp.body.decodeUtf8()) {
      case (null) { return #err("Could not decode subscribe response") };
      case (?t)   { t };
    };

    if (subscribeResp.status < 200 or subscribeResp.status >= 300) {
      return #err("Subscribe failed (HTTP " # subscribeResp.status.toText() # "): " # subscribeJson);
    };

    // Extract the sk_... API key from subscribe response
    let apiKey = extractTextField(subscribeJson, "apiKey");
    if (apiKey == "") {
      let altKey = extractTextField(subscribeJson, "key");
      if (altKey == "") {
        return #err("Could not extract API key from subscribe response: " # subscribeJson);
      };
      return #ok(altKey);
    };
    #ok(apiKey);
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Extract the assistant content from an OpenAI-compatible chat response JSON.
  private func extractContent(json : Text) : Text {
    switch (splitOnFirst(json, "\"message\":")) {
      case (?(_, afterMessage)) {
        var remaining = afterMessage;
        label contentScan loop {
          switch (splitOnFirst(remaining, "\"content\":\"")) {
            case (null) { break contentScan };
            case (?(before, after)) {
              let beforeArr = before.toArray();
              let checkLen = if (beforeArr.size() >= 10) { 10 } else { beforeArr.size() };
              let tail = Text.fromArray(beforeArr.sliceToArray(beforeArr.size() - checkLen : Nat, beforeArr.size()));
              if (tail.contains(#text "reasoning_")) {
                remaining := after;
              } else {
                return takeUntilQuote(after);
              };
            };
          };
        };
      };
      case (null) {};
    };
    switch (splitOnFirst(json, "\"content\":\"")) {
      case (null) { "" };
      case (?(_, rest)) { takeUntilQuote(rest) };
    };
  };

  /// Extract "overall" or "score" numeric field from PQS response JSON.
  private func extractOverallScore(json : Text) : ?Nat {
    let candidates = ["\"overall\":", "\"score\":", "\"overallScore\":"];
    for (field in candidates.values()) {
      switch (splitOnFirst(json, field)) {
        case (null) {};
        case (?(_, rest)) {
          let trimmed = rest.trim(#predicate(func(c : Char) : Bool {
            c == ' ' or c == '\n' or c == '\r' or c == '\t'
          }));
          var digits = "";
          var done = false;
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
          if (digits != "") {
            return Nat.fromText(digits);
          };
        };
      };
    };
    null;
  };

  /// Extract the first free tier ID from the discovery response JSON.
  private func extractFreeTierId(json : Text) : Text {
    let lowerJson = json.toLower();
    switch (splitOnFirst(lowerJson, "\"price\":0")) {
      case (?(before, _)) {
        switch (splitOnFirst(before, "\"tierid\":\"")) {
          case (null) {};
          case (?(_, rest)) {
            let tid = takeUntilQuote(rest);
            if (tid != "") { return tid };
          };
        };
      };
      case (null) {};
    };
    switch (splitOnFirst(json, "\"tierId\":\"")) {
      case (null) { "free" };
      case (?(_, rest)) {
        let tid = takeUntilQuote(rest);
        if (tid == "") { "free" } else { tid };
      };
    };
  };

  /// Extract a named text field value from a JSON string.
  private func extractTextField(json : Text, fieldName : Text) : Text {
    let marker = "\"" # fieldName # "\":\"";
    switch (splitOnFirst(json, marker)) {
      case (null) { "" };
      case (?(_, rest)) { takeUntilQuote(rest) };
    };
  };

  /// Take characters from `text` until the first unescaped double-quote.
  private func takeUntilQuote(text : Text) : Text {
    var result = "";
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

  /// Split text into (before, after) on first occurrence of sep.
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
        var before = "";
        var k = 0;
        while (k < i) {
          before := before # Text.fromChar(textArr[k]);
          k += 1;
        };
        var after = "";
        var m = i + sLen;
        while (m < tLen) {
          after := after # Text.fromChar(textArr[m]);
          m += 1;
        };
        return ?(before, after);
      };
      i += 1;
    };
    null;
  };

  /// Escape special characters for inclusion in a JSON string value.
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
