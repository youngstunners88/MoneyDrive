# Design System Inspired by ElevenLabs

> Category: AI & LLM  
> AI voice platform. Dark cinematic UI, audio-waveform aesthetics.
> Source: https://elevenlabs.io

## 1. Visual Theme & Atmosphere

ElevenLabs' website is a study in restrained elegance — a near-white canvas (`#ffffff`, `#f5f5f5`) where typography and subtle shadows do all the heavy lifting. The design feels like a premium audio product brochure: clean, spacious, and confident enough to let the content speak (literally, given ElevenLabs makes voice AI). There's an almost Apple-like quality to the whitespace strategy, but warmer — the occasional warm stone tint (`#f5f2ef`, `#777169`) prevents the purity from feeling clinical.

The typography system is built on a fascinating duality: Waldenburg at weight 300 (light) for display headings creates ethereal, whisper-thin titles that feel like sound waves rendered in type — delicate, precise, and surprisingly impactful at large sizes. This light-weight display approach is the design's signature — where most sites use bold headings to grab attention, ElevenLabs uses lightness to create intrigue. Inter handles all body and UI text with workmanlike reliability, using slight positive letter-spacing (0.14px–0.18px) that gives body text an airy, well-spaced quality. WaldenburgFH appears as a bold uppercase variant for specific button labels.

What makes ElevenLabs distinctive is its multi-layered shadow system. Rather than simple box-shadows, elements use complex stacks: inset border-shadows (`rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset`), outline shadows (`rgba(0,0,0,0.06) 0px 0px 0px 1px`), and soft elevation shadows (`rgba(0,0,0,0.04) 0px 4px 4px`) — all at remarkably low opacities. The result is a design where surfaces seem to barely exist, floating just above the page with the lightest possible touch. Pill-shaped buttons (9999px) with warm-tinted backgrounds (`rgba(245,242,239,0.8)`) and warm shadows (`rgba(78,50,23,0.04)`) add a tactile, physical quality.

**Key Characteristics:**
- Near-white canvas with warm undertones (`#f5f5f5`, `#f5f2ef`)
- Waldenburg weight 300 (light) for display — ethereal, whisper-thin headings
- Inter with positive letter-spacing (0.14–0.18px) for body — airy readability
- Multi-layered shadow stacks at sub-0.1 opacity — surfaces barely exist
- Pill buttons (9999px) with warm stone-tinted backgrounds
- WaldenburgFH bold uppercase for specific CTA labels
- Warm shadow tints: `rgba(78, 50, 23, 0.04)` — shadows have color, not just darkness
- Geist Mono / ui-monospace for code snippets

## 2. Color Palette & Roles

### Primary
- **Pure White** (`#ffffff`): Primary background, card surfaces, button backgrounds
- **Light Gray** (`#f5f5f5`): Secondary surface, subtle section differentiation
- **Warm Stone** (`#f5f2ef`): Button background (at 80% opacity) — the warm signature
- **Black** (`#000000`): Primary text, headings, dark buttons

### Neutral Scale
- **Dark Gray** (`#4e4e4e`): Secondary text, descriptions
- **Warm Gray** (`#777169`): Tertiary text, muted links, decorative underlines
- **Near White** (`#f6f6f6`): Alternate light surface

### Interactive
- **Grid Cyan** (`#7fffff`): `--grid-column-bg`, at 25% opacity — decorative grid overlay
- **Ring Blue** (`rgb(147 197 253 / 0.5)`): `--tw-ring-color`, focus ring
- **Border Light** (`#e5e5e5`): Explicit borders
- **Border Subtle** (`rgba(0, 0, 0, 0.05)`): Ultra-subtle bottom borders

### Shadows
- **Inset Border** (`rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset`): Internal edge definition
- **Inset Dark** (`rgba(0,0,0,0.1) 0px 0px 0px 0.5px inset`): Stronger inset variant
- **Outline Ring** (`rgba(0,0,0,0.06) 0px 0px 0px 1px`): Shadow-as-border
- **Soft Elevation** (`rgba(0,0,0,0.04) 0px 4px 4px`): Gentle lift
- **Card Shadow** (`rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px`): Button/card elevation
- **Warm Shadow** (`rgba(78,50,23,0.04) 0px 6px 16px`): Warm-tinted button shadow
- **Edge Shadow** (`rgba(0,0,0,0.08) 0px 0px 0px 0.5px`): Subtle edge definition
- **Inset Ring** (`rgba(0,0,0,0.1) 0px 0px 0px 1px inset`): Strong inset border

## 3. Typography Rules

### Font Families
- **Display**: `Waldenburg`, fallback: `Waldenburg Fallback`
- **Display Bold**: `WaldenburgFH`, fallback: `WaldenburgFH Fallback`
- **Body / UI**: `Inter`, fallback: `Inter Fallback`
- **Monospace**: `Geist Mono` or `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Waldenburg | 48px (3.00rem) | 300 | 1.08 (tight) | -0.96px | Whisper-thin, ethereal |
| Section Heading | Waldenburg | 36px (2.25rem) | 300 | 1.17 (tight) | normal | Light display |
| Card Heading | Waldenburg | 32px (2.00rem) | 300 | 1.13 (tight) | normal | Light card titles |
| Body Large | Inter | 20px (1.25rem) | 400 | 1.35 | normal | Introductions |
| Body | Inter | 18px (1.13rem) | 400 | 1.44–1.60 | 0.18px | Standard reading text |
| Body Standard | Inter | 16px (1.00rem) | 400 | 1.50 | 0.16px | UI text |
| Body Medium | Inter | 16px (1.00rem) | 500 | 1.50 | 0.16px | Emphasized body |
| Nav / UI | Inter | 15px (0.94rem) | 500 | 1.33–1.47 | 0.15px | Navigation links |
| Button | Inter | 15px (0.94rem) | 500 | 1.47 | normal | Button labels |
| Button Uppercase | WaldenburgFH | 14px (0.88rem) | 700 | 1.10 (tight) | 0.7px | `text-transform: uppercase` |
| Caption | Inter | 14px (0.88rem) | 400–500 | 1.43–1.50 | 0.14px | Metadata |
| Small | Inter | 13px (0.81rem) | 500 | 1.38 | normal | Tags, badges |
| Code | Geist Mono | 13px (0.81rem) | 400 | 1.85 (relaxed) | normal | Code blocks |
| Micro | Inter | 12px (0.75rem) | 500 | 1.33 | normal | Tiny labels |
| Tiny | Inter | 10px (0.63rem) | 400 | 1.60 (relaxed) | normal | Fine print |

### Principles
- **Light as the hero weight**: Waldenburg at 300 is the defining typographic choice. Lightness creates intrigue.
- **Positive letter-spacing on body**: Inter uses +0.14px to +0.18px tracking across body text.
- **WaldenburgFH for emphasis**: Bold (700) uppercase variant, only in specific CTA button labels with 0.7px letter-spacing.
- **Monospace as ambient**: Geist Mono at relaxed line-height (1.85) for code blocks.

## 4. Component Stylings

### Buttons

**Primary Black Pill**: Background `#000000`, text `#ffffff`, padding 0px 14px, radius 9999px.

**White Pill (Shadow-bordered)**: Background `#ffffff`, text `#000000`, radius 9999px, shadow: `rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px`.

**Warm Stone Pill**: Background `rgba(245, 242, 239, 0.8)`, text `#000000`, padding 12px 20px 12px 14px (asymmetric), radius 30px, shadow: `rgba(78, 50, 23, 0.04) 0px 6px 16px`.

**Uppercase Waldenburg Button**: Font WaldenburgFH 14px weight 700, text-transform uppercase, letter-spacing 0.7px.

### Cards & Containers
- Background: `#ffffff`
- Border: `1px solid #e5e5e5` or shadow-as-border
- Radius: 16px–24px
- Shadow: multi-layer stack (inset + outline + elevation)

### Navigation
- Clean white sticky header
- Inter 15px weight 500 for nav links
- Pill CTAs right-aligned (black primary, white secondary)
- Mobile: hamburger collapse at 1024px

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 3px, 4px, 8px, 9px, 10px, 11px, 12px, 16px, 18px, 20px, 24px, 28px, 32px, 40px

### Whitespace Philosophy
- **Apple-like generosity**: Massive vertical spacing between sections creates a premium, unhurried pace.
- **Warm emptiness**: The warm stone undertones and warm shadows give empty space a tactile quality.
- **Typography-led rhythm**: Light-weight Waldenburg headings create visual "whispers" through vast white space.

### Border Radius Scale
- Pill (9999px): Primary buttons, navigation pills
- Warm Button (30px): Warm stone CTA
- Section (24px): Large panels, section containers
- Large (18px–20px): Featured cards, code panels
- Card (16px): Standard cards, articles

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, text blocks |
| Inset Edge (Level 0.5) | `rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset` | Internal border definition |
| Outline Ring (Level 1) | `rgba(0,0,0,0.06) 0px 0px 0px 1px` stack | Shadow-as-border for cards |
| Card (Level 2) | `rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px` | Button elevation, prominent cards |
| Warm Lift (Level 3) | `rgba(78,50,23,0.04) 0px 6px 16px` | Featured CTAs — warm-tinted |

## 7. Do's and Don'ts

### Do
- Use Waldenburg weight 300 for all display headings — the lightness IS the brand
- Apply multi-layer shadows (inset + outline + elevation) at sub-0.1 opacity
- Use warm stone tints (`#f5f2ef`, `rgba(245,242,239,0.8)`) for featured elements
- Apply positive letter-spacing (+0.14px to +0.18px) on Inter body text
- Use 9999px radius for primary buttons

### Don't
- Don't use bold (700) Waldenburg for headings — weight 300 is non-negotiable
- Don't use heavy shadows (>0.1 opacity)
- Don't use cool gray borders — the system is warm-tinted throughout
- Don't apply negative letter-spacing to body text

## 8. Responsive Behavior

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <1024px | Single column, hamburger nav, stacked sections |
| Desktop | >1024px | Full layout, horizontal nav, multi-column grids |

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: Pure White (`#ffffff`) or Light Gray (`#f5f5f5`)
- Text: Black (`#000000`)
- Secondary text: Dark Gray (`#4e4e4e`)
- Muted text: Warm Gray (`#777169`)
- Warm surface: Warm Stone (`rgba(245, 242, 239, 0.8)`)
- Border: `#e5e5e5` or `rgba(0,0,0,0.05)`

---

## MoneyDrive Usage Notes

ElevenLabs design principles apply most directly to MoneyDrive's **voice interface** surfaces (Nduna voice sessions) and any **audio-waveform UI** elements.

Key adaptations for MoneyDrive dark theme:
- Invert the palette: use dark navy (`--color-background`) where ElevenLabs uses white
- Replace warm stone with burnt orange (`--color-primary`) for the signature warm CTA
- Keep the multi-layer shadow technique — adapt opacities for dark mode
- Waldenburg-style light weight headings → use `font-display` (the MoneyDrive display font) at regular/light weight
- The "surfaces barely exist" philosophy translates well to MoneyDrive's card overlays on dark background

**Specific use**: Apply to the Nduna voice conversation screen, the eTavern post composer, and any full-screen audio/voice recording UI.
