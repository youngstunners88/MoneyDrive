# MoneyDrive

**Earnings Optimization + Income Expansion System for South African Rideshare Drivers**

URL: https://moneydriver-2oj.caffeine.xyz/

---

## What is MoneyDrive?

MoneyDrive is a professional command centre built exclusively for Uber, Bolt, and InDrive drivers in South Africa. Its mission is to directly increase driver income and create new income streams — not a generic chatbot or analytics dashboard.

Built on the Internet Computer (ICP) blockchain for privacy, security, and global scalability.

---

## Key Features

### Earnings & Expense Management
- Animated earnings tracker with ZAR currency support
- Trip logging (fare, distance, platform)
- Expense tracker (fuel, maintenance, vehicle costs)
- Fuel consumption calculator
- Offline mode — full sync when back online

### Subscription Tiers
| Tier | Name | Price | Key Benefits |
|------|------|-------|-------------|
| 1 | Hustler | R350/month | Earnings tracker, expense tools, event calendar, 7-day free trial |
| 2 | Grinder | R530/month | In-car sales system, QR code menu, SnapScan payments, schedule planner |
| 3 | Boss | R800/month | AI advisor (Nduna), lead research, advertising pipeline, pitch deck builder |

### In-Car Sales System (Tier 2+)
Drivers can sell products directly to passengers via a QR code menu:
- WiFi hotspot (R5)
- Water (R15)
- Mints/Candy (R2–R5)
- Perfume Shot (R10)
- Wet Wipes (R5)
- PowerBank Charging (R5–R10)
- First Aid kit (R15)
- Towel (R10)

*Note: Bolt drivers may only conduct in-car sales after trips end, not during trips.*

Payment accepted via SnapScan QR code. Drivers can link their own merchant SnapCode for direct passenger payments.

### AI Advisor — Nduna (Tier 3)
Nduna is MoneyDrive's persistent AI advisor — a male persona with deep South African knowledge. He:
- Provides personalised earnings optimization advice
- Identifies advertising deal opportunities
- Learns from driver data and outcomes
- Responds via voice (ElevenLabs) and text
- Available via WhatsApp and Telegram

### Advertising Deal Pipeline (Tier 3)
- Automated lead research (top 10 SA companies per week)
- Company enrichment via WHOIS, Hunter.io, hiring signals
- Pitch deck generator with geolocation/traffic intelligence
- Interactive presentation builder
- Follow-up reminders and deal analytics
- WhatsApp/Telegram gateway for deal management

### Smart Event Calendar
- Weekly auto-refresh from SA event sites
- Surge pricing opportunities highlighted
- Honest placeholders when no data is available — no fake events

### Driver Wealth Academy
Financial education resources:
- Rich Dad Poor Dad (richandpoordads.org)
- Alex Hormozi (YouTube)
- Myron Golden (YouTube)
- The Rich Dad Channel (YouTube)
- Vusi Thembekwayo (YouTube)
- Trillion Dollar Man (YouTube)

### ICP Staking & Crypto Education
- ICP staking guides
- Live ICP price via CoinGecko
- Plug Wallet, Coinbase, NNS guides

### Referral Engine
- R50 per successful referral
- Credits applied automatically to next subscription
- Visible in driver profile

---

## Authentication

MoneyDrive uses **Internet Identity** — ICP's blockchain-based identity system. No email, no password. Privacy-first authentication.

- Identity provider: https://identity.ic0.app
- No personal data stored on external servers

---

## API / Agent Access

AI agents can interact with MoneyDrive via WebMCP tools registered on page load:

| Tool | Access | Description |
|------|--------|-------------|
| `check_earnings` | Tier 1+ | Get driver total earnings and trip count |
| `check_subscription_tier` | Tier 1+ | Get current subscription tier |
| `view_events` | Tier 1+ | List upcoming SA events for surge pricing |
| `view_leads` | Tier 3 only | List weekly advertising leads |
| `query_nduna` | Tier 3 only | Ask Nduna AI advisor a question |

### Discovery Endpoints
- MCP Server Card: `/.well-known/mcp/server-card.json`
- API Catalog: `/.well-known/api-catalog`
- Agent Skills: `/.well-known/agent-skills/index.json`
- OAuth Protected Resource: `/.well-known/oauth-protected-resource`
- OpenID Configuration: `/.well-known/openid-configuration`
- ACP Commerce: `/.well-known/acp.json`

---

## Legal

- Terms & Conditions: https://moneydriver-2oj.caffeine.xyz/terms
- Refund & Returns Policy: https://moneydriver-2oj.caffeine.xyz/refund

---

## Contact & Support

For support, billing, or account help: [caffeine.ai](https://caffeine.ai)

---

*Built with ❤️ for SA drivers. Powered by the Internet Computer.*
