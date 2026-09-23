import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import LeadTypes "../types/leads";

/// Lead scraper library — Camofox-powered public directory scraping.
/// Builds structured prompts for the Camofox browser automation API.
/// Actual HTTP outcalls are made by the mixin (needs <system> capability).
module {

  // ── Session helpers ─────────────────────────────────────────────────────────

  /// Build request body for POST /tabs (create a new browser tab).
  public func buildCreateTabBody() : Text {
    "{}";
  };

  /// Build request body for POST /tabs/:tabId/navigate.
  public func buildNavigateBody(url : Text) : Text {
    "{\"url\":\"" # escapeJson(url) # "\"}";
  };

  /// Build request body for POST /tabs/:tabId/type.
  public func buildTypeBody(ref : Text, text : Text) : Text {
    "{\"ref\":\"" # escapeJson(ref) # "\",\"text\":\"" # escapeJson(text) # "\"}";
  };

  /// Build request body for POST /tabs/:tabId/click.
  public func buildClickBody(ref : Text) : Text {
    "{\"ref\":\"" # escapeJson(ref) # "\"}";
  };

  // ── URL builders ─────────────────────────────────────────────────────────────

  /// Google Business local search URL for a given industry + city.
  public func googleBusinessUrl(industry : Text, city : Text) : Text {
    let q = (industry # " companies " # city # " South Africa").replace(#char ' ', "+");
    "https://www.google.com/search?q=" # q # "&tbm=lcl";
  };

  /// Yellow Pages SA search URL.
  public func yellowPagesSAUrl(industry : Text, city : Text) : Text {
    let term  = industry.replace(#char ' ', "+");
    let where = city.replace(#char ' ', "+");
    "https://www.yellowpages.co.za/search?term=" # term # "&where=" # where;
  };

  /// CIPC enterprise search URL (start page — requires text input interaction).
  public func cipcSearchUrl() : Text {
    "https://www.cipc.co.za/index.php/search-enterprise/";
  };

  /// Robots.txt URL for a domain.
  public func robotsTxtUrl(domain : Text) : Text {
    domain # "/robots.txt";
  };

  // ── Robots.txt parsing ───────────────────────────────────────────────────────

  /// Parse a robots.txt body and check whether User-agent: * disallows the given path.
  /// Returns true if scraping is ALLOWED, false if disallowed.
  public func isPathAllowedByRobots(robotsBody : Text, path : Text) : Bool {
    // Simple line-by-line parser — respects User-agent: * Disallow: entries
    var inRelevantBlock = false;
    let disallowedPaths = List.empty<Text>();

    for (line in robotsBody.split(#char '\n')) {
      let trimmed = trimText(line);
      let lower   = trimmed.toLower();

      if (lower.startsWith(#text "user-agent:")) {
        let agent = trimText(trimmed.trimStart(#text "user-agent:"));
        inRelevantBlock := (agent == "*");
      } else if (inRelevantBlock and lower.startsWith(#text "disallow:")) {
        let disallowedPath = trimText(trimmed.trimStart(#text "disallow:"));
        if (disallowedPath != "") {
          disallowedPaths.add(disallowedPath);
        };
      };
    };

    // Check if path matches any disallowed entry
    not disallowedPaths.any(func(dp) { path.startsWith(#text dp) });
  };

  // ── Snapshot parsing ─────────────────────────────────────────────────────────

  /// Extract company leads from a Google Business snapshot text.
  /// Looks for patterns typical of local business results.
  public func parseGoogleBusinessSnapshot(
    snapshot  : Text,
    driverId  : Text,
    _city     : Text,
    industry  : Text,
    weekNumber : Nat,
    year      : Nat,
  ) : [LeadTypes.ScrapedLead] {
    let lines  = snapshot.split(#char '\n').toArray();
    let leads  = List.empty<LeadTypes.ScrapedLead>();
    let now    = Time.now();

    var i = 0;
    while (i < lines.size()) {
      let line = trimText(lines[i]);

      // Google local results embed business names as heading-like lines followed by address
      // Heuristic: line with no trailing punctuation, short, followed by an address-like line
      if (line.size() > 2 and line.size() < 80 and not line.startsWith(#text "http")) {
        let nextLine  = if (i + 1 < lines.size()) { trimText(lines[i + 1]) } else { "" };
        let isAddress = nextLine.contains(#text ",") or nextLine.contains(#text "Road") or nextLine.contains(#text "Street") or nextLine.contains(#text "Ave");

        if (isAddress) {
          let lead : LeadTypes.ScrapedLead = {
            id             = "gb_" # driverId # "_" # now.toText() # "_" # i.toText();
            driverId       = driverId;
            companyName    = line;
            address        = nextLine;
            website        = "";
            phone          = "";
            email          = "";
            industry       = industry;
            source         = "google_business";
            compositeScore = 0;
            scoringFactors = "";
            weekNumber     = weekNumber;
            year           = year;
            scrapedAt      = now;
            status         = #pending;
            tavilyHiringSignal = false;
            tavilySnippet      = "";
            exaEnriched        = null;
            browserbaseEnriched = null;
          };
          leads.add(lead);
          i := i + 1; // skip address line
        };
      };
      i := i + 1;
    };

    leads.toArray();
  };

  /// Extract company leads from a Yellow Pages SA snapshot text.
  public func parseYellowPagesSnapshot(
    snapshot  : Text,
    driverId  : Text,
    _city     : Text,
    industry  : Text,
    weekNumber : Nat,
    year      : Nat,
  ) : [LeadTypes.ScrapedLead] {
    let lines  = snapshot.split(#char '\n').toArray();
    let leads  = List.empty<LeadTypes.ScrapedLead>();
    let now    = Time.now();

    var i = 0;
    while (i < lines.size()) {
      let line = trimText(lines[i]);

      // Yellow Pages SA: business listing blocks contain name, phone, address
      // Heuristic: line is a business name if it's title-case and not a URL/nav element
      if (isProbableBusinessName(line)) {
        var phone   = "";
        var address = "";
        var website = "";

        // Scan forward for phone, address, website in the next 5 lines
        var j = i + 1;
        while (j < lines.size() and j < i + 6) {
          let next = trimText(lines[j]);
          if (isPhoneNumber(next)) {
            phone := next;
          } else if (next.startsWith(#text "http") or next.startsWith(#text "www")) {
            website := next;
          } else if (next.contains(#text ",") or next.contains(#text "Street") or next.contains(#text "Road")) {
            address := next;
          };
          j := j + 1;
        };

        let lead : LeadTypes.ScrapedLead = {
          id             = "yp_" # driverId # "_" # now.toText() # "_" # i.toText();
          driverId       = driverId;
          companyName    = line;
          address        = address;
          website        = website;
          phone          = phone;
          email          = "";
          industry       = industry;
          source         = "yellowpages_sa";
          compositeScore = 0;
          scoringFactors = "";
          weekNumber     = weekNumber;
          year           = year;
          scrapedAt      = now;
          status         = #pending;
          tavilyHiringSignal = false;
          tavilySnippet      = "";
          exaEnriched        = null;
          browserbaseEnriched = null;
        };
        leads.add(lead);
      };
      i := i + 1;
    };

    leads.toArray();
  };

  /// Extract company records from a CIPC results snapshot text.
  public func parseCIPCSnapshot(
    snapshot  : Text,
    driverId  : Text,
    weekNumber : Nat,
    year      : Nat,
  ) : [LeadTypes.ScrapedLead] {
    let lines  = snapshot.split(#char '\n').toArray();
    let leads  = List.empty<LeadTypes.ScrapedLead>();
    let now    = Time.now();

    // CIPC results show: Company Name | Registration Number | Status | City
    var i = 0;
    while (i < lines.size()) {
      let line = trimText(lines[i]);

      // Look for lines that contain a registration pattern (e.g. 2020/123456/07)
      if (containsRegistrationNumber(line)) {
        let parts = line.split(#char '|').toArray();
        if (parts.size() >= 2) {
          let name = trimText(parts[0]);
          let reg  = trimText(parts[1]);
          let addr = if (parts.size() >= 4) { trimText(parts[3]) } else { "" };

          let lead : LeadTypes.ScrapedLead = {
            id             = "cipc_" # driverId # "_" # now.toText() # "_" # i.toText();
            driverId       = driverId;
            companyName    = name;
            address        = addr;
            website        = "";
            phone          = "";
            email          = "";
            industry       = "Corporate";
            source         = "cipc";
            compositeScore = 0;
            scoringFactors = reg;  // Store reg number in scoringFactors for now
            weekNumber     = weekNumber;
            year           = year;
            scrapedAt      = now;
            status         = #pending;
            tavilyHiringSignal = false;
            tavilySnippet      = "";
            exaEnriched        = null;
            browserbaseEnriched = null;
          };
          leads.add(lead);
        };
      };
      i := i + 1;
    };

    leads.toArray();
  };

  // ── Deduplication ────────────────────────────────────────────────────────────

  /// Merge leads from multiple sources, removing duplicates by fuzzy name match.
  /// Two names are considered duplicates if one contains the other (case-insensitive).
  public func deduplicateLeads(allLeads : [LeadTypes.ScrapedLead]) : [LeadTypes.ScrapedLead] {
    let seen   = List.empty<Text>();
    let result = List.empty<LeadTypes.ScrapedLead>();

    for (lead in allLeads.values()) {
      let nameLower = lead.companyName.toLower();
      let isDupe    = seen.any(func(s : Text) : Bool {
        s.contains(#text nameLower) or nameLower.contains(#text s);
      });
      if (not isDupe) {
        seen.add(nameLower);
        result.add(lead);
      };
    };

    result.toArray();
  };

  // ── Audit log helpers ────────────────────────────────────────────────────────

  /// Build an audit log entry.
  public func buildAuditLog(
    id             : Text,
    driverId       : Text,
    source         : Text,
    url            : Text,
    success        : Bool,
    companiesFound : Nat,
    errorMessage   : ?Text,
  ) : LeadTypes.ScraperAuditLog {
    {
      id;
      driverId;
      source;
      url;
      timestamp      = Time.now();
      success;
      companiesFound;
      errorMessage;
    };
  };

  // ── Private helpers ──────────────────────────────────────────────────────────

  /// Trim leading and trailing whitespace from a text value.
  public func trimText(t : Text) : Text {
    t.trim(#predicate(func(c) { c == ' ' or c == '\t' or c == '\r' or c == '\n' }));
  };

  func isProbableBusinessName(line : Text) : Bool {
    let len = line.size();
    if (len < 3 or len > 100) { return false };
    if (line.startsWith(#text "http")) { return false };
    if (line.startsWith(#text "Tel") or line.startsWith(#text "Phone")) { return false };
    // Must contain at least one uppercase letter (proper noun)
    var hasUpper = false;
    for (c in line.toIter()) {
      if (c >= 'A' and c <= 'Z') { hasUpper := true };
    };
    hasUpper;
  };

  func isPhoneNumber(line : Text) : Bool {
    var digitCount = 0;
    for (c in line.toIter()) {
      if (c >= '0' and c <= '9') { digitCount := digitCount + 1 };
    };
    digitCount >= 9;
  };

  func containsRegistrationNumber(line : Text) : Bool {
    // SA registration numbers: YYYY/NNNNNN/NN format
    var slashCount = 0;
    for (c in line.toIter()) {
      if (c == '/') { slashCount := slashCount + 1 };
    };
    slashCount >= 2;
  };

  func escapeJson(s : Text) : Text {
    var result = "";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if (code == 34) { result := result # "\\\"" }
      else if (code == 92) { result := result # "\\\\" }
      else if (code == 10) { result := result # "\\n" }
      else if (code == 13) { result := result # "\\r" }
      else { result := result # Text.fromChar(c) };
    };
    result;
  };
};
