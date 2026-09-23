import List         "mo:core/List";
import Time         "mo:core/Time";
import Nat          "mo:core/Nat";
import Text         "mo:core/Text";
import Runtime      "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import XPostingTypes "../types/x-posting";
import XApiProvider  "../lib/x-api/XApiProvider";
import AnalyticsLog  "../lib/analytics-log";

/// X (Twitter) autonomous posting mixin for Nduna — Layer 4.
///
/// Nduna's USDC earnings from 0xWork/Uphive are tracked via updateMonthlyXEarnings().
/// Once cumulative monthly earnings cross earningsThresholdUsd * 100 cents,
/// isUnlocked flips to true and triggerNdunaXPost() can publish to X.
///
/// All posts require admin to call triggerNdunaXPost() — Nduna cannot self-publish.
/// Content is generated from SA-localized templates without any LLM call (fast + free).
mixin (
  analyticsLog          : AnalyticsLog.State,
  accessControlState    : AccessControl.AccessControlState,
  xPostingConfig        : { var value : XPostingTypes.XPostingConfig },
  xPosts                : List.List<XPostingTypes.XPost>,
  xPostIdCounter        : { var value : Nat },
) {

  // ── Private helpers ──────────────────────────────────────────────────────────

  private func requireXAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
  };

  /// Generate SA-localized content for a post type — no LLM call needed.
  private func generateContent(postType : XPostingTypes.XPostType) : Text {
    switch (postType) {
      case (#DriverWin) {
        "\u{1F697} A SA Bolt/Uber driver just closed their first in-car ad deal using MoneyDrive. " #
        "Nduna wrote the pitch. The passenger liked it. Real income, real stories. " #
        "#MoneyDrive #SARideHailing"
      };
      case (#SAIntelligence) {
        "\u{1F4CA} SA ride-hailing intel: fuel prices up but ride-sharing demand holds strong " #
        "in Joburg & Cape Town. MoneyDrive drivers stay ahead of the curve. " #
        "#MoneyDrive #SouthAfrica"
      };
      case (#IncomeTip) {
        "\u{1F4A1} Nduna's income tip for SA drivers: turn your passenger time into pitch time. " #
        "In-car ads via MoneyDrive pay R500\u{2013}2,000/month for a 30-second conversation. " #
        "Start free. #GigEconomy #SouthAfrica"
      };
      case (#TaskOutcome) {
        "\u{1F916} Nduna just completed a research task on @0xwork_io and earned USDC. " #
        "That's an AI agent that works for you \u{2014} not just for itself. " #
        "Layer 4 is real. #AIAgent #MoneyDrive"
      };
    };
  };

  /// Mask an API key — shows first 6 chars then "****", or empty string if not set.
  private func maskKey(key : Text) : Text {
    if (key.size() > 6) {
      Text.fromArray(key.toArray().sliceToArray(0, 6)) # "****"
    } else if (key.size() > 0) {
      "****"
    } else {
      ""
    };
  };

  // ── Admin: setXApiKeys ───────────────────────────────────────────────────────

  /// Admin only: store X API credentials.
  /// xApiKey should be the OAuth 2.0 Bearer Token from the X Developer Portal.
  /// Keys are never returned in plain text.
  public shared ({ caller }) func setXApiKeys(
    xApiKey            : Text,
    xApiSecret         : Text,
    xAccessToken       : Text,
    xAccessTokenSecret : Text,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    xPostingConfig.value := {
      xPostingConfig.value with
      xApiKey;
      xApiSecret;
      xAccessToken;
      xAccessTokenSecret;
    };
    AnalyticsLog.logEvent(
      analyticsLog, "x_posting", "api_keys_updated",
      caller.toText(), null, true, null, "{}", ?"admin",
    );
    #ok(());
  };

  // ── Admin: setXEarningsThreshold ─────────────────────────────────────────────

  /// Admin only: update the USDC threshold (in whole dollars) to unlock X posting.
  public shared ({ caller }) func setXEarningsThreshold(thresholdUsd : Nat) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    xPostingConfig.value := {
      xPostingConfig.value with
      earningsThresholdUsd = thresholdUsd;
    };
    AnalyticsLog.logEvent(
      analyticsLog, "x_posting", "threshold_updated",
      caller.toText(), null, true, null,
      "{\"thresholdUsd\":" # thresholdUsd.toText() # "}",
      ?"admin",
    );
    #ok(());
  };

  // ── Admin: updateMonthlyXEarnings ─────────────────────────────────────────────

  /// Admin only: update cumulative monthly USDC earnings (in cents, 1 USDC = 100 cents).
  /// Auto-unlocks X posting if the threshold is crossed for the first time.
  /// Called by sync0xWorkEarnings() so the tracker stays in sync automatically.
  public shared ({ caller }) func updateMonthlyXEarnings(earningsCents : Nat) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };

    let thresholdCents  = xPostingConfig.value.earningsThresholdUsd * 100;
    let wasUnlocked     = xPostingConfig.value.isUnlocked;
    let shouldUnlock    = earningsCents >= thresholdCents;

    xPostingConfig.value := {
      xPostingConfig.value with
      monthlyEarningsCents = earningsCents;
      isUnlocked           = shouldUnlock;
    };

    // Log threshold crossing only once
    if (shouldUnlock and not wasUnlocked) {
      AnalyticsLog.logEvent(
        analyticsLog, "x_posting", "threshold_crossed",
        caller.toText(), null, true, null,
        "{\"earningsCents\":" # earningsCents.toText() #
        ",\"thresholdCents\":" # thresholdCents.toText() # "}",
        ?"admin",
      );
    };

    #ok(());
  };

  // ── Admin: triggerNdunaXPost ──────────────────────────────────────────────────

  /// Admin only: generate and post a tweet on Nduna's behalf.
  /// Checks isUnlocked before posting — returns #err if threshold not met.
  /// Content is generated from SA-localized templates (no LLM call).
  public shared ({ caller }) func triggerNdunaXPost(postType : XPostingTypes.XPostType) : async { #ok : XPostingTypes.XPost; #err : Text } {
    requireXAdmin(caller);

    if (not xPostingConfig.value.isUnlocked) {
      let earned    = xPostingConfig.value.monthlyEarningsCents;
      let threshold = xPostingConfig.value.earningsThresholdUsd * 100;
      return #err(
        "X posting locked. Nduna needs $" # xPostingConfig.value.earningsThresholdUsd.toText() #
        " USDC/month to fund the X API. Current: $" # (earned / 100).toText() #
        "." # (earned % 100).toText() # " USDC."
      );
    };

    if (xPostingConfig.value.xApiKey == "") {
      return #err("X API Bearer token not configured. Set it via setXApiKeys().");
    };

    let content = generateContent(postType);

    // Post to X
    let postResult = await XApiProvider.postTweet(
      xPostingConfig.value.xApiKey,
      xPostingConfig.value.xApiSecret,
      xPostingConfig.value.xAccessToken,
      xPostingConfig.value.xAccessTokenSecret,
      content,
    );

    let now = Time.now();
    xPostIdCounter.value += 1;

    let (status, xPostId) : (XPostingTypes.XPostStatus, ?Text) = switch (postResult) {
      case (#ok(id))  { (#posted, ?id) };
      case (#err(_))  { (#failed, null) };
    };

    let post : XPostingTypes.XPost = {
      id               = xPostIdCounter.value;
      content;
      postType;
      postedAt         = if (status == #posted) { ?now } else { null };
      status;
      xPostId;
      likesCount       = 0;
      retweetsCount    = 0;
      repliesCount     = 0;
      impressionsCount = 0;
    };

    xPosts.add(post);

    if (status == #posted) {
      xPostingConfig.value := {
        xPostingConfig.value with
        totalPostsPublished = xPostingConfig.value.totalPostsPublished + 1;
        lastPostAt          = ?now;
      };
      AnalyticsLog.logEvent(
        analyticsLog, "x_posting", "post_published",
        caller.toText(), null, true, null,
        "{\"postId\":" # xPostIdCounter.value.toText() #
        ",\"type\":\"" # _postTypeText(postType) # "\"}",
        ?"admin",
      );
      #ok(post)
    } else {
      let errMsg = switch (postResult) {
        case (#err(e)) { e };
        case (#ok(_))  { "unknown" };
      };
      AnalyticsLog.logEvent(
        analyticsLog, "x_posting", "post_failed",
        caller.toText(), null, false, ?errMsg,
        "{\"postId\":" # xPostIdCounter.value.toText() # "}",
        ?"admin",
      );
      #err("Failed to post: " # errMsg)
    };
  };

  // ── Admin: syncXPostMetrics ──────────────────────────────────────────────────

  /// Admin only: refresh engagement metrics for all successfully posted tweets.
  /// Makes one X API call per posted tweet. Returns count of tweets synced.
  public shared ({ caller }) func syncXPostMetrics() : async { #ok : Nat; #err : Text } {
    requireXAdmin(caller);

    if (xPostingConfig.value.xApiKey == "") {
      return #err("X API Bearer token not configured.");
    };

    var synced = 0;

    // Collect posts that need syncing
    let toSync = xPosts.filter(func(p : XPostingTypes.XPost) : Bool {
      p.status == #posted and p.xPostId != null and p.xPostId != ?""
    });

    let bearer = xPostingConfig.value.xApiKey;

    // Iterate and update one at a time (sequential async calls)
    for (post in toSync.values()) {
      switch (post.xPostId) {
        case (null) {};
        case (?tweetId) {
          let metricsResult = await XApiProvider.getTweetMetrics(bearer, tweetId);
          switch (metricsResult) {
            case (#ok(m)) {
              xPosts.mapInPlace(func(p : XPostingTypes.XPost) : XPostingTypes.XPost {
                if (p.id == post.id) {
                  {
                    p with
                    likesCount       = m.likes;
                    retweetsCount    = m.retweets;
                    repliesCount     = m.replies;
                    impressionsCount = m.impressions;
                  }
                } else { p }
              });
              synced += 1;
            };
            case (#err(_)) { /* skip failed metric fetch — keep existing values */ };
          };
        };
      };
    };

    AnalyticsLog.logEvent(
      analyticsLog, "x_posting", "metrics_synced",
      caller.toText(), null, true, null,
      "{\"synced\":" # synced.toText() # "}",
      ?"admin",
    );

    #ok(synced);
  };

  // ── Public queries ───────────────────────────────────────────────────────────

  /// Public query: returns X posting config with API keys masked.
  public query func getXPostingConfig() : async XPostingTypes.XPostingConfig {
    {
      xPostingConfig.value with
      xApiKey            = maskKey(xPostingConfig.value.xApiKey);
      xApiSecret         = maskKey(xPostingConfig.value.xApiSecret);
      xAccessToken       = maskKey(xPostingConfig.value.xAccessToken);
      xAccessTokenSecret = maskKey(xPostingConfig.value.xAccessTokenSecret);
    };
  };

  /// Public query: paginated list of posts, newest first.
  public query func getXPosts(limit : Nat, offset : Nat) : async [XPostingTypes.XPost] {
    let all = xPosts.reverse().toArray();
    let start = if (offset >= all.size()) { return [] } else { offset };
    let end   = Nat.min(start + limit, all.size());
    all.sliceToArray(start, end)
  };

  /// Public query: dashboard summary for admin panels.
  public query func getXPostingStatus() : async {
    isUnlocked    : Bool;
    earningsCents : Nat;
    thresholdCents : Nat;
    progressPct   : Nat;
    totalPosts    : Nat;
  } {
    let cfg            = xPostingConfig.value;
    let thresholdCents = cfg.earningsThresholdUsd * 100;
    let progressPct    = if (thresholdCents == 0) {
      100
    } else if (cfg.monthlyEarningsCents >= thresholdCents) {
      100
    } else {
      cfg.monthlyEarningsCents * 100 / thresholdCents
    };
    {
      isUnlocked     = cfg.isUnlocked;
      earningsCents  = cfg.monthlyEarningsCents;
      thresholdCents;
      progressPct;
      totalPosts     = cfg.totalPostsPublished;
    };
  };

  // ── Private utility ──────────────────────────────────────────────────────────

  private func _postTypeText(pt : XPostingTypes.XPostType) : Text {
    switch (pt) {
      case (#DriverWin)      { "DriverWin" };
      case (#SAIntelligence) { "SAIntelligence" };
      case (#IncomeTip)      { "IncomeTip" };
      case (#TaskOutcome)    { "TaskOutcome" };
    };
  };

};
