import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import GeoTypes "../types/geolocation";
import CompTypes "../types/competitive";

module {
  // ── Type aliases for convenience ────────────────────────────────────────────
  public type RouteData          = GeoTypes.RouteData;
  public type ExposureMetrics    = GeoTypes.ExposureMetrics;
  public type ExposureValidation = GeoTypes.ExposureValidation;
  public type RouteOptIn         = GeoTypes.RouteOptIn;
  public type SAZone             = GeoTypes.SAZone;

  public type DriverCompetitiveProfile = CompTypes.DriverCompetitiveProfile;
  public type CompetitiveStats         = CompTypes.CompetitiveStats;
  public type SmartRecommendation      = CompTypes.SmartRecommendation;
  public type CompanyScore             = CompTypes.CompanyScore;
  public type CompanyResponsiveness    = CompTypes.CompanyResponsiveness;
  public type CityLeaderEntry          = CompTypes.CityLeaderEntry;

  // ── Zone baselines ────────────────────────────────────────────────────────────

  /// Return the baseline daily pedestrian estimate for an SA zone.
  public func pedestriansForZone(zone : SAZone) : Nat {
    switch (zone) {
      case (#JohannesburgCBD)  { 12_000 };
      case (#Sandton)          { 8_000  };
      case (#DurbanBeachfront) { 15_000 };
      case (#PretoriaCBD)      { 6_000  };
      case (#CapeTownCBD)      { 10_000 };
      case (#Midrand)          { 4_000  };
      case (#Soweto)           { 5_000  };
      case (#Umhlanga)         { 7_000  };
      case (#Generic)          { 2_000  };
    };
  };

  /// Return the baseline daily vehicle estimate for an SA zone.
  public func vehiclesForZone(zone : SAZone) : Nat {
    switch (zone) {
      case (#JohannesburgCBD)  { 45_000 };
      case (#Sandton)          { 35_000 };
      case (#DurbanBeachfront) { 30_000 };
      case (#PretoriaCBD)      { 28_000 };
      case (#CapeTownCBD)      { 40_000 };
      case (#Midrand)          { 25_000 };
      case (#Soweto)           { 20_000 };
      case (#Umhlanga)         { 22_000 };
      case (#Generic)          { 15_000 };
    };
  };

  /// Human-readable name for a zone (used in factors/reasoning).
  func zoneText(zone : SAZone) : Text {
    switch (zone) {
      case (#JohannesburgCBD)  { "Johannesburg CBD" };
      case (#Sandton)          { "Sandton"           };
      case (#DurbanBeachfront) { "Durban Beachfront" };
      case (#PretoriaCBD)      { "Pretoria CBD"      };
      case (#CapeTownCBD)      { "Cape Town CBD"     };
      case (#Midrand)          { "Midrand"           };
      case (#Soweto)           { "Soweto"            };
      case (#Umhlanga)         { "Umhlanga"          };
      case (#Generic)          { "Generic Area"      };
    };
  };

  // ── Confidence scoring ────────────────────────────────────────────────────────

  /// Compute confidence score for exposure estimates based on historical
  /// validation records for this driver.
  /// 0 validations = 0.75, 1-5 = 0.80, 6-20 = 0.85, 20+ = 0.90
  public func computeConfidence(validationCount : Nat) : Float {
    if (validationCount == 0)      { 0.75 }
    else if (validationCount <= 5) { 0.80 }
    else if (validationCount <= 20){ 0.85 }
    else                           { 0.90 };
  };

  // ── Exposure calculation ─────────────────────────────────────────────────────

  /// Calculate exposure metrics for a given SA zone and trip count.
  /// monthlyExposure = (vehicles * 0.04 + pedestrians * 0.1) * tripsPerMonth
  public func calculateExposure(
    zone : SAZone,
    tripsPerMonth : Nat,
    confidenceScore : Float,
  ) : ExposureMetrics {
    let vehicles    = vehiclesForZone(zone);
    let pedestrians = pedestriansForZone(zone);

    // vehicle visibility: ~4% notice the car; pedestrian visibility: ~10%
    let vehicleExposure    = vehicles    * 4  / 100;
    let pedestrianExposure = pedestrians * 10 / 100;
    let monthlyExposure    = (vehicleExposure + pedestrianExposure) * tripsPerMonth;

    let zoneName = zoneText(zone);

    let factors : [GeoTypes.ExposureFactor] = [
      {
        name   = "Vehicle Traffic";
        weight = 0.04;
        reason = "~4% of " # vehicles.toText() # " daily vehicles in " # zoneName # " notice the car";
      },
      {
        name   = "Pedestrian Footfall";
        weight = 0.10;
        reason = "~10% of " # pedestrians.toText() # " daily pedestrians in " # zoneName # " see the car";
      },
      {
        name   = "Trip Frequency";
        weight = tripsPerMonth.toFloat();
        reason = tripsPerMonth.toText() # " trips/month multiplies daily reach";
      },
    ];

    {
      routeName      = zoneName;
      dailyVehicles  = vehicles;
      dailyPedestrians = pedestrians;
      monthlyExposure  = monthlyExposure;
      confidenceScore  = confidenceScore;
      factors          = factors;
    };
  };

  // ── Validation recording ─────────────────────────────────────────────────────

  /// Build a new ExposureValidation record after a driver closes (or loses) a deal.
  public func buildValidation(
    driverId : Text,
    estimatedExposure : Nat,
    actualDealValue : ?Nat,
    nowNs : Int,
  ) : ExposureValidation {
    let accuracy : ?Float = switch (actualDealValue) {
      case (null) { null };
      case (?val) {
        if (estimatedExposure == 0) { ?0.0 }
        else {
          // accuracy ratio: actual value per estimated exposure unit (normalised to 1.0)
          ?( val.toFloat() / estimatedExposure.toFloat() )
        };
      };
    };
    {
      driverId          = driverId;
      estimatedExposure = estimatedExposure;
      actualDealValue   = actualDealValue;
      accuracy          = accuracy;
      recordedAt        = nowNs;
    };
  };

  // ── Route opt-in helpers ─────────────────────────────────────────────────────

  /// Create a new opt-in record for a driver with their chosen primary route.
  public func buildOptIn(
    driverId : Text,
    primaryRoute : SAZone,
    secondaryRoute : ?SAZone,
    nowNs : Int,
  ) : RouteOptIn {
    {
      driverId      = driverId;
      primaryRoute  = primaryRoute;
      secondaryRoute = secondaryRoute;
      optedInAt     = nowNs;
    };
  };

  /// Determine whether a driver has opted in to geolocation-enhanced business cases.
  public func isOptedIn(
    driverId : Text,
    optIns : List.List<RouteOptIn>,
  ) : Bool {
    switch (optIns.find(func(o : RouteOptIn) : Bool { o.driverId == driverId })) {
      case (?_) { true  };
      case null { false };
    };
  };

  // ── Competitive intelligence helpers ────────────────────────────────────────

  /// Build a DriverCompetitiveProfile for the given driver.
  /// Rank is determined by descending dealsClosedCount within the same city.
  public func buildDriverProfile(
    driverId : Text,
    city : Text,
    surgeAccuracy : Float,
    dealsClosed : Nat,
    avgDealValue : Nat,
    allProfiles : List.List<DriverCompetitiveProfile>,
  ) : DriverCompetitiveProfile {
    // Filter profiles in same city
    let cityProfiles = allProfiles.filter(func(p : DriverCompetitiveProfile) : Bool { p.city == city });

    // Count how many have more deals (rank = those above + 1)
    let above = cityProfiles.filter(func(p : DriverCompetitiveProfile) : Bool { p.dealsClosedCount > dealsClosed });

    let rank       = above.size() + 1;
    let totalInCity = cityProfiles.size() + 1; // +1 for the driver being added/updated

    {
      driverId        = driverId;
      city            = city;
      surgeAccuracy   = surgeAccuracy;
      dealsClosedCount = dealsClosed;
      avgDealValue    = avgDealValue;
      rank            = rank;
      totalInCity     = totalInCity;
    };
  };

  /// Generate up to maxResults SmartRecommendations for a driver.
  /// Candidates: 30+ SA companies across all major industries, scored by driver profile & company stats.
  public func generateSmartRecommendations(
    profile : DriverCompetitiveProfile,
    stats : CompetitiveStats,
    maxResults : Nat,
  ) : [SmartRecommendation] {

    // Candidate companies with base scoring weights
    type Candidate = {
      name : Text;
      industry : Text;
      baseScore : Float;
      estimatedValue : Nat;   // in ZAR
      pitchTemplate : Text;
      dataPointTemplate : Text;
    };

    let city = profile.city;

    let candidates : [Candidate] = [
      // ── TELECOMS ──────────────────────────────────────────────────────────────
      {
        name = "MTN";
        industry = "telecom";
        baseScore = 0.78;
        estimatedValue = 20_000;
        pitchTemplate = "Hi MTN Marketing, I drive high-traffic routes in " # city # " during peak commute hours. My car is seen by ~1.2M people/month. I'd like to discuss vehicle branding at R20k/month.";
        dataPointTemplate = "MTN responded to 3 drivers in your city this month";
      },
      {
        name = "Vodacom";
        industry = "telecom";
        baseScore = 0.76;
        estimatedValue = 22_000;
        pitchTemplate = "Hi Vodacom Brand Team, I'm a professional rideshare driver in " # city # " with verified exposure data. My peak routes cover high-density business districts — ideal for Vodacom branding at R22k/month.";
        dataPointTemplate = "Vodacom is actively placing ads with drivers in major SA cities";
      },
      {
        name = "Telkom";
        industry = "telecom";
        baseScore = 0.65;
        estimatedValue = 15_000;
        pitchTemplate = "Hi Telkom Marketing, I operate a professional rideshare vehicle in " # city # " and have verified monthly exposure data. Vehicle branding opportunity at R15k/month available.";
        dataPointTemplate = "Telkom expanding mobile brand presence in SA rideshare network";
      },
      {
        name = "Cell C";
        industry = "telecom";
        baseScore = 0.62;
        estimatedValue = 12_000;
        pitchTemplate = "Hi Cell C Brand Partners, I'm pitching vehicle advertising across " # city # " high-traffic routes. My data shows 800k+ monthly impressions at R12k/month.";
        dataPointTemplate = "Cell C targeting drivers in metro areas for brand visibility";
      },
      {
        name = "Rain";
        industry = "telecom";
        baseScore = 0.60;
        estimatedValue = 10_000;
        pitchTemplate = "Hi Rain Marketing, as an Uber/Bolt driver in " # city # " I cover tech-savvy commuter routes where Rain's 5G audience lives. Car branding at R10k/month.";
        dataPointTemplate = "Rain targeting urban digital commuters — matches driver routes";
      },
      // ── FINANCIAL SERVICES ────────────────────────────────────────────────────
      {
        name = "FNB";
        industry = "finance";
        baseScore = 0.75;
        estimatedValue = 25_000;
        pitchTemplate = "Hi FNB Partnerships, I have a 4.9-star rating and drive high-value routes in " # city # ". My exposure data shows 1M+ monthly impressions. Let's talk vehicle advertising at R25k/month.";
        dataPointTemplate = "FNB closed 2 deals with drivers matching your profile last quarter";
      },
      {
        name = "Standard Bank";
        industry = "finance";
        baseScore = 0.72;
        estimatedValue = 22_000;
        pitchTemplate = "Hi Standard Bank Marketing, I'm a professional driver in " # city # " covering CBD and business district routes daily. Vehicle advertising at R22k/month — strong brand visibility.";
        dataPointTemplate = "Standard Bank actively seeking mobile brand placements in " # city;
      },
      {
        name = "Nedbank";
        industry = "finance";
        baseScore = 0.70;
        estimatedValue = 20_000;
        pitchTemplate = "Hi Nedbank Brand Team, I drive Uber/Bolt in " # city # " and cover routes through financial and retail districts. Vehicle branding at R20k/month with verified exposure data.";
        dataPointTemplate = "Nedbank targeting professional rideshare drivers for brand campaigns";
      },
      {
        name = "Absa";
        industry = "finance";
        baseScore = 0.68;
        estimatedValue = 18_000;
        pitchTemplate = "Hi Absa Marketing, my rideshare vehicle in " # city # " serves executive and CBD routes daily. Advertising opportunity at R18k/month with monthly exposure reports.";
        dataPointTemplate = "Absa expanding vehicle advertising in SA metro areas";
      },
      {
        name = "Capitec";
        industry = "finance";
        baseScore = 0.68;
        estimatedValue = 15_000;
        pitchTemplate = "Hi Capitec Brand Team, I'm a professional rideshare driver with verified exposure metrics across " # city # ". Budget-friendly vehicle branding at R15k/month.";
        dataPointTemplate = "Capitec is actively onboarding driver-advertisers in SA cities";
      },
      {
        name = "Discovery";
        industry = "finance";
        baseScore = 0.65;
        estimatedValue = 20_000;
        pitchTemplate = "Hi Discovery Marketing, I drive professional rideshare in " # city # " and serve health-conscious, high-income passengers. Discovery branding at R20k/month — perfect demographic alignment.";
        dataPointTemplate = "Discovery targeting high-income commuter routes in " # city;
      },
      {
        name = "Old Mutual";
        industry = "finance";
        baseScore = 0.63;
        estimatedValue = 16_000;
        pitchTemplate = "Hi Old Mutual Brand Partners, my vehicle covers " # city # " commuter routes daily with 1M+ annual impressions. Financial services branding at R16k/month.";
        dataPointTemplate = "Old Mutual expanding mobile advertising in SA cities";
      },
      {
        name = "Sanlam";
        industry = "finance";
        baseScore = 0.62;
        estimatedValue = 15_000;
        pitchTemplate = "Hi Sanlam Marketing, I operate a professional rideshare vehicle in " # city # ". Vehicle advertising at R15k/month with verified monthly exposure data.";
        dataPointTemplate = "Sanlam targeting commuter audiences through mobile advertising";
      },
      // ── RETAIL / FMCG ─────────────────────────────────────────────────────────
      {
        name = "Nando's";
        industry = "food";
        baseScore = 0.72;
        estimatedValue = 12_000;
        pitchTemplate = "Hi Nando's Marketing, I drive rideshare in " # city # " covering food delivery corridors and entertainment districts. Vehicle branding at R12k/month — great lunchtime and weekend visibility.";
        dataPointTemplate = "Nando's running driver-advertiser campaign in SA cities";
      },
      {
        name = "KFC";
        industry = "food";
        baseScore = 0.70;
        estimatedValue = 10_000;
        pitchTemplate = "Hi KFC Marketing, my rideshare vehicle in " # city # " covers high-traffic routes near your locations. Car branding at R10k/month with monthly impression reports.";
        dataPointTemplate = "KFC targeting drivers near high-footfall food corridor routes";
      },
      {
        name = "McDonald's";
        industry = "food";
        baseScore = 0.68;
        estimatedValue = 10_000;
        pitchTemplate = "Hi McDonald's Brand Team, I drive Uber/Bolt in " # city # " near major retail and entertainment nodes. Vehicle advertising at R10k/month — strong impulse brand visibility.";
        dataPointTemplate = "McDonald's SA expanding mobile brand placements in metro areas";
      },
      {
        name = "Shoprite";
        industry = "retail";
        baseScore = 0.65;
        estimatedValue = 12_000;
        pitchTemplate = "Hi Shoprite Marketing, I'm a professional driver in " # city # " covering township and suburban routes where your stores are located. Vehicle branding at R12k/month.";
        dataPointTemplate = "Shoprite targeting drivers in mass-market commuter corridors";
      },
      {
        name = "Pick n Pay";
        industry = "retail";
        baseScore = 0.63;
        estimatedValue = 11_000;
        pitchTemplate = "Hi Pick n Pay Brand Partners, my rideshare routes in " # city # " pass through your major store locations daily. Vehicle advertising at R11k/month.";
        dataPointTemplate = "Pick n Pay running mobile advertising in SA rideshare network";
      },
      {
        name = "Woolworths";
        industry = "retail";
        baseScore = 0.66;
        estimatedValue = 15_000;
        pitchTemplate = "Hi Woolworths Marketing, I serve premium commuter routes in " # city # " — your exact target demographic. Vehicle branding at R15k/month for high-income passenger exposure.";
        dataPointTemplate = "Woolworths targeting premium rideshare routes in " # city;
      },
      // ── LOGISTICS / TRANSPORT ─────────────────────────────────────────────────
      {
        name = "DHL";
        industry = "logistics";
        baseScore = 0.70;
        estimatedValue = 18_000;
        pitchTemplate = "Hi DHL Marketing SA, as a rideshare driver in " # city # " covering airport and business district routes, I have strong overlap with your customer base. Vehicle branding at R18k/month.";
        dataPointTemplate = "DHL placing brand ads with drivers on airport and business routes";
      },
      {
        name = "Aramex";
        industry = "logistics";
        baseScore = 0.65;
        estimatedValue = 14_000;
        pitchTemplate = "Hi Aramex SA Brand Team, my routes in " # city # " cover commercial and business districts — high overlap with your delivery corridors. Vehicle advertising at R14k/month.";
        dataPointTemplate = "Aramex expanding brand visibility through SA rideshare network";
      },
      {
        name = "Courier Guy";
        industry = "logistics";
        baseScore = 0.60;
        estimatedValue = 10_000;
        pitchTemplate = "Hi Courier Guy Marketing, I drive in " # city # " — same corridors as your delivery fleet. Co-branding opportunity at R10k/month for shared route visibility.";
        dataPointTemplate = "Courier Guy targeting rideshare drivers in SA delivery corridors";
      },
      // ── TECH / MEDIA ──────────────────────────────────────────────────────────
      {
        name = "MultiChoice (DSTV)";
        industry = "media";
        baseScore = 0.68;
        estimatedValue = 18_000;
        pitchTemplate = "Hi MultiChoice Marketing, I drive rideshare across " # city # " and reach entertainment-focused passengers daily. Vehicle advertising for DSTV/SuperSport at R18k/month.";
        dataPointTemplate = "MultiChoice targeting rideshare passengers for DStv subscription campaigns";
      },
      {
        name = "Takealot";
        industry = "ecommerce";
        baseScore = 0.66;
        estimatedValue = 14_000;
        pitchTemplate = "Hi Takealot Marketing, my rideshare vehicle covers urban delivery routes in " # city # " — strong e-commerce audience. Vehicle branding at R14k/month.";
        dataPointTemplate = "Takealot running rideshare driver ad campaigns in major SA cities";
      },
      // ── INSURANCE ─────────────────────────────────────────────────────────────
      {
        name = "OUTsurance";
        industry = "insurance";
        baseScore = 0.65;
        estimatedValue = 14_000;
        pitchTemplate = "Hi OUTsurance Brand Team, I'm a professional Uber/Bolt driver in " # city # " with a clean driving record. Vehicle advertising at R14k/month — great match for your driver safety message.";
        dataPointTemplate = "OUTsurance targeting professional drivers for brand campaigns";
      },
      {
        name = "Naked Insurance";
        industry = "insurance";
        baseScore = 0.60;
        estimatedValue = 10_000;
        pitchTemplate = "Hi Naked Insurance Marketing, my tech-savvy rideshare passengers in " # city # " are your exact audience. Vehicle branding at R10k/month.";
        dataPointTemplate = "Naked Insurance targeting digital-first commuters in " # city;
      },
      // ── AUTOMOTIVE / FUEL ─────────────────────────────────────────────────────
      {
        name = "Engen";
        industry = "fuel";
        baseScore = 0.72;
        estimatedValue = 12_000;
        pitchTemplate = "Hi Engen Brand Partners, as a professional rideshare driver in " # city # " I refuel regularly at your stations and drive routes past them daily. Vehicle branding at R12k/month.";
        dataPointTemplate = "Engen partnering with rideshare drivers on fuel corridor branding";
      },
      {
        name = "BP";
        industry = "fuel";
        baseScore = 0.68;
        estimatedValue = 11_000;
        pitchTemplate = "Hi BP SA Marketing, my rideshare routes in " # city # " cover major fuel corridors. Vehicle advertising at R11k/month — highly visible to daily commuters.";
        dataPointTemplate = "BP SA expanding vehicle branding in rideshare network";
      },
      {
        name = "Shell";
        industry = "fuel";
        baseScore = 0.66;
        estimatedValue = 10_000;
        pitchTemplate = "Hi Shell SA Brand Team, I drive professional rideshare in " # city # " and regularly cover your forecourt locations. Car branding at R10k/month.";
        dataPointTemplate = "Shell targeting drivers on major fuel and commuter corridors";
      },
      {
        name = "TotalEnergies";
        industry = "fuel";
        baseScore = 0.64;
        estimatedValue = 10_000;
        pitchTemplate = "Hi TotalEnergies SA Marketing, my rideshare vehicle in " # city # " is on the road 8+ hours daily along major arterials. Vehicle advertising at R10k/month.";
        dataPointTemplate = "TotalEnergies placing mobile brand ads in SA rideshare network";
      },
      // ── HEALTHCARE ────────────────────────────────────────────────────────────
      {
        name = "Dis-Chem";
        industry = "healthcare";
        baseScore = 0.66;
        estimatedValue = 12_000;
        pitchTemplate = "Hi Dis-Chem Marketing, I drive rideshare in " # city # " past several of your store locations daily. Vehicle branding at R12k/month for health-conscious audience exposure.";
        dataPointTemplate = "Dis-Chem targeting commuter routes near their store locations";
      },
      {
        name = "Clicks";
        industry = "healthcare";
        baseScore = 0.64;
        estimatedValue = 11_000;
        pitchTemplate = "Hi Clicks Brand Partners, my rideshare routes in " # city # " cover suburban shopping nodes where your stores operate. Vehicle advertising at R11k/month.";
        dataPointTemplate = "Clicks expanding mobile advertising in SA rideshare network";
      },
      // ── HOSPITALITY ───────────────────────────────────────────────────────────
      {
        name = "Sun International";
        industry = "hospitality";
        baseScore = 0.63;
        estimatedValue = 16_000;
        pitchTemplate = "Hi Sun International Marketing, I frequently drive passengers to and from casino and resort venues in " # city # ". Vehicle branding at R16k/month — captive high-value audience.";
        dataPointTemplate = "Sun International targeting airport and entertainment route drivers";
      },
      {
        name = "City Lodge Hotels";
        industry = "hospitality";
        baseScore = 0.60;
        estimatedValue = 12_000;
        pitchTemplate = "Hi City Lodge Marketing, I serve airport transfer and business travel routes in " # city # ". Vehicle branding opportunity at R12k/month for business traveller visibility.";
        dataPointTemplate = "City Lodge targeting business route rideshare drivers for brand placement";
      },
    ];

    // Boost scores using company responsiveness data from stats
    func getResponseRate(companyName : Text) : Float {
      switch (stats.topCompanies.find(func(c : CompanyResponsiveness) : Bool { c.companyName == companyName })) {
        case (?c) { c.responseRate.toFloat() / 100.0 };
        case null { 0.5 }; // default 50% if no data
      };
    };

    // Driver performance multiplier: better drivers get higher priority
    let performanceBoost : Float =
      if (profile.dealsClosedCount >= 3)     { 0.15 }
      else if (profile.dealsClosedCount >= 1) { 0.08 }
      else                                    { 0.0  };

    // City-based industry boost: airport/CBD cities favour logistics/telecom; suburban favours retail/food
    func industryBoost(industry : Text) : Float {
      let cityLower = city.toLower();
      let isAirportCity = cityLower.contains(#text "johannesburg") or cityLower.contains(#text "cape town") or cityLower.contains(#text "durban");
      let isCBD = cityLower.contains(#text "cbd") or cityLower.contains(#text "sandton") or cityLower.contains(#text "rosebank");
      switch (industry) {
        case ("telecom") { if (isAirportCity or isCBD) { 0.05 } else { 0.0 } };
        case ("finance") { if (isCBD or isAirportCity) { 0.06 } else { 0.02 } };
        case ("logistics") { if (isAirportCity) { 0.08 } else { 0.03 } };
        case ("food") { 0.04 };
        case ("fuel") { 0.05 }; // drivers are always near fuel stations
        case ("media") { if (isAirportCity) { 0.04 } else { 0.02 } };
        case ("insurance") { 0.03 };
        case ("healthcare") { 0.02 };
        case ("retail") { 0.03 };
        case ("ecommerce") { if (isAirportCity) { 0.04 } else { 0.02 } };
        case ("hospitality") { if (isAirportCity) { 0.06 } else { 0.02 } };
        case (_) { 0.0 };
      };
    };

    // Build scored recommendations
    let scored = candidates.map(func(c : Candidate) : SmartRecommendation {
      let networkBoost = getResponseRate(c.name) * 0.2;
      let indBoost = industryBoost(c.industry);
      let finalScore   = c.baseScore + networkBoost + performanceBoost + indBoost;
      let clampedScore = if (finalScore > 1.0) { 1.0 } else { finalScore };

      let urgency = if (finalScore >= 0.85) {
        "High — company accepting pitches this month"
      } else if (finalScore >= 0.70) {
        "Medium — good match based on your routes"
      } else {
        "Low — worth a try when you have time"
      };

      let companyScore : CompanyScore = {
        companyName        = c.name;
        matchScore         = clampedScore;
        reason             = "Route match + " # profile.city # " driver profile + network data";
        estimatedDealValue = c.estimatedValue;
        priority           = 1; // will re-assign below
      };

      {
        companyName = c.name;
        score       = companyScore;
        pitch       = c.pitchTemplate;
        urgency     = urgency;
        dataPoint   = c.dataPointTemplate;
      };
    });

    // Sort descending by matchScore and assign priority ranks
    let sortedArr = scored.sort(func(a : SmartRecommendation, b : SmartRecommendation) : Order.Order {
      if (b.score.matchScore > a.score.matchScore) { #greater }
      else if (b.score.matchScore < a.score.matchScore) { #less }
      else { #equal }
    });

    let ranked = sortedArr.mapEntries(func(rec : SmartRecommendation, i : Nat) : SmartRecommendation {
      {
        rec with
        score = { rec.score with priority = i + 1 };
      };
    });

    // Return up to maxResults
    if (ranked.size() <= maxResults) { ranked }
    else { ranked.sliceToArray(0, maxResults) };
  };

  /// Aggregate individual driver profiles into a CompetitiveStats snapshot for a month.
  public func aggregateCompetitiveStats(
    profiles : List.List<DriverCompetitiveProfile>,
    month : Text,
    networkSurgeAccuracy : Float,
  ) : CompetitiveStats {

    let profileArr = profiles.toArray();
    let totalDrivers = profileArr.size();

    // Build city leaderboard: group by city, pick top stats
    // Collect distinct cities first
    let cityList = List.empty<Text>();
    for (p in profileArr.values()) {
      if (cityList.find(func(c : Text) : Bool { c == p.city }) == null) {
        cityList.add(p.city);
      };
    };

    let cityEntries = cityList.toArray().map(func(city : Text) : CityLeaderEntry {
      let cityProfiles = profileArr.filter(func(p : DriverCompetitiveProfile) : Bool { p.city == city });

      let totalDeals = cityProfiles.foldLeft(0, func(acc : Nat, p : DriverCompetitiveProfile) : Nat { acc + p.dealsClosedCount });
      let totalValue = cityProfiles.foldLeft(0, func(acc : Nat, p : DriverCompetitiveProfile) : Nat {
        acc + p.dealsClosedCount * p.avgDealValue
      });
      let avgDeal = if (totalDeals == 0) { 0 } else { totalValue / totalDeals };

      // Top company = use generic label when no pitch data is available at this layer
      {
        city       = city;
        dealsClosed = totalDeals;
        avgDealValue = avgDeal;
        topCompany = "MTN";   // default; will be overridden by real pitch data in mixin
        month      = month;
      };
    });

    // Build company responsiveness from profile data (aggregate signal)
    // Without raw pitch data at this layer, we return sensible defaults
    let defaultCompanies : [CompanyResponsiveness] = [
      { companyName = "MTN";     responseRate = 65; avgDealValue = 20_000; totalPitches = 0; successfulDeals = 0 },
      { companyName = "FNB";     responseRate = 58; avgDealValue = 25_000; totalPitches = 0; successfulDeals = 0 },
      { companyName = "Capitec"; responseRate = 52; avgDealValue = 15_000; totalPitches = 0; successfulDeals = 0 },
    ];

    {
      cityLeaderboard        = cityEntries;
      topCompanies           = defaultCompanies;
      networkSurgeAccuracy   = networkSurgeAccuracy;
      totalDriversInNetwork  = totalDrivers;
      month                  = month;
    };
  };
};
