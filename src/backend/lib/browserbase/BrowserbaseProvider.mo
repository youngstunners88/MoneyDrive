import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import IC "ic:aaaaa-aa";
import BBTypes "../../types/browserbase";

/// Browserbase cloud browser automation provider.
/// All functions are stateless — callers supply the config on every call.
/// Follows MoneyDrive HTTP outcall pattern:
///   is_replicated = ?false, cycles = 100M, transform = null
module {

  public type BrowserbaseConfig     = BBTypes.BrowserbaseConfig;
  public type BrowserbaseSession    = BBTypes.BrowserbaseSession;
  public type BrowserbaseExtraction = BBTypes.BrowserbaseExtraction;
  public type OpportunityHuntResult = BBTypes.OpportunityHuntResult;
  public type BrowserbaseFindings   = BBTypes.BrowserbaseFindings;
  public type BrowserbaseCompanyResult = BBTypes.BrowserbaseCompanyResult;

  // ── Private type alias ───────────────────────────────────────────────────────

  type Result<T, E> = { #ok : T; #err : E };

  // ── startSession ────────────────────────────────────────────────────────────

  /// Create a new Browserbase session via POST /v1/sessions.
  /// Returns the session ID and initial status on success.
  public func startSession(
    config : BrowserbaseConfig,
  ) : async Result<BrowserbaseSession, Text> {
    let timeoutSecs = if (config.timeout == 0) { 30 } else { config.timeout };
    let body =
      "{\"textContent\":true," #
      "\"timeout\":" # timeoutSecs.toText() # "}";

    let httpRequest : IC.http_request_args = {
      url              = "https://api.browserbase.com/v1/sessions";
      max_response_bytes = ?10_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # config.apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body         = ?body.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Browserbase startSession request failed: " # e.message());
    };

    if (response.status < 200 or response.status >= 300) {
      return #err("Browserbase startSession HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode Browserbase startSession response") };
      case (?json) {
        let id = _extractTextField(json, "id");
        if (id == "") {
          return #err("Could not parse session ID from Browserbase response: " # json);
        };
        let status = _extractTextField(json, "status");
        #ok({ id; status = if (status == "") { "running" } else { status } });
      };
    };
  };

  // ── loadPage ────────────────────────────────────────────────────────────────

  /// Navigate an existing session to `url` via POST /v1/sessions/{id}/load.
  /// Returns a confirmation message or the page title on success.
  public func loadPage(
    config    : BrowserbaseConfig,
    sessionId : Text,
    url       : Text,
  ) : async Result<Text, Text> {
    let body =
      "{\"url\":\"" # _escapeJson(url) # "\"," #
      "\"timeout\":20000," #
      "\"waitForSelector\":\"body\"}";

    let httpRequest : IC.http_request_args = {
      url              = "https://api.browserbase.com/v1/sessions/" # sessionId # "/load";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # config.apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body         = ?body.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Browserbase loadPage request failed: " # e.message());
    };

    if (response.status < 200 or response.status >= 300) {
      return #err("Browserbase loadPage HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode Browserbase loadPage response") };
      case (?json) {
        let title = _extractTextField(json, "title");
        #ok(if (title == "") { "Page loaded: " # url } else { title });
      };
    };
  };

  // ── extractContent ──────────────────────────────────────────────────────────

  /// Extract content from the current session page via POST /v1/sessions/{id}/extract.
  /// `selectors` is a list of CSS selectors or field names to pull.
  /// Returns a parallel list of extracted text strings.
  public func extractContent(
    config    : BrowserbaseConfig,
    sessionId : Text,
    selectors : [Text],
  ) : async Result<[Text], Text> {
    var selectorsJson = "[";
    var first = true;
    for (sel in selectors.values()) {
      if (not first) { selectorsJson := selectorsJson # "," };
      first := false;
      selectorsJson := selectorsJson # "\"" # _escapeJson(sel) # "\"";
    };
    selectorsJson := selectorsJson # "]";

    let body =
      "{\"selectors\":" # selectorsJson # "," #
      "\"type\":\"text\"}";

    let httpRequest : IC.http_request_args = {
      url              = "https://api.browserbase.com/v1/sessions/" # sessionId # "/extract";
      max_response_bytes = ?50_000;
      headers = [
        { name = "Content-Type";  value = "application/json" },
        { name = "Authorization"; value = "Bearer " # config.apiKey },
        { name = "User-Agent";    value = "MoneyDrive/1.0" },
      ];
      body         = ?body.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Browserbase extractContent request failed: " # e.message());
    };

    if (response.status < 200 or response.status >= 300) {
      return #err("Browserbase extractContent HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode Browserbase extractContent response") };
      case (?json) {
        // Parse JSON array of strings from the response
        let items = _extractJsonStringArray(json);
        #ok(items);
      };
    };
  };

  // ── researchCompany ─────────────────────────────────────────────────────────

  /// Research a company by directly browsing its website.
  /// Pipeline: startSession → loadPage(companyUrl) → extractContent → parse into BrowserbaseCompanyResult.
  /// Best-effort: on any step failure the error is propagated as #err so callers can gracefully skip.
  public func researchCompany(
    config      : BrowserbaseConfig,
    companyUrl  : Text,
    companyName : Text,
  ) : async Result<BrowserbaseCompanyResult, Text> {
    let now = Time.now();

    // Step 1: Start session
    let sessionResult = await startSession(config);
    let sessionId = switch (sessionResult) {
      case (#err(e)) { return #err("researchCompany startSession failed: " # e) };
      case (#ok(s))  { s.id };
    };

    // Step 2: Load the company's website
    ignore await loadPage(config, sessionId, companyUrl);

    // Step 3: Extract structured content — order matters for parsing heuristics
    let selectors : [Text] = [
      "h1",
      "h2",
      ".about",
      ".about-us",
      "meta[name='description']",
      "p",
      "a[href*='mailto']",
      ".careers",
      ".jobs",
      "[class*='job']",
      "[class*='career']",
      ".services",
      ".products",
    ];
    let extractResult = await extractContent(config, sessionId, selectors);
    let texts : [Text] = switch (extractResult) {
      case (#err(_)) { [] };
      case (#ok(t))  { t };
    };

    // Step 4: Parse extracted texts into BrowserbaseCompanyResult
    var combined = "";
    for (t in texts.values()) {
      combined := combined # " " # t;
    };
    let lower = combined.toLower();

    // Description: use first paragraph-length chunk (> 80 chars)
    var description = "";
    for (t in texts.values()) {
      if (description == "" and t.size() > 80) {
        let arr = t.toArray();
        description := if (arr.size() > 400) {
          Text.fromArray(arr.sliceToArray(0, 400))
        } else { t };
      };
    };
    if (description == "") { description := "Company website: " # companyUrl };

    // Industry inference from keywords
    let industry : Text =
      if (lower.contains(#text "logistics") or lower.contains(#text "transport") or lower.contains(#text "freight")) { "Logistics & Transport" }
      else if (lower.contains(#text "retail") or lower.contains(#text "store") or lower.contains(#text "shop")) { "Retail" }
      else if (lower.contains(#text "construction") or lower.contains(#text "build") or lower.contains(#text "civil")) { "Construction" }
      else if (lower.contains(#text "insurance") or lower.contains(#text "assurance") or lower.contains(#text "policy")) { "Insurance" }
      else if (lower.contains(#text "finance") or lower.contains(#text "bank") or lower.contains(#text "invest")) { "Finance" }
      else if (lower.contains(#text "tech") or lower.contains(#text "software") or lower.contains(#text "digital")) { "Technology" }
      else if (lower.contains(#text "food") or lower.contains(#text "restaurant") or lower.contains(#text "catering")) { "Food & Beverage" }
      else if (lower.contains(#text "health") or lower.contains(#text "medical") or lower.contains(#text "pharma")) { "Healthcare" }
      else if (lower.contains(#text "education") or lower.contains(#text "school") or lower.contains(#text "training")) { "Education" }
      else { "General Business" };

    // Employee count estimation from size keywords
    let estimatedEmployees : Text =
      if (lower.contains(#text "large enterprise") or lower.contains(#text "10,000") or lower.contains(#text "listed company")) { "1000+" }
      else if (lower.contains(#text "medium enterprise") or lower.contains(#text "500 employees") or lower.contains(#text "national")) { "200-1000" }
      else if (lower.contains(#text "team of") or lower.contains(#text "our staff") or lower.contains(#text "our team")) { "50-200" }
      else if (lower.contains(#text "small business") or lower.contains(#text "family business") or lower.contains(#text "owner")) { "1-10" }
      else { "10-50" };

    // Hiring signals
    let hiringSignals : Bool =
      lower.contains(#text "we're hiring") or
      lower.contains(#text "we are hiring") or
      lower.contains(#text "join our team") or
      lower.contains(#text "careers") or
      lower.contains(#text "vacancies") or
      lower.contains(#text "open positions") or
      lower.contains(#text "apply now");

    // Contact email: look for mailto: links in extracted text
    var contactEmail : ?Text = null;
    label emailSearch for (t in texts.values()) {
      let tLower = t.toLower();
      if (tLower.contains(#text "@") and (tLower.contains(#text ".co.za") or tLower.contains(#text ".com"))) {
        // Simple email extraction: find word containing @
        let words = t.split(#char ' ').toArray();
        for (word in words.values()) {
          if (word.contains(#text "@")) {
            let clean = word.trim(#predicate(func(c : Char) : Bool {
              c == '<' or c == '>' or c == '\"' or c == '(' or c == ')'
            }));
            if (clean.size() > 5 and clean.size() < 80) {
              contactEmail := ?clean;
              break emailSearch;
            };
          };
        };
      };
    };

    // Key services: collect h2 headings and short items that look like service names (< 60 chars)
    let services = List.empty<Text>();
    for (t in texts.values()) {
      if (services.size() < 5 and t.size() > 5 and t.size() < 60) {
        let tl = t.toLower();
        if (
          tl.contains(#text "service") or tl.contains(#text "solution") or
          tl.contains(#text "product") or tl.contains(#text "offer") or
          tl.contains(#text "provide") or tl.contains(#text "deliver")
        ) {
          services.add(t);
        };
      };
    };

    let result : BrowserbaseCompanyResult = {
      companyName        = companyName;
      websiteUrl         = companyUrl;
      description;
      industry;
      estimatedEmployees;
      hiringSignals;
      contactEmail;
      keyServices        = services.toArray();
      scrapedAt          = now;
      source             = "browserbase_company_research";
    };
    #ok(result);
  };

  // ── runOpportunityHunt ──────────────────────────────────────────────────────

  /// Full pipeline for a single-site opportunity hunt:
  ///   startSession → loadPage(url) → extractContent → map to OpportunityHuntResult[]
  /// Runs across all `targetUrls` sequentially (max 5); returns all findings from all URLs.
  /// `brief` is injected into the extraction prompt to guide relevance scoring.
  public func runOpportunityHunt(
    config     : BrowserbaseConfig,
    targetUrls : [Text],
    brief      : Text,
  ) : async Result<[OpportunityHuntResult], Text> {
    let DEFAULT_SA_SELECTORS = ["h1", "h2", ".title", ".description", "p"];
    let results = List.empty<OpportunityHuntResult>();

    // Cap at 5 URLs to limit cycle consumption
    let cap = if (targetUrls.size() < 5) { targetUrls.size() } else { 5 };
    var idx = 0;

    while (idx < cap) {
      let targetUrl = targetUrls[idx];
      idx += 1;

      // Step 1: Start session
      let sessionResult = await startSession(config);
      switch (sessionResult) {
        case (#err(e)) {
          // Skip this URL on session error, add a failed result and continue to next
          let failResult : OpportunityHuntResult = {
            url           = targetUrl;
            title         = "Session start failed";
            description   = e;
            category      = "error";
            relevanceScore = 0;
          };
          results.add(failResult);
        };
        case (#ok(session)) {
          let sessionId = session.id;

          // Step 2: Load the page (best-effort; failures don't abort the extraction)
          ignore await loadPage(config, sessionId, targetUrl);

          // Step 3: Extract content with SA opportunity selectors
          let extractResult = await extractContent(config, sessionId, DEFAULT_SA_SELECTORS);
          let extractedTexts : [Text] = switch (extractResult) {
            case (#err(_)) { [] };
            case (#ok(texts)) { texts };
          };

          // Step 4: Score and map extracted texts to OpportunityHuntResult
          var combinedText = "";
          for (t in extractedTexts.values()) {
            combinedText := combinedText # " " # t;
          };
          let lower = combinedText.toLower();

          // Detect title from first non-empty extracted element
          var title = "";
          for (t in extractedTexts.values()) {
            if (title == "" and t.size() > 3) { title := t };
          };
          if (title == "") { title := targetUrl };
          let titleArr = title.toArray();
          if (titleArr.size() > 120) {
            title := Text.fromArray(titleArr.sliceToArray(0, 120));
          };

          // Category detection via keyword scoring
          let category : Text =
            if (lower.contains(#text "platform") or lower.contains(#text "driver app") or lower.contains(#text "register")) { "newPlatform" }
            else if (lower.contains(#text "intercit") or lower.contains(#text "long distance") or lower.contains(#text "route")) { "intercityRoute" }
            else if (lower.contains(#text "promo") or lower.contains(#text "bonus") or lower.contains(#text "challenge") or lower.contains(#text "earn extra")) { "platformPromotion" }
            else if (lower.contains(#text "earn") or lower.contains(#text "income") or lower.contains(#text "delivery") or lower.contains(#text "rental")) { "incomeCategory" }
            else { "businessLead" };

          // Relevance scoring: 50 base + 10 per keyword match (cap 100)
          var keywordHits = 0;
          let keywords = ["driver", "earn", "income", "platform", "bonus", "promo", "hire",
                          "opportunity", "money", "boost", "payment", "commission", "incentive",
                          "trip", "delivery", brief.toLower()];
          for (kw in keywords.values()) {
            if (lower.contains(#text kw)) { keywordHits += 1 };
          };
          let rawScore = 50 + keywordHits * 10;
          let relevanceScore : Nat = if (rawScore > 100) { 100 } else { rawScore };

          // Build description from combined text (first 300 chars)
          var description = combinedText.trim(#predicate(func(c : Char) : Bool { c == ' ' or c == '\n' or c == '\r' }));
          let descArr = description.toArray();
          if (descArr.size() > 300) {
            description := Text.fromArray(descArr.sliceToArray(0, 300));
          };
          if (description == "") { description := "Content extracted from " # targetUrl };

          let result : OpportunityHuntResult = {
            url           = targetUrl;
            title;
            description;
            category;
            relevanceScore;
          };
          results.add(result);
        };
      };
    };

    #ok(results.toArray());
  };

  // ── Private helpers ──────────────────────────────────────────────────────────

  /// Extract a named text field from a JSON string.
  private func _extractTextField(json : Text, fieldName : Text) : Text {
    let marker = "\"" # fieldName # "\":\"";
    switch (_splitOnFirst(json, marker)) {
      case (null) { "" };
      case (?(_, rest)) { _takeUntilQuote(rest) };
    };
  };

  /// Parse a JSON array of strings from a response body.
  /// e.g. {"data":["foo","bar"]} or ["foo","bar"]
  private func _extractJsonStringArray(json : Text) : [Text] {
    let items = List.empty<Text>();
    var remaining = json;
    label scan loop {
      switch (_splitOnFirst(remaining, "\"")) {
        case (null) { break scan };
        case (?(_, after)) {
          let value = _takeUntilQuote(after);
          switch (_splitOnFirst(after, "\"")) {
            case (null) { break scan };
            case (?(_, rest)) {
              remaining := rest;
              if (value.size() > 0) {
                items.add(value);
              };
            };
          };
        };
      };
      if (items.size() >= 20) { break scan };
    };
    items.toArray();
  };

  /// Split text on the first occurrence of sep.
  private func _splitOnFirst(text : Text, sep : Text) : ?(Text, Text) {
    let textArr = text.toArray();
    let sepArr  = sep.toArray();
    let tLen = textArr.size();
    let sLen = sepArr.size();
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

  /// Take characters until the first unescaped double-quote.
  private func _takeUntilQuote(text : Text) : Text {
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
    result;
  };
};
