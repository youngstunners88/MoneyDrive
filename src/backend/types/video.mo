module {
  /// Processing status for a raw video upload.
  public type UploadStatus = {
    #pending;
    #processing;
    #ready;
    #failed;
  };

  /// Processing status for a derived video clip.
  public type ClipStatus = {
    #pending;
    #captioning;
    #branding;
    #ready;
    #failed;
  };

  /// Status of a scheduled or posted video on a social platform.
  public type PostStatus = {
    #scheduled;
    #posted;
    #failed;
  };

  /// Social platforms supported by the video automation engine.
  public type SocialPlatform = {
    #tiktok;
    #instagram;
    #youtube;
    #linkedin;
  };

  /// A raw video uploaded by a driver — references object-storage, never inline bytes.
  public type VideoUpload = {
    id               : Text;
    driverId         : Text;           // Principal.toText()
    storageRef       : Text;           // object-storage key
    fileName         : Text;
    fileSizeBytes    : Nat;
    contentType      : Text;           // "video/mp4" etc.
    uploadedAt       : Int;
    processingStatus : UploadStatus;
    errorMsg         : ?Text;
  };

  /// A short-form clip derived from a VideoUpload, enhanced with captions and branding.
  public type VideoClip = {
    id               : Text;
    uploadId         : Text;           // References VideoUpload.id
    driverId         : Text;
    storageRef       : Text;           // object-storage key for raw clip
    startSec         : Float;          // Start time in source video (seconds)
    endSec           : Float;          // End time in source video (seconds)
    durationSec      : Float;
    captionsVttRef   : ?Text;          // object-storage key for VTT caption file (Whisper output)
    brandedStorageRef : ?Text;         // object-storage key for final branded clip
    title            : ?Text;
    processingStatus : ClipStatus;
    errorMsg         : ?Text;
  };

  /// A scheduled or completed post of a VideoClip to a social platform.
  public type VideoPost = {
    id             : Text;
    clipId         : Text;             // References VideoClip.id
    driverId       : Text;
    platform       : SocialPlatform;
    scheduledAt    : ?Int;             // null = post immediately
    postedAt       : ?Int;
    platformPostId : ?Text;            // Returned by the platform API after posting
    status         : PostStatus;
    errorMsg       : ?Text;
  };

  /// Analytics snapshot for a posted clip — fetched from platform APIs.
  public type VideoAnalytics = {
    postId          : Text;            // References VideoPost.id
    platform        : SocialPlatform;
    fetchedAt       : Int;
    views           : Nat;
    likes           : Nat;
    shares          : Nat;
    comments        : Nat;
    engagementRate  : Float;           // (likes + comments + shares) / views
  };

  /// Upload-Post API configuration — admin-only, never exposed to frontend.
  /// Used for posting to TikTok, Instagram Reels, YouTube Shorts, LinkedIn.
  public type UploadPostConfig = {
    apiKey    : Text;
    accountId : Text;
  };

  /// Whisper API configuration for auto-captioning — admin-only.
  public type WhisperConfig = {
    apiKey : Text;
  };

  /// Aggregate processing status for a single VideoUpload job.
  public type VideoJobStatus = {
    uploadId       : Text;
    clipsGenerated : Nat;
    clipsReady     : Nat;
    clipsFailed    : Nat;
    postsScheduled : Nat;
    postsPosted    : Nat;
    lastUpdatedAt  : Int;
  };

  /// Branding preferences a driver can configure for their clips.
  public type BrandingConfig = {
    driverName       : Text;
    showMoneyDriveLogo : Bool;
    accentColor      : Text;           // hex colour e.g. "#D97706"
    musicPreference  : Text;           // "upbeat" | "calm" | "none"
    callToAction     : Text;           // e.g. "Join MoneyDrive" or referral link
  };

  /// Posting schedule for a driver (when to auto-post across the week).
  public type PostingSchedule = {
    driverId          : Text;
    platformsEnabled  : [SocialPlatform];
    postsPerWeek      : Nat;           // e.g. 3
    preferredDays     : [Nat];         // 0=Sun … 6=Sat
    preferredHourUtc  : Nat;           // 0–23
    enabled           : Bool;
  };
};
