# Design System Inspired by Linear

> Category: Productivity & Project Management  
> Issue tracking. Ultra-dense dark UI, keyboard-first, structured hierarchy.  
> Source: https://linear.app  
> **Note**: The upstream `nexu-io/open-design` DESIGN.md for Linear returned 404 at time of installation. This is a reconstructed reference based on Linear's publicly documented design system.

## 1. Visual Theme & Atmosphere

Linear's design is the gold standard for dense, keyboard-first productivity interfaces. Dark backgrounds (`#111118`, `#16161E`) with precise typography create a focused, no-noise environment. Everything is engineered for speed: compact row heights, subtle hover states, and precise keyboard shortcut affordances. The aesthetic is deliberately "tool, not toy" — no gradients, no hero images, no decorative elements. Every pixel serves a function.

**Key Characteristics:**
- Deep dark backgrounds: `#111118` (app), `#16161E` (sidebar)
- Linear Purple accent (`#5E6AD2`) — used sparingly for active states and CTAs
- Inter font throughout — weight hierarchy creates visual structure without color variation
- Row-based layout — issues, projects, and cycles are displayed in tight horizontal rows
- Sidebar-centric navigation — left sidebar is persistent and content-first
- Keyboard-first: every action has a shortcut, shortcuts are visible in the UI
- No drop shadows — depth through background color contrast only
- Subtle border system: `rgba(255,255,255,0.06)` for dividers, barely visible

## 2. Color Palette & Roles

### Primary Surfaces
- **App Background** (`#111118`): Main workspace background
- **Sidebar Background** (`#16161E`): Navigation sidebar, slightly elevated
- **Panel Background** (`#1A1A24`): Secondary panels, modals
- **Card Surface** (`#1E1E28`): Card containers, elevated panels
- **Hover State** (`rgba(255,255,255,0.04)`): Row hover, list item highlight

### Text Scale
- **Primary Text** (`#E8E8EE`): Headings, issue titles, primary labels
- **Secondary Text** (`#A3A3B4`): Descriptions, metadata, timestamps
- **Muted Text** (`#6B6B80`): Placeholders, disabled, hints
- **Disabled Text** (`#4A4A5A`): Explicitly disabled elements

### Accent
- **Linear Purple** (`#5E6AD2`): Active states, primary CTA, selected items, links
- **Purple Hover** (`#6B79E4`): Hover on purple elements
- **Purple Subtle** (`rgba(94,106,210,0.15)`): Background tint for selected rows

### Semantic Colors
- **Success Green** (`#26BE8F`): Completed, done states
- **Warning Amber** (`#F2BE4B`): Blocked, at-risk
- **Error Red** (`#E35A5A`): Overdue, error states
- **Info Blue** (`#4EA7FC`): In-progress, information

### Border System
- **Subtle** (`rgba(255,255,255,0.06)`): Dividers between sections
- **Default** (`rgba(255,255,255,0.10)`): Component borders, input outlines
- **Prominent** (`rgba(255,255,255,0.16)`): Active borders, focused inputs

## 3. Typography Rules

### Font Family
- **Primary**: `Inter` — the only font in the system
- **Monospace**: `JetBrains Mono` or `Menlo, Monaco, Consolas`

### Hierarchy

| Role | Size | Weight | Color | Notes |
|------|------|--------|-------|-------|
| Page Title | 18px | 600 | `#E8E8EE` | Section headings |
| Issue Title | 14px | 500 | `#E8E8EE` | List row primary text |
| Label | 13px | 500 | `#E8E8EE` | Column headers, metadata labels |
| Body | 13px | 400 | `#A3A3B4` | Descriptions, secondary info |
| Caption | 12px | 400 | `#6B6B80` | Timestamps, counts, fine print |
| Shortcut | 11px | 500 | `#6B6B80` | Keyboard shortcut indicators |
| Code | 13px | 400 | `#E8E8EE` | Mono, code blocks |

### Principles
- **Small and precise**: 13px is the base body size — denser than most apps but readable at this weight
- **Weight for hierarchy**: 600 for titles, 500 for labels/interactive, 400 for body/secondary
- **No italic**: emphasis is conveyed through weight, color, and size — never italic
- **Tabular numbers**: use `font-variant-numeric: tabular-nums` for all numeric data (issue counts, dates, values)

## 4. Component Stylings

### Issue Row (The Core Component)
- Height: 36px (compact), 44px (comfortable)
- Background: transparent default, `rgba(255,255,255,0.04)` on hover
- Border-bottom: `rgba(255,255,255,0.06)` 1px
- Layout: priority icon → issue ID → title → assignee → date → status
- Status badge: small pill with semantic color fill

### Buttons

**Primary**: Background `#5E6AD2`, text white, padding 6px 12px, radius 6px, no shadow.

**Secondary**: Background `rgba(255,255,255,0.08)`, text `#E8E8EE`, padding 6px 12px, radius 6px, border `rgba(255,255,255,0.10)`.

**Ghost**: Background transparent, text `#A3A3B4`, padding 6px 8px, radius 4px. Hover: `rgba(255,255,255,0.06)`.

**Icon Button**: 28px × 28px square, radius 4px, icon at 16px. Hover: `rgba(255,255,255,0.06)`.

### Sidebar Navigation
- Width: 240px fixed
- Background: `#16161E`
- Section labels: 11px Inter 500 uppercase, `#6B6B80`, 0.8px letter-spacing
- Nav items: 13px Inter 500, `#A3A3B4` inactive, `#E8E8EE` active
- Active item: background `rgba(94,106,210,0.15)`, text `#5E6AD2`, left border `#5E6AD2` 2px
- Item height: 28px with 4px vertical padding

### Status Badges
- Radius: 9999px (pill)
- Padding: 2px 8px
- Font: 11px Inter 500
- Colors: semantic (green/amber/red/blue/purple) with 15% opacity background, 100% color text

### Inputs & Search
- Background: `rgba(255,255,255,0.06)`
- Border: `rgba(255,255,255,0.10)` 1px
- Focus border: `#5E6AD2`
- Radius: 6px
- Font: 13px Inter 400
- Padding: 6px 10px

### Modal / Command Palette
- Background: `#1A1A24`
- Border: `rgba(255,255,255,0.10)` 1px
- Shadow: `rgba(0,0,0,0.5) 0px 16px 48px` — the one place depth matters
- Radius: 12px
- Max-width: 560px
- Search input at top: 48px height, 16px font

## 5. Layout Principles

### Spacing System
- Base: 4px
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
- Row heights: 28px (tiny), 36px (compact), 44px (comfortable), 56px (large)

### Grid
- Sidebar: 240px fixed left
- Content: fluid fill
- No max-width on content — expands to fill available space
- Header: 44px fixed top within content area

### Information Density
Linear operates at maximum density — more information per pixel than nearly any other tool:
- No card padding above 16px
- No section padding above 24px
- Row-based lists, not card-based grids
- Horizontal rule dividers at `rgba(255,255,255,0.06)` between logical sections

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| App (0) | `#111118` | Base workspace |
| Sidebar (1) | `#16161E` | Navigation sidebar |
| Panel (2) | `#1A1A24` | Modals, drawer panels |
| Card (3) | `#1E1E28` | Floating cards, popovers |
| Overlay (4) | `rgba(0,0,0,0.5) 0px 16px 48px` | Command palette, full modals |

No decorative shadows. Elevation is expressed through background color progression only.

## 7. Do's and Don'ts

### Do
- Use Inter exclusively — no display fonts, no serif
- Keep rows tight (36px default) — Linear is about density
- Use Linear Purple sparingly — active states and primary CTAs only
- Express depth through background color alone (no box-shadows in the workspace)
- Show keyboard shortcuts inline — they reduce cognitive load
- Use semantic status colors consistently across all issue states

### Don't
- Don't use gradients or decorative fills
- Don't use large border radius (>8px on functional elements)
- Don't pad cards generously — this is a productivity tool, not a landing page
- Don't use animations on list items — they break the "fast and immediate" feel
- Don't apply purple to large background areas — it should be accent-only
- Don't use icon + text + description for simple list items — pick two

## 8. Responsive Behavior

Linear is desktop-first. Mobile collapses the sidebar to a bottom sheet drawer.

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: `#111118`
- Sidebar: `#16161E`
- Primary text: `#E8E8EE`
- Secondary text: `#A3A3B4`
- Accent: `#5E6AD2`
- Border subtle: `rgba(255,255,255,0.06)`
- Hover: `rgba(255,255,255,0.04)`

---

## MoneyDrive Usage Notes

Linear's design system is the closest reference for MoneyDrive's **admin panel**, **fleet dashboard**, and **analytics pages** — all of which are dense, data-heavy productivity interfaces.

Key adaptations:
- Replace Linear Purple (`#5E6AD2`) with MoneyDrive Burnt Orange (`--color-primary`) for active states
- Use MoneyDrive's OKLCH navy palette where Linear uses `#111118`
- Keep Linear's row-based density philosophy for trip lists, expense logs, and lead tables
- Apply Linear's sidebar pattern to MoneyDrive's main navigation (Dashboard, eTavern, Nduna, Earnings, Settings)
- Status badge pattern: use for trip status (Active/Completed/Cancelled), lead status (Cold/Warm/Pitched/Closed), campaign status (Draft/Pending/Live/Ended)

**Specific screens to apply Linear principles**: Fleet Dashboard, Earnings Tracker, Admin Analytics, Campaign Engine (Nduna Marketing HQ), Lead Management.
