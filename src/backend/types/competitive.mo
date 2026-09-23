module {
  /// Anonymous leaderboard entry per city for advertising deal performance.
  public type CityLeaderEntry = {
    city : Text;
    dealsClosed : Nat;
    avgDealValue : Nat;   // in Rands
    topCompany : Text;
    month : Text;         // e.g. "2026-04"
  };

  /// Aggregated responsiveness data for an advertising company across all pitches.
  public type CompanyResponsiveness = {
    companyName : Text;
    responseRate : Nat;       // percentage 0–100
    avgDealValue : Nat;       // in Rands
    totalPitches : Nat;
    successfulDeals : Nat;
  };

  /// Full competitive intelligence snapshot for a given month.
  public type CompetitiveStats = {
    cityLeaderboard : [CityLeaderEntry];
    topCompanies : [CompanyResponsiveness];
    networkSurgeAccuracy : Float;   // aggregate surge accuracy across all drivers (0.0–1.0)
    totalDriversInNetwork : Nat;
    month : Text;                   // e.g. "2026-04"
  };

  /// A single driver's competitive standing within their city.
  public type DriverCompetitiveProfile = {
    driverId : Text;
    city : Text;
    surgeAccuracy : Float;    // 0.0–1.0
    dealsClosedCount : Nat;
    avgDealValue : Nat;       // in Rands
    rank : Nat;               // 1-indexed rank within city
    totalInCity : Nat;        // how many drivers are ranked in this city
  };

  /// Scoring of a company for a specific driver's profile.
  public type CompanyScore = {
    companyName : Text;
    matchScore : Float;           // 0.0–1.0 likelihood this company will respond
    reason : Text;                // human-readable explanation of the score
    estimatedDealValue : Nat;     // predicted Rand value if the deal closes
    priority : Nat;               // 1 = highest priority target
  };

  /// A smart Nduna recommendation to pitch a specific company.
  public type SmartRecommendation = {
    companyName : Text;
    score : CompanyScore;
    pitch : Text;       // the suggested opening pitch or subject line
    urgency : Text;     // e.g. "High — company accepting pitches this month"
    dataPoint : Text;   // key data fact supporting this recommendation
  };
};
