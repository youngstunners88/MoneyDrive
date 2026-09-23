# Design Brief: MoneyDrive — Messaging Gateway + Video Automation Engine

## Direction

MoneyDrive SA — Command center for South African rideshare drivers, blending township energy with professional fintech polish. Warm earth tones (gold, burnt orange, rust red) on deep navy backgrounds. Features: WhatsApp messaging gateway (Nduna chat integration), video automation engine (auto-clip, auto-post), Camofox lead research, and Nduna presentation builder.

## Tone

Bold, grassroots-professional. Energetic yet trustworthy. Messaging feels real-time and immediate, video tools feel like having a personal content team. Lead cards speak directly to the driver. Presentation decks feel premium. Accessibility and ease-of-use prioritized for mobile-first drivers.

## Differentiation

**Messaging Gateway** (Pro tier): WhatsApp/Telegram chat with Nduna. Command shortcuts (/leads, /coach, /status, /help). Real-time sync status, error recovery. Frictionless driver engagement.

**Video Engine** (Elite tier): Drag-drop upload, auto-clip detection, multi-platform posting (TikTok, Instagram, YouTube, LinkedIn). Preview carousel, analytics dashboard, schedule picker. Passive income automation.

**Lead Research + Presentation Builder**: Weekly company discovery + data-driven pitch decks (Layer 3 foundation).

## Color Palette

| Token            | OKLCH              | Role                              |
|------------------|-------------------|-----------------------------------|
| background       | 0.08 0.01 85      | Deep navy page background         |
| foreground       | 0.96 0.005 85     | High-contrast text                |
| card             | 0.12 0.01 85      | Warm card surface                 |
| primary          | 0.75 0.12 85      | Gold CTAs & highlights            |
| accent           | 0.75 0.12 85      | Gold secondary accents            |
| success          | 0.55 0.14 145     | Forest green earnings/gains       |
| destructive      | 0.52 0.20 20      | Rust red alerts & deletions       |
| burnt-orange     | 0.60 0.22 35      | Peak earning time badges          |
| rust-red         | 0.50 0.18 15      | Warning/secondary alerts          |
| border           | 0.22 0.02 85      | Warm subtle borders               |
| msg-connected    | 0.55 0.14 145     | WhatsApp/Messaging online status  |
| msg-disconnected | 0.52 0.20 20      | Messaging error/offline state     |
| video-tiktok     | 0.00 0.00 0       | TikTok platform badge             |
| video-instagram  | 0.60 0.18 315     | Instagram Reels platform badge    |
| video-youtube    | 0.55 0.18 25      | YouTube Shorts platform badge     |
| video-linkedin   | 0.50 0.18 230     | LinkedIn video platform badge     |

## Typography

- Display: BricolageGrotesque — bold, energetic headings & hero text with weight hierarchy (200–800)
- Body: Satoshi — warm, readable, professional body copy & UI labels
- Mono: JetBrains Mono — technical labels, timestamp strings, code snippets
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl font-bold tracking-tight`, label `text-sm font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered card hierarchy. Shadows: `shadow-card` for standard cards. Section alternation: `bg-card` and `bg-muted/30`.

## Structural Zones

| Zone    | Background | Border | Notes |
|---------|------------|--------|-------|
| Header | `bg-card` | `border-burnt-orange/20` | Warm accent border |
| Messaging | `bg-card` | success/error border | Sync status, command grid |
| Upload | dashed `border-gold` | hover: `border-gold/40` | Active: `bg-gold/8` |
| Video Carousel | `bg-navy` | — | 9:16 aspect, overlay gradient |
| Analytics | `bg-card` grid | `border-border` | Charts + platform badges |
| Schedule | `bg-card` | `border-border` | Frequency, time, platforms |
| Footer | `bg-muted/50` | `border-border` | Disclaimers |

## Spacing & Rhythm

Section gaps 2–3rem, card stacking (0.75rem radius), micro-spacing 0.25–0.5rem. Stagger animations 80ms offsets.

## Component Patterns

- **Messaging**: `.messaging-status-indicator` (connected/disconnected/pending), `.message-sync-card`, `.command-shortcuts-grid`
- **Video**: `.drag-drop-zone`, `.upload-progress-bar`, `.clip-carousel` (9:16), `.analytics-card` grid, `.schedule-picker`, `.platform-badge`
- **Leads**: `.lead-card`, `.lead-score`, `.lead-status-badge`
- **Slides**: `.slide-container` (16:9), `.slide-nav-button`, `.slide-dots`
- **Buttons**: gold primary, burnt-orange secondary, rust-red destructive
- **Badges**: success (green), error (rust-red), platform (multi-color)

## Motion & Interactions

Entrance: `animate-fade-up` stagger 80ms. Sync pulsing dot. Upload progress bar animated. Hover: `card-hover-lift`, button `opacity-90`. Carousel nav dots (gold active). Toast on change.

## Data Schema & Integration

**Motoko Types:** Message (driverId, content, status, timestamp), MessageSync (lastSyncTime, status, error?), CommandShortcut, VideoUpload (id, driverId, rawFile, status, duration), AutoClip (id, startTime, endTime, title, thumbnail), VideoAnalytics (views, likes, shares, platform), ScheduleConfig (frequency, time, platforms), + existing NdunaRecommendation, CamofoxLead, PresentationDeck, Slide

**Frontend→Backend:** Messaging: `sendMessage()`, `syncMessages()`, `executeCommand()` | Video: `uploadVideo()`, `autoClipVideo()`, `publishClip()`, `getAnalytics()`, `schedulePost()` | Leads: `getCamofoxLeads()`, `refreshLeads()` | Presentations: `createPresentationDeck()`, `shareDeck()`

## Feature Build Guidance

**Messaging** (Pro): `WhatsAppGateway.tsx`, `MessageSyncStatus.tsx`, `CommandShortcuts.tsx` + `.messaging-status-indicator`, `.message-sync-card`, `.message-error-state`, `.command-shortcuts-grid`

**Video** (Elite): `VideoUpload.tsx`, `ClipCarousel.tsx`, `AnalyticsDashboard.tsx`, `SchedulePicker.tsx` + `.drag-drop-zone`, `.upload-progress-bar`, `.clip-carousel`, `.analytics-card`, `.schedule-picker`, `.platform-badge`

**Leads**: `CamofoxLeadList.tsx` + `.lead-card`, `.lead-score`, `.lead-status-badge` | **Presentations**: `NdunaPresentationBuilder.tsx` + `.slide-container`, `.slide-nav-button`, `.slide-dots`

**Document Vault** (Tier 2+): `DocumentVaultPage.tsx`, `DocumentUploadZone.tsx`, `DocumentList.tsx`, `DocumentCard.tsx` + `.drag-drop-zone`, `.document-card`, `.document-status-badge`, `.upload-progress-bar` | Reuse gold/burnt-orange accents

**Opportunities** (Tier 3): `OpportunitiesPage.tsx`, `OpportunityCard.tsx`, `ScanResultsList.tsx` + `.lead-card` (adapted), `.lead-score` (for opportunity score), gold highlights, stagger animations | Autonomous browser scan results: new platforms, routes, promotions, hiring signals
