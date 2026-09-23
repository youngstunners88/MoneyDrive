import Text "mo:core/Text";

/// Pure routing logic for the Cloudflare AI Gateway.
/// Decides whether to use the Cloudflare gateway or call providers directly.
/// No canister state, no side effects — fully testable pure functions.
module {

  // ─── Config Types ─────────────────────────────────────────────────────────

  /// Configuration for a Cloudflare AI Gateway endpoint.
  public type GatewayConfig = {
    /// Full base URL: https://gateway.ai.cloudflare.com/v1/{account_id}/moneydriver
    url : Text;
    /// Bearer API key for the gateway.
    apiKey : Text;
  };

  /// Configuration for a direct provider endpoint.
  public type DirectConfig = {
    url : Text;
    apiKey : Text;
  };

  // ─── Error Types ──────────────────────────────────────────────────────────

  /// Errors that routing decisions can produce.
  public type RouterError = {
    /// Gateway is not configured (no URL or key).
    #NotConfigured;
    /// Gateway call timed out; caller should retry via direct.
    #GatewayTimeout;
    /// Routing fell back to direct after a gateway failure.
    #DirectFallback;
  };

  // ─── Decision Types ───────────────────────────────────────────────────────

  /// Routing decision produced by resolveRoute functions.
  public type RouteDecision = {
    #gateway : GatewayConfig;
    #direct : DirectConfig;
  };

  /// Log entry emitted for every routing decision.
  public type RouteLogEntry = {
    timestamp : Int;
    routedToGateway : Bool;
    reason : Text;
    tier : Nat;
  };

  // ─── Timeout Constants (nanoseconds) ─────────────────────────────────────

  /// 30 seconds — timeout for HTTP outcalls via Cloudflare AI Gateway.
  public let GATEWAY_TIMEOUT_NS : Nat = 30_000_000_000;

  /// 20 seconds — timeout for direct OpenRouter / ElevenLabs HTTP outcalls.
  public let DIRECT_TIMEOUT_NS : Nat = 20_000_000_000;

  // ─── Pure Decision Function ───────────────────────────────────────────────

  /// Pure tier-based gateway routing predicate.
  /// Returns true when the gateway is configured and the driver's tier
  /// warrants gateway routing (all tiers route via gateway when configured).
  public func shouldUseCloudflare(driverTier : Nat, gatewayEnabled : Bool) : Bool {
    // All tiers use the gateway when it is configured; the parameter is
    // intentionally kept for future per-tier logic (e.g. Tier 1 bypass).
    ignore driverTier;
    gatewayEnabled;
  };

  // ─── Route Resolution ─────────────────────────────────────────────────────

  /// Resolve the routing decision for OpenRouter calls.
  /// Uses gateway if both gatewayUrl and gatewayKey are non-null/non-empty.
  /// Falls back to direct OpenRouter otherwise.
  public func resolveOpenRouterRoute(
    gatewayUrl : ?Text,
    gatewayKey : ?Text,
    directUrl : Text,
    directKey : Text,
  ) : RouteDecision {
    switch (gatewayUrl, gatewayKey) {
      case (?gUrl, ?gKey) {
        if (gUrl != "" and gKey != "") {
          return #gateway({ url = gUrl; apiKey = gKey });
        };
      };
      case _ {};
    };
    #direct({ url = directUrl; apiKey = directKey });
  };

  /// Resolve the routing decision for ElevenLabs calls.
  /// Same gateway-first logic as OpenRouter.
  public func resolveElevenLabsRoute(
    gatewayUrl : ?Text,
    gatewayKey : ?Text,
    directKey : Text,
  ) : RouteDecision {
    let elevenLabsDirectUrl = "https://api.elevenlabs.io/v1/text-to-speech";
    switch (gatewayUrl, gatewayKey) {
      case (?gUrl, ?gKey) {
        if (gUrl != "" and gKey != "") {
          // Gateway URL for ElevenLabs via Cloudflare:
          // {gatewayUrl}/elevenlabs/v1/text-to-speech
          return #gateway({ url = gUrl # "/elevenlabs"; apiKey = gKey });
        };
      };
      case _ {};
    };
    #direct({ url = elevenLabsDirectUrl; apiKey = directKey });
  };

  // ─── URL Builders ─────────────────────────────────────────────────────────

  /// Build the full OpenRouter URL for use through the Cloudflare AI gateway.
  /// Cloudflare pattern: {gatewayBaseUrl}/openrouter/v1/chat/completions
  public func buildOpenRouterGatewayUrl(gatewayBaseUrl : Text) : Text {
    gatewayBaseUrl # "/openrouter/v1/chat/completions"
  };

  // ─── Decision Helpers ─────────────────────────────────────────────────────

  /// Extract the base URL and API key from a RouteDecision.
  public func extractEndpoint(decision : RouteDecision) : (Text, Text) {
    switch (decision) {
      case (#gateway(cfg)) { (cfg.url, cfg.apiKey) };
      case (#direct(cfg)) { (cfg.url, cfg.apiKey) };
    };
  };

  /// Returns true if the route decision is using the gateway.
  public func isGateway(decision : RouteDecision) : Bool {
    switch (decision) {
      case (#gateway(_)) { true };
      case (#direct(_)) { false };
    };
  };

  // ─── Log Entry Builder ────────────────────────────────────────────────────

  /// Build a structured routing log entry.
  /// Callers emit this to the analytics log after every routing decision.
  public func buildLogEntry(
    timestamp : Int,
    decision : RouteDecision,
    reason : Text,
    tier : Nat,
  ) : RouteLogEntry {
    {
      timestamp;
      routedToGateway = isGateway(decision);
      reason;
      tier;
    };
  };

  /// Build the reason text for a gateway-timeout fallback log entry.
  /// This should be emitted to the analytics log with event name
  /// "gateway_timeout_fallback" before retrying via the direct route.
  public func timeoutFallbackReason() : Text {
    "gateway_timeout: falling back to direct provider"
  };
};
