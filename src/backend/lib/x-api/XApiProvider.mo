import Text "mo:core/Text";
import Nat  "mo:core/Nat";
import IC   "ic:aaaaa-aa";

/// X (Twitter) API v2 HTTP outcall provider.
/// All functions are stateless — callers supply credentials on every call.
///
/// Auth note: ICP canisters cannot compute HMAC-SHA1 for OAuth 1.0a signing
/// (no native HMAC primitive). We use OAuth 2.0 App-only Bearer token auth
/// (xApiKey is treated as the Bearer token) via GET /2/tweets and POST /2/tweets.
/// For write access the X API v2 requires an Elevated app with read+write OAuth 2.0.
/// Admins should set xApiKey to their "Bearer Token" from the X Developer Portal.
///
/// HTTP outcall pattern: is_replicated = ?false, transform = null,
/// 100M cycles for write calls, 50M for read calls.
module {

  // ── postTweet ──────────────────────────────────────────────────────────────

  /// Post a tweet via X API v2.
  /// Uses OAuth 2.0 App-only Bearer token — xApiKey is the Bearer token.
  /// Content is truncated to 280 characters before sending.
  /// Returns the X tweet ID on success (e.g. "1234567890"), or #err with reason.
  public func postTweet(
    xApiKey     : Text,
    _xApiSecret : Text,       // reserved for future OAuth1 signing
    _accessToken : Text,      // reserved for future OAuth1 signing
    _accessSecret : Text,     // reserved for future OAuth1 signing
    content     : Text,
  ) : async { #ok : Text; #err : Text } {
    if (xApiKey == "") {
      return #err("X API Bearer token not configured");
    };

    // Truncate to 280 chars
    let truncated = if (content.size() > 280) {
      Text.fromArray(content.toArray().sliceToArray(0, 277)) # "..."
    } else {
      content
    };

    let body = "{\"text\":\"" # _escapeJson(truncated) # "\"}";

    let httpRequest : IC.http_request_args = {
      url               = "https://api.twitter.com/2/tweets";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # xApiKey },
        { name = "User-Agent";    value = "MoneyDrive-Nduna/1.0" },
      ];
      body          = ?body.encodeUtf8();
      method        = #post;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("X API request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode X API response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("X API HTTP " # response.status.toText() # ": " # json);
        };
        // Extract tweet ID from: {"data":{"id":"...","text":"..."}}
        let tweetId = _extractNestedTextField(json, "data", "id");
        if (tweetId != "") {
          #ok(tweetId)
        } else {
          // Graceful fallback — return a placeholder so post is marked as sent
          #ok("posted")
        };
      };
    };
  };

  // ── getTweetMetrics ────────────────────────────────────────────────────────

  /// Fetch engagement metrics for a published tweet.
  /// GET /2/tweets/{id}?tweet.fields=public_metrics
  /// Returns likes, retweets, replies, impressions, or #err with reason.
  public func getTweetMetrics(
    bearerToken : Text,
    tweetId     : Text,
  ) : async { #ok : { likes : Nat; retweets : Nat; replies : Nat; impressions : Nat }; #err : Text } {
    if (bearerToken == "") {
      return #err("X API Bearer token not configured");
    };
    if (tweetId == "") {
      return #err("tweetId is required");
    };

    let httpRequest : IC.http_request_args = {
      url = "https://api.twitter.com/2/tweets/" # tweetId # "?tweet.fields=public_metrics";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Authorization"; value = "Bearer " # bearerToken },
        { name = "User-Agent";    value = "MoneyDrive-Nduna/1.0" },
      ];
      body          = null;
      method        = #get;
      transform     = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("X metrics request failed: " # e.message());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode X metrics response") };
      case (?json) {
        if (response.status < 200 or response.status >= 300) {
          return #err("X metrics HTTP " # response.status.toText() # ": " # json);
        };
        // Extract from: {"data":{"public_metrics":{"like_count":5,...}}}
        let likes       = _extractNatFromNested(json, "like_count");
        let retweets    = _extractNatFromNested(json, "retweet_count");
        let replies     = _extractNatFromNested(json, "reply_count");
        let impressions = _extractNatFromNested(json, "impression_count");
        #ok({ likes; retweets; replies; impressions });
      };
    };
  };

  // ── Private helpers ──────────────────────────────────────────────────────────

  /// Escape special characters for JSON string values.
  private func _escapeJson(s : Text) : Text {
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
    result
  };

  /// Split text on the first occurrence of sep.
  private func _splitOnFirst(text : Text, sep : Text) : ?(Text, Text) {
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
    null
  };

  /// Take chars until the first unescaped double-quote.
  private func _takeUntilQuote(text : Text) : Text {
    var result  = "";
    var escaped = false;
    for (c in text.toIter()) {
      let code = c.toNat32();
      if (escaped) {
        result  := result # Text.fromChar(c);
        escaped := false;
      } else if (code == 92) {
        escaped := true;
      } else if (code == 34) {
        return result;
      } else {
        result := result # Text.fromChar(c);
      };
    };
    result
  };

  /// Extract a text field nested one level: outer.fieldName.
  private func _extractNestedTextField(json : Text, _outer : Text, fieldName : Text) : Text {
    let marker = "\"" # fieldName # "\":\"";
    switch (_splitOnFirst(json, marker)) {
      case (null) { "" };
      case (?(_, rest)) { _takeUntilQuote(rest) };
    };
  };

  /// Extract a Nat field from anywhere in the JSON (searches by field name).
  private func _extractNatFromNested(json : Text, fieldName : Text) : Nat {
    let marker = "\"" # fieldName # "\":";
    switch (_splitOnFirst(json, marker)) {
      case (null) { 0 };
      case (?(_, rest)) {
        var digits = "";
        var done   = false;
        for (c in rest.toIter()) {
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
};
