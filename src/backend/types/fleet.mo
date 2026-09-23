module {
  /// A vehicle registered in a fleet owner's fleet.
  public type FleetVehicle = {
    vehicleId   : Text;   // UUID-style, generated on creation
    plateNumber : Text;   // e.g. "CA 123-456"
    make        : Text;   // e.g. "Toyota"
    model       : Text;   // e.g. "Corolla"
    year        : ?Nat;   // optional manufacture year
    color       : ?Text;  // optional color
    dateAdded   : Int;    // Time.now() nanoseconds
    notes       : ?Text;  // optional free-form notes
  };

  /// A single expense entry for a fleet vehicle.
  public type FleetExpenseEntry = {
    expenseId : Text;
    vehicleId : Text;
    category  : Text;   // e.g. "Fuel", "Tyre Repair", "Insurance"
    amount    : Float;  // must be > 0
    date      : Int;    // nanoseconds timestamp
    notes     : Text;
  };

  /// A single income entry for a fleet vehicle.
  public type FleetIncomeEntry = {
    incomeId  : Text;
    vehicleId : Text;
    platform  : Text;   // e.g. "Uber", "Bolt", "InDrive", "Other"
    amount    : Float;  // must be > 0
    date      : Int;    // nanoseconds timestamp
    notes     : Text;
  };

  /// Summary analytics for a single fleet vehicle.
  public type FleetVehicleSummary = {
    vehicleId     : Text;
    plateNumber   : Text;
    make          : Text;
    model         : Text;
    totalIncome   : Float;
    totalExpenses : Float;
    netProfit     : Float;
    tripCount     : Nat;    // number of income entries
    expenseCount  : Nat;
  };
};
