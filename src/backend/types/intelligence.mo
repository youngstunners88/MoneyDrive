/// Types for MoneyDrive's SA Market Intelligence API.
/// Powers the Orbis marketplace data endpoint and getSAIntelligence public query.
/// All data is anonymised and aggregated — zero individual driver exposure.
module {

  /// Categories of intelligence data that can be queried.
  public type IntelligenceCategory = {
    #surgeWindows;       // Peak demand windows by city/area
    #topZones;           // Highest-earning zones by city
    #adConversionRates;  // Advertising deal close rates by industry
    #earningsBenchmarks; // Earnings benchmarks by platform and city
    #leadQuality;        // Lead quality distribution by category
  };

  /// A query request for a single category of intelligence.
  public type IntelligenceQuery = {
    category : IntelligenceCategory;
    city     : ?Text;   // Optional city filter; null = all SA
    limit    : Nat;     // Max data points to return (0 = no limit)
  };

  /// A single anonymised data point within an intelligence result.
  public type IntelligenceDataPoint = {
    name       : Text;   // Human-readable name, e.g. "Sandton", "08:00–10:00"
    value      : Float;  // Numeric value in the given unit
    unit       : Text;   // e.g. "ZAR/shift", "% conversion", "data points"
    sampleSize : Nat;    // Number of anonymised records this was derived from
  };

  /// A complete intelligence result for a query.
  public type IntelligenceResult = {
    category    : Text;   // String form of IntelligenceCategory variant
    city        : Text;   // Applied city filter or "All SA"
    generatedAt : Int;    // Time.now() nanoseconds when result was computed
    data        : [IntelligenceDataPoint];
  };

  /// Configuration for listing MoneyDrive's aggregated intelligence as a paid
  /// API on the Orbis marketplace.
  public type OrbisListingConfig = {
    providerApiKey : Text;   // Orbis provider dashboard API key (admin-only)
    listingName    : Text;   // Display name on Orbis marketplace
    pricePerCall   : Float;  // USD price per API call (e.g. 0.05)
    autoPublish    : Bool;   // Automatically re-publish after config changes
  };

  /// Current status of MoneyDrive's Orbis marketplace listing.
  public type OrbisListingStatus = {
    listed      : Bool;
    listingId   : ?Text;  // Orbis listing ID once published
    totalCalls  : Nat;    // Cumulative API calls received via Orbis
    usdcEarned  : Float;  // Cumulative USDC earned (80% share)
  };
};
