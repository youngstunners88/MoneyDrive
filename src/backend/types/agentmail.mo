module {

  /// Global AgentMail configuration — stored in backend canister state only.
  /// apiKey is never returned to the frontend (admin getter masks it as "***").
  public type AgentMailConfig = {
    apiKey                    : Text;
    ndunaInboxId              : ?Text; // provisioned inbox address e.g. "nduna@agentmail.to"
    onboardingEmailEnabled    : Bool;
    weeklyBriefingEmailEnabled : Bool;
    leadFollowupEmailEnabled  : Bool;
  };

  /// Immutable log entry for every email sent through Nduna's pipeline.
  public type EmailLog = {
    id         : Text;
    driverId   : Text;
    emailType  : Text; // "pitch" | "followup" | "briefing" | "onboarding" | "website_delivery"
    recipient  : Text;
    subject    : Text;
    sentAt     : Int;
    status     : Text; // "sent" | "failed"
    errorMsg   : ?Text;
  };

  /// A single message visible in Nduna's provisioned AgentMail inbox.
  public type NdunaEmail = {
    inboxId    : Text;
    messageId  : Text;
    from       : Text;
    subject    : Text;
    preview    : Text;
    receivedAt : Int;
    isRead     : Bool;
  };

};
