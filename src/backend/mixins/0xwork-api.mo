import Text "mo:core/Text";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import AnalyticsLog "../lib/analytics-log";
import ZeroXWorkProvider "../lib/0xwork/ZeroXWorkProvider";

/// Public API mixin for the 0xWork agent marketplace integration.
/// Registers Nduna on 0xWork (0xwork.org), a decentralised task marketplace
/// on Base chain where AI agents claim bounties and get paid in USDC.
///
/// Security contract:
///   - walletAddress is public chain data — exposed in get0xWorkStatus.
///   - apiKey is NEVER returned in any query.
///   - All update functions are admin-only.
///   - isZeroXWorkRegistered is the only public registration status indicator.
mixin (
  analyticsLog            : AnalyticsLog.State,
  accessControlState      : AccessControl.AccessControlState,
  zeroXWorkWalletAddress  : { var value : Text },
  zeroXWorkApiKey         : { var value : Text },
  zeroXWorkTotalUSDCEarned : { var value : Float },
  zeroXWorkTasksCompleted : { var value : Nat },
  zeroXWorkRegistered     : { var value : Bool },
  zeroXWorkActiveTaskId   : { var value : ?Text },
  zeroXWorkCachedTasks    : { var value : [ZeroXWorkProvider.TaskItem] },
) {

  // ── Public types (shared) ─────────────────────────────────────────────────

  public type ZeroXWorkStatus = {
    registered    : Bool;
    walletAddress : Text;
    tasksCompleted : Nat;
    activeTaskId  : ?Text;
  };

  public type ZeroXWorkEarnings = {
    totalUSDCEarned : Float;
    tasksCompleted  : Nat;
  };

  public type ZeroXWorkTask = {
    taskId      : Text;
    title       : Text;
    description : Text;
    reward      : Float;
    capability  : Text;
  };

  // ── Admin: trigger0xWorkRegistration ──────────────────────────────────────

  /// Admin only: register Nduna on 0xWork and stake initial $AXOBOTL.
  /// Step 1: POST /api/agents/register → get walletAddress + apiKey
  /// Step 2: POST /api/faucet/axobotl  → stake initial $AXOBOTL
  /// Sets zeroXWorkRegistered = true on success.
  public shared ({ caller }) func trigger0xWorkRegistration() : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };

    // Step 1: register and get wallet
    let regResult = await ZeroXWorkProvider.initWallet();
    let (walletAddress, apiKey) = switch (regResult) {
      case (#err(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "trigger0xWorkRegistration",
          caller.toText(), null, false, ?msg, "{\"step\":\"register\"}", ?"admin",
        );
        return #err("Registration failed: " # msg);
      };
      case (#ok(res)) { (res.walletAddress, res.apiKey) };
    };

    // Persist credentials
    zeroXWorkWalletAddress.value := walletAddress;
    zeroXWorkApiKey.value        := apiKey;
    zeroXWorkRegistered.value    := true;

    AnalyticsLog.logEvent(
      analyticsLog, "0xwork", "wallet_created",
      caller.toText(), null, true, null,
      "{\"walletAddress\":\"" # walletAddress # "\"}",
      ?"admin",
    );

    // Step 2: stake $AXOBOTL (best-effort — don't fail registration if faucet is slow)
    let stakeResult = await ZeroXWorkProvider.stakeAxobotl(walletAddress);
    let stakeMsg = switch (stakeResult) {
      case (#err(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "axobotl_stake_failed",
          caller.toText(), null, false, ?msg, "{}", ?"admin",
        );
        " (faucet pending: " # msg # ")";
      };
      case (#ok(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "axobotl_staked",
          caller.toText(), null, true, null, "{\"result\":\"" # msg # "\"}", ?"admin",
        );
        " | " # msg;
      };
    };

    #ok("Nduna registered on 0xWork. Wallet: " # walletAddress # stakeMsg);
  };

  // ── Public query: get0xWorkStatus ─────────────────────────────────────────

  /// Public query: returns Nduna's 0xWork status.
  /// walletAddress is public chain data. apiKey is NEVER returned.
  public query func get0xWorkStatus() : async ZeroXWorkStatus {
    {
      registered     = zeroXWorkRegistered.value;
      walletAddress  = zeroXWorkWalletAddress.value;
      tasksCompleted = zeroXWorkTasksCompleted.value;
      activeTaskId   = zeroXWorkActiveTaskId.value;
    };
  };

  /// Public query: returns whether Nduna is registered on 0xWork.
  /// Alias for get0xWorkStatus().registered — used by frontend for quick checks.
  public query func isZeroXWorkRegistered() : async Bool {
    zeroXWorkRegistered.value;
  };

  // ── Public query: get0xWorkEarnings ───────────────────────────────────────

  /// Public query: returns Nduna's cached USDC earnings and completed task count.
  /// This is NOT a live HTTP call — it returns state cached by triggerTaskDiscovery
  /// or the last sync. Call sync0xWorkEarnings() to refresh live data.
  public query func get0xWorkEarnings() : async ZeroXWorkEarnings {
    {
      totalUSDCEarned = zeroXWorkTotalUSDCEarned.value;
      tasksCompleted  = zeroXWorkTasksCompleted.value;
    };
  };

  // ── Admin: sync0xWorkEarnings ─────────────────────────────────────────────

  /// Admin only: fetch live earnings from 0xWork API and update cached state.
  public shared ({ caller }) func sync0xWorkEarnings() : async { #ok : ZeroXWorkEarnings; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    if (not zeroXWorkRegistered.value) {
      return #err("Nduna is not registered on 0xWork yet. Call trigger0xWorkRegistration first.");
    };

    let result = await ZeroXWorkProvider.getEarnings(zeroXWorkApiKey.value);
    switch (result) {
      case (#err(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "sync_earnings_failed",
          caller.toText(), null, false, ?msg, "{}", ?"admin",
        );
        #err(msg);
      };
      case (#ok(data)) {
        zeroXWorkTotalUSDCEarned.value := data.totalUSDC;
        zeroXWorkTasksCompleted.value  := data.tasksCompleted;
        zeroXWorkActiveTaskId.value    := data.activeTaskId;
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "earnings_synced",
          caller.toText(), null, true, null,
          "{\"totalUSDC\":" # data.totalUSDC.toText() #
          ",\"tasks\":" # data.tasksCompleted.toText() # "}",
          ?"admin",
        );
        #ok({
          totalUSDCEarned = data.totalUSDC;
          tasksCompleted  = data.tasksCompleted;
        });
      };
    };
  };

  // ── Admin: triggerTaskDiscovery ────────────────────────────────────────────

  /// Admin only: fetch available tasks from 0xWork and cache up to 10.
  /// Returns the count of tasks found.
  public shared ({ caller }) func triggerTaskDiscovery() : async { #ok : Nat; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    if (not zeroXWorkRegistered.value) {
      return #err("Nduna is not registered on 0xWork yet.");
    };

    let result = await ZeroXWorkProvider.getAvailableTasks(zeroXWorkApiKey.value);
    switch (result) {
      case (#err(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "task_discovery_failed",
          caller.toText(), null, false, ?msg, "{}", ?"admin",
        );
        #err(msg);
      };
      case (#ok(tasks)) {
        // Cap at 10 tasks
        let cap = if (tasks.size() < 10) { tasks.size() } else { 10 };
        let capped = tasks.sliceToArray(0, cap);
        // Convert to ZeroXWorkTask array (same shape) for cached storage
        zeroXWorkCachedTasks.value := capped;
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "task_discovery_complete",
          caller.toText(), null, true, null,
          "{\"tasksFound\":" # capped.size().toText() # "}",
          ?"admin",
        );
        #ok(capped.size());
      };
    };
  };

  // ── Public query: getAvailableTasks ───────────────────────────────────────

  /// Public query: returns the cached list of available 0xWork tasks.
  /// Refresh by calling triggerTaskDiscovery().
  public query func getZeroXWorkTasks() : async [ZeroXWorkTask] {
    let cached = zeroXWorkCachedTasks.value;
    var out : [ZeroXWorkTask] = [];
    for (t in cached.values()) {
      let task : ZeroXWorkTask = {
        taskId      = t.taskId;
        title       = t.title;
        description = t.description;
        reward      = t.reward;
        capability  = t.capability;
      };
      out := out.concat([task]);
    };
    out;
  };

  // ── Admin: claimZeroXWorkTask ──────────────────────────────────────────────

  /// Admin only: claim a specific task for Nduna to work on.
  public shared ({ caller }) func claimZeroXWorkTask(taskId : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    if (not zeroXWorkRegistered.value) {
      return #err("Nduna is not registered on 0xWork yet.");
    };
    if (taskId == "") {
      return #err("taskId is required");
    };

    let result = await ZeroXWorkProvider.claimTask(zeroXWorkApiKey.value, taskId);
    switch (result) {
      case (#err(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "task_claim_failed",
          caller.toText(), null, false, ?msg,
          "{\"taskId\":\"" # taskId # "\"}", ?"admin",
        );
        #err(msg);
      };
      case (#ok(msg)) {
        zeroXWorkActiveTaskId.value := ?taskId;
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "task_claimed",
          caller.toText(), null, true, null,
          "{\"taskId\":\"" # taskId # "\"}", ?"admin",
        );
        #ok(msg);
      };
    };
  };

  // ── Admin: submitZeroXWorkTask ────────────────────────────────────────────

  /// Admin only: submit the deliverable for the currently active task.
  public shared ({ caller }) func submitZeroXWorkTask(taskId : Text, deliverable : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    if (not zeroXWorkRegistered.value) {
      return #err("Nduna is not registered on 0xWork yet.");
    };

    let result = await ZeroXWorkProvider.submitTask(zeroXWorkApiKey.value, taskId, deliverable);
    switch (result) {
      case (#err(msg)) {
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "task_submit_failed",
          caller.toText(), null, false, ?msg,
          "{\"taskId\":\"" # taskId # "\"}", ?"admin",
        );
        #err(msg);
      };
      case (#ok(msg)) {
        // Clear active task on successful submission
        if (zeroXWorkActiveTaskId.value == ?taskId) {
          zeroXWorkActiveTaskId.value := null;
          zeroXWorkTasksCompleted.value += 1;
        };
        AnalyticsLog.logEvent(
          analyticsLog, "0xwork", "task_submitted",
          caller.toText(), null, true, null,
          "{\"taskId\":\"" # taskId # "\"}", ?"admin",
        );
        #ok(msg);
      };
    };
  };
};
