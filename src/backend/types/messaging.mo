module {
  /// Delivery status of a WhatsApp message.
  public type MessageDeliveryStatus = {
    #sent;
    #delivered;
    #read;
    #failed;
  };

  /// A raw WhatsApp message record as received or sent via 360dialog.
  public type WhatsAppMessage = {
    id          : Text;
    from        : Text;    // WhatsApp number (e.g. "27821234567")
    to          : Text;    // WhatsApp number
    body        : Text;
    mediaUrl    : ?Text;   // URL to media if this is a media message
    mediaType   : ?Text;   // "image" | "document" | "audio" | "video"
    timestamp   : Int;
    status      : MessageDeliveryStatus;
    errorMsg    : ?Text;
  };

  /// Future-proof stub for Telegram message parity.
  public type TelegramMessage = {
    id        : Text;
    chatId    : Text;
    from      : Text;
    body      : Text;
    mediaUrl  : ?Text;
    mediaType : ?Text;
    timestamp : Int;
  };

  /// 360dialog WhatsApp Business API configuration — admin-only, never exposed to frontend.
  public type WhatsAppConfig = {
    apiKey      : Text;    // 360dialog API key (replaces accountSid/authToken)
    phoneNumber : Text;    // Business WhatsApp number (E.164 format, e.g. "+27821234567")
    webhookSecret : Text;  // Secret to validate incoming webhook signatures
  };

  /// The channel through which a conversation entry was created.
  public type ConversationChannel = {
    #app;
    #whatsapp;
    #telegram;
  };

  /// Direction of a message in a conversation.
  public type MessageDirection = {
    #inbound;   // Driver → Nduna
    #outbound;  // Nduna → Driver
  };

  /// A single conversation entry — persisted in canister, synced across app + WhatsApp.
  public type WhatsAppConversationEntry = {
    channel        : ConversationChannel;
    messageId      : Text;
    driverId       : Text;           // Principal.toText()
    direction      : MessageDirection;
    body           : Text;
    mediaStorageRef : ?Text;         // object-storage ref if media was attached
    timestamp      : Int;
    deliveryStatus : MessageDeliveryStatus;
    errorMsg       : ?Text;
  };

  /// Command shortcuts parsed from driver messages (e.g. "/leads", "/coach FNB").
  public type WhatsAppCommand = {
    #leads;                          // /leads → top 10 companies this week
    #coach : Text;                   // /coach [company] → pitch strategy
    #status;                         // /status → dashboard summary
    #help;                           // /help → command menu
    #unknown : Text;                 // unrecognised command text
  };

  /// Whisper API configuration for media transcription (audio/video messages).
  public type WhisperConfig = {
    apiKey : Text;   // OpenAI Whisper API key
    model  : Text;   // e.g. "whisper-1"
  };

  /// Rate limiting record per driver phone number.
  public type WhatsAppRateLimit = {
    phoneNumber    : Text;
    messageCount   : Nat;
    windowStartMs  : Int;   // Unix ms of the current rolling window start
  };

  /// State for the weekly WhatsApp briefing scheduler.
  public type WeeklyBriefingState = {
    enabled : Bool;
    lastSentAt : ?Int;         // nanosecond timestamp of last batch send; null = never sent
    briefingDayOfWeek : Nat;   // 0 = Monday, 1 = Tuesday, …, 6 = Sunday (default 0 = Monday)
    briefingHour : Nat;        // SAST hour to send (default 8 = 8am SAST)
  };
};
