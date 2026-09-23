## MoneyDrive

Earnings Optimization + Income Expansion System for professional Uber and Bolt drivers.

Built on the Internet Computer (ICP) blockchain. South Africa–first, designed for global scale.

---

## What MoneyDrive Does

MoneyDrive helps professional rideshare drivers make more money — not through generic advice, but through real data, persistent AI memory, and direct income stream creation.

**Core value proposition:**
1. You log trips → Nduna learns your patterns → Nduna tells you when and where to drive
2. You scan a QR code menu → passengers buy products in your car → you earn between fares
3. You generate a pitch deck → you approach MTN, FNB, Vodacom → you close R10k–R50k/month car-wrap deals
4. Nduna gets smarter every month based on what actually worked

---

## Features

### Tier 1 — Hustler (R350/month, 7-day free trial)
- Dashboard command centre
- Full earnings tracker
- Expense & fuel logging
- Voice commands (500 char/month browser trial)
- Smart event calendar

### Tier 2 — Pro Driver (R530/month)
- Everything in Hustler
- In-Car Sales tracker (QR code passenger menu)
- QR code passenger-facing menu (WiFi, Water, Mints, Perfume Shot, Dash Cam Show)
- Shift scheduling
- Full ElevenLabs AI voice (unlimited)
- Weekly earnings charts
- **Competitive Intelligence Dashboard** (anonymous SA driver leaderboard)

### Tier 3 — Elite Driver (R800/month)
- Everything in Pro Driver
- **Nduna** — persistent AI with full memory and analytics
- **Smart Recommendation Engine** — Nduna's top company matches weekly
- **Personalized Pitch Strategy** — AI-generated pitch language per company
- **Geolocation Intelligence in PDF** — traffic exposure data in pitch decks
- Advanced analytics and AI insights
- Gold Elite badge
- Priority AI voice
- Priority support

---

## Layer 3 Amplifiers

The "moat" — features that get more valuable as more drivers use MoneyDrive.

### ✅ Geolocation Intelligence (Phase 1 — Built)

Integrates Google Maps API + TomTom API to calculate real traffic exposure for driver routes.

**How it works:**
- Driver selects their primary SA zone (Sandton, Johannesburg CBD, Cape Town CBD, etc.)
- Backend calls traffic APIs to get daily vehicle + pedestrian counts for that zone
- Exposure calculation: `daily vehicles × trips × visibility window`
- Monthly total exposure shown in pitch deck alongside ROI vs. billboard comparison
- If APIs unavailable: conservative zone-based fallback with confidence score

**In PDF:** Adds "Exposure Intelligence" section (Tier 2+) and "ROI Comparison" box showing how much more efficient the driver's car is vs. a local billboard.

### ✅ Competitive Intelligence Dashboard (Tier 2+)

Anonymous network leaderboard showing how SA drivers are performing as a group.

**What drivers see:**
- Deals closed this month by city (with gold medal for #1 city)
- Most responsive companies (response rate bar, avg deal value, success count)
- Network stats: total drivers, network surge accuracy
- Driver's own rank in their city vs. peers
- All data 100% anonymised — no individual driver identifiable

**Why it matters:** FOMO drives action. When a Sandton driver sees "3 FNB deals closed in their city this month," they pitch.

### ✅ Smart Recommendation Engine (Tier 3)

Nduna proactively surfaces the top 3 company pitch opportunities each week.

**Scoring model considers:**
- Driver's primary zone vs. company's target market
- Monthly trip volume and exposure metrics
- Historical network success rates for the company
- Time since last pitch attempt
- Urgency (companies currently active in the network get "Hot opportunity" badge)

**Each card includes:**
- Match score (0–100) with confidence bar
- Pre-written pitch opening line
- Supporting data point ("3 drivers in Sandton closed this company last month")
- Estimated deal value range
- "Generate Pitch" button — pre-fills and scrolls to PDF generator

### ✅ Personalized Pitch Strategy (Tier 3)

Auto-generated pitch language in Nduna's Strategy panel and PDF.

- Tailored to driver's zone, trip count, and exposure data
- Company-specific language when company name is known
- 5 strategy lines: value framing, company rationale, peak data lead, recommended approach, follow-up timeline
- Updated monthly as Nduna learns from real deal outcomes

---

## Planned Phase 2 Amplifiers

### 🗓 Partnership Data Marketplace (Planned)
- After 100+ network pitches: sell anonymised aggregate insights to advertisers (e.g. "Here's what messaging converted with SA rideshare audiences")
- B2B revenue stream on top of driver subscriptions

### 🗓 Driver Cohort Analysis (Planned)
- Group drivers by success archetype: Power Earner (200+ trips, 4.8+), Growth Driver (100–200 trips), New Driver
- Nduna gives hyper-targeted advice per cohort
- Predictive models for deal closure likelihood

### 🗓 Referral Engine (Planned)
- Drivers who close advertising deals get a referral link
- When a referred driver closes any deal, referrer earns R500
- Network effect: successful drivers become MoneyDrive's sales team

---

## Parked Features

### 🚫 MiroShark (Phase 3 / VPS era — PARKED)

MiroShark is a multi-agent simulation engine. You feed it a document (like a pitch deck), and it generates AI personas that simulate how the target audience would react.

**Use case for MoneyDrive:** "Stress Test Your Pitch" — feed PDF to MiroShark, get an MTN marketing manager simulation before sending.

**Why it's parked:**
- Requires Neo4j + Python 3.11 + Docker — cannot run on ICP canisters
- AGPL-3.0 license requires commercial agreement for closed-source production use
- Contabo VPS needed first (not yet provisioned)
- Revisit in Phase 3 when VPS is running

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS (OKLCH design system) |
| Backend | Motoko on Internet Computer Protocol (ICP) |
| Auth | Internet Identity (blockchain-based, no passwords) |
| AI | OpenRouter (Mistral, Gemma, Llama, DeepSeek, Qwen — free models) |
| Voice | ElevenLabs API (Voice ID: mJZEpDe9qAKz9yOOwCD8) |
| Web search | Tavily MCP |
| Custom skills | FastMCP |
| Traffic data | Google Maps API + TomTom API |
| Payments | Stripe (subscriptions) + SnapScan (in-car passenger payments) |
| Storage | ICP canister stable storage (on-chain, persistent) |

---

## Design System

- **Colours:** Gold (#FFD700), Forest Green (#1A6B2A / #228B22), Burnt Orange (#D85A30), Navy (#0F1419), Off-White (#F5F4F0)
- **Typography:** Font-display for headings, Font-body for copy
- **Theming:** OKLCH colour tokens, dark-mode first
- **Mobile-first:** All components built mobile-first, WCAG 2.1 AA accessible

---

## Key Agent Files

- `NDUNA.md` — Nduna's identity, capabilities, tier access, and learning loop configuration
- `HERMES.md` — Nduna's underlying skill definitions (Earnings Snapshot, Surge Detector, Geolocation Exposure Analysis, Competitive Intelligence Reading, Company Scoring, Personalized Pitch Strategy, etc.)

---

## Market Focus

South Africa first (ZAR pricing, SA cities: Johannesburg, Sandton, Durban, Pretoria, Cape Town).
Global expansion architecture in place — currency, city, and zone systems are parameterised.

---

This source code has been exported from [Caffeine](https://caffeine.ai/)
