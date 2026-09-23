# MoneyDrive Skills & Design Systems Index

This index catalogs all installed open-design skills and design system references for MoneyDrive's build pipeline and Nduna's context.

**Source repository**: [nexu-io/open-design](https://github.com/nexu-io/open-design)  
**Installation date**: 2026-04-29  
**Location**: `src/frontend/src/skills/`

---

## Skill Files (UI Layout Patterns)

These SKILL.md files define how to produce specific UI layout archetypes as self-contained HTML prototypes. Nduna uses these when generating website drafts, driver landing pages, or campaign preview pages.

| File | Skill Name | Best For | Key Output |
|------|-----------|----------|------------|
| `open-design-dashboard.md` | Dashboard | Admin panels, analytics, control centers | Fixed sidebar + KPI cards + inline SVG charts |
| `open-design-mobile.md` | Mobile App | Phone screen mockups, driver app previews | iPhone 15 Pro framed HTML screen |
| `open-design-pricing.md` | Pricing Page | Subscription tier pages, plan comparison | Hero + plan cards + comparison table + FAQ |
| `open-design-saas-landing.md` | SaaS Landing | MoneyDrive marketing page, pilot recruitment | Hero + features + social proof + pricing + CTA |
| `open-design-docs.md` | Docs Page | Driver manual, API docs, Nduna integration guide | 3-column docs layout (nav + article + TOC) |
| `open-design-blog.md` | Blog Post | Driver success stories, income tips, SA gig economy | Editorial long-form article |
| `open-design-prototype.md` | Web Prototype | Quick marketing mock-ups, pilot onboarding flows | General single-page HTML prototype |

### How Nduna Uses Skills

When a driver (or admin) asks Nduna to **"build a website"** or **"create a campaign page"**, Nduna:
1. Reads the relevant SKILL.md for the requested page type
2. Reads the active `DESIGN.md` (the MoneyDrive design system)
3. Follows the skill's Workflow steps exactly
4. Produces a single self-contained HTML file
5. Publishes via here.now for free permanent hosting

---

## Design System Files (Visual Reference)

These DESIGN.md files document production design systems from well-known products. They serve as visual and structural references when building MoneyDrive UI components, designing Nduna-generated content, and making design decisions.

| File | System | Mood | Best Applied To |
|------|--------|------|----------------|
| `design-elevenlabs.md` | ElevenLabs | Light, airy, audio-aesthetic | Voice interfaces, Nduna conversation UI, audio recording screens |
| `design-linear.md` | Linear | Dense, dark, keyboard-first | Admin panels, fleet dashboard, analytics, lead management tables |
| `design-vercel.md` | Vercel | Precise, minimal, developer-grade | Marketing pages, documentation, campaign preview cards |
| `design-supabase.md` | Supabase | Dark-native, code-adjacent, emerald | Overall MoneyDrive architecture reference (closest structural match) |

### Design System Cross-Reference for MoneyDrive

| MoneyDrive Screen | Reference Design System | Key Principles to Apply |
|-------------------|------------------------|------------------------|
| Nduna Chat / Voice | ElevenLabs | Whisper-thin typography, warm shadows, audio-waveform aesthetics |
| Fleet Dashboard | Linear | Row-based density, compact 36px rows, subtle hover states |
| Admin Analytics | Linear | KPI cards, chart density, sidebar navigation pattern |
| Marketing Landing | Vercel | Shadow-as-border, negative letter-spacing, gallery whitespace |
| Earnings Tracker | Supabase | Dark borders for depth, HSL alpha tokens, code-adjacent labels |
| eTavern Forum | Supabase | Dark-native, border hierarchy, minimal shadows |
| Subscription Pricing | Vercel + Pricing skill | Multi-layer shadow cards, tier comparison table |
| Driver Website Builder | SaaS Landing skill | Hero + features + social proof flow |

---

## MoneyDrive Brand Constants

Always apply these when using any skill or design system:

| Token | Value | Use |
|-------|-------|-----|
| Primary | Burnt orange (`--color-primary`) | CTAs, active states, highlights |
| Secondary | Gold (`--color-secondary`) | Supporting accents, earnings numbers |
| Background | Navy dark (`--color-background`) | All page backgrounds |
| Card | Deep navy (`--color-card`) | Card surfaces, sidebar |
| Foreground | Near-white (`--color-foreground`) | Primary text |
| Muted | Warm mid-gray | Secondary text, metadata |

**Typography**: `font-display` for headings, `font-body` for UI text, `font-mono` for numbers/code.

**Greeting**: Always "Hola 7!" — never "Hello Driver" or "Welcome".

**Nduna voice**: Male, SA-local, direct. Minto Pyramid Principle: answer first, then why, then detail.

**Pilot mode**: When `pilotMode === true`, show "Free 90-day pilot" copy on all pricing surfaces. Tier 1 and Tier 2 = R0.00. Tier 3 = R800/mo.

---

## Missing Files

| Requested | Status | Notes |
|-----------|--------|-------|
| `design-linear.md` | ⚠️ Reconstructed | Upstream 404 at `nexu-io/open-design/design-systems/linear/DESIGN.md`. File written from Linear's documented design system. |

---

## Skill Usage Quick Reference

```
User says: "Build me a landing page for MoneyDrive"
→ Use: open-design-saas-landing.md
→ Reference: design-vercel.md (precision) + MoneyDrive brand constants

User says: "Create an admin dashboard"  
→ Use: open-design-dashboard.md
→ Reference: design-linear.md (density) + design-supabase.md (dark theme)

User says: "Show me a mobile screen for the earnings tracker"
→ Use: open-design-mobile.md (archetype A — Feed)
→ Reference: design-supabase.md (dark, data-dense)

User says: "Build a pricing page"
→ Use: open-design-pricing.md
→ MoneyDrive tiers: Tier 1 R350/mo, Tier 2 R530/mo, Tier 3 R800/mo
→ Pilot mode: Tier 1+2 = R0.00 when pilotMode === true

User says: "Write a blog post about in-car advertising"
→ Use: open-design-blog.md
→ SA-localized voice, 600+ words, real MoneyDrive content

User says: "Create a driver manual page"
→ Use: open-design-docs.md
→ Fetch live from: https://github.com/youngstunners88/MoneyDrive-Manual
→ Reference: design-linear.md (left nav pattern)
```
