module {
  /// The category of an opportunity Nduna discovered via the hunter scan.
  public type OpportunityCategory = {
    #newPlatform;       // A new or underutilised rideshare / gig platform (e.g. Maxim)
    #intercityRoute;    // Profitable long-distance or intercity route opportunity
    #platformPromotion; // Current Uber / Bolt / inDrive promotion, bonus, or challenge
    #incomeCategory;    // New income stream (delivery app, rental, freight, etc.)
    #businessLead;      // Company lead for advertising / partnership deal
    #regulatoryChange;  // New legislation, SARS ruling, or platform policy affecting drivers
  };

  /// A single opportunity finding returned by the hunter scan for a driver.
  public type OpportunityFinding = {
    id             : Text;
    driverId       : Text;
    category       : OpportunityCategory;
    title          : Text;
    description    : Text;
    relevanceScore : Nat;    // 0–100
    source         : Text;   // e.g. "browser-use", "tavily", "vps-hunter"
    discoveredAt   : Int;    // Time.now() nanoseconds
    expiresAt      : Int;    // discoveredAt + 14 days in nanoseconds
    dismissed      : Bool;   // Driver chose to dismiss this finding
  };

  /// Record of a single opportunity hunter scan run for a driver.
  public type OpportunityScan = {
    scanId    : Text;
    driverId  : Text;
    scanDate  : Int;        // Time.now() nanoseconds when scan started
    status    : Text;       // "running" | "complete" | "failed"
    findings  : [Text];     // List of OpportunityFinding IDs stored from this scan
    error     : ?Text;      // Error message if status = "failed"
  };
};
