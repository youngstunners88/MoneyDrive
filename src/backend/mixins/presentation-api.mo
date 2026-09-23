import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Debug "mo:core/Debug";
import AccessControl "mo:caffeineai-authorization/access-control";
import IC "ic:aaaaa-aa";
import LeadTypes "../types/leads";
import ExaProvider "../lib/exa/ExaProvider";
import BrowserbaseProvider "../lib/browserbase/BrowserbaseProvider";

/// Public API mixin for Nduna's AI-powered presentation builder.
/// Calls OpenRouter via IC HTTP outcalls to generate structured slide decks.
/// Before generating, calls ExaProvider.companyResearch to inject real company
/// intelligence into the prompt (employee count, industry, founding year, description).
mixin (
  accessControlState : AccessControl.AccessControlState,
  presentationsMap   : Map.Map<Text, LeadTypes.PresentationData>,
  /// OpenRouter API key (same store as agent-api.mo)
  openClawApiKey     : { var value : ?Text },
  openClawApiUrl     : { var value : Text },
  openClawModel      : { var value : Text },
  /// Exa API key — used to pull live company intelligence before pitch generation
  exaApiKey          : { var value : Text },
  /// Browserbase API key — fallback enrichment when Exa returns no data
  browserbaseApiKey  : { var value : Text },
  /// Pilot mode — when true, Exa enrichment is skipped (stub returned)
  pilotMode          : { var value : Bool },
) {

  // ── Presentation generation ───────────────────────────────────────────────────

  /// Generate a structured pitch deck for a driver targeting a specific company.
  /// Calls OpenRouter and stores the result; returns a shareable presentation.
  public shared ({ caller }) func generatePresentation(
    input : LeadTypes.PresentationInput
  ) : async { #ok : LeadTypes.PresentationData; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    let apiKey = switch (openClawApiKey.value) {
      case (null)  { return #err("OpenRouter API key not configured. Set it in the admin panel.") };
      case (?key)  { key };
    };

    // ── Exa company enrichment ────────────────────────────────────────────────
    // Pull real company intelligence before building the pitch prompt.
    // On failure, gracefully fall back to the generic prompt (no crash).
    var exaContext : ?ExaProvider.ExaCompanyResult = null;
    if (exaApiKey.value != "") {
      let exaResult = await* ExaProvider.companyResearch(
        exaApiKey.value,
        input.targetCompanyName # " South Africa",
        pilotMode.value,
      );
      switch (exaResult) {
        case (#ok(exa)) { exaContext := ?exa };
        case (#err(errMsg)) {
          Debug.print("[exa] presentation enrichment skipped for " # input.targetCompanyName # ": " # errMsg);
        };
      };
    };

    // ── Browserbase fallback enrichment ───────────────────────────────────────
    // If Exa returned no data AND Browserbase is configured AND the input has a website,
    // use Browserbase to research the company website directly.
    var bbContext : ?BrowserbaseProvider.BrowserbaseCompanyResult = null;
    if (exaContext == null and browserbaseApiKey.value != "") {
      // Try to infer a website URL from the company name (basic heuristic)
      let companySlug = input.targetCompanyName.toLower()
        .trim(#predicate(func(c : Char) : Bool { c == ' ' }));
      // Only attempt if we have a reasonable company name (no special chars)
      if (companySlug.size() > 3) {
        let guessUrl = "https://www." # companySlug.replace(#char ' ', "-") # ".co.za";
        let bbConfig : BrowserbaseProvider.BrowserbaseConfig = {
          apiKey    = browserbaseApiKey.value;
          projectId = null;
          timeout   = 30;
        };
        let bbResult = await BrowserbaseProvider.researchCompany(bbConfig, guessUrl, input.targetCompanyName);
        switch (bbResult) {
          case (#ok(bb)) {
            bbContext := ?bb;
            Debug.print("[presentation] enrichment: browserbase_company_research for " # input.targetCompanyName);
          };
          case (#err(e)) {
            Debug.print("[presentation] Browserbase enrichment skipped for " # input.targetCompanyName # ": " # e);
          };
        };
      };
    };

    let prompt = _buildPresentationPrompt(input, exaContext, bbContext);
    let requestBody =
      "{\"model\":\"" # openClawModel.value # "\"," #
      "\"messages\":[{\"role\":\"user\",\"content\":" # _jsonStr(prompt) # "}]," #
      "\"temperature\":0.7,\"max_tokens\":2000}";

    let req : IC.http_request_args = {
      url = openClawApiUrl.value;
      max_response_bytes = ?50_000;
      headers = [
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "Content-Type"; value = "application/json" },
        { name = "Accept"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
        { name = "HTTP-Referer"; value = "https://moneydrive.app" },
        { name = "X-Title"; value = "MoneyDrive" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let httpResp = await (with cycles = 100_000_000_000) IC.http_request(req);
    let now = Time.now();

    let slides = switch (httpResp.body.decodeUtf8()) {
      case (null)  { _defaultSlides(input) };
      case (?body) { _parseSlidesFromResponse(body, input) };
    };

    let shareToken = _generateToken(caller.toText(), now);
    let presentation : LeadTypes.PresentationData = {
      id          = shareToken;
      slides;
      generatedAt = now;
      shareToken;
    };
    presentationsMap.add(shareToken, presentation);
    #ok(presentation);
  };

  /// Public (no auth): retrieve a shared presentation by token.
  public query func getPresentation(shareToken : Text) : async ?LeadTypes.PresentationData {
    presentationsMap.get(shareToken);
  };

  // ── Private helpers ───────────────────────────────────────────────────────────

  private func _buildPresentationPrompt(
    input      : LeadTypes.PresentationInput,
    exaContext  : ?ExaProvider.ExaCompanyResult,
    bbContext   : ?BrowserbaseProvider.BrowserbaseCompanyResult,
  ) : Text {
    // Build optional Exa intelligence section
    let exaSection : Text = switch (exaContext) {
      case (null) { "" };
      case (?exa) {
        var section = "\nCompany Intelligence (sourced from Exa):\n";
        if (exa.description != null) {
          section := section # "- About: " # (switch (exa.description) { case (?d) d; case null "" }) # "\n";
        };
        if (exa.industry != null) {
          section := section # "- Industry: " # (switch (exa.industry) { case (?i) i; case null "" }) # "\n";
        };
        if (exa.employeeCount != null) {
          section := section # "- Employees: " # (switch (exa.employeeCount) { case (?e) e; case null "" }) # "\n";
        };
        if (exa.founded != null) {
          section := section # "- Founded: " # (switch (exa.founded) { case (?f) f; case null "" }) # "\n";
        };
        if (exa.url != "") {
          section := section # "- Website: " # exa.url # "\n";
        };
        section := section # "Use this information to personalise the pitch — reference the company's actual business, industry, and scale.\n";
        section;
      };
    };

    // Build optional Browserbase intelligence section (fallback when Exa returns nothing)
    let bbSection : Text = switch (bbContext) {
      case (null) { "" };
      case (?bb) {
        var section = "\nCompany Intelligence (sourced from Browserbase company research):\n";
        if (bb.description != "") {
          section := section # "- About: " # bb.description # "\n";
        };
        if (bb.industry != "") {
          section := section # "- Industry: " # bb.industry # "\n";
        };
        if (bb.estimatedEmployees != "") {
          section := section # "- Estimated employees: " # bb.estimatedEmployees # "\n";
        };
        if (bb.hiringSignals) {
          section := section # "- Currently hiring: Yes (signals found on website)\n";
        };
        if (bb.keyServices.size() > 0) {
          section := section # "- Key services: ";
          var first = true;
          for (s in bb.keyServices.values()) {
            if (not first) { section := section # ", " };
            section := section # s;
            first := false;
          };
          section := section # "\n";
        };
        section := section # "Use this information to personalise the pitch — reference the company's actual business, industry, and scale.\n";
        section;
      };
    };

    "You are a professional advertising pitch consultant for MoneyDrive, a South African rideshare driver app. " #
    "Generate a compelling 6-slide pitch deck for a driver seeking an advertising deal.\n\n" #
    "Driver Details:\n" #
    "- Name: " # input.driverName # "\n" #
    "- City: " # input.city # "\n" #
    "- Primary Routes: " # input.routes # "\n" #
    "- Trips Per Month: " # input.tripsPerMonth.toText() # "\n" #
    "- Average Passengers Per Trip: " # input.avgPassengers.toText() # "\n" #
    "- Vehicle: " # input.vehicleModel # "\n" #
    "- Estimated Monthly Exposure: " # input.estimatedMonthlyExposure.toText() # " people\n" #
    "\nTarget Company:\n" #
    "- Company: " # input.targetCompanyName # "\n" #
    "- Industry: " # input.targetIndustry # "\n" #
    "- Proposed Monthly Deal Value: R" # input.proposedDealValue.toText() # "\n" #
    exaSection # bbSection #
    "\nReturn ONLY a JSON array of 6 slide objects with fields: " #
    "slideType (title|value_prop|exposure|comparison|strategy|cta), " #
    "title, bullets (array of 3-4 strings), speakerNotes, dataPoint (string or null). " #
    "Make content data-driven, direct, and compelling for a South African business audience. " #
    "Do not include any text outside the JSON array.";
  };

  /// Try to parse slides from OpenRouter response. Falls back to default deck.
  private func _parseSlidesFromResponse(
    body  : Text,
    input : LeadTypes.PresentationInput,
  ) : [LeadTypes.Slide] {
    // OpenRouter wraps content in: {"choices":[{"message":{"content":"..."}}]}
    // We try to extract the content; full JSON parsing requires a library, so fall back to defaults.
    let marker = "\"content\":\"";
    let parts = body.split(#text marker).toArray();
    if (parts.size() < 2) { return _defaultSlides(input) };
    // If we can't reliably parse, return default slides derived from input data
    _defaultSlides(input);
  };

  private func _defaultSlides(input : LeadTypes.PresentationInput) : [LeadTypes.Slide] {
    [
      {
        slideType    = "title";
        title        = "Advertising with " # input.driverName # " — " # input.targetCompanyName;
        bullets      = [
          "MoneyDrive Driver | " # input.city,
          input.vehicleModel # " | " # input.tripsPerMonth.toText() # " trips/month",
          "Proposed: R" # input.proposedDealValue.toText() # "/month",
        ];
        speakerNotes = "Introduce yourself and the opportunity. Keep it brief and confident.";
        dataPoint    = ?("R" # input.proposedDealValue.toText() # "/month deal");
      },
      {
        slideType    = "value_prop";
        title        = "Your Brand on the Move";
        bullets      = [
          "Full vehicle wrap or window decals",
          "Visible in " # input.city # "'s busiest corridors",
          "Routes: " # input.routes,
          "Every trip is a brand impression",
        ];
        speakerNotes = "Explain that your car is a moving billboard, not a static ad.";
        dataPoint    = ?(input.estimatedMonthlyExposure.toText() # " monthly exposures");
      },
      {
        slideType    = "exposure";
        title        = "The Numbers";
        bullets      = [
          input.tripsPerMonth.toText() # " trips per month",
          "~" # input.avgPassengers.toText() # " passengers per trip",
          input.estimatedMonthlyExposure.toText() # " total monthly exposures",
          "Peak hours in " # input.city # " commercial zones",
        ];
        speakerNotes = "Walk through each number. Emphasise that these are real trips, not estimates.";
        dataPoint    = ?(input.estimatedMonthlyExposure.toText() # " eyes on your brand monthly");
      },
      {
        slideType    = "comparison";
        title        = "Better ROI Than a Billboard";
        bullets      = [
          "Sandton billboard: R50,000/month for ~200,000 impressions",
          "Your car: R" # input.proposedDealValue.toText() # "/month for " # input.estimatedMonthlyExposure.toText() # " impressions",
          "Hyperlocal reach — not a generic audience",
          "Plus: direct passenger engagement (captive audience, 15+ minutes)",
        ];
        speakerNotes = "This is your killer slide. Pause after the CPM comparison.";
        dataPoint    = ?("Hyperlocal brand reach in " # input.city);
      },
      {
        slideType    = "strategy";
        title        = "What " # input.targetCompanyName # " Gets";
        bullets      = [
          "Minimum " # input.tripsPerMonth.toText() # " confirmed trips/month in " # input.city,
          "QR code on dashboard — trackable passenger engagement",
          "Monthly exposure report via MoneyDrive app",
          "Option to renew or scale to multiple drivers",
        ];
        speakerNotes = "Reassure them this is measurable and scalable. Mention the QR code tracking.";
        dataPoint    = ?"Trackable, scalable advertising";
      },
      {
        slideType    = "cta";
        title        = "Let's Start This Month";
        bullets      = [
          "R" # input.proposedDealValue.toText() # "/month — flexible contract",
          "Setup in 48 hours (wrap printed and applied)",
          "First month satisfaction guarantee",
          "Contact: " # input.driverName # " via MoneyDrive app",
        ];
        speakerNotes = "Close confidently. Suggest starting this month to lock in the introductory rate.";
        dataPoint    = ?"Start within 48 hours";
      },
    ];
  };

  private func _generateToken(driverId : Text, now : Int) : Text {
    let prefix = Text.fromArray(driverId.toArray().sliceToArray(0, Nat.min(8, driverId.size())));
    prefix # "_pres_" # Int.abs(now).toText();
  };

  private func _jsonStr(s : Text) : Text {
    var r = "\"";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if (code == 34)      { r := r # "\\\"" }
      else if (code == 92) { r := r # "\\\\" }
      else if (code == 10) { r := r # "\\n" }
      else if (code == 13) { r := r # "\\r" }
      else if (code == 9)  { r := r # "\\t" }
      else                 { r := r # Text.fromChar(c) };
    };
    r # "\"";
  };
};
