import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import FleetTypes "../types/fleet";

/// Public API mixin for the Fleet Owner domain (Tier 2+).
/// Fleet owners can register multiple vehicles and track per-vehicle
/// income and expenses independently from their own driver trips/expenses.
/// All data is scoped to the calling principal — each fleet owner sees
/// only their own fleet.
mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles           : Map.Map<Principal, {
    displayName         : Text;
    currencyCode        : Text;
    subscriptionTier    : Nat;
    voiceEnabled        : Bool;
    fuelConsumptionRate : Float;
    vehicleName         : Text;
  }>,
  /// Primary vehicle store: ownerId (Text) → Map(vehicleId → FleetVehicle)
  fleetVehiclesStore  : Map.Map<Text, Map.Map<Text, FleetTypes.FleetVehicle>>,
  /// Primary expense store: ownerId (Text) → Map(expenseId → FleetExpenseEntry)
  fleetExpensesStore  : Map.Map<Text, Map.Map<Text, FleetTypes.FleetExpenseEntry>>,
  /// Primary income store: ownerId (Text) → Map(incomeId → FleetIncomeEntry)
  fleetIncomeStore    : Map.Map<Text, Map.Map<Text, FleetTypes.FleetIncomeEntry>>,
) {

  // ── Private helpers ─────────────────────────────────────────────────────────

  /// Generate a simple unique ID from timestamp + caller text slice.
  private func genId(prefix : Text, caller : Principal) : Text {
    let now = Time.now();
    prefix # "-" # now.toText() # "-" # caller.toText().size().toText();
  };

  /// Retrieve or create the vehicle sub-map for an owner.
  private func getOwnerVehicles(ownerId : Text) : Map.Map<Text, FleetTypes.FleetVehicle> {
    switch (fleetVehiclesStore.get(ownerId)) {
      case (null) { Map.empty<Text, FleetTypes.FleetVehicle>() };
      case (?m)   { m };
    };
  };

  /// Retrieve or create the expense sub-map for an owner.
  private func getOwnerExpenses(ownerId : Text) : Map.Map<Text, FleetTypes.FleetExpenseEntry> {
    switch (fleetExpensesStore.get(ownerId)) {
      case (null) { Map.empty<Text, FleetTypes.FleetExpenseEntry>() };
      case (?m)   { m };
    };
  };

  /// Retrieve or create the income sub-map for an owner.
  private func getOwnerIncome(ownerId : Text) : Map.Map<Text, FleetTypes.FleetIncomeEntry> {
    switch (fleetIncomeStore.get(ownerId)) {
      case (null) { Map.empty<Text, FleetTypes.FleetIncomeEntry>() };
      case (?m)   { m };
    };
  };

  /// Check that the caller is authenticated and has Tier 2+ access.
  /// Returns the owner ID string on success or an #err variant.
  private func requireFleetAccess(
    caller : Principal,
  ) : { #ok : Text; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin) {
      let profile = switch (profiles.get(caller)) {
        case (null) { return #err("Profile not found — create your profile first") };
        case (?p)   { p };
      };
      if (profile.subscriptionTier < 2) {
        return #err("Fleet feature requires Tier 2 or higher subscription");
      };
    };
    #ok(caller.toText());
  };

  // ── Vehicle Management ──────────────────────────────────────────────────────

  /// Register a new vehicle in the caller's fleet.
  /// Returns the generated vehicleId on success.
  /// Requires Tier 2+ subscription. plateNumber, make, and model must be non-empty.
  public shared ({ caller }) func addFleetVehicle(
    plateNumber : Text,
    make        : Text,
    model       : Text,
    year        : ?Nat,
    color       : ?Text,
    notes       : ?Text,
  ) : async { #ok : Text; #err : Text } {
    let capturedCaller = caller;
    let ownerId = switch (requireFleetAccess(capturedCaller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(id)) { id };
    };

    if (plateNumber.size() == 0) { return #err("plateNumber cannot be empty") };
    if (make.size() == 0)        { return #err("make cannot be empty") };
    if (model.size() == 0)       { return #err("model cannot be empty") };

    let vehicleId = genId("v", capturedCaller);
    let vehicle : FleetTypes.FleetVehicle = {
      vehicleId;
      plateNumber;
      make;
      model;
      year;
      color;
      dateAdded = Time.now();
      notes;
    };

    let ownerVehicles = getOwnerVehicles(ownerId);
    ownerVehicles.add(vehicleId, vehicle);
    fleetVehiclesStore.add(ownerId, ownerVehicles);

    #ok(vehicleId);
  };

  /// Return all vehicles registered by the calling fleet owner.
  /// Requires Tier 2+ subscription.
  public query ({ caller }) func getFleetVehicles() : async [FleetTypes.FleetVehicle] {
    let ownerId = switch (requireFleetAccess(caller)) {
      case (#err(_)) { return [] };
      case (#ok(id)) { id };
    };
    getOwnerVehicles(ownerId).values().toArray();
  };

  /// Delete a vehicle from the caller's fleet.
  /// Also removes all associated expense and income entries for that vehicle.
  /// Requires Tier 2+ subscription.
  public shared ({ caller }) func deleteFleetVehicle(vehicleId : Text) : async { #ok : (); #err : Text } {
    let capturedCaller = caller;
    let ownerId = switch (requireFleetAccess(capturedCaller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(id)) { id };
    };

    let ownerVehicles = getOwnerVehicles(ownerId);
    if (not ownerVehicles.containsKey(vehicleId)) {
      return #err("Vehicle not found: " # vehicleId);
    };
    ownerVehicles.remove(vehicleId);
    fleetVehiclesStore.add(ownerId, ownerVehicles);

    // Remove all expenses belonging to this vehicle
    let ownerExpenses = getOwnerExpenses(ownerId);
    let expensesToRemove = List.empty<Text>();
    for ((expenseId, entry) in ownerExpenses.entries()) {
      if (entry.vehicleId == vehicleId) {
        expensesToRemove.add(expenseId);
      };
    };
    for (expenseId in expensesToRemove.values()) {
      ownerExpenses.remove(expenseId);
    };
    fleetExpensesStore.add(ownerId, ownerExpenses);

    // Remove all income entries belonging to this vehicle
    let ownerIncome = getOwnerIncome(ownerId);
    let incomeToRemove = List.empty<Text>();
    for ((incomeId, entry) in ownerIncome.entries()) {
      if (entry.vehicleId == vehicleId) {
        incomeToRemove.add(incomeId);
      };
    };
    for (incomeId in incomeToRemove.values()) {
      ownerIncome.remove(incomeId);
    };
    fleetIncomeStore.add(ownerId, ownerIncome);

    #ok(());
  };

  // ── Per-Vehicle Expense Tracking ────────────────────────────────────────────

  /// Add an expense entry for a specific fleet vehicle.
  /// vehicleId must exist in the caller's fleet. amount must be > 0.
  /// Returns the generated expenseId on success.
  public shared ({ caller }) func addFleetExpense(
    vehicleId : Text,
    category  : Text,
    amount    : Float,
    date      : Int,
    notes     : Text,
  ) : async { #ok : Text; #err : Text } {
    let capturedCaller = caller;
    let ownerId = switch (requireFleetAccess(capturedCaller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(id)) { id };
    };

    if (amount <= 0.0) { return #err("amount must be greater than 0") };

    let ownerVehicles = getOwnerVehicles(ownerId);
    if (not ownerVehicles.containsKey(vehicleId)) {
      return #err("Vehicle not found: " # vehicleId);
    };

    let expenseId = genId("fe", capturedCaller);
    let entry : FleetTypes.FleetExpenseEntry = {
      expenseId;
      vehicleId;
      category;
      amount;
      date;
      notes;
    };

    let ownerExpenses = getOwnerExpenses(ownerId);
    ownerExpenses.add(expenseId, entry);
    fleetExpensesStore.add(ownerId, ownerExpenses);

    #ok(expenseId);
  };

  /// Return expense entries for the calling fleet owner.
  /// If vehicleId is ?null returns all expenses; otherwise filters to that vehicle.
  /// Requires Tier 2+ subscription.
  public query ({ caller }) func getFleetExpenses(
    vehicleId : ?Text,
  ) : async [FleetTypes.FleetExpenseEntry] {
    let ownerId = switch (requireFleetAccess(caller)) {
      case (#err(_)) { return [] };
      case (#ok(id)) { id };
    };
    let ownerExpenses = getOwnerExpenses(ownerId);
    switch (vehicleId) {
      case (null)  { ownerExpenses.values().toArray() };
      case (?vid)  {
        ownerExpenses.values().toArray().filter(func(e) { e.vehicleId == vid });
      };
    };
  };

  /// Delete a specific expense entry from the caller's fleet.
  /// Requires Tier 2+ subscription.
  public shared ({ caller }) func deleteFleetExpense(expenseId : Text) : async { #ok : (); #err : Text } {
    let capturedCaller = caller;
    let ownerId = switch (requireFleetAccess(capturedCaller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(id)) { id };
    };

    let ownerExpenses = getOwnerExpenses(ownerId);
    if (not ownerExpenses.containsKey(expenseId)) {
      return #err("Expense entry not found: " # expenseId);
    };
    ownerExpenses.remove(expenseId);
    fleetExpensesStore.add(ownerId, ownerExpenses);

    #ok(());
  };

  // ── Per-Vehicle Income Tracking ─────────────────────────────────────────────

  /// Add an income entry for a specific fleet vehicle.
  /// vehicleId must exist in the caller's fleet. amount must be > 0.
  /// Returns the generated incomeId on success.
  public shared ({ caller }) func addFleetIncome(
    vehicleId : Text,
    platform  : Text,
    amount    : Float,
    date      : Int,
    notes     : Text,
  ) : async { #ok : Text; #err : Text } {
    let capturedCaller = caller;
    let ownerId = switch (requireFleetAccess(capturedCaller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(id)) { id };
    };

    if (amount <= 0.0) { return #err("amount must be greater than 0") };

    let ownerVehicles = getOwnerVehicles(ownerId);
    if (not ownerVehicles.containsKey(vehicleId)) {
      return #err("Vehicle not found: " # vehicleId);
    };

    let incomeId = genId("fi", capturedCaller);
    let entry : FleetTypes.FleetIncomeEntry = {
      incomeId;
      vehicleId;
      platform;
      amount;
      date;
      notes;
    };

    let ownerIncome = getOwnerIncome(ownerId);
    ownerIncome.add(incomeId, entry);
    fleetIncomeStore.add(ownerId, ownerIncome);

    #ok(incomeId);
  };

  /// Return income entries for the calling fleet owner.
  /// If vehicleId is ?null returns all income; otherwise filters to that vehicle.
  /// Requires Tier 2+ subscription.
  public query ({ caller }) func getFleetIncome(
    vehicleId : ?Text,
  ) : async [FleetTypes.FleetIncomeEntry] {
    let ownerId = switch (requireFleetAccess(caller)) {
      case (#err(_)) { return [] };
      case (#ok(id)) { id };
    };
    let ownerIncome = getOwnerIncome(ownerId);
    switch (vehicleId) {
      case (null)  { ownerIncome.values().toArray() };
      case (?vid)  {
        ownerIncome.values().toArray().filter(func(e) { e.vehicleId == vid });
      };
    };
  };

  /// Delete a specific income entry from the caller's fleet.
  /// Requires Tier 2+ subscription.
  public shared ({ caller }) func deleteFleetIncome(incomeId : Text) : async { #ok : (); #err : Text } {
    let capturedCaller = caller;
    let ownerId = switch (requireFleetAccess(capturedCaller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(id)) { id };
    };

    let ownerIncome = getOwnerIncome(ownerId);
    if (not ownerIncome.containsKey(incomeId)) {
      return #err("Income entry not found: " # incomeId);
    };
    ownerIncome.remove(incomeId);
    fleetIncomeStore.add(ownerId, ownerIncome);

    #ok(());
  };

  // ── Fleet Summary / Analytics ───────────────────────────────────────────────

  /// Return a per-vehicle summary (totals + net profit) for the calling fleet owner.
  /// Requires Tier 2+ subscription.
  public query ({ caller }) func getFleetSummary() : async [FleetTypes.FleetVehicleSummary] {
    let ownerId = switch (requireFleetAccess(caller)) {
      case (#err(_)) { return [] };
      case (#ok(id)) { id };
    };

    let ownerVehicles = getOwnerVehicles(ownerId);
    let ownerExpenses = getOwnerExpenses(ownerId);
    let ownerIncome   = getOwnerIncome(ownerId);

    let summaries = List.empty<FleetTypes.FleetVehicleSummary>();

    for ((_, vehicle) in ownerVehicles.entries()) {
      let vid = vehicle.vehicleId;

      var totalIncome   : Float = 0.0;
      var totalExpenses : Float = 0.0;
      var tripCount     : Nat   = 0;
      var expenseCount  : Nat   = 0;

      for ((_, entry) in ownerIncome.entries()) {
        if (entry.vehicleId == vid) {
          totalIncome   := totalIncome + entry.amount;
          tripCount     := tripCount + 1;
        };
      };

      for ((_, entry) in ownerExpenses.entries()) {
        if (entry.vehicleId == vid) {
          totalExpenses := totalExpenses + entry.amount;
          expenseCount  := expenseCount + 1;
        };
      };

      summaries.add({
        vehicleId     = vid;
        plateNumber   = vehicle.plateNumber;
        make          = vehicle.make;
        model         = vehicle.model;
        totalIncome;
        totalExpenses;
        netProfit     = totalIncome - totalExpenses;
        tripCount;
        expenseCount;
      });
    };

    summaries.toArray();
  };
};
