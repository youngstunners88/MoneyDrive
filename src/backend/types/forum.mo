import CommonTypes "common";

module {
  public type UserId = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  public type ForumChannel = {
    #whatILove;
    #whatNeedsWork;
    #featureRequests;
  };

  public type ForumPostId = Text;

  // Internal type — likedBy stored externally as ForumLike map
  public type ForumPost = {
    id : ForumPostId;
    channel : ForumChannel;
    authorId : UserId;
    isAnonymous : Bool;
    text : Text;
    voiceNoteKey : ?Text;
    timestamp : Timestamp;
    replyCount : Nat;
    likeCount : Nat;
    flagCount : Nat;
    parentId : ?ForumPostId;
    deleted : Bool;
  };

  public type ForumLike = {
    userId : UserId;
    postId : ForumPostId;
    timestamp : Timestamp;
  };

  public type ForumFlag = {
    userId : UserId;
    postId : ForumPostId;
    reason : Text;
    timestamp : Timestamp;
  };

  public type ForumPage = {
    posts : [ForumPost];
    total : Nat;
    nextOffset : ?Nat;
  };

  // Channel name helper for admin stats keying
  public func channelToText(channel : ForumChannel) : Text {
    switch (channel) {
      case (#whatILove) { "whatILove" };
      case (#whatNeedsWork) { "whatNeedsWork" };
      case (#featureRequests) { "featureRequests" };
    };
  };
};
