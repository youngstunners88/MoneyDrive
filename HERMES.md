# Hermes Agent — Skill Definitions for MoneyDrive

This file defines the skill library used by Nduna (MoneyDrive's driver AI agent). Skills are loaded into the agent's context per session based on the driver's tier and current task.

---

## Identity

Nduna runs on the Hermes agent framework. These skills configure Nduna's reasoning, data access, and output style for the MoneyDrive context.

---

## Skill Library

### 1. Earnings Snapshot
- **Trigger:** Driver asks about earnings, income, or shift performance
- **Behaviour:** Pull trip log totals, peak hours, and top days from canister memory. Calculate average earnings per shift. Compare against driver's own historical baseline.
- **Output:** 3–5 bullet summary with specific rand values and actionable shift recommendation.

### 2. Surge Detector
- **Trigger:** Driver asks when to drive, where to drive, or mentions surge
- **Behaviour:** Cross-reference Tavily web search results for local events, weather, public holidays, and demand patterns. Apply to driver's primary zone.
- **Output:** "Top 3 windows this week" with reasoning per window.

### 3. Advertising Business Case Builder
- **Trigger:** Driver asks about advertising, company pitches, or generating a pitch deck
- **Behaviour:** Pull driver's exposure metrics, trip count, top routes, and peak hours. Structure a business case for the target company. Include ROI comparison vs. billboard if exposure data is available.
- **Output:** Structured pitch summary + recommendation on which company to target first.

### 4. Event Relevance Scorer
- **Trigger:** Weekly refresh of the smart event calendar
- **Behaviour:** Fetch upcoming SA events via Tavily. Score each event for driver income relevance (stadium capacity, proximity to driver's primary zone, historical surge data for similar events). Flag top 3 with "NEW" badge if added mid-cycle.
- **Output:** Ranked event list with relevance score and recommended positioning window.

### 5. Driver Profile Query
- **Trigger:** Any recommendation that requires knowing the driver's history
- **Behaviour:** Read driver profile from canister (zone, trip count, earnings, tier, feedback history). Summarise as a data block for use in downstream skills.
- **Output:** Internal context block — not shown to driver directly.

### 6. Geolocation Exposure Analysis *(Phase 1 — Built)*
- **Trigger:** Pitch deck generation, exposure questions, or ROI calculation requests
- **Behaviour:** Pull driver's primary SA zone (e.g. Sandton, Johannesburg CBD, Cape Town CBD). Call Google Maps API and/or TomTom API for traffic density data. Calculate daily vehicle count, daily pedestrian estimate, and monthly total exposure. Apply time-of-day multipliers for peak hours. Generate confidence score.
- **Output:** Structured exposure metrics: daily vehicles, daily pedestrians, monthly total exposure, confidence %, and efficiency vs. billboard (e.g. "3x more cost-efficient than a Sandton billboard at R20,000/mo").
- **Fallback:** Conservative zone-based estimates if APIs unavailable. Confidence score drops to 40% and note displayed in UI.

### 7. Competitive Intelligence Reading *(Tier 2+)*
- **Trigger:** Driver views Advertising Pipeline page (Tier 2+)
- **Behaviour:** Read anonymous network leaderboard from canister (updated hourly). Interpret city-level deal closure data, company responsiveness rates, and driver rank within their city. Contextualise driver's surge accuracy against network average.
- **Output:** City leaderboard, top 3 most responsive companies with response rate bars, driver's city rank and deal comparison vs. city average.
- **Privacy:** All network data is fully anonymised — no individual driver is identifiable.

### 8. Company Scoring *(Tier 3)*
- **Trigger:** SmartRecommendations panel loads for Tier 3 driver
- **Behaviour:** Score driver-company match based on: driver's primary zone vs. company's target market, driver's monthly trip volume, historical network success rates for this company, driver's exposure metrics, and time since last pitch attempt.
- **Scoring model:** 0–100 match score. Top 3 companies surfaced with urgency flag ("high" if network shows recent activity or company response rate >50%).
- **Output:** Ranked recommendation list with match score, pitch opening line, supporting data point, and estimated deal value range.

### 9. Personalized Pitch Strategy *(Tier 3)*
- **Trigger:** Pitch deck generation or Nduna's Strategy panel in PitchDeckGenerator
- **Behaviour:** Generate customised pitch strategy language based on: driver's zone, monthly passenger count, exposure metrics (if available), and top-performing company for that zone from network data. Produce 5 strategy lines: value framing, company rationale, peak data lead, recommended approach, follow-up timeline.
- **Output:** Displayed in "Nduna's Strategy" panel in the pitch deck preview and embedded in the downloaded PDF.
- **Personalisation:** Company-specific objection handling lines generated when company name is available (e.g. "FNB procurement responds to cost-per-impression framing").

### 10. Automated Lead Research *(Tier 2+)*
- **Trigger:** Weekly scheduler (Sunday 02:00 SAST) or manual driver refresh request
- **Behaviour:**
  1. Pull driver's city and primary peak routes from profile
  2. Call Camofox REST API with scraping job config:
     - Sources: Google Business SA, Yellow Pages SA (`yellowpages.co.za`), CIPC public register (`cipc.co.za`)
     - robots.txt respected; rate-limited; no login-gated pages; no LinkedIn
  3. Receive raw company list (50–100 results)
  4. Score each company using ranking algorithm:
     - Industry fit (35%): logistics, transport, fleet, delivery, retail chain = high score
     - Location proximity (25%): same city as driver's peak routes
     - Company size signals (20%): website quality, registration age, estimated headcount
     - Hiring/expansion activity (20%): Tavily search for recent job postings or press mentions
  5. Store top 10 ranked leads in canister as `ScrapedLead` records under a `LeadBatch`
  6. Write `ScraperAuditLog` entry for compliance tracking
- **Output:** Top 10 scored leads surfaced in the Leads tab (inside Advertising section), each with: company name, industry tag, city, match score (0–100), estimated deal range (ZAR), and status tracker.
- **Driver actions per lead:** `Interested` / `Pitched` / `Rejected` / `Deal Closed` (with optional deal value entry)
- **Manual refresh:** Rate-limited to once per 24 hours per driver; always available via the refresh button
- **Integration:** Tapping a lead pre-fills Nduna's Personalized Pitch Strategy (Skill 9) and opens the Presentation Builder (Skill 11) for that specific company

### 11. Nduna Presentation Builder *(Tier 3)*
- **Trigger:** Driver taps "Build Presentation" from any lead card or from the Advertising tab
- **Behaviour:**
  1. Pull driver profile data: name, city, peak routes, monthly trips, exposure metrics, top earning hours
  2. Call OpenRouter (admin-configured model) with a structured prompt to generate slide content for all 8 slide types
  3. Render interactive slide carousel in-app
  4. Generate unique shareable URL stored in canister
- **Slide types generated:**
  - `Title` — Driver name, company target, "Advertising Proposal" header
  - `ValueProp` — Why this driver's car is a premium advertising channel
  - `AudienceData` — Monthly passengers, daily vehicles, total monthly exposure
  - `RouteIntelligence` — Primary zones, peak hours, service area demographics
  - `Pricing` — Three-tier deal proposal (R10k / R20k / R50k with deliverables)
  - `ROIComparison` — Driver vs. billboard cost-per-impression breakdown
  - `NdunaStrategy` — Personalized pitch approach for this specific company (from Skill 9)
  - `CTA` — Driver contact details, SnapScan / email / WhatsApp
- **Output:** Interactive in-app carousel + shareable link (`moneydrive.app/pitch/[driverHandle]/[companySlug]`)
- **Fallback:** If OpenRouter unavailable, generates simplified text-based PDF summary using static template
- **Storage:** Each presentation stored as a canister record with slide content JSON, company target, driver ID, and creation timestamp

### 12. WhatsApp Command Handler *(All Tiers)*
- **Trigger:** Incoming message received via 360dialog webhook
- **Behaviour:**
  1. Parse raw webhook payload — extract driver phone number, message type (text/image/audio/document), and body
  2. Match against command list: `/leads`, `/coach [company]`, `/status`, `/help`
  3. If command → route to the relevant skill (Skill 10 for `/leads`, Skill 9 for `/coach`, Skill 5 for `/status`)
  4. If natural text → route to standard Nduna inference pipeline with driver context loaded
  5. If image → extract text/information using OpenRouter vision model; summarise offer terms if it's a deal screenshot
  6. If PDF/document → extract key clauses using OpenRouter; return summary with flagged terms
  7. Format response with WhatsApp markdown (bold `*text*`, lists, line breaks)
  8. POST response to 360dialog send endpoint
  9. Write both inbound message and outbound response to canister conversation record (same schema as in-app chat)
- **Output:** WhatsApp-formatted response delivered to driver; conversation history synced to canister
- **Rate limiting:** 60 messages/minute per driver; queue overflow messages for up to 15 minutes before error
- **Fallback:** If 360dialog API is unreachable, log failure in canister; retry delivery up to 3× over 15 minutes

### 13. Video Clip Analytics Interpreter *(Tier 2+)*
- **Trigger:** Driver opens Video Analytics dashboard, or monthly prompt evolution cycle runs
- **Behaviour:**
  1. Load daily analytics records from canister for all driver's published clips (views, likes, shares, comments per platform)
  2. Calculate top-performing content types: earnings reveals, pitch coaching, driving tips, day-in-life
  3. Identify highest-retention hooks (first 3 seconds) from clips with above-average watch-time
  4. Cross-reference clip performance with posting day/time to surface optimal schedule
  5. Generate actionable content recommendation: "Record an earnings breakdown clip this week — they get 3× more shares than driving footage"
- **Output:** Analytics summary card in the Video tab + Nduna content recommendation tip; monthly analytics also used in prompt evolution (which clip formats should Nduna recommend recording)
- **Data retention:** Analytics records kept for 12 months; older records archived, not deleted

---

MoneyDrive calls the Camofox REST API for automated lead research jobs. Key integration notes:

- **Base URL:** Admin-configured via admin panel. Stored securely in backend canister — never visible to frontend or users.
- **Auth:** API token stored alongside base URL in canister secure storage.
- **Job payload example:**
  ```json
  {
    "sources": ["google_business_sa", "yellow_pages_sa", "cipc"],
    "city": "Johannesburg",
    "industries": ["logistics", "transport", "fleet", "delivery", "retail"],
    "max_results": 100,
    "respect_robots": true,
    "rate_limit_ms": 2000
  }
  ```
- **Camofox infrastructure** (server setup, proxy management, browser automation environment) is fully user-managed. MoneyDrive only consumes the REST API — it does not manage Camofox's internal operation.
- **Error handling:** If Camofox returns a non-200 response or times out, the lead batch is marked as `failed` in the audit log, the driver sees "Leads refreshing — check back shortly", and the scheduler retries the following day.

---

## Outcome Feedback Loop

Every recommendation Nduna surfaces generates a feedback card. Drivers report:
1. Did they act on the recommendation? (Yes / Partially / No)
2. What happened? (Free text, optional)
3. How much did they earn / save? (Rand value, optional)

Feedback is stored in canister. Monthly analysis:
- Which recommendation types had highest action rate?
- Which companies resulted in closed deals?
- What messaging language correlated with positive outcomes?
- Nduna's system prompt is updated monthly with learnings.

**Lead Research Feedback:**
- When a driver marks a lead as `Deal Closed`, the deal value is stored and fed into the ranking algorithm — companies with closed deals get a score boost for future batches
- When marked `Rejected`, the company is suppressed from future batches for 90 days

---

## Prompt Evolution Schedule

| Month | Action |
|---|---|
| Month 1 | Deploy feedback loop. Collect baseline data. |
| Month 2 | First prompt evolution. Update surge timing weights based on real SA event data. |
| Month 3 | Update company scoring model with first deal closure data. |
| Month 4 | Refine lead ranking algorithm with first confirmed closed deals from Camofox leads. |
| Month 6 | Full cohort analysis. Segment drivers by profile archetype. Update Presentation Builder slide templates with highest-converting copy. |

---

## Parked Tools — Reference

| Tool | Reason Parked |
|---|---|
| MiroShark | Requires Neo4j + Python + Docker; not ICP-compatible; AGPL-3.0 license; planned for Phase 3 on Contabo VPS |
| presentation-ai | Next.js + PostgreSQL stack — not ICP-compatible. Replaced by Nduna Presentation Builder (Skill 11). |
| NotebookLM | Google closed product — not self-hostable, no API available |
| VisionCaptioner | Desktop video captioning tool — not relevant to driver pitch or income workflows |
| SocratiCode | Developer MCP codebase intelligence tool — not a driver-facing feature; parked as dev workflow tool |
---

## Constraints

- Never expose API keys (ElevenLabs, OpenRouter, Tavily, Google Maps, TomTom, Camofox, 360dialog, Upload-Post, Whisper) to any frontend surface
- Never store raw GPS coordinates — use zone labels only (e.g. "Sandton")
- Never identify individual drivers in network/leaderboard data
- Fallback to text if voice pipeline fails — never leave driver without a response
- All Rand values must be formatted in ZAR (e.g. R20,000 — not $20k)
- Camofox scraping: only public data, robots.txt respected, no LinkedIn, no login-gated pages
- Lead data older than 90 days is archived (not deleted) — regulatory compliance
- WhatsApp messages: rate-limited to 60/min per driver; all content encrypted in canister; 360dialog does not retain content after delivery
- Video posting: driver preview and explicit approval required before any clip is published to any platform — no exceptions
- Video branding: MoneyDrive logo only — no third-party watermarks or platform logos in driver clips
- Whisper captions: words below 80% confidence flagged with `[?]` — never silently omit low-confidence words
