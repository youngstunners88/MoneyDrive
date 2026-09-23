---
name: saas-landing
description: |
  Single-page SaaS landing with hero, features, social proof, pricing, and CTA.
  Respects the active DESIGN.md color/typography/layout tokens.
  Trigger keywords: "saas landing", "marketing page", "product landing".
triggers:
  - "saas landing"
  - "marketing page"
  - "product landing"
od:
  mode: prototype
  platform: desktop
  scenario: marketing
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  inputs:
    - name: product_name
      type: string
      required: true
    - name: tagline
      type: string
      required: true
    - name: has_pricing
      type: boolean
      default: true
    - name: proof_count
      type: integer
      default: 3
      min: 0
      max: 6
  parameters:
    - name: hero_density
      type: spacing
      default: 96
      range: [48, 200]
    - name: accent_strength
      type: opacity
      default: 1.0
      range: [0.5, 1.0]
  outputs:
    primary: index.html
  capabilities_required:
    - file_write
---

# SaaS Landing Skill

Produce a single-page SaaS landing. Agent, follow this workflow exactly.

## 1. Read context

Before writing anything:
- Read `DESIGN.md` in the current working directory. If missing, stop and ask for one.
- Identify the color palette, typography tokens, and layout principles.
- Note the "Agent Prompt Guide" section — it overrides any instruction here if they conflict.

## 2. Plan sections

Required sections, in order:
1. **Hero** — logo-or-wordmark, headline (tagline input), subhead (1–2 sentences), primary CTA, secondary CTA. Use the hero_density parameter as vertical padding in px.
2. **Features** — 3–6 feature tiles. Each: icon, short title, 1–2 sentence body.
3. **Social proof** — `proof_count` logos or testimonials. If 0, skip this section.
4. **Pricing** — 2–3 tiers. Include only if `has_pricing` is true.
5. **Footer CTA** — large accent-colored band with one-button call to action.
6. **Footer** — minimal: links + copyright.

## 3. Apply design system

- All colors must come from DESIGN.md tokens. Do not invent hex values.
- Typography: use the declared display font for headlines, body font for everything else.
- Layout: respect the grid, max-width, and section spacing rules.
- Components: use declared button/card/input patterns. Do not add shadows if DESIGN.md's Depth & Elevation says minimal.
- Accent: use the accent color only once in the hero, once in the footer CTA, and for all links. Do not flood the page.

## 4. Write the file

Output a single self-contained `index.html` with:
- All CSS inlined in a `<style>` block in `<head>`.
- System font fallbacks if DESIGN.md fonts aren't loadable from Google Fonts etc.
- No external JS.
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`).
- Each editable element tagged with `data-od-id="<unique-slug>"` so the host app's comment mode can target it.

## 5. Self-check

Before finishing, verify:
- [ ] All text is content-meaningful, not lorem ipsum (use product_name and tagline inputs; generate plausible specific copy for the rest).
- [ ] No broken color references (every CSS color value is in DESIGN.md's palette or a valid alpha/fallback variant).
- [ ] Responsive breakpoints match DESIGN.md's Responsive Behavior section.
- [ ] The page looks good at 1440w, 768w, and 375w (mentally simulate).
- [ ] Accent used no more than twice total.

## 6. Done

Write only `index.html`. Do not generate a separate CSS file, JS file, or README.

---

## MoneyDrive Usage Notes

**Product name**: MoneyDrive  
**Tagline**: "The AI co-pilot that turns every trip into a business."  
**Subhead**: "Built for SA ride-hailing drivers. Nduna finds advertising clients, manages in-car sales, tracks your money — all from your phone."

**Hero CTA**: "Start Free Pilot" → links to `/signup`  
**Secondary CTA**: "See how it works" → scrolls to features

**Feature tiles** (6 recommended):
1. Nduna AI Agent — "Your personal AI co-pilot learns your hustle and finds companies to pitch"
2. In-Car Sales — "Sell products to passengers with a driver-specific SnapScan QR"
3. Earnings Tracker — "See every rand earned across Uber, Bolt, and InDrive in one view"
4. Advertising Broker — "Nduna pitches companies on paying for ad space in your vehicle"
5. Fleet Dashboard — "Manage up to 5 vehicles, track income per car, see your fleet at a glance"
6. MiniPay Savings — "Save in stablecoins through MiniPay — no bank account needed"

**Social proof** (3): Use fictional but SA-plausible testimonials from Uber drivers in Cape Town, Bolt driver in Joburg, InDrive driver in Durban.

**Pricing**: 3-tier, ZAR, SnapScan payment. Reference pricing skill for details.

**Dark theme**: Burnt orange primary, gold accent, navy background. SA energy throughout.
