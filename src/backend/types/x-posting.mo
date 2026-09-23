/// X (Twitter) autonomous posting types for Nduna's Layer 4 social presence.
/// Nduna earns USDC from 0xWork/Uphive; once monthly earnings exceed the threshold
/// he funds his own X API access and posts autonomously (with admin approval gate).
module {

  /// X API credentials and posting state.
  /// API keys are stored here but NEVER returned in plain text — only masked previews.
  public type XPostingConfig = {
    xApiKey             : Text;   // X API OAuth2 Bearer token (App-only auth)
    xApiSecret          : Text;   // kept for future OAuth1 signing
    xAccessToken        : Text;   // kept for future OAuth1 signing
    xAccessTokenSecret  : Text;   // kept for future OAuth1 signing
    earningsThresholdUsd : Nat;   // USDC threshold to unlock posting (default: 100)
    monthlyEarningsCents : Nat;   // cumulative USDC * 100 for this calendar month
    isUnlocked          : Bool;   // true once threshold has been crossed
    totalPostsPublished : Nat;    // lifetime post count
    lastPostAt          : ?Int;   // timestamp of last published post
  };

  /// Post type — maps to SA-localized template content.
  public type XPostType = {
    #DriverWin;       // A SA driver success story
    #SAIntelligence;  // SA ride-hailing market intelligence
    #IncomeTip;       // Practical income tip for SA drivers
    #TaskOutcome;     // Nduna's 0xWork task completion update
  };

  /// Lifecycle status of a single post.
  public type XPostStatus = {
    #pending;    // Queued, not yet sent
    #posted;     // Successfully posted to X
    #failed;     // HTTP call succeeded but posting failed
    #scheduled;  // Saved for later (not yet implemented — reserved)
  };

  /// A single X post record.
  public type XPost = {
    id               : Nat;
    content          : Text;
    postType         : XPostType;
    postedAt         : ?Int;
    status           : XPostStatus;
    xPostId          : ?Text;   // X's own tweet ID, set after successful post
    likesCount       : Nat;
    retweetsCount    : Nat;
    repliesCount     : Nat;
    impressionsCount : Nat;
  };

  /// Function return type for post operations.
  public type XPostResult = {
    #ok  : XPost;
    #err : Text;
  };
};
