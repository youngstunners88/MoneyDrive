# Nduna — MoneyDrive AI Agent

Nduna is MoneyDrive's persistent, learning AI agent built for professional South African rideshare drivers. Nduna lives in your ICP canister, accumulates driver-specific data over time, and surfaces actionable income-maximising recommendations — not generic chatbot responses.

---

## Identity

- **Name:** Nduna (isiZulu for "agent/representative" — someone trusted to act on your behalf)
- **Gender:** MALE. Pronouns: **he / him / his**. Nduna is a man. Never refer to him using female pronouns.
- **Role:** Earnings intelligence, advertising deal facilitation, and driver income growth
- **Personality:** Direct, data-driven, South African in context. No padding, no fluff. Speaks to the driver as a peer who knows the routes.
- **Voice Model:** ElevenLabs Voice ID `mJZEpDe9qAKz9yOOwCD8` (admin-configured, never exposed to users)

---

## Core Capabilities

### 1. Earnings Intelligence
- Analyses trip logs, peak hours, earnings per day, and surge patterns
- Recommends optimal drive windows, city zones, and shift structures
- Compares driver performance against anonymous network benchmarks

### 2. In-Car Sales Coaching
- Surfaces which products perform best (WiFi, Water, Perfume, Candy)
- Identifies passenger segments most likely to purchase
- Recommends pricing adjustments based on route and time of day

### 3. Smart Event Calendar
- Auto-fetches upcoming SA events (concerts, sports, conferences) relevant to driver income
- Weekly refresh; mid-cycle "NEW" badges for urgent additions
- Recommends which events to position for and when to arrive

### 4. Advertising Deal Pipeline Support
- Helps drivers build a business case for car-wrap advertising deals
- Generates pitch language tailored to specific companies (MTN, FNB, Capitec, Vodacom, etc.)
- Tracks pitch outcomes in the CompanyPipelineTracker
- Logs recommendation outcomes and learns from real driver deal data

### 5. Geolocation Intelligence *(Phase 1 — Built)*
- Calculates vehicle and pedestrian exposure for a driver's SA city zone
- Sources: Google Maps API + TomTom API (keys stored in backend, never exposed)
- Generates defensible ROI comparisons: "Your car = 1.2M exposures vs. billboard = 200k exposures"
- Feeds directly into the Advertising Pitch Deck PDF generator
- If APIs unavailable, falls back to conservative zone-based estimates with confidence scoring

### 6. Competitive Intelligence *(Tier 2+)*
- Reads anonymous network leaderboard data aggregated across all MoneyDrive drivers
- Shows which SA cities are closing the most advertising deals and which companies are most responsive
- Positions each driver vs. their city peers (surge accuracy, deals closed, avg deal value)
- Refreshes hourly; all data fully anonymised

### 7. Smart Recommendations *(Tier 3)*
- Scores driver-company match based on: driver profile, primary routes, exposure zone, and historical network success rates
- Surfaces top 3 weekly company opportunities with match score, pitch opening, and urgency indicator
- Each recommendation includes supporting data: "3 drivers in Sandton closed this company last month"
- "Generate Pitch" button pre-fills the pitch deck generator and scrolls directly to it

### 8. Personalized Pitch Strategy *(Tier 3)*
- Auto-generates customised pitch language per driver based on their zone, trip data, and exposure metrics
- Sections: value framing, company selection rationale, ROI comparison, follow-up timeline, objection handling
- Appears in both the on-screen Nduna's Strategy panel and the downloadable PDF pitch deck
- Updated monthly as Nduna accumulates more outcome data from the feedback loop

---

## Layer 3.5 — Automated Lead Research *(Tier 2+)*

Nduna automatically researches and ranks advertising leads for each driver on a weekly basis using Camofox browser automation. No manual searching — Nduna surfaces companies ready to pitch.

### How It Works

1. **Weekly Scrape Job** — Every week, Nduna triggers a Camofox job for the driver's city and peak routes.
2. **Sources scraped (public data only):**
   - Google Business SA (search results, business listings)
   - Yellow Pages SA (`yellowpages.co.za`)
   - CIPC public company register (`cipc.co.za`)
3. **Legal Compliance:**
   - Only public, openly accessible data — no login-gated pages
   - robots.txt is respected on every source
   - Rate limiting applied: requests throttled to avoid hammering servers
   - No LinkedIn profile scraping (ToS violation — permanently excluded)
4. **Data extracted per company:** Company name, address, city, website, phone, email (if public), industry category

### Lead Ranking Algorithm

Each scraped company is scored 0–100 using the following factors:

| Factor | Weight | Signal |
|---|---|---|
| Industry fit | 35% | Logistics, transport, fleet, delivery, retail chain = high score |
| Location proximity | 25% | Company headquartered in same city as driver's peak routes |
| Company size signal | 20% | Website quality, staff count signals, registered years |
| Hiring/expansion activity | 20% | Recent job postings, press mentions (via Tavily search) |

Top 10 leads per driver are surfaced weekly. Driver can also manually trigger a refresh at any time.

### Driver UI — Lead Surface

The **Leads tab** (inside the Advertising section, Tier 2+) shows:

- **"Top 10 This Week"** — card stack with company name, industry tag, city, estimated deal range (R), and match score
- **Status tracking per lead:** Driver marks each as:
  - `Interested` — want to pitch
  - `Pitched` — contact sent
  - `Rejected` — company passed or no response
  - `Deal Closed` — deal confirmed (with optional deal value entry)
- **Pitch Strategy shortcut:** Tapping any lead loads Nduna's Personalized Pitch Strategy pre-filled for that company
- **Manual refresh button** — driver can trigger a fresh scrape at any time (rate-limited to once per 24h)

### Data Schema

```
ScrapedLead {
  id: Text
  driverId: Text
  companyName: Text
  address: Text
  city: Text
  website: ?Text
  phone: ?Text
  email: ?Text
  industry: Text
  matchScore: Nat (0-100)
  status: "new" | "interested" | "pitched" | "rejected" | "closed"
  dealValue: ?Nat (ZAR, filled when closed)
  scrapedAt: Nat64
  batchId: Text
}

LeadBatch {
  id: Text
  driverId: Text
  city: Text
  totalScraped: Nat
  totalRanked: Nat
  topLeads: [Text] (lead IDs)
  runAt: Nat64
  triggeredBy: "scheduler" | "manual"
}

ScraperAuditLog {
  batchId: Text
  source: "google_business" | "yellow_pages" | "cipc"
  requestCount: Nat
  robotsRespected: Bool
  rateLimit: Nat (ms between requests)
  errors: [Text]
  completedAt: Nat64
}
```

### Infrastructure Note

Camofox infrastructure (server setup, rate limiting configuration, proxy management) is managed by the app owner. MoneyDrive's backend only calls the Camofox REST API using the base URL configured in the admin panel. The Camofox base URL is stored securely in the backend canister — it is never exposed to the frontend or any user.

### Weekly Scheduler Config (Admin Panel)

| Setting | Default | Description |
|---|---|---|
| Enabled | `true` | Turn weekly automation on/off globally |
| Run day | `Sunday` | Day of week for scheduled scrape jobs |
| Run hour | `02:00` | Time of day (SA timezone, SAST) |
| Camofox base URL | (admin-set) | Secure backend storage — never visible once saved |

---

## Nduna Presentation Builder *(Tier 3 only)*

Nduna generates a complete, branded multi-slide pitch presentation for any advertising lead — directly from the driver's real data. No external tools needed.

### How It Works

1. Driver selects a company from their Leads list (or enters a company name manually)
2. Taps **"Build Presentation"**
3. Nduna calls OpenRouter (using the admin-configured model) to generate structured slide content
4. Presentation renders as an **interactive slide carousel** in-app — no download required
5. Driver can **share via link** — a unique shareable URL is generated per presentation

### Slide Structure

| Slide | Title | Content |
|---|---|---|
| 1 | Title | Driver name, company target, "Advertising Proposal" header |
| 2 | The Value Proposition | Why this driver's car is a premium advertising channel |
| 3 | Audience & Exposure Data | Monthly passengers, daily vehicles, total exposure (from geolocation layer) |
| 4 | Route Intelligence | Primary zones, peak hours, demographics of service area |
| 5 | Pricing Options | Three-tier deal proposal (e.g. R10k / R20k / R50k with deliverables) |
| 6 | ROI Comparison | Driver vs. billboard: cost-per-impression breakdown |
| 7 | Nduna's Strategy | Personalized pitch approach for this specific company |
| 8 | Call to Action | Driver contact details, SnapScan / email / WhatsApp |

### Technical Integration

- Powered by **OpenRouter** (same connection already configured — no new API key required)
- Slide content generated using driver's live data: trip count, exposure metrics, primary city, peak hours
- Presentation stored in canister per driver — accessible any time
- Shareable link generated: `moneydrive.app/pitch/[driverHandle]/[companySlug]`
- If OpenRouter is unavailable, Nduna generates a simplified text-based PDF summary as fallback

### Why This Replaces External Tools

| Tool | Why Parked |
|---|---|
| presentation-ai (allweonedev) | Next.js + PostgreSQL — not ICP-compatible |
| Google Slides / Canva | Requires leaving the app; no live driver data integration |
| Static PDF generator | Already implemented (Tier 2); Presentation Builder is the Tier 3 upgrade |

---

## Learning Loop

Every Nduna recommendation generates a feedback card:
- "Did you try this? What happened? How much did you earn?"
- Outcome data stored in ICP canister
- Monthly analysis identifies which recommendations worked, which companies respond, and what messaging closes deals
- **System prompt auto-update:** When `monthlyAnalysis()` runs, the generated prompt delta is automatically written back to `NdunaSystemPromptState.evolutionDelta`. On the next `chat()` call, the delta is appended to Nduna's base system prompt — Nduna gets smarter every month without any manual steps.
- Admin can view the current evolution state via `getNdunaPromptState()` and reset it via `resetNdunaEvolution()` if needed.

---

## Driver Cohort Analysis *(All Tiers)*

Nduna classifies every driver into one of three cohorts based on their monthly trip count and earnings. Each cohort gets tailored advice — no generic one-size-fits-all recommendations.

| Cohort | Threshold | Nduna's Approach |
|---|---|---|
| 🏆 Power Earner | 200+ trips/mo OR R20k+/mo | Push advertising deals above R20k/mo. MTN and FNB prefer drivers with this profile. |
| 📈 Growth Driver | 100–199 trips/mo OR R8k–R20k/mo | Focus on rating above 4.8 before pitching — increases closure rate by 23%. Aim for 200 trips. |
| 🌱 New Driver | <100 trips/mo OR <R8k/mo | Build 100 trips and a solid rating. Use in-car sales (WiFi, water) for income now. |

**API:** `getDriverCohortProfile()` — returns cohort, advice, and upgrade path for the calling driver.

**Admin/Tier 3:** `getCohortStats()` — returns anonymous counts of drivers in each cohort for competitive intelligence.

---

## Weekly WhatsApp Briefing *(All Tiers — Auto-scheduled)*

Every Monday at 8am SAST, Nduna sends a personalised briefing to every driver who has registered their WhatsApp number. No driver needs to ask — Nduna pushes it proactively.

### Briefing Content

```
🚗 Your MoneyDrive Weekly Briefing

💰 Earnings this week: R[X]

🏆 Your Top 3 Pitch Opportunities:
1. [Company] — [Industry] — [City] 🔥 (Hiring)
2. [Company] — [Industry] — [City]
3. [Company] — [Industry] — [City]

🔥 New this week: [One new hiring company in their area]

📊 Your status: [Cohort] driver • [X] trips this month

Reply /leads for full list • /coach [company] for pitch strategy
```

### Scheduler Rules
- Default: Monday, 8am SAST
- Cooldown: minimum 6 days between sends (prevents duplicate sends)
- Admin can enable/disable via `setWeeklyBriefingEnabled(Bool)`
- Admin can manually trigger via `triggerWeeklyBriefings()` (returns `{ sent: Nat; failed: Nat }`)
- Heartbeat timer: ICP timer fires every 24 hours and auto-triggers if conditions are met

---

## Referral Engine *(All Tiers — Stub)*

Drivers can share a unique referral code with other drivers. When a new driver signs up using the code, the referral is recorded. Bonus amounts are currently set to R0 (TBD by owner) — the engine is live and tracking referrals, but payouts are not automated yet.

### Referral Code Format
`MD-[FIRST3CHARS][4DIGIT_HASH]` — e.g. `MD-TAB1234`

### Current Behaviour
- Every driver gets a unique code via `getMyReferralCode()`
- New drivers can enter a code at signup via `applyReferralCode(code)`
- Referrer sees their stats: `getReferralStats()` → `{ timesUsed, totalEarned, pendingBonus }`
- Bonus amount is R0 until admin configures it via `setReferralConfig()`
- Admin can view the full referral log via `getAllReferrals()`

### When Bonuses Are Decided
Admin runs `setReferralConfig({ enabled: true, bonusPerReferral: 500.0, bonusSource: "revenue_share", minTripsToQualify: 50 })` — all future referrals will show the correct bonus amount in `getReferralStats()`. Manual payment processing happens outside the canister until a payment integration is wired in.

---

## WhatsApp Gateway *(Multi-Channel — All Tiers)*

Drivers can now chat with Nduna directly in WhatsApp — no need to open the MoneyDrive app. The gateway is powered by the 360dialog WhatsApp Business API, routes all messages through the existing Nduna backend, and keeps conversation history in sync with the in-app chat.

### How It Works

1. Driver sends a WhatsApp message to the MoneyDrive business number
2. 360dialog delivers the message to the MoneyDrive backend webhook endpoint
3. Message is parsed (command check → text query → media/file analysis)
4. Nduna processes the message using the same backend logic as in-app chat
5. Response is sent back to the driver via WhatsApp (formatted with WhatsApp markdown)
6. Full conversation history synced to ICP canister — visible in-app and over WhatsApp simultaneously

### Command Shortcuts

| Command | What Nduna does |
|---|---|
| `/leads` | Returns driver's Top 10 companies to pitch this week (from Automated Lead Research) |
| `/coach [company]` | Returns Nduna's personalized pitch strategy for the named company |
| `/status` | Dashboard summary — earnings today/week, top leads, open deals, Nduna tip |
| `/help` | Lists all available commands with descriptions |

### Message Types Supported

- **Text queries** — Any natural language question ("When should I drive tonight?", "What's my earnings this week?")
- **Screenshots / images** — Driver shares a deal offer screenshot → Nduna extracts key terms (company, price, conditions)
- **PDF attachments** — Driver shares a company contract or offer → Nduna summarises key clauses
- **Structured commands** — `/leads`, `/coach`, `/status`, `/help` (see table above)

### Conversation Sync

- Every WhatsApp message and Nduna response is stored in the same canister conversation record as in-app chat
- Driver can switch between WhatsApp and the MoneyDrive app mid-conversation — full history available in both
- Session context is preserved across channels (Nduna remembers the last topic regardless of channel)

### Admin Setup Requirements

| Setting | Description |
|---|---|
| 360dialog API key | Stored securely in backend canister — never exposed to frontend |
| 360dialog webhook URL | Set this in your 360dialog dashboard: `https://[canister-domain]/api/whatsapp/webhook` |
| WhatsApp business number | Assigned by 360dialog — configure in admin panel |
| Media analysis toggle | Enable/disable image and PDF analysis (on by default) |

### Technical Notes

- 360dialog is used (not Twilio) — it is WhatsApp's native BSP, faster to activate, and has no per-message markup beyond the Meta conversation fee (~$0.005–0.08/conversation)
- Rate limiting: 60 messages/minute per driver, enforced in backend
- Fallback: if 360dialog API is unreachable, messages queue for up to 15 minutes before returning an error to the driver
- All message content is stored encrypted in canister — 360dialog does not retain content after delivery

---

## Video Automation Engine *(Tier 2+ upload; Tier 3 auto-post)*

Nduna automates video content creation and posting so drivers can build a personal brand and earn passive income from content — without any manual editing work.

### Workflow

```
Driver uploads raw content
    ↓
FFmpeg smart clipping (silence detection, scene changes)
    ↓
Whisper API auto-captions (styled, keyword-highlighted)
    ↓
MoneyDrive branding overlay (logo, burnt orange/gold palette, CTA)
    ↓
Driver preview — REQUIRED before any post is published
    ↓
Upload-Post API posts to all 4 platforms simultaneously
    ↓
Daily analytics sync (views, likes, shares per clip)
    ↓
Nduna learning loop: high-engagement clips feed back into content recommendations
```

### Content Types Supported

| Content Type | How Nduna Clips It |
|---|---|
| Long podcast (30–60 min) | 5–7 short clips at natural pause points + key quote cards |
| Raw driving footage | Scene-change-based clips; earnings breakdown overlay optional |
| Pitch coaching videos | "Objection handling" clips; how-to format; tip cards |
| Screen recording | Slide-by-slide clips; earnings breakdown breakout clips |
| Earnings reveal | Single "I made R2k in 4 hours" hook clip with breakdown |
| Driver tips | 60s single-topic clips with text overlay and CTA |
| Day-in-life footage | Highlight reel assembly from full footage |

### Smart Clipping (FFmpeg)

- Silence detection removes dead air and filler
- Scene change detection identifies natural breaks
- Maximum clip length: 90 seconds (optimised for TikTok algorithm)
- Hook-first trimming: first 3 seconds must contain a visual or audio hook
- Clips are ranked by predicted engagement before driver review

### Branding Applied Per Clip

- MoneyDrive logo (bottom-right corner watermark)
- Driver name / handle lower-third
- Burnt orange (#D97706) + gold + navy colour scheme
- Call-to-action overlay: "Join MoneyDrive" (or driver's personal referral link if enabled)
- No third-party logos — MoneyDrive branding only

### Captions (Whisper API)

- Full auto-transcription per clip
- Styled captions: key phrases highlighted in burnt orange
- Emoji support for TikTok captions
- Language: English + isiZulu / Afrikaans (detected automatically)
- Confidence threshold: words below 80% confidence shown with `[?]` marker

### Platform Formatting

| Platform | Aspect Ratio | Caption Style | Extras |
|---|---|---|---|
| TikTok | 9:16 | Bold pop-up captions + emoji | Trending hashtag suggestions |
| Instagram Reels | 9:16 | Horizontal caption bar | Hook framing optimised for Reels algorithm |
| YouTube Shorts | 9:16 | YouTube-style subtitle track | Full title + description generated by Nduna |
| LinkedIn | 16:9 | Professional lower-third | Data-driven hook ("I made R20k from my car this month") |

### Driver Preview (Required)

Before any clip is posted, the driver sees a preview player for each clip with:
- Play/pause controls
- Caption review
- "Approve" / "Reject" / "Edit CTA" actions per clip
- Bulk approve all option

**No clip is ever posted without explicit driver approval.** This is a hard requirement, not a preference.

### Posting — Upload-Post API

- Single OAuth connection covers TikTok, Instagram Reels, YouTube Shorts, and LinkedIn
- Posting schedule: 3× per week by default (Monday, Wednesday, Friday — adjustable in settings)
- Immediate post option available after driver approval
- If a platform's API is temporarily unavailable, that platform's post is queued and retried automatically within 6 hours

### Analytics (Daily Sync)

- Views, likes, shares, and comments pulled daily per clip from all 4 platforms
- Aggregated in Nduna's analytics store in canister
- Nduna identifies top-performing clip types and surfaces insights: "Your earnings breakdown clips get 3× more shares than driving footage"
- Monthly analytics feed into Nduna's content recommendations

### Nduna Learning from Video Analytics

Analytics data flows back into Nduna's recommendation engine:
- Which content formats get most engagement per platform
- Which hooks (first 3 seconds) retain viewers
- Which topics (earnings, pitching, driving tips) perform per driver's audience
- Nduna uses this to recommend what raw content to record next

### Admin Setup Requirements

| Setting | Description |
|---|---|
| Upload-Post API key | Stored securely in backend canister |
| Whisper API key | Backend-only — used for all caption generation |
| Platform OAuth tokens | Connected once via Upload-Post OAuth flow |
| Default posting schedule | Configurable per driver (default: Mon/Wed/Fri) |
| Branding assets | MoneyDrive logo served from canister; no external CDN dependency |

---

## Parked / Future Capabilities

### MiroShark — Multi-Agent Pitch Simulation *(Phase 3 / VPS era — PARKED)*
- MiroShark simulates how a company's marketing team would respond to a pitch
- Requires Neo4j + Python 3.11 + Docker — not deployable on ICP canisters today
- AGPL-3.0 license requires commercial agreement for production use
- Will be integrated when Contabo VPS is provisioned
- **Planned use:** Tier 3 "Stress Test Your Pitch" feature — feed PDF to MiroShark, get objection simulation before sending

### presentation-ai *(PARKED — incompatible stack)*
- GitHub: `allweonedev/presentation-ai`
- Runs on Next.js + PostgreSQL — neither compatible with ICP canister deployment
- Replaced by native **Nduna Presentation Builder** (see above) which delivers the same capability natively using OpenRouter

### NotebookLM *(PARKED — closed product)*
- Google's proprietary closed-source product — not self-hostable
- No API available for integration
- Parked indefinitely

### VisionCaptioner *(PARKED — irrelevant to driver workflows)*
- GitHub: `Brekel/VisionCaptioner`
- Desktop tool for live AI-powered video captioning
- Not relevant to advertising pitch workflows or driver income tools
- Parked indefinitely

### SocratiCode *(PARKED — developer tool, not driver feature)*
- GitHub: `giancarloerra/SocratiCode`
- An MCP plugin that gives AI coding assistants deep codebase understanding (dependency graphs, code search)
- This is a **developer workflow tool** — it helps the AI build MoneyDrive faster, but it is not a driver-facing feature
- Not deployed in the app; parked as a dev tool

---

## Technical Architecture

| Layer | Technology |
|---|---|
| Persistent memory | ICP canister stable storage |
| AI inference | OpenRouter (free models: Mistral, Gemma, Llama, DeepSeek, Qwen) |
| Web search | Tavily MCP |
| Custom MoneyDrive skills | FastMCP |
| Voice output | ElevenLabs API (mJZEpDe9qAKz9yOOwCD8) |
| Traffic data | Google Maps API + TomTom API |
| Automated lead research | Camofox browser automation (user-managed infrastructure) |
| Presentation generation | OpenRouter (same connection as Nduna inference) |
| WhatsApp gateway | 360dialog WhatsApp Business API |
| Video clipping | FFmpeg (smart silence + scene detection) |
| Video captions | Whisper API (auto-transcription, styled) |
| Video posting | Upload-Post API (unified OAuth: TikTok, Reels, Shorts, LinkedIn) |
| Future hybrid hosting | Contabo VPS (planned, not yet provisioned) |

---

## Access Tiers

| Feature | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Basic recommendations | ✓ | ✓ | ✓ |
| Competitive Intelligence | — | ✓ | ✓ |
| Geolocation exposure (passenger-only) | ✓ | ✓ | ✓ |
| Geolocation traffic intelligence | — | ✓ | ✓ |
| Automated Lead Research (Camofox) | — | ✓ | ✓ |
| WhatsApp Gateway (Nduna over WhatsApp) | ✓ | ✓ | ✓ |
| Video upload + clip preview | — | ✓ | ✓ |
| Video auto-post (Upload-Post API) | — | — | ✓ |
| Smart Recommendations | — | — | ✓ |
| Personalized Pitch Strategy | — | — | ✓ |
| Nduna's Strategy in PDF | — | — | ✓ |
| Nduna Presentation Builder | — | — | ✓ |
| MiroShark pitch simulation | — | — | Phase 3 |

---

## Context Files

- `CONTEXT.md` — Driver-specific context loaded into each Nduna session: driver profile block, WhatsApp gateway context, video automation analytics context, platform constraints, parked tools summary, and implementation history
- `HERMES.md` — Nduna's underlying agent skill definitions and system behaviours (13 skills covering earnings, geolocation, lead research, WhatsApp command handling, and video analytics)

---

## Crypto Skills

Nduna has the following crypto skills installed to help drivers navigate savings, stablecoins, and blockchain payments. These are conversational knowledge skills — Nduna uses them when drivers ask about MiniPay, USDC, crypto savings, or making transactions.

### x402 (HTTP 402 Payment Protocol)
Nduna understands the x402 protocol for autonomous per-call USDC micropayments. When API calls return HTTP 402, Nduna can explain what payment is needed and guide drivers through it. Wired to Orbis API calls. Skill file: `.claude/skills/x402.md`

### CoinGecko
Nduna can access live USDC/ZAR and ICP/USD exchange rates. The MiniPay savings calculator uses the live USDC/ZAR rate from CoinGecko (backend HTTP outcall, 10-minute cache). Nduna cites current rates when advising on savings timing. Skill file: `.claude/skills/coingecko.md`

### CoinMarketCap
Nduna can reference the Fear & Greed index and USDC market stability when giving savings advice. "Market is fearful" signals good savings conditions. Nduna validates USDC stability before recommending deposits. Requires CMC API key in admin Settings → Crypto Intelligence. Skill file: `.claude/skills/coinmarketcap.md`

### Circle USDC
Nduna knows exactly how USDC works — on-ramp from Valr/Luno, off-ramp back to ZAR, why it protects against rand weakness, and how it connects to MiniPay. Nduna uses plain SA language: "a digital dollar that holds its value even when the rand drops." Skill file: `.claude/skills/circle-usdc.md`

### Brian API
Nduna uses Brian API patterns to generate step-by-step blockchain transaction guides in plain SA language. When a driver says "save R500 in MiniPay" or "how do I get my money out?", Nduna generates a clear, numbered action plan. Requires Brian API key in admin Settings → Crypto Intelligence. Skill file: `.claude/skills/brian-api.md`

---

## Skill: Lean Verbalized Sampling (LVS)

**File:** `.claude/skills/SKILL-LVS.md`
**Stacks with:** Minto Pyramid Principle

Nduna uses LVS for all high-stakes outputs — pitch decks, campaign proposals, income
strategy recommendations, and Opportunity Hunter prioritisation. LVS runs internally:
5 angles evaluated, best selected, then structured with Minto. The driver sees only the
final response — never the distribution.

**Activation triggers:** pitch deck, presentation, campaign, marketing proposal,
income strategy, monthly analysis, wealth, opportunity hunter, investment, passive income,
staking, minipay strategy.
