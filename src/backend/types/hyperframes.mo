module {
  /// Status of a Hyperframes render job.
  public type HyperframesRenderStatus = {
    #pending;
    #rendering;
    #ready;
    #failed;
  };

  /// A single Hyperframes video generation job record.
  public type HyperframesJob = {
    id            : Text;
    driverId      : Text;
    topic         : Text;
    compositionHtml : Text;
    renderStatus  : HyperframesRenderStatus;
    mp4Url        : ?Text;
    errorMsg      : ?Text;
    createdAt     : Int;
  };

  // ─── YouTube Shorts Auto-Clip types ─────────────────────────────────────────

  /// Processing status of a Shorts clip job.
  public type ShortsStatus = {
    #pending;
    #transcribing;
    #selecting;
    #rendering;
    #ready;
    #failed;
  };

  /// A single Shorts auto-clip job record.
  public type ShortsJob = {
    id                   : Text;
    driverId             : Principal;
    sourceUrl            : Text;
    sourceType           : { #youtube; #upload };
    clipStatus           : ShortsStatus;
    outputMp4Url         : ?Text;
    selectedSegmentStart : ?Nat;
    selectedSegmentEnd   : ?Nat;
    errorMsg             : ?Text;
    createdAt            : Int;
  };

  /// Request payload for submitting a new Shorts clip job.
  public type ShortsRequest = {
    sourceUrl  : Text;
    sourceType : { #youtube; #upload };
  };

  /// Admin-controlled VPS configuration for the Shorts pipeline.
  public type ShortsConfig = {
    vpsUrl : ?Text;
    vpsKey : ?Text;
  };
};
