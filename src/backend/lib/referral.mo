import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import ReferralTypes "../types/referral";

/// Domain logic for the MoneyDrive Referral Engine.
/// R50 credit per qualifying sign-up, applied to the referrer's next subscription payment.
module {
  public type ReferralCode = ReferralTypes.ReferralCode;
  public type ReferralUse = ReferralTypes.ReferralUse;
  public type ReferralConfig = ReferralTypes.ReferralConfig;

  /// Default referral config — R50 subscription credit per qualifying referral.
  public func defaultConfig() : ReferralConfig {
    {
      enabled = true;
      bonusPerReferral = 50.0;
      bonusSource = "subscription_credit";
      bonusDescription = "R50 credit applied to your next subscription payment";
      minTripsToQualify = 50;
    };
  };

  /// Generate a referral code from userId and display name.
  /// Format: "MD-[FIRST3CHARS_OF_NAME_UPPERCASED][4_DIGIT_HASH]"
  /// e.g. "MD-TAB1234"
  public func generateCode(userId : Text, name : Text) : Text {
    // Take first 3 chars of name (uppercase, letters only)
    let nameArr = name.toUpper().toArray();
    var prefix = "";
    var count = 0;
    for (c in nameArr.values()) {
      if (count < 3) {
        let code = c.toNat32();
        // A-Z only
        if (code >= 65 and code <= 90) {
          prefix := prefix # Text.fromChar(c);
          count += 1;
        };
      };
    };
    if (prefix.size() < 3) {
      let gap : Nat = if (prefix.size() < 3) { 3 - prefix.size() } else { 0 };
      let padding = Array.tabulate(gap, func(_) { 'X' });
      prefix := prefix # Text.fromArray(padding);
    };

    // Build a 4-digit hash from userId + timestamp
    let seed = userId.size() + Int.abs(Time.now()) % 9000 + 1000;
    let hash = ((seed * 7919) % 9000 + 1000).toText();

    "MD-" # prefix # hash;
  };

  /// Get or create a referral code for a driver.
  /// If the driver already has a code, returns it. Otherwise creates and stores a new one.
  public func getOrCreateCode(
    referralCodes : Map.Map<Text, ReferralCode>,
    userId : Text,
    name : Text,
  ) : ReferralCode {
    // Look up by ownerId
    for ((_, rc) in referralCodes.entries()) {
      if (rc.ownerId == userId) {
        return rc;
      };
    };
    // Create new code
    let code = generateCode(userId, name);
    let rc : ReferralCode = {
      code;
      ownerId = userId;
      ownerName = name;
      createdAt = Time.now();
      timesUsed = 0;
      totalEarned = 0.0;
    };
    referralCodes.add(code, rc);
    rc;
  };

  /// Record a referral use — called when a new driver enters a referral code.
  /// Returns #ok if the code exists and the referral was recorded.
  /// Returns #err if the code does not exist or was already used by this driver.
  public func applyReferral(
    referralCodes : Map.Map<Text, ReferralCode>,
    referralUses : List.List<ReferralUse>,
    code : Text,
    newUserId : Text,
  ) : { #ok : (); #err : Text } {
    // Validate code exists
    let rc = switch (referralCodes.get(code)) {
      case (null) { return #err("Referral code not found: " # code) };
      case (?r) { r };
    };

    // Prevent self-referral
    if (rc.ownerId == newUserId) {
      return #err("You cannot use your own referral code");
    };

    // Prevent duplicate use
    for (use in referralUses.values()) {
      if (use.code == code and use.referredUserId == newUserId) {
        return #err("You have already used this referral code");
      };
    };

    // Record use (bonus not yet paid — credit applied on first payment)
    let use : ReferralUse = {
      code;
      referredUserId = newUserId;
      usedAt = Time.now();
      bonusPaid = false;
      bonusAmount = 0.0;
    };
    referralUses.add(use);

    // Increment timesUsed on the code
    referralCodes.add(code, { rc with timesUsed = rc.timesUsed + 1 });

    #ok(());
  };

  /// Apply the R50 referral credit to the referrer when a referred driver makes their first payment.
  /// Finds the referral use record for newUserId, marks it bonusPaid=true, credits the referrer.
  /// Returns the referrer's userId (Text) if credit was applied, null if no qualifying referral found.
  public func applyReferralBonus(
    referralCodes : Map.Map<Text, ReferralCode>,
    referralUses : List.List<ReferralUse>,
    creditBalances : Map.Map<Text, Float>,
    newUserId : Text,
    config : ReferralConfig,
  ) : ?Text {
    if (not config.enabled or config.bonusPerReferral <= 0.0) {
      return null;
    };

    // Find the unpaid referral use for this new driver
    var foundCode : ?Text = null;
    for (use in referralUses.values()) {
      if (use.referredUserId == newUserId and not use.bonusPaid) {
        foundCode := ?use.code;
      };
    };

    let code = switch (foundCode) {
      case (null) { return null };
      case (?c) { c };
    };

    // Find the referrer's code record
    let rc = switch (referralCodes.get(code)) {
      case (null) { return null };
      case (?r) { r };
    };

    // Mark the referral use as bonusPaid and record amount
    referralUses.mapInPlace(func(use : ReferralUse) : ReferralUse {
      if (use.referredUserId == newUserId and use.code == code and not use.bonusPaid) {
        { use with bonusPaid = true; bonusAmount = config.bonusPerReferral };
      } else { use };
    });

    // Add credit to referrer's balance
    let existing = switch (creditBalances.get(rc.ownerId)) {
      case (null) { 0.0 };
      case (?bal) { bal };
    };
    creditBalances.add(rc.ownerId, existing + config.bonusPerReferral);

    // Update code's totalEarned
    referralCodes.add(code, { rc with totalEarned = rc.totalEarned + config.bonusPerReferral });

    ?rc.ownerId;
  };

  /// Get a driver's referral code (if they have one).
  public func getCodeForDriver(
    referralCodes : Map.Map<Text, ReferralCode>,
    userId : Text,
  ) : ?ReferralCode {
    for ((_, rc) in referralCodes.entries()) {
      if (rc.ownerId == userId) {
        return ?rc;
      };
    };
    null;
  };

  /// Count referral uses for a driver and sum pending bonuses.
  public func getReferralStats(
    referralCodes : Map.Map<Text, ReferralCode>,
    referralUses : List.List<ReferralUse>,
    userId : Text,
    config : ReferralConfig,
  ) : { timesUsed : Nat; totalEarned : Float; pendingBonus : Float } {
    let rc = switch (getCodeForDriver(referralCodes, userId)) {
      case (null) { return { timesUsed = 0; totalEarned = 0.0; pendingBonus = 0.0 } };
      case (?r) { r };
    };

    var pendingBonus : Float = 0.0;
    for (use in referralUses.values()) {
      if (use.code == rc.code and not use.bonusPaid) {
        pendingBonus := pendingBonus + config.bonusPerReferral;
      };
    };

    {
      timesUsed = rc.timesUsed;
      totalEarned = rc.totalEarned;
      pendingBonus;
    };
  };

  /// Get the current credit balance for a driver (ZAR).
  public func getCreditBalance(
    creditBalances : Map.Map<Text, Float>,
    userId : Text,
  ) : Float {
    switch (creditBalances.get(userId)) {
      case (null) { 0.0 };
      case (?bal) { bal };
    };
  };

  /// Consume credit from a driver's balance (e.g. at subscription renewal).
  /// Returns (amountConsumed, remainingBalance). Consumes up to the requested amount.
  public func consumeCredit(
    creditBalances : Map.Map<Text, Float>,
    userId : Text,
    requestedAmount : Float,
  ) : (Float, Float) {
    let balance = switch (creditBalances.get(userId)) {
      case (null) { 0.0 };
      case (?bal) { bal };
    };
    if (balance <= 0.0) { return (0.0, 0.0) };
    let consumed = if (balance >= requestedAmount) { requestedAmount } else { balance };
    let remaining = balance - consumed;
    creditBalances.add(userId, remaining);
    (consumed, remaining);
  };

  /// Get all referral uses (admin only — for the full referral log).
  public func getAllReferralUses(referralUses : List.List<ReferralUse>) : [ReferralUse] {
    referralUses.toArray();
  };
};
