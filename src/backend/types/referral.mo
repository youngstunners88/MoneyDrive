module {
  /// A referral code owned by a driver.
  /// Drivers share this code with other drivers to earn R50 credit per sign-up.
  public type ReferralCode = {
    code : Text;         // e.g. "MD-TAB1234"
    ownerId : Text;      // Principal.toText() of the code owner
    ownerName : Text;    // Display name for reference
    createdAt : Int;     // Nanosecond timestamp
    timesUsed : Nat;     // How many times this code has been used
    totalEarned : Float; // Total ZAR credit earned via referrals
  };

  /// A single recorded referral use — when a new driver signs up using a code.
  public type ReferralUse = {
    code : Text;             // The referral code used
    referredUserId : Text;   // Principal.toText() of the new driver who used the code
    usedAt : Int;            // Nanosecond timestamp
    bonusPaid : Bool;        // true once credit has been applied to the referrer's balance
    bonusAmount : Float;     // R value of the credit (e.g. 50.0)
  };

  /// Global referral engine configuration — admin-controlled.
  public type ReferralConfig = {
    enabled : Bool;
    bonusPerReferral : Float;   // R value credit per qualifying referral (R50)
    bonusSource : Text;         // "subscription_credit" — applied to next payment
    bonusDescription : Text;    // Human-readable description shown to drivers
    minTripsToQualify : Nat;    // Referrer must have at least this many trips to earn credit
  };
};
