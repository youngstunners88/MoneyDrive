/// Types for the Browserbase cloud browser automation provider.
/// Used by BrowserbaseProvider.mo and mixins/intelligence-api.mo.
module {

  /// Configuration required to authenticate and drive a Browserbase session.
  public type BrowserbaseConfig = {
    apiKey    : Text;
    projectId : ?Text;   // Optional Browserbase project ID
    timeout   : Nat;     // Request timeout hint in seconds
  };

  /// A live Browserbase browser session.
  public type BrowserbaseSession = {
    id     : Text;   // Browserbase session ID
    status : Text;   // "running" | "idle" | "closed"
  };

  /// Structured result from a single content-extraction call.
  public type BrowserbaseExtraction = {
    data    : [Text];  // Extracted content strings, one per selector match
    success : Bool;
    error   : ?Text;   // Error message if success = false
  };

  /// A single opportunity finding returned by a Browserbase-driven hunt.
  public type OpportunityHuntResult = {
    url           : Text;
    title         : Text;
    description   : Text;
    category      : Text;   // Raw string; caller maps to OpportunityCategory
    relevanceScore : Nat;   // 0–100
  };

  /// Aggregated raw findings from a complete runOpportunityHunt() call.
  public type BrowserbaseFindings = {
    sessionId : Text;
    targetUrl : Text;
    results   : [OpportunityHuntResult];
    scrapedAt : Int;   // Time.now() nanoseconds
  };

  /// Structured company intelligence extracted by directly browsing a company's website.
  /// Populated by BrowserbaseProvider.researchCompany as a fallback when Exa returns no data.
  public type BrowserbaseCompanyResult = {
    companyName        : Text;
    websiteUrl         : Text;
    description        : Text;
    industry           : Text;
    estimatedEmployees : Text;  // e.g. "10-50", "50-200"
    hiringSignals      : Bool;  // true if job postings or "we're hiring" detected
    contactEmail       : ?Text;
    keyServices        : [Text]; // up to 5 key products/services
    scrapedAt          : Int;   // Time.now() nanoseconds
    source             : Text;  // always "browserbase_company_research"
  };
};
