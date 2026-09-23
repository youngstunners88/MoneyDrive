import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Debug "mo:core/Debug";
import IC "ic:aaaaa-aa";

/// Exa API integration module.
/// Provides:
///   - companyResearch — structured company intelligence for lead enrichment and pitch decks
///   - peopleSearch    — people/contact research for a company
///
/// All HTTP calls follow MoneyDrive pattern:
///   is_replicated = ?false, cycles = 75_000_000_000, transform = null
/// x-api-key header auth (Exa uses "x-api-key").
module {

  // ── Public types ─────────────────────────────────────────────────────────────

  /// Structured company intelligence returned by companyResearch.
  public type ExaCompanyResult = {
    name         : Text;
    url          : Text;
    industry     : ?Text;
    employeeCount : ?Text;
    founded      : ?Text;
    description  : ?Text;
    contactEmail : ?Text;
    snippet      : Text;
  };

  /// A single person / contact record returned by peopleSearch.
  public type ExaPerson = {
    name    : Text;
    title   : ?Text;
    company : ?Text;
    linkedin : ?Text;
    email   : ?Text;
  };

  type Result<T, E> = { #ok : T; #err : E };

  // ── companyResearch ──────────────────────────────────────────────────────────

  /// Search Exa for a company and return structured intelligence.
  /// Uses POST /search with auto type and text contents enabled.
  /// 75M cycles; pilot guard returns a stub immediately.
  public func companyResearch(
    apiKey      : Text,
    searchQuery : Text,
    pilotMode   : Bool,
  ) : async* Result<ExaCompanyResult, Text> {
    let searchTerm = searchQuery;
    if (pilotMode) {
      Debug.print("[pilot_mode] skipped outcall: exa companyResearch");
      return #ok({
        name         = searchTerm;
        url          = "";
        industry     = null;
        employeeCount = null;
        founded      = null;
        description  = null;
        contactEmail = null;
        snippet      = "[pilot_mode] Exa enrichment disabled during pilot";
      });
    };

    if (apiKey == "") {
      return #err("Exa API key not configured");
    };

    let requestBody =
      "{\"query\":\"" # _escapeJson(searchTerm) # "\"," #
      "\"type\":\"auto\"," #
      "\"numResults\":3," #
      "\"contents\":{\"text\":true,\"highlights\":true}}";

    let httpRequest : IC.http_request_args = {
      url = "https://api.exa.ai/search";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "x-api-key";    value = apiKey },
        { name = "User-Agent";   value = "MoneyDrive/1.0" },
      ];
      body         = ?requestBody.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 75_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Exa companyResearch request failed: " # e.message());
    };

    if (response.status == 401) {
      return #err("Exa API key invalid (401)");
    };
    if (response.status == 429) {
      return #err("Exa rate limit exceeded (429)");
    };
    if (response.status < 200 or response.status >= 300) {
      return #err("Exa returned HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode Exa companyResearch response") };
      case (?json) { #ok(_parseCompanyResult(json, searchTerm)) };
    };
  };

  // ── peopleSearch ─────────────────────────────────────────────────────────────

  /// Search Exa for people associated with a company query.
  /// Uses livecrawl: "always" for fresher results.
  /// 75M cycles; pilot guard returns a stub immediately.
  public func peopleSearch(
    apiKey      : Text,
    searchQuery : Text,
    pilotMode   : Bool,
  ) : async* Result<[ExaPerson], Text> {
    let searchTerm = searchQuery;
    if (pilotMode) {
      Debug.print("[pilot_mode] skipped outcall: exa peopleSearch");
      return #ok([]);
    };

    if (apiKey == "") {
      return #err("Exa API key not configured");
    };

    let requestBody =
      "{\"query\":\"" # _escapeJson(searchTerm) # "\"," #
      "\"type\":\"auto\"," #
      "\"numResults\":5," #
      "\"livecrawl\":\"always\"," #
      "\"contents\":{\"text\":true,\"highlights\":true}}";

    let httpRequest : IC.http_request_args = {
      url = "https://api.exa.ai/search";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "x-api-key";    value = apiKey },
        { name = "User-Agent";   value = "MoneyDrive/1.0" },
      ];
      body         = ?requestBody.encodeUtf8();
      method       = #post;
      transform    = null;
      is_replicated = ?false;
    };

    let response = try {
      await (with cycles = 75_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Exa peopleSearch request failed: " # e.message());
    };

    if (response.status == 401) {
      return #err("Exa API key invalid (401)");
    };
    if (response.status == 429) {
      return #err("Exa rate limit exceeded (429)");
    };
    if (response.status < 200 or response.status >= 300) {
      return #err("Exa peopleSearch returned HTTP " # response.status.toText());
    };

    switch (response.body.decodeUtf8()) {
      case (null) { #err("Could not decode Exa peopleSearch response") };
      case (?json) { #ok(_parsePeopleResults(json)) };
    };
  };

  // ── Private helpers ───────────────────────────────────────────────────────────

  /// Parse the primary ExaCompanyResult from the Exa search JSON response.
  /// Uses results[0] as the primary match.
  private func _parseCompanyResult(json : Text, fallbackName : Text) : ExaCompanyResult {
    // Extract the first result object's fields
    let url     = _extractAfterMarker(json, "\"url\":\"");
    let snippet = _extractSnippet(json);
    let text    = _extractAfterMarker(json, "\"text\":\"");

    // Derive name: try "title" field first, fall back to domain from url
    var name = _extractAfterMarker(json, "\"title\":\"");
    if (name == "") { name := _domainFromUrl(url) };
    if (name == "") { name := fallbackName };

    // Best-effort extract company metadata from the text content
    let industry     = _detectIndustry(text # " " # snippet);
    let employeeCount = _detectEmployeeCount(text # " " # snippet);
    let founded      = _detectFounded(text # " " # snippet);
    let contactEmail = _detectEmail(text # " " # snippet);
    let description  = _buildDescription(text, snippet);

    {
      name;
      url;
      industry;
      employeeCount;
      founded;
      description;
      contactEmail;
      snippet = if (snippet != "") { snippet } else { text };
    };
  };

  /// Parse all ExaPerson records from a people search response.
  private func _parsePeopleResults(json : Text) : [ExaPerson] {
    let people = List.empty<ExaPerson>();
    var remaining = json;

    // Walk through "results" array entries — each contains url, title, text
    label scan loop {
      switch (_splitOnFirst(remaining, "\"url\":\"")) {
        case (null) { break scan };
        case (?(_, afterUrl)) {
          let url       = _takeUntilQuote(afterUrl);
          let nameInUrl = _nameFromLinkedinUrl(url);
          let title     = _extractAfterMarker(remaining, "\"title\":\"");
          let text      = _extractAfterMarker(remaining, "\"text\":\"");
          let email     = _detectEmail(text);

          // Parse display name and job title from the title field
          // LinkedIn titles often look like "First Last – Job Title at Company"
          let (personName, jobTitle, company) = _parseLinkedinTitle(title, nameInUrl);

          let person : ExaPerson = {
            name     = personName;
            title    = if (jobTitle == "") { null } else { ?jobTitle };
            company  = if (company == "") { null } else { ?company };
            linkedin = if (url.contains(#text "linkedin.com")) { ?url } else { null };
            email    = email;
          };
          people.add(person);

          // Advance past this result entry
          switch (_splitOnFirst(afterUrl, "\"url\":\"")) {
            case (null) { break scan };
            case (?(_, next)) { remaining := "\"url\":\"" # next };
          };
        };
      };
      if (people.size() >= 5) { break scan };
    };

    people.toArray();
  };

  /// Extract the snippet / highlight text from an Exa response.
  private func _extractSnippet(json : Text) : Text {
    // Try highlights array first
    switch (_splitOnFirst(json, "\"highlights\":")) {
      case (?(_, afterHighlights)) {
        switch (_splitOnFirst(afterHighlights, "\"")) {
          case (?(_, rest)) {
            let s = _takeUntilQuote(rest);
            if (s.size() > 10) {
              let arr = s.toArray();
              if (arr.size() > 300) {
                return Text.fromArray(arr.sliceToArray(0, 300));
              };
              return s;
            };
          };
          case (null) {};
        };
      };
      case (null) {};
    };
    // Fall back to first text snippet
    let text = _extractAfterMarker(json, "\"text\":\"");
    let arr = text.toArray();
    if (arr.size() > 300) {
      Text.fromArray(arr.sliceToArray(0, 300))
    } else {
      text
    };
  };

  private func _extractAfterMarker(json : Text, marker : Text) : Text {
    switch (_splitOnFirst(json, marker)) {
      case (null) { "" };
      case (?(_, rest)) { _takeUntilQuote(rest) };
    };
  };

  private func _domainFromUrl(url : Text) : Text {
    // https://www.example.com/... → example.com
    switch (_splitOnFirst(url, "://")) {
      case (null) { url };
      case (?(_, afterScheme)) {
        // Strip www.
        let withoutWww = if (afterScheme.startsWith(#text "www.")) {
          switch (_splitOnFirst(afterScheme, "www.")) {
            case (null) { afterScheme };
            case (?(_, rest)) { rest };
          };
        } else { afterScheme };
        // Take until first /
        switch (_splitOnFirst(withoutWww, "/")) {
          case (null) { withoutWww };
          case (?(domain, _)) { domain };
        };
      };
    };
  };

  private func _detectIndustry(text : Text) : ?Text {
    let lower = text.toLower();
    let industries = [
      ("logistics", "Logistics & Transport"),
      ("transport", "Logistics & Transport"),
      ("delivery", "Delivery & Courier"),
      ("retail", "Retail"),
      ("financial services", "Financial Services"),
      ("insurance", "Insurance"),
      ("technology", "Technology"),
      ("telco", "Telecommunications"),
      ("telecommunications", "Telecommunications"),
      ("mining", "Mining"),
      ("construction", "Construction"),
      ("healthcare", "Healthcare"),
      ("manufacturing", "Manufacturing"),
      ("fmcg", "FMCG"),
    ];
    for ((kw, displayLabel) in industries.values()) {
      if (lower.contains(#text kw)) { return ?displayLabel };
    };
    null;
  };

  private func _detectEmployeeCount(text : Text) : ?Text {
    let lower = text.toLower();
    let markers = [
      ("50,000", "50,000+"),
      ("10,000", "10,000+"),
      ("5,000", "5,000+"),
      ("1,000", "1,000+"),
      ("500 employee", "500+"),
      ("200 employee", "200+"),
      ("100 employee", "100+"),
      ("50 employee", "50+"),
    ];
    for ((kw, displayLabel) in markers.values()) {
      if (lower.contains(#text kw)) { return ?displayLabel };
    };
    null;
  };

  private func _detectFounded(text : Text) : ?Text {
    // Look for patterns like "founded in 1999" or "established 2001"
    let lower = text.toLower();
    let markers = ["founded in ", "founded ", "established in ", "established "];
    for (marker in markers.values()) {
      switch (_splitOnFirst(lower, marker)) {
        case (null) {};
        case (?(_, rest)) {
          var digits = "";
          var count = 0;
          for (c in rest.toIter()) {
            let code = c.toNat32();
            if (code >= 48 and code <= 57) {
              digits := digits # Text.fromChar(c);
              count += 1;
            } else if (digits != "") {
              // Stop after collecting digits
              count := 999;
            };
            if (count >= 4) {
              // We have enough digits for a year
              return ?(digits);
            };
          };
        };
      };
    };
    null;
  };

  private func _detectEmail(text : Text) : ?Text {
    switch (_splitOnFirst(text, "@")) {
      case (null) { null };
      case (?(before, after)) {
        // Extract local part (backwards from @)
        let beforeArr = before.toArray();
        var localStart = beforeArr.size();
        var i = beforeArr.size();
        while (i > 0) {
          i -= 1;
          let c = beforeArr[i];
          let code = c.toNat32();
          if (code == 32 or code == 34 or code == 10 or code == 13 or code == 9) {
            localStart := i + 1;
            i := 0; // break
          };
        };
        let localPart = Text.fromArray(beforeArr.sliceToArray(localStart, beforeArr.size()));
        // Extract domain part
        var domainPart = "";
        var inDomain = true;
        for (c in after.toIter()) {
          let code = c.toNat32();
          if (inDomain and (code == 32 or code == 34 or code == 10 or code == 13)) {
            inDomain := false;
          } else if (inDomain) {
            domainPart := domainPart # Text.fromChar(c);
          };
        };
        if (localPart.size() > 0 and domainPart.contains(#text ".")) {
          ?(localPart # "@" # domainPart)
        } else { null };
      };
    };
  };

  private func _buildDescription(text : Text, snippet : Text) : ?Text {
    let src = if (snippet.size() > text.size()) { snippet } else { text };
    if (src == "") { return null };
    let arr = src.toArray();
    let len = if (arr.size() > 200) { 200 } else { arr.size() };
    ?(Text.fromArray(arr.sliceToArray(0, len)));
  };

  private func _nameFromLinkedinUrl(url : Text) : Text {
    // https://www.linkedin.com/in/first-last → first-last → First Last
    switch (_splitOnFirst(url, "/in/")) {
      case (null) { "" };
      case (?(_, rest)) {
        switch (_splitOnFirst(rest, "/")) {
          case (null) {
            // Replace hyphens with spaces, title-case
            rest.replace(#char '-', " ")
          };
          case (?(slug, _)) {
            slug.replace(#char '-', " ")
          };
        };
      };
    };
  };

  private func _parseLinkedinTitle(title : Text, fallbackName : Text) : (Text, Text, Text) {
    // Common patterns: "First Last – Job Title at Company" or "First Last | Job | Company"
    let separators = [" – ", " — ", " | ", " - "];
    for (sep in separators.values()) {
      switch (_splitOnFirst(title, sep)) {
        case (?(name, rest)) {
          // Rest may be "Job at Company" or just "Job"
          switch (_splitOnFirst(rest, " at ")) {
            case (?(job, company)) { return (name, job, company) };
            case (null) { return (name, rest, "") };
          };
        };
        case (null) {};
      };
    };
    // No separator found — whole title is the name
    let name = if (title != "") { title } else { fallbackName };
    (name, "", "");
  };

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
    null;
  };

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
