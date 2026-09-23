# Design System Inspired by Vercel

> Category: Developer Tools  
> Frontend deployment. Black and white precision, Geist font.  
> Source: https://vercel.com

## 1. Visual Theme & Atmosphere

Vercel's website is the visual thesis of developer infrastructure made invisible — a design system so restrained it borders on philosophical. The page is overwhelmingly white (`#ffffff`) with near-black (`#171717`) text, creating a gallery-like emptiness where every element earns its pixel. This isn't minimalism as decoration; it's minimalism as engineering principle. The Geist design system treats the interface like a compiler treats code — every unnecessary token is stripped away until only structure remains.

The custom Geist font family is the crown jewel. Geist Sans uses aggressive negative letter-spacing (-2.4px to -2.88px at display sizes), creating headlines that feel compressed, urgent, and engineered — like code that's been minified for production. At body sizes, the tracking relaxes but the geometric precision persists. Geist Mono completes the system as the monospace companion for code, terminal output, and technical labels. Both fonts enable OpenType `"liga"` (ligatures) globally, adding a layer of typographic sophistication that rewards close reading.

What distinguishes Vercel from other monochrome design systems is its shadow-as-border philosophy. Instead of traditional CSS borders, Vercel uses `box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.08)` — a zero-offset, zero-blur, 1px-spread shadow that creates a border-like line without the box model implications. This technique allows borders to exist in the shadow layer, enabling smoother transitions, rounded corners without clipping, and a subtler visual weight than traditional borders. The entire depth system is built on layered, multi-value shadow stacks where each layer serves a specific purpose: one for the border, one for soft elevation, one for ambient depth.

**Key Characteristics:**
- Geist Sans with extreme negative letter-spacing (-2.4px to -2.88px at display) — text as compressed infrastructure
- Geist Mono for code and technical labels with OpenType `"liga"` globally
- Shadow-as-border technique: `box-shadow 0px 0px 0px 1px` replaces traditional borders throughout
- Multi-layer shadow stacks for nuanced depth (border + elevation + ambient in single declarations)
- Near-pure white canvas with `#171717` text — not quite black, creating micro-contrast softness
- Workflow-specific accent colors: Ship Red (`#ff5b4f`), Preview Pink (`#de1d8d`), Develop Blue (`#0a72ef`)
- Focus ring system using `hsla(212, 100%, 48%, 1)` — a saturated blue for accessibility
- Pill badges (9999px) with tinted backgrounds for status indicators

## 2. Color Palette & Roles

### Primary
- **Vercel Black** (`#171717`): Primary text, headings, dark surface backgrounds
- **Pure White** (`#ffffff`): Page background, card surfaces, button text on dark
- **True Black** (`#000000`): Secondary use in specific console/code contexts

### Workflow Accent Colors
- **Ship Red** (`#ff5b4f`): The "ship to production" workflow step — warm, urgent coral-red
- **Preview Pink** (`#de1d8d`): The preview deployment workflow — vivid magenta-pink
- **Develop Blue** (`#0a72ef`): The development workflow — bright, focused blue

### Console / Code Colors
- **Console Blue** (`#0070f3`): Syntax highlighting blue
- **Console Purple** (`#7928ca`): Syntax highlighting purple
- **Console Pink** (`#eb367f`): Syntax highlighting pink

### Interactive
- **Link Blue** (`#0072f5`): Primary link color with underline decoration
- **Focus Blue** (`hsla(212, 100%, 48%, 1)`): Focus ring on interactive elements
- **Ring Blue** (`rgba(147, 197, 253, 0.5)`): Tailwind ring utility

### Neutral Scale
- **Gray 900** (`#171717`): Primary text, headings, nav text
- **Gray 600** (`#4d4d4d`): Secondary text, description copy
- **Gray 500** (`#666666`): Tertiary text, muted links
- **Gray 400** (`#808080`): Placeholder text, disabled states
- **Gray 100** (`#ebebeb`): Borders, card outlines, dividers
- **Gray 50** (`#fafafa`): Subtle surface tint, inner shadow highlight

### Shadows & Depth
- **Border Shadow** (`rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`): The signature — replaces traditional borders
- **Subtle Elevation** (`rgba(0, 0, 0, 0.04) 0px 2px 2px`): Minimal lift for cards
- **Card Stack** (`rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px`): Full multi-layer card shadow
- **Ring Border** (`rgb(235, 235, 235) 0px 0px 0px 1px`): Light gray ring-border for tabs and images

## 3. Typography Rules

### Font Family
- **Primary**: `Geist`, with fallbacks: `Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol`
- **Monospace**: `Geist Mono`, with fallbacks: `ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New`
- **OpenType Features**: `"liga"` enabled globally on all Geist text; `"tnum"` for tabular numbers on specific captions

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Geist | 48px (3.00rem) | 600 | 1.00–1.17 (tight) | -2.4px to -2.88px | Maximum compression, billboard impact |
| Section Heading | Geist | 40px (2.50rem) | 600 | 1.20 (tight) | -2.4px | Feature section titles |
| Sub-heading Large | Geist | 32px (2.00rem) | 600 | 1.25 (tight) | -1.28px | Card headings, sub-sections |
| Sub-heading | Geist | 32px (2.00rem) | 400 | 1.50 | -1.28px | Lighter sub-headings |
| Card Title | Geist | 24px (1.50rem) | 600 | 1.33 | -0.96px | Feature cards |
| Card Title Light | Geist | 24px (1.50rem) | 500 | 1.33 | -0.96px | Secondary card headings |
| Body Large | Geist | 20px (1.25rem) | 400 | 1.80 (relaxed) | normal | Introductions, feature descriptions |
| Body | Geist | 18px (1.13rem) | 400 | 1.56 | normal | Standard reading text |
| Body Small | Geist | 16px (1.00rem) | 400 | 1.50 | normal | Standard UI text |
| Body Medium | Geist | 16px (1.00rem) | 500 | 1.50 | normal | Navigation, emphasized text |
| Body Semibold | Geist | 16px (1.00rem) | 600 | 1.50 | -0.32px | Strong labels, active states |
| Button / Link | Geist | 14px (0.88rem) | 500 | 1.43 | normal | Buttons, links, captions |
| Button Small | Geist | 14px (0.88rem) | 400 | 1.00 (tight) | normal | Compact buttons |
| Caption | Geist | 12px (0.75rem) | 400–500 | 1.33 | normal | Metadata, tags |
| Mono Body | Geist Mono | 16px (1.00rem) | 400 | 1.50 | normal | Code blocks |
| Mono Caption | Geist Mono | 13px (0.81rem) | 500 | 1.54 | normal | Code labels |
| Mono Small | Geist Mono | 12px (0.75rem) | 500 | 1.00 (tight) | normal | `text-transform: uppercase`, technical labels |
| Micro Badge | Geist | 7px (0.44rem) | 700 | 1.00 (tight) | normal | `text-transform: uppercase`, tiny badges |

### Principles
- **Compression as identity**: Geist Sans at display sizes uses -2.4px to -2.88px letter-spacing
- **Ligatures everywhere**: Every Geist text element enables OpenType `"liga"`
- **Three weights, strict roles**: 400 (body/reading), 500 (UI/interactive), 600 (headings/emphasis)
- **Mono for identity**: Geist Mono in uppercase for developer console voice

## 4. Component Stylings

### Buttons

**Primary White (Shadow-bordered)**: Background `#ffffff`, text `#171717`, padding 0px 6px, radius 6px, shadow `rgb(235, 235, 235) 0px 0px 0px 1px`.

**Primary Dark**: Background `#171717`, text `#ffffff`, padding 8px 16px, radius 6px.

**Pill Button / Badge**: Background `#ebf5ff`, text `#0068d6`, padding 0px 10px, radius 9999px, font 12px weight 500.

### Cards & Containers
- Background: `#ffffff`
- Border: via shadow — `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`
- Radius: 8px (standard), 12px (featured/image cards)
- Shadow stack: `rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px`

### Navigation
- Clean horizontal nav on white, sticky
- Geist 14px weight 500 for links, `#171717` text
- CTA: dark pill buttons
- Mobile: hamburger menu collapse

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 2px, 3px, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 16px, 32px, 36px, 40px
- Notable gap: jumps from 16px to 32px — no 20px or 24px in primary scale

### Whitespace Philosophy
- **Gallery emptiness**: 80px–120px+ between sections. White space IS the design.
- **Compressed text, expanded space**: Dense text counterbalanced by generous surrounding whitespace.
- **Section rhythm**: No color variation between sections — separation from borders and spacing alone.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, text blocks |
| Ring (Level 1) | `rgba(0,0,0,0.08) 0px 0px 0px 1px` | Shadow-as-border for most elements |
| Light Ring (Level 1b) | `rgb(235,235,235) 0px 0px 0px 1px` | Lighter ring for tabs, images |
| Subtle Card (Level 2) | Ring + `rgba(0,0,0,0.04) 0px 2px 2px` | Standard cards with minimal lift |
| Full Card (Level 3) | Ring + Subtle + `rgba(0,0,0,0.04) 0px 8px 8px -8px` + inner `#fafafa` ring | Featured cards, highlighted panels |

## 7. Do's and Don'ts

### Do
- Use shadow-as-border (`0px 0px 0px 1px rgba(0,0,0,0.08)`) instead of traditional CSS borders
- Enable `"liga"` on all Geist text — ligatures are structural, not optional
- Use the three-weight system: 400 (body), 500 (UI), 600 (headings)
- Use `#171717` instead of `#000000` for primary text

### Don't
- Don't use positive letter-spacing on Geist Sans — it's always negative or zero
- Don't use weight 700 (bold) on body text — 600 is the maximum
- Don't use traditional CSS `border` on cards — use the shadow-border technique
- Don't skip the inner `#fafafa` ring in card shadows

## 8. Responsive Behavior

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <1024px | Single column, hamburger nav |
| Desktop | >1024px | Full layout, horizontal nav, multi-column |

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Vercel Black (`#171717`)
- Background: Pure White (`#ffffff`)
- Heading text: Vercel Black (`#171717`)
- Body text: Gray 600 (`#4d4d4d`)
- Border (shadow): `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`

---

## MoneyDrive Usage Notes

Vercel's design system is most relevant for MoneyDrive's **public-facing marketing pages**, **documentation**, and **Nduna Marketing HQ campaign previews** — surfaces where precision and credibility matter most.

Key adaptations for MoneyDrive dark theme:
- Invert: dark navy background where Vercel uses white; near-white text where Vercel uses `#171717`
- Shadow-as-border technique translates to dark mode: use `rgba(255,255,255,0.08) 0px 0px 0px 1px`
- Negative letter-spacing principle applies: use tight tracking on display headings
- Multi-layer shadow stack works on dark: replace `#fafafa` inner ring with `rgba(255,255,255,0.03)`
- Workflow accent concept maps: use burnt orange for "active", gold for "completed", muted for "upcoming"

**Specific screens**: MoneyDrive public landing page (light theme), campaign creative preview cards in Nduna Marketing HQ, subscription pricing page.
