import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import EventTypes "../types/events";
import IC "ic:aaaaa-aa";


module {
  public type FetchedEvent = EventTypes.FetchedEvent;

  // ─── Driver Relevance Labels ──────────────────────────────────────────────────

  /// Map an event category to a driver-relevant opportunity label.
  public func driverRelevanceLabel(category : Text) : Text {
    let lower = category.toLower();
    if (lower.contains(#text "concert") or lower.contains(#text "music") or lower.contains(#text "festival")) {
      "Surge opportunity - concert/festival crowd"
    } else if (lower.contains(#text "sport") or lower.contains(#text "soccer") or lower.contains(#text "rugby") or lower.contains(#text "cricket") or lower.contains(#text "stadium")) {
      "Stadium area surge - match day traffic"
    } else if (lower.contains(#text "airport") or lower.contains(#text "flight") or lower.contains(#text "travel")) {
      "Airport run opportunity"
    } else if (lower.contains(#text "conference") or lower.contains(#text "summit") or lower.contains(#text "expo") or lower.contains(#text "business")) {
      "Conference - business traveler pickups"
    } else if (lower.contains(#text "club") or lower.contains(#text "night") or lower.contains(#text "party")) {
      "Late-night surge - club/party crowd"
    } else if (lower.contains(#text "food") or lower.contains(#text "market") or lower.contains(#text "fair")) {
      "Market day - high pedestrian traffic area"
    } else if (lower.contains(#text "art") or lower.contains(#text "theatre") or lower.contains(#text "show") or lower.contains(#text "exhibition")) {
      "Arts & culture event - steady demand"
    } else {
      "Local event - monitor for demand spikes"
    };
  };

  // ─── Empty Fallback ───────────────────────────────────────────────────────────

  /// Returns an empty array when live event fetching fails.
  /// Never returns fabricated/hardcoded events — the frontend shows
  /// a "check back soon" message when the array is empty.
  public func fallbackSAEvents() : [FetchedEvent] {
    [];
  };

  // ─── JSON Field Extraction ────────────────────────────────────────────────────

  /// Extract a JSON string field value for "key":"<value>" patterns.
  func extractJsonField(json : Text, key : Text) : Text {
    let needle = "\"" # key # "\":\"";
    let needleSize = needle.size();
    let jsonChars = json.toArray();
    let needleChars = needle.toArray();
    var i = 0;
    label search while (i + needleSize <= jsonChars.size()) {
      var matched = true;
      var j = 0;
      while (j < needleSize) {
        if (jsonChars[i + j] != needleChars[j]) {
          matched := false;
          j := needleSize; // exit inner loop
        } else {
          j += 1;
        };
      };
      if (matched) {
        var pos = i + needleSize;
        var result : Text = "";
        while (pos < jsonChars.size() and jsonChars[pos].toNat32() != 34) {
          result := result # Text.fromChar(jsonChars[pos]);
          pos += 1;
        };
        return result;
      };
      i += 1;
    };
    "";
  };

  // ─── Quicket Parser ───────────────────────────────────────────────────────────

  /// Parse a Quicket-style JSON response into FetchedEvent array.
  func parseQuicketEvents(json : Text, now : Int) : [FetchedEvent] {
    // Split on closing brace to get rough per-object blocks
    let blocks = json.split(#char '}').toArray();
    blocks.filterMap(
      func(block) {
        let title = extractJsonField(block, "name");
        if (title == "") return null;
        let id = extractJsonField(block, "id");
        let date = extractJsonField(block, "startDate");
        let venue = extractJsonField(block, "venueName");
        let city = extractJsonField(block, "city");
        let category = extractJsonField(block, "category");
        let ev : FetchedEvent = {
          id = "qk-" # (if (id == "") title else id);
          title = title;
          date = if (date == "") "TBD" else date;
          venue = if (venue == "") "Venue TBD" else venue;
          city = if (city == "") "South Africa" else city;
          category = if (category == "") "General" else category;
          driverRelevance = driverRelevanceLabel(if (category == "") "General" else category);
          fetchedAt = now;
          isNew = true;
        };
        ?ev;
      },
    );
  };

  // ─── HTTP Request Builder ─────────────────────────────────────────────────────

  func makeGetRequest(url : Text) : IC.http_request_args {
    {
      url = url;
      max_response_bytes = ?50_000;
      headers = [
        { name = "Accept"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = null;
      method = #get;
      transform = null;
      is_replicated = ?false;
    };
  };

  // ─── Tavily Event Search ──────────────────────────────────────────────────────

  /// Build a Tavily search request body for SA events.
  func makeTavilyRequest(apiKey : Text) : IC.http_request_args {
    let body = "{\"query\":\"concerts festivals sporting events markets South Africa this month upcoming events Johannesburg Cape Town Durban\",\"api_key\":\"" # apiKey # "\",\"max_results\":15,\"search_depth\":\"advanced\",\"include_answer\":true}";
    {
      url = "https://api.tavily.com/search";
      max_response_bytes = ?30_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
      ];
      body = ?body.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };
  };

  /// Parse a Tavily JSON response into FetchedEvent array.
  /// Extracts result titles and content snippets as events.
  func parseTavilyEventResults(json : Text, now : Int) : [FetchedEvent] {
    let results = List.empty<FetchedEvent>();
    var remaining = json;
    var count = 0;
    label scan loop {
      if (count >= 10) { break scan };
      // Find next "title":"..."
      let titleNeedle = "\"title\":\"";
      let titleNeedleChars = titleNeedle.toArray();
      let remChars = remaining.toArray();
      var found = false;
      var ti = 0;
      while (ti + titleNeedleChars.size() <= remChars.size() and not found) {
        var match = true;
        var j = 0;
        while (j < titleNeedleChars.size()) {
          if (remChars[ti + j] != titleNeedleChars[j]) { match := false };
          j += 1;
        };
        if (match) { found := true } else { ti += 1 };
      };
      if (not found) { break scan };
      // Extract title value (up to closing quote)
      var titleEnd = ti + titleNeedleChars.size();
      var title = "";
      while (titleEnd < remChars.size() and remChars[titleEnd].toNat32() != 34) {
        title := title # Text.fromChar(remChars[titleEnd]);
        titleEnd += 1;
      };
      // Advance remaining past this title
      remaining := Text.fromArray(remChars.sliceToArray(titleEnd, remChars.size()));

      // Try to extract url
      let urlNeedle = "\"url\":\"";
      let urlNeedleChars = urlNeedle.toArray();
      let remChars2 = remaining.toArray();
      var urlFound = false;
      var ui = 0;
      while (ui + urlNeedleChars.size() <= remChars2.size() and not urlFound) {
        var match = true;
        var j = 0;
        while (j < urlNeedleChars.size()) {
          if (remChars2[ui + j] != urlNeedleChars[j]) { match := false };
          j += 1;
        };
        if (match) { urlFound := true } else { ui += 1 };
      };
      var url = "";
      if (urlFound) {
        var urlEnd = ui + urlNeedleChars.size();
        while (urlEnd < remChars2.size() and remChars2[urlEnd].toNat32() != 34) {
          url := url # Text.fromChar(remChars2[urlEnd]);
          urlEnd += 1;
        };
        remaining := Text.fromArray(remChars2.sliceToArray(urlEnd, remChars2.size()));
      };

      if (title.size() > 4) {
        // Infer category from title keywords
        let titleLower = title.toLower();
        let category = if (titleLower.contains(#text "concert") or titleLower.contains(#text "music") or titleLower.contains(#text "festival")) { "Music/Festival" }
          else if (titleLower.contains(#text "rugby") or titleLower.contains(#text "soccer") or titleLower.contains(#text "sport") or titleLower.contains(#text "cricket")) { "Sport" }
          else if (titleLower.contains(#text "market") or titleLower.contains(#text "food") or titleLower.contains(#text "fair")) { "Market" }
          else if (titleLower.contains(#text "conference") or titleLower.contains(#text "summit") or titleLower.contains(#text "expo")) { "Conference" }
          else { "General" };

        // Extract city from title if possible
        let city = if (titleLower.contains(#text "johannesburg") or titleLower.contains(#text "joburg") or titleLower.contains(#text "jhb")) { "Johannesburg" }
          else if (titleLower.contains(#text "cape town") or titleLower.contains(#text "cpt")) { "Cape Town" }
          else if (titleLower.contains(#text "durban")) { "Durban" }
          else if (titleLower.contains(#text "pretoria") or titleLower.contains(#text "tshwane")) { "Pretoria" }
          else { "South Africa" };

        let ev : FetchedEvent = {
          id = "tv-" # count.toText() # "-" # now.toText();
          title = title;
          date = "TBD";
          venue = "See source";
          city = city;
          category = category;
          driverRelevance = driverRelevanceLabel(category);
          fetchedAt = now;
          isNew = true;
        };
        results.add(ev);
        count += 1;
      };
    };
    results.toArray();
  };

  // ─── Main Fetch ───────────────────────────────────────────────────────────────

  /// Fetch SA events. Tries Quicket first; if Quicket returns 0 events or fails,
  /// falls back to Tavily web search (if tavilyApiKey is non-empty).
  /// If both fail or tavilyApiKey is empty, returns [] — never fabricates events.
  public func fetchSAEvents(tavilyApiKey : Text) : async* [FetchedEvent] {
    let now = Time.now();

    // Try Quicket public API — the primary live source
    try {
      let resp = await (with cycles = 231_000_000_000) IC.http_request(
        makeGetRequest("https://api.quicket.co.za/api/events?country=ZA&pageSize=20&sort=date")
      );
      switch (resp.body.decodeUtf8()) {
        case (?body) {
          let parsed = parseQuicketEvents(body, now);
          if (parsed.size() > 0) return parsed;
        };
        case null {};
      };
    } catch (_) {};

    // Quicket returned 0 events or failed — try Tavily as fallback
    if (tavilyApiKey != "") {
      try {
        let tavilyResp = await (with cycles = 50_000_000_000) IC.http_request(
          makeTavilyRequest(tavilyApiKey)
        );
        switch (tavilyResp.body.decodeUtf8()) {
          case (?body) {
            let parsed = parseTavilyEventResults(body, now);
            if (parsed.size() > 0) return parsed;
          };
          case null {};
        };
      } catch (_) {};
    };

    // Both Quicket and Tavily failed or returned 0 events — return empty array.
    // The frontend will show the honest "check back soon" placeholder card.
    fallbackSAEvents();
  };

  // ─── Mark All As Read ─────────────────────────────────────────────────────────

  /// Return a new array with all events marked isNew = false.
  public func markAllAsRead(events : [FetchedEvent]) : [FetchedEvent] {
    events.map<FetchedEvent, FetchedEvent>(func(e) { { e with isNew = false } });
  };
};
