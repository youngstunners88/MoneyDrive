import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import ReferralTypes "../types/referral";
import ReferralLib "../lib/referral";

/// Public API mixin for the MoneyDrive Referral Engine.
/// R50 subscription credit per qualifying sign-up — applied at next renewal.
mixin (
  accessControlState : AccessControl.AccessControlState,
  referralCodes      : Map.Map<Text, ReferralTypes.ReferralCode>,
  referralUses       : List.List<ReferralTypes.ReferralUse>,
  referralConfig     : { var value : ReferralTypes.ReferralConfig },
  /// Driver credit balances: driverId (Principal.toText()) → ZAR credit
  referralCreditBalances : Map.Map<Text, Float>,
  profiles           : Map.Map<Principal, {
    displayName     : Text;
    currencyCode    : Text;
    subscriptionTier: Nat;
    voiceEnabled    : Bool;
    fuelConsumptionRate : Float;
    vehicleName     : Text;
  }>,
  /// Idempotency guard: composite key (code # ":" # newUserId) → processing timestamp.
  /// Prevents double-credit when triggerReferralBonus is called more than once for the
  /// same (referral code, new driver) pair within a 5-minute window.
  processedReferralBonuses : Map.Map<Text, Int>,
) {

  // ── Driver API ─────────────────────────────────────────────────────────────

  /// Returns the caller's referral code — creates one if it doesn't exist yet.
  public shared ({ caller }) func getMyReferralCode() : async ReferralTypes.ReferralCode {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let name = switch (profiles.get(caller)) {
      case (null) { "Driver" };
      case (?p) { p.displayName };
    };
    ReferralLib.getOrCreateCode(referralCodes, caller.toText(), name);
  };

  /// Returns the caller's referral summary — times used, total earned, pending bonus.
  public query ({ caller }) func getReferralStats() : async { timesUsed : Nat; totalEarned : Float; pendingBonus : Float } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return { timesUsed = 0; totalEarned = 0.0; pendingBonus = 0.0 };
    };
    ReferralLib.getReferralStats(referralCodes, referralUses, caller.toText(), referralConfig.value);
  };

  /// Returns the caller's current referral credit balance (ZAR).
  /// Displayed at payment time: "You have R50 credit — you only pay R300 this month!"
  public query ({ caller }) func getMyReferralCredit() : async Float {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return 0.0;
    };
    ReferralLib.getCreditBalance(referralCreditBalances, caller.toText());
  };

  /// Called when a new driver signs up — records who referred them.
  /// The R50 credit is applied to the referrer when this driver makes their FIRST payment.
  /// Returns #ok if successful, #err with reason if not.
  public shared ({ caller }) func applyReferralCode(code : Text) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    if (not referralConfig.value.enabled) {
      return #err("Referral programme is not currently active");
    };
    ReferralLib.applyReferral(referralCodes, referralUses, code, caller.toText());
  };

  /// Called by the payment webhook handler after a referred driver's FIRST subscription payment.
  /// Applies R50 credit to the referrer's balance and marks the referral use as paid.
  /// Returns the referrer's userId if credit was applied, or null if no qualifying referral found.
  /// Internal: meant to be called from the SnapScan webhook handler in main.mo.
  /// Idempotent: calling this multiple times for the same newDriverId within 5 minutes is a no-op.
  public shared ({ caller = _ }) func triggerReferralBonus(newDriverId : Text) : async ?Text {
    // Build idempotency key from the newDriverId + their referral code (if any)
    // Find the code for this driver first
    var foundCode : ?Text = null;
    for (use in referralUses.values()) {
      if (use.referredUserId == newDriverId and not use.bonusPaid) {
        foundCode := ?use.code;
      };
    };
    switch (foundCode) {
      case (null) {
        // No unpaid referral found — nothing to do
        return null;
      };
      case (?code) {
        let idempotencyKey = code # ":" # newDriverId;
        let now = Time.now();
        // Check if we already processed this within the last 5 minutes (300 billion ns)
        switch (processedReferralBonuses.get(idempotencyKey)) {
          case (?processedAt) {
            if (now - processedAt < 300_000_000_000) {
              // Already processed recently — return early (idempotent no-op)
              return null;
            };
          };
          case (null) {};
        };
        // Mark as in-progress before applying bonus (prevents concurrent double-credit)
        processedReferralBonuses.add(idempotencyKey, now);
        ReferralLib.applyReferralBonus(
          referralCodes,
          referralUses,
          referralCreditBalances,
          newDriverId,
          referralConfig.value,
        );
      };
    };
  };

  /// Called at subscription renewal when the driver has referral credit.
  /// Consumes up to `subscriptionPrice` from the driver's credit balance.
  /// Returns { creditApplied; remainingBalance; amountDue } where amountDue = subscriptionPrice - creditApplied.
  public shared ({ caller }) func applyReferralCreditToPayment(subscriptionPrice : Float) : async {
    creditApplied : Float;
    remainingBalance : Float;
    amountDue : Float;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return { creditApplied = 0.0; remainingBalance = 0.0; amountDue = subscriptionPrice };
    };
    let (consumed, remaining) = ReferralLib.consumeCredit(
      referralCreditBalances,
      caller.toText(),
      subscriptionPrice,
    );
    {
      creditApplied = consumed;
      remainingBalance = remaining;
      amountDue = subscriptionPrice - consumed;
    };
  };

  /// Returns the current referral config — shows drivers what bonus to expect.
  public query func getReferralConfig() : async ReferralTypes.ReferralConfig {
    referralConfig.value;
  };

  // ── Admin API ──────────────────────────────────────────────────────────────

  /// Admin only: update the referral config (enable/disable, set bonus amount, min trips, etc.).
  public shared ({ caller }) func setReferralConfig(config : ReferralTypes.ReferralConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set referral config");
    };
    referralConfig.value := config;
  };

  /// Admin only: returns the complete referral use log.
  public query ({ caller }) func getAllReferrals() : async [ReferralTypes.ReferralUse] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all referrals");
    };
    ReferralLib.getAllReferralUses(referralUses);
  };

  /// Admin only: view a driver's current credit balance by userId (Principal text).
  public query ({ caller }) func getDriverCreditBalance(driverId : Text) : async Float {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    ReferralLib.getCreditBalance(referralCreditBalances, driverId);
  };
};

