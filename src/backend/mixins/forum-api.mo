import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import ForumTypes "../types/forum";

// eTavern Community Forum — public functions for all tiers.
//
// Anonymous masking: when isAnonymous=true the post's authorId is replaced by
// Principal.anonymous() in the returned value. The real authorId is stored
// internally so that the author can still delete their own post.
// A stable anon display label is derived from a deterministic hash of
// (authorId # postId) so the same author always gets the same label on the
// same post without leaking identity.
mixin (
  accessControlState : AccessControl.AccessControlState,
  forumPosts         : Map.Map<ForumTypes.ForumPostId, ForumTypes.ForumPost>,
  forumLikes         : Map.Map<Text, ForumTypes.ForumLike>,  // key = callerId#"#"#postId
  forumFlags         : Map.Map<Text, ForumTypes.ForumFlag>,  // key = callerId#"#"#postId
) {

  // ── Private helpers ────────────────────────────────────────────────────────

  // Replace authorId with anonymous principal for public-facing responses.
  private func _maskPost(post : ForumTypes.ForumPost) : ForumTypes.ForumPost {
    if (post.isAnonymous) {
      { post with authorId = Principal.anonymous() }
    } else {
      post
    }
  };

  // Collect all active (non-deleted) top-level posts for a channel, newest first.
  private func _channelPosts(channel : ForumTypes.ForumChannel) : [ForumTypes.ForumPost] {
    let raw = forumPosts.values().toArray()
      .filter(func(p : ForumTypes.ForumPost) : Bool {
        p.channel == channel and p.parentId == null and not p.deleted
      });
    raw.sort(func(a : ForumTypes.ForumPost, b : ForumTypes.ForumPost) : { #less; #equal; #greater } {
      Int.compare(b.timestamp, a.timestamp)
    })
  };

  // Collect replies for a given parentId, sorted oldest first.
  private func _replies(parentId : ForumTypes.ForumPostId) : [ForumTypes.ForumPost] {
    let raw = forumPosts.values().toArray()
      .filter(func(p : ForumTypes.ForumPost) : Bool {
        switch (p.parentId) {
          case (?pid) { pid == parentId and not p.deleted };
          case null   { false };
        }
      });
    raw.sort(func(a : ForumTypes.ForumPost, b : ForumTypes.ForumPost) : { #less; #equal; #greater } {
      Int.compare(a.timestamp, b.timestamp)
    })
  };

  // Slice an array and return a ForumPage.
  private func _paginate(posts : [ForumTypes.ForumPost], offset : Nat, limit : Nat) : ForumTypes.ForumPage {
    let cap    = if (limit == 0 or limit > 25) { 25 } else { limit };
    let total  = posts.size();
    if (offset >= total) {
      return { posts = []; total; nextOffset = null };
    };
    let endIdx       = if (offset + cap > total) { total } else { offset + cap };
    let slice        = posts.sliceToArray(offset, endIdx);
    let nextOffset : ?Nat = if (endIdx < total) { ?(endIdx) } else { null };
    { posts = slice; total; nextOffset }
  };

  // Mask all posts in a page.
  private func _maskPage(page : ForumTypes.ForumPage) : ForumTypes.ForumPage {
    { page with posts = page.posts.map(func(p : ForumTypes.ForumPost) : ForumTypes.ForumPost { _maskPost(p) }) }
  };

  // ── Public canister methods ────────────────────────────────────────────────

  /// Create a new top-level post or a reply in the eTavern community forum.
  /// Text is capped at 2000 characters. Replies cannot be nested deeper than one level.
  public shared ({ caller }) func createForumPost(
    channel      : ForumTypes.ForumChannel,
    text         : Text,
    isAnonymous  : Bool,
    voiceNoteKey : ?Text,
    parentId     : ?ForumTypes.ForumPostId,
  ) : async { #ok : ForumTypes.ForumPost; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in to post in eTavern");
    };
    if (text.size() == 0) {
      return #err("Post text cannot be empty");
    };
    if (text.size() > 2000) {
      return #err("Post text exceeds 2000 character limit");
    };
    // Validate parentId when replying
    switch (parentId) {
      case (?pid) {
        switch (forumPosts.get(pid)) {
          case (null) { return #err("Parent post not found") };
          case (?parent) {
            if (parent.deleted) { return #err("Cannot reply to a deleted post") };
            if (parent.parentId != null) { return #err("Nested replies are not allowed") };
          };
        };
      };
      case null {};
    };

    // Generate a stable ID: nanosecond timestamp + deterministic hash of caller+time
    let now = Time.now();
    let rawSeed = now.toText() # caller.toText();
    var h : Nat = 5381;
    for (c in rawSeed.toIter()) {
      h := ((h * 33) + Nat.fromNat32(c.toNat32())) % 4_294_967_296;
    };
    let postId : ForumTypes.ForumPostId = now.toText() # "-" # h.toText();

    let post : ForumTypes.ForumPost = {
      id           = postId;
      channel;
      authorId     = caller;
      isAnonymous;
      text;
      voiceNoteKey;
      timestamp    = now;
      replyCount   = 0;
      likeCount    = 0;
      flagCount    = 0;
      parentId;
      deleted      = false;
    };
    forumPosts.add(postId, post);

    // Increment parent replyCount atomically
    switch (parentId) {
      case (?pid) {
        switch (forumPosts.get(pid)) {
          case (?parent) {
            forumPosts.add(pid, { parent with replyCount = parent.replyCount + 1 });
          };
          case null {};
        };
      };
      case null {};
    };

    #ok(_maskPost(post))
  };

  /// Paginated feed of top-level posts for a channel (newest first, max 25/page).
  public query ({ caller }) func getForumPosts(
    channel : ForumTypes.ForumChannel,
    offset  : Nat,
    limit   : Nat,
  ) : async ForumTypes.ForumPage {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to view eTavern");
    };
    _maskPage(_paginate(_channelPosts(channel), offset, limit))
  };

  /// Single post by ID. Returns null if not found or soft-deleted.
  public query ({ caller }) func getForumPost(id : ForumTypes.ForumPostId) : async ?ForumTypes.ForumPost {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to view eTavern");
    };
    switch (forumPosts.get(id)) {
      case (null) { null };
      case (?post) {
        if (post.deleted) { null } else { ?(_maskPost(post)) }
      };
    }
  };

  /// Paginated replies for a post (oldest first, max 25/page).
  public query ({ caller }) func getForumReplies(
    parentId : ForumTypes.ForumPostId,
    offset   : Nat,
    limit    : Nat,
  ) : async ForumTypes.ForumPage {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to view eTavern");
    };
    _maskPage(_paginate(_replies(parentId), offset, limit))
  };

  /// Toggle like on a post. Returns new like count. Calling again unlike the post.
  public shared ({ caller }) func likeForumPost(postId : ForumTypes.ForumPostId) : async { #ok : Nat; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in to like posts");
    };
    switch (forumPosts.get(postId)) {
      case (null) { #err("Post not found") };
      case (?post) {
        if (post.deleted) { return #err("Post has been deleted") };
        let likeKey = caller.toText() # "#" # postId;
        switch (forumLikes.get(likeKey)) {
          case (?_) {
            // Already liked — toggle to unlike
            forumLikes.remove(likeKey);
            let newCount : Nat = if (post.likeCount > 0) { post.likeCount - 1 : Nat } else { 0 };
            forumPosts.add(postId, { post with likeCount = newCount });
            #ok(newCount)
          };
          case null {
            // New like
            forumLikes.add(likeKey, { userId = caller; postId; timestamp = Time.now() });
            let newCount = post.likeCount + 1;
            forumPosts.add(postId, { post with likeCount = newCount });
            #ok(newCount)
          };
        }
      };
    }
  };

  /// Returns whether the authenticated caller has liked the given post.
  public query ({ caller }) func hasLikedForumPost(postId : ForumTypes.ForumPostId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    forumLikes.containsKey(caller.toText() # "#" # postId)
  };

  /// Soft-delete a post. Caller must be the original author or an admin.
  /// Post ID is preserved for reply reference integrity.
  public shared ({ caller }) func deleteForumPost(postId : ForumTypes.ForumPostId) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    switch (forumPosts.get(postId)) {
      case (null) { #err("Post not found") };
      case (?post) {
        if (not Principal.equal(caller, post.authorId) and not AccessControl.isAdmin(accessControlState, caller)) {
          return #err("Unauthorized: Only the author or an admin can delete this post");
        };
        forumPosts.add(postId, { post with deleted = true });
        #ok(())
      };
    }
  };

  /// Flag a post for moderation review. One flag per user per post.
  public shared ({ caller }) func flagForumPost(postId : ForumTypes.ForumPostId, reason : Text) : async { #ok : (); #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in to flag posts");
    };
    switch (forumPosts.get(postId)) {
      case (null) { #err("Post not found") };
      case (?post) {
        if (post.deleted) { return #err("Post has been deleted") };
        let flagKey = caller.toText() # "#" # postId;
        if (forumFlags.containsKey(flagKey)) {
          return #err("You have already flagged this post");
        };
        let safeReason = if (reason.size() > 500) {
          Text.fromArray(reason.toArray().sliceToArray(0, 500))
        } else { reason };
        forumFlags.add(flagKey, { userId = caller; postId; reason = safeReason; timestamp = Time.now() });
        forumPosts.add(postId, { post with flagCount = post.flagCount + 1 });
        #ok(())
      };
    }
  };

  /// Admin only: aggregate stats for forum moderation dashboard.
  public query ({ caller }) func getForumAdminStats() : async {
    totalPosts      : Nat;
    postsPerChannel : [(Text, Nat)];
    flaggedPosts    : [ForumTypes.ForumPost];
    topContributors : [(Text, Nat)];
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin only");
    };
    var total     = 0;
    var loveCnt   = 0;
    var workCnt   = 0;
    var reqCnt    = 0;
    let flagged   = List.empty<ForumTypes.ForumPost>();
    let contribs  = Map.empty<Text, Nat>();

    for (post in forumPosts.values()) {
      if (not post.deleted) {
        total += 1;
        switch (post.channel) {
          case (#whatILove)       { loveCnt += 1 };
          case (#whatNeedsWork)   { workCnt += 1 };
          case (#featureRequests) { reqCnt  += 1 };
        };
        if (post.flagCount > 0) { flagged.add(post) };
        let key  = post.authorId.toText();
        let prev = switch (contribs.get(key)) { case (?n) n; case null 0 };
        contribs.add(key, prev + 1);
      };
    };

    // Flagged posts sorted by flagCount descending
    let flaggedArr = flagged.toArray().sort(
      func(a : ForumTypes.ForumPost, b : ForumTypes.ForumPost) : { #less; #equal; #greater } {
        Int.compare(b.flagCount.toInt(), a.flagCount.toInt())
      }
    );

    // Top 10 contributors by post count descending
    let maxContribs = if (contribs.size() > 10) { 10 } else { contribs.size() };
    let allContribs = contribs.toArray();
    let sortedContribs = allContribs.sort(
      func(pa : (Text, Nat), pb : (Text, Nat)) : { #less; #equal; #greater } {
        Int.compare(pb.1.toInt(), pa.1.toInt())
      }
    );
    let contribArr = sortedContribs.sliceToArray(0, maxContribs);

    {
      totalPosts      = total;
      postsPerChannel = [
        ("whatILove",       loveCnt),
        ("whatNeedsWork",   workCnt),
        ("featureRequests", reqCnt),
      ];
      flaggedPosts    = flaggedArr;
      topContributors = contribArr;
    }
  };
};
