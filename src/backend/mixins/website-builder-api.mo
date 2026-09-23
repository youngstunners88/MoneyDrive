import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import IC "ic:aaaaa-aa";
import WBTypes "../types/website-builder";
import AgentLib "../lib/agent";

/// Public API mixin that gives Nduna the ability to generate professional driver websites.
/// Tier 3 only. Generates complete single-file HTML websites via OpenRouter/Nduna.
/// All 4 design skills stacked: SA taste, SuperDesign, frontend-slides, interaction-design.
/// Rate limited to 5 generations per driver per day.
mixin (
  accessControlState : AccessControl.AccessControlState,
  /// All website jobs keyed by jobId
  websiteJobs : Map.Map<Text, WBTypes.WebsiteJob>,
  /// Per-driver list of jobIds (newest first)
  driverWebsiteJobs : Map.Map<Text, List.List<Text>>,
  /// Per-driver rate limit state: (count, dayTimestamp)
  websiteBuilderDailyCount : Map.Map<Text, (Nat, Int)>,
  /// OpenRouter API key (shared from agent state)
  openClawApiKey : { var value : ?Text },
  /// OpenRouter API URL
  openClawApiUrl : { var value : Text },
  /// OpenRouter model
  openClawModel : { var value : Text },
) {

  // ── Private helpers ────────────────────────────────────────────────────────

  let DAILY_LIMIT : Nat = 5;

  /// Returns the SAST day number (days since epoch) for a nanosecond timestamp.
  /// Used to bucket rate limits by calendar day in SAST (UTC+2).
  private func sastDayKey(nowNs : Int) : Int {
    let secsUtc = Int.abs(nowNs / 1_000_000_000);
    let secsSAST = secsUtc + 7_200;
    (secsSAST / 86_400).toInt();
  };

  /// Returns how many generations the driver has used today plus the current day key.
  private func todayUsage(driverId : Text, nowNs : Int) : (Nat, Int) {
    let today = sastDayKey(nowNs);
    switch (websiteBuilderDailyCount.get(driverId)) {
      case (null) { (0, today) };
      case (?(count, storedDay)) {
        if (storedDay == today) { (count, today) } else { (0, today) };
      };
    };
  };

  /// Increment the daily usage counter for a driver.
  private func incrementUsage(driverId : Text, nowNs : Int) {
    let (used, today) = todayUsage(driverId, nowNs);
    websiteBuilderDailyCount.add(driverId, (used + 1, today));
  };

  /// Generate a pseudo-random job ID from caller + timestamp.
  private func generateJobId(caller : Principal, nowNs : Int, iteration : Nat) : Text {
    "wb_" # Text.fromArray(
      caller.toText().toArray().sliceToArray(0, if (caller.toText().size() >= 8) { 8 } else { caller.toText().size() })
    ) # "_" # Int.abs(nowNs).toText() # "_" # iteration.toText();
  };

  /// Build the website-generation system prompt for Nduna.
  /// Integrates all 4 stacked design skills:
  /// - taste-skill: SA design taste, cultural authenticity, township energy
  /// - SuperDesign: visual hierarchy, component-level thinking, layout canvas approach
  /// - frontend-slides: scroll-triggered animations, IntersectionObserver, CSS transitions
  /// - interaction-design: microinteractions, hover states, sticky header, smooth scroll
  private func websiteSystemPrompt(currentDate : Text) : Text {
    "TODAY IS " # currentDate # ". YOU ARE NDUNA, A SOUTH AFRICAN MALE AI ASSISTANT. YOUR PRONOUNS ARE HE/HIM/HIS.\n\n" #
    "You are Nduna, a world-class South African website designer. You combine township energy with global design excellence.\n\n" #
    "YOU ONLY OUTPUT VALID HTML — nothing else.\n" #
    "No explanations. No markdown. No code fences. No commentary. No preamble.\n" #
    "Your response MUST start with exactly: <!DOCTYPE html>\n" #
    "Any character before <!DOCTYPE html> will break the website. Output ONLY the HTML.\n\n" #

    "═══ TASTE-SKILL: SA DESIGN PHILOSOPHY ═══\n" #
    "Apply authentic South African design taste — not generic western templates, not copycat corporate.\n" #
    "SA Brand Palette (mandatory, no substitutions):\n" #
    "  --burnt-orange: #D55C2E   (primary CTAs, hero accents, section dividers)\n" #
    "  --gold: #CFA537           (highlights, star ratings, premium badges, hover glows)\n" #
    "  --navy: #1a2a4a           (nav background, footer, dark sections, text on light)\n" #
    "  --off-white: #FAF6F0      (page background, card backgrounds)\n" #
    "  --deep-navy: #0f1a2e      (deepest dark, shadows, overlays)\n" #
    "  --warm-white: #FFFFFF     (text on dark backgrounds)\n" #
    "Typography taste: Bold, confident, South African. Use Ubuntu (headings) + Inter (body) via Google Fonts CDN.\n" #
    "Attitude: Township hustle meets corporate excellence. Never timid. Never generic.\n" #
    "NO western design clichés (no blue corporate gradients, no stock-photo placeholder boxes, no grey-on-grey).\n\n" #

    "═══ SUPERDESIGN: CANVAS LAYOUT APPROACH ═══\n" #
    "Approach the page as a design canvas — define a clear visual hierarchy before coding:\n" #
    "  LAYER 1 (hero): Full-viewport impact. 100vh hero with diagonal/angled background split.\n" #
    "  LAYER 2 (services): CSS Grid 3-col desktop / 1-col mobile. Each card is a self-contained component.\n" #
    "  LAYER 3 (trust): Horizontal scrolling testimonial strip on mobile, 3-col on desktop.\n" #
    "  LAYER 4 (booking): Centered, high-contrast CTA zone. SnapScan QR + WhatsApp side by side.\n" #
    "Component architecture — every section is a discrete component with its own spacing, border-radius, and shadow:\n" #
    "  .hero-component { position: relative; overflow: hidden; }\n" #
    "  .service-card { border-radius: 16px; padding: 2rem; box-shadow: 0 4px 24px rgba(26,42,74,0.12); }\n" #
    "  .trust-badge { border-left: 4px solid var(--gold); padding-left: 1rem; }\n" #
    "CSS Grid for layout: Use grid-template-areas for named zones. Never rely on margin hacks.\n" #
    "Whitespace is a design element — 80px section padding minimum, 24px gap between cards.\n\n" #

    "═══ FRONTEND-SLIDES: SCROLL ANIMATION SYSTEM ═══\n" #
    "MANDATORY: Include this exact embedded JS animation system (no CDN, no external deps):\n" #
    "  const observer = new IntersectionObserver((entries) => {\n" #
    "    entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));\n" #
    "  }, { threshold: 0.1 });\n" #
    "  document.querySelectorAll('.animate').forEach(el => observer.observe(el));\n" #
    "MANDATORY: Include these animation CSS classes (embedded in <style>):\n" #
    "  .animate { opacity: 0; transform: translateY(30px); transition: all 0.6s ease; }\n" #
    "  .animate.visible { opacity: 1; transform: translateY(0); }\n" #
    "  .animate-left { opacity: 0; transform: translateX(-40px); transition: all 0.7s ease; }\n" #
    "  .animate-left.visible { opacity: 1; transform: translateX(0); }\n" #
    "  .animate-right { opacity: 0; transform: translateX(40px); transition: all 0.7s ease; }\n" #
    "  .animate-right.visible { opacity: 1; transform: translateX(0); }\n" #
    "  .animate-scale { opacity: 0; transform: scale(0.85); transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1); }\n" #
    "  .animate-scale.visible { opacity: 1; transform: scale(1); }\n" #
    "Apply animation classes: hero headline = instant (no animate), services cards = animate (stagger with delay 0.1s each),\n" #
    "about section = animate-left, trust badges = animate-scale, testimonials = animate, booking = animate-scale.\n" #
    "Stagger delays: service-card:nth-child(1) { transition-delay: 0s; } nth-child(2) { 0.15s; } nth-child(3) { 0.3s; }\n\n" #

    "═══ INTERACTION-DESIGN: MICROINTERACTIONS ═══\n" #
    "Every interactive element MUST have a microinteraction. No dead hover states.\n" #
    "Button interactions:\n" #
    "  .btn-primary { background: #D55C2E; transition: all 0.2s ease; transform: translateY(0); box-shadow: 0 4px 15px rgba(213,92,46,0.3); }\n" #
    "  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(213,92,46,0.5); background: #bf5228; }\n" #
    "  .btn-primary:active { transform: translateY(1px); box-shadow: 0 2px 8px rgba(213,92,46,0.3); }\n" #
    "Card hover effects:\n" #
    "  .service-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }\n" #
    "  .service-card:hover { transform: translateY(-8px); box-shadow: 0 12px 40px rgba(26,42,74,0.2); }\n" #
    "  .service-icon { transition: transform 0.3s ease; }\n" #
    "  .service-card:hover .service-icon { transform: scale(1.2) rotate(-5deg); }\n" #
    "WhatsApp button: #25D366 with pulse animation on hover:\n" #
    "  @keyframes whatsapp-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.4); } 50% { box-shadow: 0 0 0 12px rgba(37,211,102,0); } }\n" #
    "  .btn-whatsapp:hover { animation: whatsapp-pulse 1.5s infinite; }\n" #
    "STICKY HEADER that shrinks on scroll (MANDATORY JS):\n" #
    "  window.addEventListener('scroll', () => {\n" #
    "    const nav = document.querySelector('nav');\n" #
    "    if (window.scrollY > 80) { nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }\n" #
    "  });\n" #
    "  nav { transition: padding 0.3s ease, box-shadow 0.3s ease; }\n" #
    "  nav.scrolled { padding: 0.5rem 0; box-shadow: 0 2px 20px rgba(26,42,74,0.15); }\n" #
    "SMOOTH SCROLL for all anchor links (MANDATORY):\n" #
    "  html { scroll-behavior: smooth; }\n" #
    "  a[href^='#'] — all internal nav links must use #section-id anchors.\n" #
    "LOADING STATE on CTA buttons (MANDATORY):\n" #
    "  WhatsApp and SnapScan booking buttons must have data-loading='false'.\n" #
    "  onclick: button.setAttribute('data-loading','true'); button.textContent='Opening...'; setTimeout(()=>{ button.setAttribute('data-loading','false'); button.textContent=originalText; }, 2000);\n\n" #

    "═══ MANDATORY SECTIONS (in this exact order) ═══\n" #
    "1. STICKY NAV: Logo (🚗 MoneyDrive), driver name, nav links (Home, Services, About, Book), hamburger for mobile.\n" #
    "   Nav background: navy #1a2a4a. Nav.scrolled: slightly smaller padding, drop shadow.\n\n" #
    "2. HERO SECTION (100vh): \n" #
    "   - Diagonal background: left half navy gradient, right half burnt orange gradient\n" #
    "   - Large driver name placeholder: [YOUR NAME] in white, 3.5rem+\n" #
    "   - Tagline derived from topic (e.g. 'Your Premium Airport Shuttle Specialist')\n" #
    "   - City: Johannesburg / Cape Town / Durban (pick based on topic or use placeholder)\n" #
    "   - Platform badges: Uber (black pill), Bolt (green pill), InDrive (blue pill) — inline\n" #
    "   - Primary CTA: 'Book via WhatsApp' (burnt orange button, large)\n" #
    "   - Secondary CTA: 'View Services' (outlined, white)\n" #
    "   - Rating display: ⭐ 4.9 · [TRIPS] trips completed\n" #
    "   - Subtle background pattern: CSS radial-gradient dots or diagonal lines\n\n" #
    "3. SERVICES SECTION:\n" #
    "   - 3-column grid (desktop), 1-column (mobile)\n" #
    "   - Services from topic + standard: Airport Runs, Corporate Transfers, School Runs, Late Night Safe Rides, Family Trips, Long Distance\n" #
    "   - Each card: emoji icon, service name, 1-sentence description, price range badge\n" #
    "   - animate class on each card with stagger delays\n\n" #
    "4. IN-CAR EXPERIENCE SECTION:\n" #
    "   - Section title: 'Premium In-Car Experience'\n" #
    "   - 4-column grid: 📶 WiFi (R5), 💧 Water (R15), 🌸 Perfume Shot (R10), 🔌 Charging (R5-R10)\n" #
    "   - Optionals: 🧻 Wet Wipes, 🎥 Dash Cam Show, 🩺 First Aid Kit\n" #
    "   - Light background (off-white), gold accent icons\n\n" #
    "5. ABOUT SECTION:\n" #
    "   - Two-column: left = text, right = stats\n" #
    "   - animate-left on text, animate-right on stats\n" #
    "   - Driver bio placeholder text (2–3 sentences, SA authentic voice)\n" #
    "   - Stats grid: ⭐ 4.9 Rating | 🗺️ [TRIPS]+ Trips | 📅 [YEARS] Years | 🔒 Background Checked\n" #
    "   - Platforms section: 'Available on' with Uber/Bolt/InDrive text badges\n\n" #
    "6. TRUST SIGNALS SECTION:\n" #
    "   - Horizontal strip with gold left-border cards (trust-badge class)\n" #
    "   - 4 signals: Professional Driver ✓, Background Checked ✓, Fully Insured ✓, COVID Compliant ✓\n" #
    "   - animate-scale on each badge\n\n" #
    "7. TESTIMONIALS SECTION:\n" #
    "   - 3 testimonial cards with SA names and realistic SA feedback\n" #
    "   - Names: Thabo M., Priya N., Andre van der M. (authentic SA diversity)\n" #
    "   - Each card: quote text, star rating (⭐⭐⭐⭐⭐), reviewer name and trip type\n" #
    "   - Gold stars, navy card backgrounds, white text\n\n" #
    "8. BOOKING SECTION (high contrast, navy background):\n" #
    "   - Two-column: SnapScan QR left, WhatsApp right\n" #
    "   - SnapScan: '[SNAPSCAN_QR_URL] — replace with your QR image URL' instruction\n" #
    "   - Use a gold-bordered placeholder box with text 'SnapScan QR — Replace with your QR code'\n" #
    "   - WhatsApp: Large green button with phone icon, links to https://wa.me/[PHONE_NUMBER]\n" #
    "   - Loading state JS on both buttons\n\n" #
    "9. CONTACT FOOTER:\n" #
    "   - Navy background, white text\n" #
    "   - Phone: +27 [YOUR NUMBER] (SA format)\n" #
    "   - WhatsApp quick link\n" #
    "   - Social media placeholders: Facebook, Instagram, TikTok (emoji icons)\n" #
    "   - MoneyDrive powered-by badge\n" #
    "   - Copyright © 2025 [Driver Name]\n\n" #

    "═══ TECHNICAL REQUIREMENTS ═══\n" #
    "- All CSS embedded in <style> in <head> — no external CSS files\n" #
    "- Google Fonts in <head>: https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;600;700&family=Inter:wght@400;600;700&display=swap\n" #
    "- All JS at end of <body> — includes: scroll observer, sticky nav, smooth scroll, loading states, hamburger menu\n" #
    "- Mobile hamburger menu with toggle JS (no CDN)\n" #
    "- CSS custom properties (variables) for all brand colors at :root level\n" #
    "- NO external image URLs. Use CSS gradients, SVG data URIs, or emoji for all visuals\n" #
    "- Viewport meta tag: <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" #
    "- max_tokens will be high — use all of it. Build a COMPLETE, fully detailed website.\n\n" #

    "FINAL DIRECTIVE: Make this website UNFORGETTABLE. A South African rideshare driver should look world-class.\n" #
    "Township energy, professional excellence, authentic SA soul. No template feel. Every pixel deliberate.";
  };

  /// Build the iteration system prompt — applies design-level iteration commands.
  /// Supports commands like: "make it more premium", "add more animations",
  /// "change the color scheme to match my car (black and gold)", "make the hero section more dramatic"
  private func iterationSystemPrompt(currentDate : Text) : Text {
    "TODAY IS " # currentDate # ". YOU ARE NDUNA, A SOUTH AFRICAN MALE AI ASSISTANT. YOUR PRONOUNS ARE HE/HIM/HIS.\n\n" #
    "You are Nduna, a world-class South African website designer specialising in design evolution and refinement.\n\n" #
    "YOU ONLY OUTPUT VALID HTML — nothing else.\n" #
    "No explanations. No markdown. No code fences. No commentary. No preamble.\n" #
    "Your response MUST start with exactly: <!DOCTYPE html>\n" #
    "Take the provided HTML website and apply the requested design change. Return the COMPLETE updated HTML.\n\n" #

    "═══ ITERATION INTERPRETATION GUIDE ═══\n" #
    "Interpret design-level commands as a professional designer would:\n\n" #
    "'make it more premium' → \n" #
    "  - Increase whitespace (section padding from 80px → 120px)\n" #
    "  - Add subtle glassmorphism on cards: backdrop-filter: blur(10px); background: rgba(255,255,255,0.08);\n" #
    "  - Use gold (#CFA537) more liberally for accents\n" #
    "  - Upgrade typography: larger hero headline (4rem+), tighter letter-spacing on headings (-0.02em)\n" #
    "  - Add a dark luxury feel: deeper navy backgrounds, gold gradient text on hero headline\n" #
    "  - More sophisticated animations: slower transitions (0.8s), easing cubic-bezier(0.25,0.46,0.45,0.94)\n\n" #
    "'add more animations' → \n" #
    "  - Add CSS @keyframes for: float (hero icon), shimmer (CTAs), rotate (service icons on hover)\n" #
    "  - Increase animation variety: mix animate, animate-left, animate-right, animate-scale across all sections\n" #
    "  - Add a typing animation on the hero tagline using CSS\n" #
    "  - Add counter animations on stat numbers using IntersectionObserver + JS\n" #
    "  - Particle effect on hero: small CSS-only floating dots using pseudo-elements\n\n" #
    "'change the color scheme to match my car [color description]' → \n" #
    "  - Derive a new palette from the color description (e.g. black and gold → #0a0a0a primary, #CFA537 accent)\n" #
    "  - Update all CSS variables at :root level — never hardcode colors elsewhere\n" #
    "  - Keep SA brand identity: even a black-and-gold scheme should feel SA, not generic luxury\n" #
    "  - Adjust text contrast ratios to maintain accessibility (dark bg → white text, light bg → navy text)\n\n" #
    "'make the hero section more dramatic' → \n" #
    "  - Full-bleed video-style background with animated CSS gradient (background-size: 400% 400%; @keyframes gradient)\n" #
    "  - Oversized headline: 5rem+ with text-shadow and gradient clip\n" #
    "  - Add a parallax scroll effect using JS: window.addEventListener('scroll', () => { hero.style.backgroundPositionY = scrollY * 0.5 + 'px'; })\n" #
    "  - Floating badge animations on the platform badges\n" #
    "  - A subtle animated underline on the driver name\n\n" #
    "'make it more mobile-friendly' → \n" #
    "  - Audit all grid layouts: ensure 1-col on mobile (< 768px)\n" #
    "  - Increase touch targets: buttons min 48px height, min 44px width\n" #
    "  - Increase font sizes on mobile: hero 2.5rem, section titles 1.75rem\n" #
    "  - Improve hamburger menu: full-screen overlay with large nav links\n" #
    "  - Ensure SnapScan QR is full-width on mobile\n\n" #
    "'add [specific feature]' → Build the feature natively with embedded CSS/JS. No CDN.\n\n" #

    "═══ ITERATION RULES ═══\n" #
    "1. Keep everything not mentioned in the instruction EXACTLY as it was\n" #
    "2. Maintain the SA design aesthetic: burnt orange, gold, navy, off-white palette (unless color change requested)\n" #
    "3. Keep mobile-first approach regardless of the change\n" #
    "4. Never remove sections — only enhance them\n" #
    "5. Never add external CDN dependencies — all CSS and JS must remain inline/embedded\n" #
    "6. The animation system (IntersectionObserver + .animate classes) must always be present\n" #
    "7. The sticky nav and smooth scroll must always be present\n" #
    "8. Return the COMPLETE HTML — never truncate or abbreviate sections\n\n" #
    "Apply the change with the full skill of a professional South African web designer.";
  };



  /// Call OpenRouter with the website generation prompt and return the HTML response.
  private func callWebsiteGenerator(
    systemPrompt : Text,
    userMessage : Text,
    nowNs : Int,
  ) : async* Text {
    let apiKey = switch (openClawApiKey.value) {
      case (null) { Runtime.trap("OpenRouter API key not configured") };
      case (?k) { k };
    };
    let apiUrl = openClawApiUrl.value;
    let model = openClawModel.value;
    let (dateStr, timeStr) = AgentLib.formatDateTimeSAST(nowNs);
    let dateStamp = "TODAY IS " # dateStr # ", " # timeStr # " SAST. ";

    let messagesJson =
      "[{\"role\":\"system\",\"content\":\"" # AgentLib.escapeJson(systemPrompt) # "\"}," #
      "{\"role\":\"user\",\"content\":\"" # AgentLib.escapeJson(dateStamp # userMessage) # "\"}]";

    let requestBody =
      "{\"model\":\"" # model # "\"," #
      "\"messages\":" # messagesJson # "," #
      "\"max_tokens\":8000," #
      "\"temperature\":0.8}";

    let httpRequest : IC.http_request_args = {
      url = apiUrl;
      max_response_bytes = ?400_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "User-Agent"; value = "MoneyDrive/1.0" },
        { name = "HTTP-Referer"; value = "https://moneydrive.app" },
        { name = "X-Title"; value = "MoneyDrive Website Builder" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let httpResponse = try {
      await (with cycles = 100_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      Runtime.trap("Website generation failed: " # e.message());
    };

    switch (httpResponse.body.decodeUtf8()) {
      case (null) { Runtime.trap("Could not decode website generator response") };
      case (?text) {
        // Extract the content field from OpenAI-compatible JSON response
        let raw = extractHtmlContent(text);
        // Strip any leading/trailing whitespace and ensure it starts with <!DOCTYPE
        let trimmed = raw.trim(#predicate(func(c : Char) : Bool {
          c == ' ' or c == '\n' or c == '\r' or c == '\t'
        }));
        if (trimmed.size() == 0) {
          Runtime.trap("Empty response from website generator");
        };
        trimmed;
      };
    };
  };

  /// Extract the assistant message content from an OpenAI-compatible JSON response.
  private func extractHtmlContent(json : Text) : Text {
    switch (AgentLib.splitOnFirst(json, "\"message\":")) {
      case (?(_, afterMessage)) {
        var remaining = afterMessage;
        label scan loop {
          switch (AgentLib.splitOnFirst(remaining, "\"content\":\"")) {
            case (null) { break scan };
            case (?(before, after)) {
              let beforeArr = before.toArray();
              let sz = beforeArr.size();
              let checkLen = if (sz >= 10) { 10 } else { sz };
              let startIdx : Nat = sz - checkLen;
              let tail = Text.fromArray(beforeArr.sliceToArray(startIdx, sz));
              if (tail.contains(#text "reasoning_")) {
                remaining := after;
              } else {
                return AgentLib.takeUntilQuote(after);
              };
            };
          };
        };
      };
      case (null) {};
    };
    // Fallback
    switch (AgentLib.splitOnFirst(json, "\"content\":\"")) {
      case (null) { "" };
      case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
    };
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Generate a professional driver website using Nduna's AI capabilities.
  /// All 4 design skills are stacked: SA taste, SuperDesign canvas layout,
  /// frontend-slides scroll animations, and interaction-design microinteractions.
  /// Rate limited to 5 per driver per day (Tier 3).
  /// Requires authenticated caller (not anonymous).
  public shared ({ caller }) func generateDriverWebsite(topic : Text) : async WBTypes.Result<WBTypes.WebsiteJob, Text> {
    if (caller.isAnonymous()) {
      return #err("Authentication required");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    if (topic.size() == 0) {
      return #err("Topic cannot be empty");
    };

    let now = Time.now();
    let driverId = caller.toText();
    let (used, today) = todayUsage(driverId, now);
    if (used >= DAILY_LIMIT) {
      return #err("Daily limit reached: " # DAILY_LIMIT.toText() # " website generations per day. Try again tomorrow.");
    };

    let jobId = generateJobId(caller, now, 0);

    // Create the job as pending
    let pendingJob : WBTypes.WebsiteJob = {
      id = jobId;
      driverId;
      topic;
      iteration = 0;
      htmlContent = null;
      status = #generating;
      errorMsg = null;
      createdAt = now;
      updatedAt = now;
      shareUrl = null;
    };
    websiteJobs.add(jobId, pendingJob);

    // Register the job under the driver's list
    let existingList = switch (driverWebsiteJobs.get(driverId)) {
      case (null) { List.empty<Text>() };
      case (?lst) { lst };
    };
    existingList.add(jobId);
    driverWebsiteJobs.add(driverId, existingList);

    // Increment rate limit before the async call
    incrementUsage(driverId, now);

    // Build the prompt
    let currentDate = AgentLib.formatDateFull(now);
    let systemPrompt = websiteSystemPrompt(currentDate);
    let userMessage =
      "Create a complete, UNFORGETTABLE professional website for a South African rideshare driver.\n" #
      "Service focus / topic: " # topic # "\n\n" #
      "Apply ALL 4 stacked design skills: SA taste, SuperDesign canvas layout, frontend-slides scroll animations, interaction-design microinteractions.\n" #
      "MANDATORY: Include all 9 sections in order: Sticky Nav, Hero (100vh), Services, In-Car Experience, About, Trust Signals, Testimonials, Booking (SnapScan + WhatsApp), Footer.\n" #
      "MANDATORY: Embed the IntersectionObserver animation system and sticky nav JS.\n" #
      "MANDATORY: All CSS embedded in <style>, all JS at end of <body>. No external dependencies except Google Fonts.\n" #
      "Output ONLY the complete HTML starting with exactly: <!DOCTYPE html>";

    // Call Nduna to generate the website
    let htmlResult = try {
      await* callWebsiteGenerator(systemPrompt, userMessage, now);
    } catch (e) {
      let failedJob : WBTypes.WebsiteJob = {
        pendingJob with
        status = #failed;
        errorMsg = ?("Generation error: " # e.message());
        updatedAt = Time.now();
      };
      websiteJobs.add(jobId, failedJob);
      return #err("Website generation failed: " # e.message());
    };

    let completedJob : WBTypes.WebsiteJob = {
      pendingJob with
      htmlContent = ?htmlResult;
      status = #ready;
      updatedAt = Time.now();
    };
    websiteJobs.add(jobId, completedJob);
    #ok(completedJob);
  };

  /// Iterate on an existing website job by applying a design-level change instruction.
  /// Supports natural design commands: "make it more premium", "add more animations",
  /// "change the color scheme to match my car (black and gold)", "make the hero more dramatic".
  /// The original HTML is sent back to Nduna with the instruction and the full design skill context.
  /// Counts against the same daily rate limit (5 per day).
  public shared ({ caller }) func iterateDriverWebsite(jobId : Text, instruction : Text) : async WBTypes.Result<WBTypes.WebsiteJob, Text> {
    if (caller.isAnonymous()) {
      return #err("Authentication required");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    if (instruction.size() == 0) {
      return #err("Instruction cannot be empty");
    };

    let driverId = caller.toText();
    let now = Time.now();

    let originalJob = switch (websiteJobs.get(jobId)) {
      case (null) { return #err("Job not found: " # jobId) };
      case (?j) { j };
    };

    if (originalJob.driverId != driverId) {
      return #err("Unauthorized: This website job does not belong to you");
    };

    let originalHtml = switch (originalJob.htmlContent) {
      case (null) { return #err("Job is not ready — cannot iterate on an incomplete website") };
      case (?html) { html };
    };

    if (originalJob.status != #ready) {
      return #err("Job status must be #ready to iterate");
    };

    let (used, _today) = todayUsage(driverId, now);
    if (used >= DAILY_LIMIT) {
      return #err("Daily limit reached: " # DAILY_LIMIT.toText() # " generations per day. Try again tomorrow.");
    };

    let newIteration = originalJob.iteration + 1;
    let newJobId = generateJobId(caller, now, newIteration);

    let iteratingJob : WBTypes.WebsiteJob = {
      id = newJobId;
      driverId;
      topic = originalJob.topic;
      iteration = newIteration;
      htmlContent = null;
      status = #generating;
      errorMsg = null;
      createdAt = now;
      updatedAt = now;
      shareUrl = null;
    };
    websiteJobs.add(newJobId, iteratingJob);

    let existingList = switch (driverWebsiteJobs.get(driverId)) {
      case (null) { List.empty<Text>() };
      case (?lst) { lst };
    };
    existingList.add(newJobId);
    driverWebsiteJobs.add(driverId, existingList);

    incrementUsage(driverId, now);

    let currentDate = AgentLib.formatDateFull(now);
    let systemPrompt = iterationSystemPrompt(currentDate);
    let userMessage =
      "Here is the existing website HTML:\n\n" #
      originalHtml # "\n\n" #
      "Design iteration instruction: " # instruction # "\n\n" #
      "Interpret this as a professional South African website designer would. Apply the change using the full skill stack " #
      "(SA taste, SuperDesign canvas thinking, frontend-slides animation system, interaction-design microinteractions).\n" #
      "Keep all 9 sections intact. Return the COMPLETE updated HTML starting with exactly: <!DOCTYPE html>\n" #
      "Do not truncate, abbreviate, or omit any section.";

    let htmlResult = try {
      await* callWebsiteGenerator(systemPrompt, userMessage, now);
    } catch (e) {
      let failedJob : WBTypes.WebsiteJob = {
        iteratingJob with
        status = #failed;
        errorMsg = ?("Iteration error: " # e.message());
        updatedAt = Time.now();
      };
      websiteJobs.add(newJobId, failedJob);
      return #err("Website iteration failed: " # e.message());
    };

    let completedJob : WBTypes.WebsiteJob = {
      iteratingJob with
      htmlContent = ?htmlResult;
      status = #ready;
      updatedAt = Time.now();
    };
    websiteJobs.add(newJobId, completedJob);
    #ok(completedJob);
  };

  /// Get a specific website job. Returns null if not found or not owned by caller.
  public query ({ caller }) func getWebsiteJob(jobId : Text) : async ?WBTypes.WebsiteJob {
    if (caller.isAnonymous()) { return null };
    switch (websiteJobs.get(jobId)) {
      case (null) { null };
      case (?job) {
        if (job.driverId == caller.toText()) { ?job } else { null };
      };
    };
  };

  /// Get all website jobs for the calling driver, newest first.
  public query ({ caller }) func getWebsiteJobs() : async [WBTypes.WebsiteJob] {
    if (caller.isAnonymous()) { return [] };
    let driverId = caller.toText();
    let jobIds = switch (driverWebsiteJobs.get(driverId)) {
      case (null) { return [] };
      case (?lst) { lst.toArray() };
    };
    // Collect valid jobs, newest first (list was built oldest-first, so reverse)
    let jobs = List.empty<WBTypes.WebsiteJob>();
    // Walk in reverse order to get newest first
    let len = jobIds.size();
    var i = if (len > 0) { len - 1 : Nat } else { 0 };
    if (len > 0) {
      label walk loop {
        switch (websiteJobs.get(jobIds[i])) {
          case (?job) { jobs.add(job) };
          case (null) {};
        };
        if (i == 0) { break walk };
        i -= 1;
      };
    };
    jobs.toArray();
  };

  /// Return how many website generations the caller has remaining today.
  public query ({ caller }) func getWebsiteBuilderRateLimit() : async Nat {
    if (caller.isAnonymous()) { return 0 };
    let now = Time.now();
    let (used, _) = todayUsage(caller.toText(), now);
    if (used >= DAILY_LIMIT) { 0 } else { DAILY_LIMIT - used };
  };

  /// Publish a completed driver website to here.now for free permanent hosting.
  /// Retrieves the generated HTML from the job, POSTs it to here.now's publishing API,
  /// stores the returned URL in the job's shareUrl field, and returns both url and claimUrl.
  /// The caller must own the job and the job status must be #ready.
  public shared ({ caller }) func publishDriverWebsite(jobId : Text) : async WBTypes.Result<{ url : Text; claimUrl : Text }, Text> {
    if (caller.isAnonymous()) {
      return #err("Authentication required");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    let driverId = caller.toText();

    let job = switch (websiteJobs.get(jobId)) {
      case (null) { return #err("Job not found: " # jobId) };
      case (?j) { j };
    };

    if (job.driverId != driverId) {
      return #err("Unauthorized: This website job does not belong to you");
    };

    if (job.status != #ready) {
      return #err("Job is not ready — cannot publish an incomplete or failed website");
    };

    let html = switch (job.htmlContent) {
      case (null) { return #err("Job has no HTML content — cannot publish") };
      case (?h) { h };
    };

    // If already published, return the cached URL
    switch (job.shareUrl) {
      case (?existingUrl) {
        // Return cached result; claimUrl is not stored separately, so return empty string
        return #ok({ url = existingUrl; claimUrl = "" });
      };
      case (null) {};
    };

    // Build the here.now API request
    // here.now accepts a JSON payload: { "files": { "index.html": "<html content>" } }
    // and returns: { "url": "https://...", "claimUrl": "https://..." }
    let escapedHtml = AgentLib.escapeJson(html);
    let requestBody = "{\"files\":{\"index.html\":\"" # escapedHtml # "\"}}";

    let httpRequest : IC.http_request_args = {
      url = "https://api.here.now/v1/sites";
      max_response_bytes = ?50_000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Accept";       value = "application/json" },
        { name = "User-Agent";   value = "MoneyDrive/1.0 (Nduna Website Builder)" },
      ];
      body = ?requestBody.encodeUtf8();
      method = #post;
      transform = null;
      is_replicated = ?false;
    };

    let httpResponse = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (e) {
      return #err("Failed to reach here.now: " # e.message());
    };

    let responseText = switch (httpResponse.body.decodeUtf8()) {
      case (null) { return #err("Could not decode here.now response") };
      case (?t) { t };
    };

    // Validate HTTP status (2xx success)
    if (httpResponse.status >= 300) {
      return #err("here.now returned error status " # httpResponse.status.toText() # ": " # responseText);
    };

    // Parse url from JSON response — look for "url":"..." and "claimUrl":"..."
    let publishedUrl = switch (AgentLib.splitOnFirst(responseText, "\"url\":\"")) {
      case (null) {
        // Fallback: try "deployUrl"
        switch (AgentLib.splitOnFirst(responseText, "\"deployUrl\":\"")) {
          case (null) { return #err("Could not find URL in here.now response: " # responseText) };
          case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
        };
      };
      case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
    };

    let claimUrl = switch (AgentLib.splitOnFirst(responseText, "\"claimUrl\":\"")) {
      case (null) { "" };
      case (?(_, rest)) { AgentLib.takeUntilQuote(rest) };
    };

    if (publishedUrl.size() == 0) {
      return #err("here.now returned an empty URL — response was: " # responseText);
    };

    // Persist the shareUrl back onto the job
    let updatedJob : WBTypes.WebsiteJob = {
      job with
      shareUrl  = ?publishedUrl;
      updatedAt = Time.now();
    };
    websiteJobs.add(jobId, updatedJob);

    #ok({ url = publishedUrl; claimUrl });
  };
};
