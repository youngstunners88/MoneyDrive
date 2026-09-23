# Design System Inspired by Supabase

> Category: Backend & Data  
> Open-source Firebase alternative. Dark emerald theme, code-first.  
> Source: https://supabase.com

## 1. Visual Theme & Atmosphere

Supabase's website is a dark-mode-native developer platform that channels the aesthetic of a premium code editor — deep black backgrounds (`#0f0f0f`, `#171717`) with emerald green accents (`#3ecf8e`, `#00c573`) that reference the brand's open-source, PostgreSQL-green identity. The design system feels like it was born in a terminal window and evolved into a sophisticated marketing surface without losing its developer soul.

The typography is built on "Circular" — a geometric sans-serif with rounded terminals that softens the technical edge. At 72px with a 1.00 line-height, the hero text is compressed to its absolute minimum vertical space, creating dense, impactful statements that waste nothing. The monospace companion (Source Code Pro) appears sparingly for uppercase technical labels with 1.2px letter-spacing, creating the "developer console" markers that connect the marketing site to the product experience.

What makes Supabase distinctive is its sophisticated HSL-based color token system. Rather than flat hex values, Supabase uses HSL with alpha channels for nearly every color (`--colors-crimson4`, `--colors-purple5`, `--colors-slateA12`), enabling a nuanced layering system where colors interact through transparency. This creates depth through translucency — borders at `rgba(46, 46, 46)`, surfaces at `rgba(41, 41, 41, 0.84)`, and accents at partial opacity all blend with the dark background to create a rich, dimensional palette from minimal color ingredients.

The green accent (`#3ecf8e`) appears selectively — in the Supabase logo, in link colors (`#00c573`), and in border highlights (`rgba(62, 207, 142, 0.3)`) — always as a signal of "this is Supabase" rather than as a decorative element.

**Key Characteristics:**
- Dark-mode-native: near-black backgrounds (`#0f0f0f`, `#171717`) — never pure black
- Emerald green brand accent (`#3ecf8e`, `#00c573`) used sparingly as identity marker
- Circular font — geometric sans-serif with rounded terminals
- Source Code Pro for uppercase technical labels (1.2px letter-spacing)
- HSL-based color token system with alpha channels for translucent layering
- Pill buttons (9999px) for primary CTAs, 6px radius for secondary
- Neutral gray scale from `#171717` through `#898989` to `#fafafa`
- Border system using dark grays (`#2e2e2e`, `#363636`, `#393939`)
- Minimal shadows — depth through border contrast and transparency
- Radix color primitives (crimson, purple, violet, indigo, yellow, tomato, orange, slate)

## 2. Color Palette & Roles

### Brand
- **Supabase Green** (`#3ecf8e`): Primary brand color, logo, accent borders
- **Green Link** (`#00c573`): Interactive green for links and actions
- **Green Border** (`rgba(62, 207, 142, 0.3)`): Subtle green border accent

### Neutral Scale (Dark Mode)
- **Near Black** (`#0f0f0f`): Primary button background, deepest surface
- **Dark** (`#171717`): Page background, primary canvas
- **Dark Border** (`#242424`): Horizontal rule, section dividers
- **Border Dark** (`#2e2e2e`): Card borders, tab borders
- **Mid Border** (`#363636`): Button borders, dividers
- **Border Light** (`#393939`): Secondary borders
- **Charcoal** (`#434343`): Tertiary borders, dark accents
- **Dark Gray** (`#4d4d4d`): Heavy secondary text
- **Mid Gray** (`#898989`): Muted text, link color
- **Light Gray** (`#b4b4b4`): Secondary link text
- **Near White** (`#efefef`): Light border, subtle surface
- **Off White** (`#fafafa`): Primary text, button text

### Radix Color Tokens (HSL-based)
- **Slate Scale**: `--colors-slate5` through `--colors-slateA12` — neutral progression
- **Purple**: `--colors-purple4`, `--colors-purple5`, `--colors-purpleA7` — accent spectrum
- **Violet**: `--colors-violet10` (`hsl(251, 63.2%, 63.2%)`) — vibrant accent
- **Crimson**: `--colors-crimson4`, `--colors-crimsonA9` — warm accent / alert
- **Indigo**: `--colors-indigoA2` — subtle blue wash
- **Yellow**: `--colors-yellowA7` — attention/warning
- **Tomato**: `--colors-tomatoA4` — error accent
- **Orange**: `--colors-orange6` — warm accent

### Surface & Overlay
- **Glass Dark** (`rgba(41, 41, 41, 0.84)`): Translucent dark overlay
- **Slate Alpha** (`hsla(210, 87.8%, 16.1%, 0.031)`): Ultra-subtle blue wash
- **Fixed Scale Alpha** (`hsla(200, 90.3%, 93.4%, 0.109)`): Light frost overlay

## 3. Typography Rules

### Font Families
- **Primary**: `Circular`, with fallbacks: `custom-font, Helvetica Neue, Helvetica, Arial`
- **Monospace**: `Source Code Pro`, with fallbacks: `Office Code Pro, Menlo`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Circular | 72px (4.50rem) | 400 | 1.00 (tight) | normal | Maximum density, zero waste |
| Section Heading | Circular | 36px (2.25rem) | 400 | 1.25 (tight) | normal | Feature section titles |
| Card Title | Circular | 24px (1.50rem) | 400 | 1.33 | -0.16px | Slight negative tracking |
| Sub-heading | Circular | 18px (1.13rem) | 400 | 1.56 | normal | Secondary headings |
| Body | Circular | 16px (1.00rem) | 400 | 1.50 | normal | Standard body text |
| Nav Link | Circular | 14px (0.88rem) | 500 | 1.00–1.43 | normal | Navigation items |
| Button | Circular | 14px (0.88rem) | 500 | 1.14 (tight) | normal | Button labels |
| Caption | Circular | 14px (0.88rem) | 400–500 | 1.43 | normal | Metadata, tags |
| Small | Circular | 12px (0.75rem) | 400 | 1.33 | normal | Fine print, footer links |
| Code Label | Source Code Pro | 12px (0.75rem) | 400 | 1.33 | 1.2px | `text-transform: uppercase` |

### Principles
- **Weight restraint**: Nearly all text uses weight 400. Weight 500 appears only for navigation links and button labels. No bold (700).
- **1.00 hero line-height**: The hero text is compressed to absolute zero leading — text feels like a terminal command.
- **Negative tracking on cards**: Card titles use -0.16px letter-spacing, a subtle tightening.
- **Monospace as ritual**: Source Code Pro in uppercase with 1.2px letter-spacing for developer-context markers.
- **Geometric personality**: Circular's rounded terminals create warmth in what could otherwise be cold.

## 4. Component Stylings

### Buttons

**Primary Pill (Dark)**: Background `#0f0f0f`, text `#fafafa`, padding 8px 32px, radius 9999px, border `1px solid #fafafa`.

**Secondary Pill (Dark, Muted)**: Background `#0f0f0f`, text `#fafafa`, padding 8px 32px, radius 9999px, border `1px solid #2e2e2e`, opacity 0.8.

**Ghost Button**: Background transparent, text `#fafafa`, padding 8px, radius 6px, border `1px solid transparent`.

### Cards & Containers
- Background: dark surfaces (`#171717` or slightly lighter)
- Border: `1px solid #2e2e2e` or `#363636`
- Radius: 8px–16px
- No visible shadows — borders define edges

### Navigation
- Dark background matching page (`#171717`)
- Circular 14px weight 500 for nav links
- Green pill CTA button
- Sticky header behavior

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 90px, 96px, 128px
- Notable large jumps: 48px → 90px → 96px → 128px for major section spacing

### Whitespace Philosophy
- **Dramatic section spacing**: 90px–128px between major sections — cinematic pacing, each section is its own scene.
- **Dense content blocks**: Within sections, spacing is tight (16px–24px).
- **Border-defined space**: Separation through thin borders on dark backgrounds — line, not gap.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, border `#2e2e2e` | Default state, most surfaces |
| Subtle Border (Level 1) | Border `#363636` or `#393939` | Interactive elements, hover |
| Focus (Level 2) | `rgba(0, 0, 0, 0.1) 0px 4px 12px` | Focus states only |
| Green Accent (Level 3) | Border `rgba(62, 207, 142, 0.3)` | Brand-highlighted elements |

**Shadow Philosophy**: Supabase deliberately avoids shadows. Depth through border hierarchy — from `#242424` (barely visible) through `#2e2e2e` (standard) to `#393939` (prominent). The green accent border at 30% opacity IS the elevated state.

## 7. Do's and Don'ts

### Do
- Use near-black backgrounds — depth comes from gray border hierarchy
- Apply green sparingly — it's an identity marker, not a decoration
- Use Circular at weight 400 for nearly everything — 500 only for buttons and nav
- Set hero text to 1.00 line-height
- Create depth through border color differences
- Use pill shape (9999px) exclusively for primary CTAs and tabs

### Don't
- Don't add box-shadows — they're invisible on dark backgrounds
- Don't use bold (700) text weight
- Don't apply green to backgrounds or large surfaces
- Don't use large border radius (16px+) on buttons — pills (9999px) or standard (6px)
- Don't lighten background above `#171717` for primary surfaces

## 8. Responsive Behavior

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <600px | Single column, stacked features, condensed nav |
| Desktop | >600px | Multi-column grids, full nav, expanded sections |

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: `#0f0f0f` (button), `#171717` (page)
- Text: `#fafafa` (primary), `#b4b4b4` (secondary), `#898989` (muted)
- Brand green: `#3ecf8e` (brand), `#00c573` (links)
- Borders: `#242424` (subtle), `#2e2e2e` (standard), `#363636` (prominent)
- Green border: `rgba(62, 207, 142, 0.3)` (accent)

---

## MoneyDrive Usage Notes

Supabase's design system is the closest structural reference for MoneyDrive's overall dark-mode architecture — both are dark-mode-native, data-dense, code-adjacent platforms.

**Direct parallels:**

| Supabase | MoneyDrive equivalent |
|----------|----------------------|
| Emerald green brand accent | Burnt orange primary accent |
| `#0f0f0f` near-black | Navy dark background |
| Source Code Pro labels | Mono font for earnings numbers/stats |
| Border hierarchy for depth | Same approach — no decorative shadows |
| Pill (9999px) for primary CTAs | Same — "Subscribe with SnapScan" buttons |
| HSL alpha transparency | OKLCH alpha values for MoneyDrive's token system |

**Key adaptation**: Replace Supabase green with MoneyDrive burnt orange (`--color-primary`) as the brand accent. The border hierarchy principle translates directly to MoneyDrive's dark navy palette.

**Most applicable screens**: All of MoneyDrive (it's a dark-mode-native app). Specifically the eTavern forum, Nduna chat interface, and the earnings dashboard — all benefit from Supabase's "depth through border contrast" philosophy.
