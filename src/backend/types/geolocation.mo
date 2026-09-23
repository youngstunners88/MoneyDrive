module {
  /// A geographic coordinate point.
  public type GeoPoint = {
    lat : Float;
    lng : Float;
  };

  /// South African geographic zones used for exposure estimation.
  public type SAZone = {
    #JohannesburgCBD;
    #Sandton;
    #DurbanBeachfront;
    #PretoriaCBD;
    #CapeTownCBD;
    #Midrand;
    #Soweto;
    #Umhlanga;
    #Generic;
  };

  /// Driver route data for exposure calculation.
  public type RouteData = {
    driverId : Text;
    routeName : Text;
    origin : SAZone;
    destination : SAZone;
    averageTripsMonthly : Nat;
    peakHours : [Nat];   // e.g. [6, 7, 8] for 6am–8am peak
  };

  /// A single factor contributing to an exposure score with its weight and explanation.
  public type ExposureFactor = {
    name : Text;
    weight : Float;  // multiplier applied to base exposure (e.g. 1.3 = +30%)
    reason : Text;
  };

  /// Calculated exposure metrics for a driver's route.
  public type ExposureMetrics = {
    routeName : Text;
    dailyVehicles : Nat;
    dailyPedestrians : Nat;
    monthlyExposure : Nat;
    confidenceScore : Float;   // 0.0–1.0
    factors : [ExposureFactor];
  };

  /// Recorded validation of an exposure estimate against an actual deal outcome.
  /// Used to improve confidence scoring over time.
  public type ExposureValidation = {
    driverId : Text;
    estimatedExposure : Nat;
    actualDealValue : ?Nat;  // in Rands; null until deal closes
    accuracy : ?Float;       // actualDealValue / predictedDealValue; null until deal closes
    recordedAt : Int;        // nanoseconds since epoch (Time.now())
  };

  /// Driver opt-in record for geolocation-enhanced business cases.
  public type RouteOptIn = {
    driverId : Text;
    primaryRoute : SAZone;
    secondaryRoute : ?SAZone;
    optedInAt : Int;  // nanoseconds since epoch (Time.now())
  };
};
