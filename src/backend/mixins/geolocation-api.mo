import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import GeoTypes "../types/geolocation";
import CompTypes "../types/competitive";
import GeoLib "../lib/geolocation";
import AccessControl "mo:caffeineai-authorization/access-control";

/// Public API mixin for geolocation and competitive intelligence features.
/// State slices are injected by main.mo at composition time.
mixin (
  accessControlState  : AccessControl.AccessControlState,
  googleMapsApiKey    : { var value : Text },
  tomTomApiKey        : { var value : Text },
  routeOptIns         : Map.Map<Text, GeoTypes.RouteOptIn>,
  exposureValidations : Map.Map<Text, GeoTypes.ExposureValidation>,
  competitiveProfiles : Map.Map<Text, CompTypes.DriverCompetitiveProfile>,
) {

  // ── Admin: API key management ─────────────────────────────────────────────

  /// Admin-only: store the Google Maps API key securely in the canister.
  public shared ({ caller }) func setGoogleMapsApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the Google Maps API key");
    };
    googleMapsApiKey.value := key;
  };

  /// Admin-only: store the TomTom API key securely in the canister.
  public shared ({ caller }) func setTomTomApiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the TomTom API key");
    };
    tomTomApiKey.value := key;
  };

  // ── Geolocation opt-in ────────────────────────────────────────────────────

  /// Register driver's opt-in for geolocation-enhanced business case generation.
  public shared ({ caller }) func setDriverRouteOptIn(
    primaryRoute   : GeoTypes.SAZone,
    secondaryRoute : ?GeoTypes.SAZone,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to opt in");
    };
    let driverId = caller.toText();
    let optIn    = GeoLib.buildOptIn(driverId, primaryRoute, secondaryRoute, Time.now());
    routeOptIns.add(driverId, optIn);
  };

  /// Return the calling driver's route opt-in record, if it exists.
  public query ({ caller }) func getMyRouteOptIn() : async ?GeoTypes.RouteOptIn {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    routeOptIns.get(caller.toText());
  };

  // ── Exposure metrics ──────────────────────────────────────────────────────

  /// Calculate and return exposure metrics for a given SA zone.
  /// Uses hardcoded SA zone baselines — no external API needed for Phase 1.
  public query ({ caller }) func getExposureMetrics(zone : GeoTypes.SAZone) : async GeoTypes.ExposureMetrics {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Count this driver's existing validations for confidence scoring
    let driverId   = caller.toText();
    let validCount = competitiveProfiles.size(); // proxy: use global network size for now
    let confidence = GeoLib.computeConfidence(validCount);

    // Default to 200 trips/month if no profile; real value comes from frontend
    let tripsPerMonth = 200;
    GeoLib.calculateExposure(zone, tripsPerMonth, confidence);
  };

  /// Calculate and return exposure metrics for a given SA zone with explicit trip count.
  public query ({ caller }) func getExposureMetricsWithTrips(
    zone          : GeoTypes.SAZone,
    tripsPerMonth : Nat,
  ) : async GeoTypes.ExposureMetrics {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId   = caller.toText();
    let driverValidationCount = exposureValidations.size();
    let confidence = GeoLib.computeConfidence(driverValidationCount);
    GeoLib.calculateExposure(zone, tripsPerMonth, confidence);
  };

  // ── Deal outcome validation ───────────────────────────────────────────────

  /// Record the actual outcome of an advertising deal for accuracy improvement.
  public shared ({ caller }) func recordExposureOutcome(
    estimatedExposure : Nat,
    actualDealValue   : Nat,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId   = caller.toText();
    let validation = GeoLib.buildValidation(driverId, estimatedExposure, ?actualDealValue, Time.now());
    // Key by driverId + timestamp for uniqueness
    let key = driverId # "_" # Time.now().toText();
    exposureValidations.add(key, validation);
  };

  // ── Competitive intelligence ──────────────────────────────────────────────

  /// Return the current competitive stats snapshot (Tier 2+ and admin).
  public query ({ caller }) func getCompetitiveStats() : async CompTypes.CompetitiveStats {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    // Build stats from stored competitive profiles
    let profileList = List.fromIter<CompTypes.DriverCompetitiveProfile>(
      competitiveProfiles.values()
    );
    GeoLib.aggregateCompetitiveStats(profileList, _currentMonth(), 0.75);
  };

  /// Return the calling driver's competitive profile within their city.
  public query ({ caller }) func getMyCompetitiveProfile() : async ?CompTypes.DriverCompetitiveProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    competitiveProfiles.get(caller.toText());
  };

  /// Update or create the calling driver's competitive profile.
  public shared ({ caller }) func upsertCompetitiveProfile(
    city          : Text,
    surgeAccuracy : Float,
    dealsClosed   : Nat,
    avgDealValue  : Nat,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    let profileList = List.fromIter<CompTypes.DriverCompetitiveProfile>(
      competitiveProfiles.values()
    );
    let newProfile = GeoLib.buildDriverProfile(
      driverId, city, surgeAccuracy, dealsClosed, avgDealValue, profileList
    );
    competitiveProfiles.add(driverId, newProfile);
  };

  /// Return smart company pitch recommendations for the calling driver (Tier 3 + admin).
  public query ({ caller }) func getSmartRecommendations() : async [CompTypes.SmartRecommendation] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let driverId = caller.toText();
    let profileList = List.fromIter<CompTypes.DriverCompetitiveProfile>(
      competitiveProfiles.values()
    );
    let myProfile = switch (competitiveProfiles.get(driverId)) {
      case (?p)  { p };
      case null  {
        // Default profile for drivers who haven't upserted yet
        {
          driverId        = driverId;
          city            = "Johannesburg";
          surgeAccuracy   = 0.75;
          dealsClosedCount = 0;
          avgDealValue    = 0;
          rank            = 1;
          totalInCity     = 1;
        };
      };
    };
    let stats = GeoLib.aggregateCompetitiveStats(profileList, _currentMonth(), 0.75);
    GeoLib.generateSmartRecommendations(myProfile, stats, 3);
  };

  // ── Private helpers ───────────────────────────────────────────────────────

  /// Returns current month as "YYYY-MM" string (approximate — uses Int division on nanoseconds).
  private func _currentMonth() : Text {
    // Time.now() returns nanoseconds since Unix epoch
    let nowNs    = Time.now();
    let secsSinceEpoch = nowNs / 1_000_000_000;
    // Approximate year/month from seconds (not daylight-saving aware, good enough for labels)
    let daysSinceEpoch  = secsSinceEpoch / 86_400;
    let approxYear      = 1970 + daysSinceEpoch / 365;
    let approxMonth     = (daysSinceEpoch % 365) / 30 + 1;
    let monthStr = if (approxMonth < 10) { "0" # approxMonth.toText() } else { approxMonth.toText() };
    approxYear.toText() # "-" # monthStr;
  };
};
