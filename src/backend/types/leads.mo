module {
  /// Status of a scraped lead in the driver's outreach workflow.
  public type LeadStatus = {
    #pending;     // Not yet reviewed
    #interested;  // Driver marked as interested
    #pitched;     // Driver has pitched this company
    #rejected;    // Driver rejected or not relevant
    #dealClosed;  // Advertising deal signed
  };

  /// Exa company intelligence attached to an enriched lead.
  /// Populated by ExaProvider.companyResearch after Camofox scraping.
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

  /// A single company record scraped from public directories.
  public type ScrapedLead = {
    id            : Text;
    driverId      : Text;
    companyName   : Text;
    address       : Text;
    website       : Text;
    phone         : Text;
    email         : Text;
    industry      : Text;
    source        : Text;       // "google_business" | "yellowpages_sa" | "cipc" | "tavily"
    compositeScore : Nat;       // 0–100 ranking score
    scoringFactors : Text;      // JSON-like breakdown of scoring factors
    weekNumber    : Nat;        // ISO week number (1–53)
    year          : Nat;
    scrapedAt     : Int;        // Time.now() nanoseconds
    status        : LeadStatus;
    tavilyHiringSignal : Bool;  // true if Tavily detected hiring/expansion signals
    tavilySnippet      : Text;  // Short excerpt from Tavily result, or "" if not enriched
    exaEnriched        : ?ExaCompanyResult; // Exa company intelligence, null if not enriched
    browserbaseEnriched : ?BrowserbaseCompanyResult; // Browserbase fallback intelligence, null if not enriched
  };

  /// Browserbase company intelligence — mirrors types/browserbase.mo but defined here
  /// to avoid a circular dependency between leads and browserbase type modules.
  public type BrowserbaseCompanyResult = {
    companyName        : Text;
    websiteUrl         : Text;
    description        : Text;
    industry           : Text;
    estimatedEmployees : Text;
    hiringSignals      : Bool;
    contactEmail       : ?Text;
    keyServices        : [Text];
    scrapedAt          : Int;
    source             : Text;
  };

  /// Structured event intelligence returned by getEventsWithTavilyIntelligence.
  public type EventIntelligence = {
    name                   : Text;
    date                   : Text;   // free-text date from Tavily, e.g. "15 June 2025"
    expectedAttendance     : Text;   // free-text estimate, e.g. "10,000+"
    driverOpportunityScore : Nat;    // 0–100 scored by Nduna heuristic
    sourceUrl              : Text;
  };

  /// A batch of scraped leads for one driver in one week.
  public type LeadBatch = {
    driverId      : Text;
    weekNumber    : Nat;
    year          : Nat;
    leads         : [ScrapedLead];
    generatedAt   : Int;
    totalScraped  : Nat;        // Before ranking/dedup
    totalRanked   : Nat;        // After ranking (top 50 stored)
  };

  /// Audit log entry for a single scraping run against one source.
  public type ScraperAuditLog = {
    id             : Text;
    driverId       : Text;
    source         : Text;
    url            : Text;
    timestamp      : Int;
    success        : Bool;
    companiesFound : Nat;
    errorMessage   : ?Text;
  };

  /// Scheduler configuration for the weekly automation.
  public type SchedulerConfig = {
    dayOfWeek : Nat;   // 0 = Sunday, 1 = Monday … 6 = Saturday
    hour      : Nat;   // UTC hour (0–23)
    enabled   : Bool;
  };

  /// Input for generating a Nduna presentation / pitch deck.
  public type PresentationInput = {
    driverName               : Text;
    city                     : Text;
    routes                   : Text;
    tripsPerMonth            : Nat;
    avgPassengers            : Nat;
    vehicleModel             : Text;
    targetCompanyName        : Text;
    targetIndustry           : Text;
    estimatedMonthlyExposure : Nat;
    proposedDealValue        : Nat;  // In Rands
  };

  /// A single slide in a generated presentation.
  public type Slide = {
    slideType    : Text;    // "title" | "value_prop" | "exposure" | "comparison" | "cta"
    title        : Text;
    bullets      : [Text];
    speakerNotes : Text;
    dataPoint    : ?Text;   // Optional highlighted number/stat
  };

  /// A generated presentation / pitch deck.
  public type PresentationData = {
    id          : Text;
    slides      : [Slide];
    generatedAt : Int;
    shareToken  : Text;  // Public share token for viewer link
  };
};
