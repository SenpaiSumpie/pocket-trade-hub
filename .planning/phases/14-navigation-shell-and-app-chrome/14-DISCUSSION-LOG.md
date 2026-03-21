# Phase 14: Navigation Shell and App Chrome - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 14-navigation-shell-and-app-chrome
**Areas discussed:** Tab bar design, Collapsible headers, Icon migration scope, Font & typography

---

## Tab Bar Design

### Selection Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Sliding pill | Rounded pill shape that slides between tabs, gold-tinted background | ✓ |
| Sliding underline | Thin animated gold line below active tab | |
| Icon glow | Soft radial glow behind active icon | |

**User's choice:** Sliding pill
**Notes:** None

### Icon Morphing

| Option | Description | Selected |
|--------|-------------|----------|
| Filled ↔ outline swap | Inactive = outline/regular, active = filled | ✓ |
| Scale + weight shift | Active scales up 1.1x and shifts to bold weight | |
| You decide | Claude picks based on indicator style | |

**User's choice:** Filled ↔ outline swap
**Notes:** None

### Tab Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | All 6 tabs show icon + label at all times | ✓ |
| Active only | Only selected tab shows label | |
| Icon-only with tooltip | No labels, long-press shows tooltip | |

**User's choice:** Always visible
**Notes:** None

### Badge Style

| Option | Description | Selected |
|--------|-------------|----------|
| Dot indicator | Small gold dot on icon when pending proposals exist | ✓ |
| Count badge | Keep numeric count badge (current behavior) | |
| You decide | Claude picks based on pill design | |

**User's choice:** Dot indicator
**Notes:** None

---

## Collapsible Headers

### Which Screens

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable list screens only | Cards, Market, Trades, Meta tabs | ✓ |
| All tab screens | Every tab gets collapsible header | |
| You decide per screen | Claude evaluates per screen | |

**User's choice:** Scrollable list screens only
**Notes:** None

### Collapsed State Content

| Option | Description | Selected |
|--------|-------------|----------|
| Just the tab title | Minimal bar with title only | ✓ |
| Title + search bar | Search bar stays pinned | |
| You decide per screen | Claude determines per screen | |

**User's choice:** Just the tab title
**Notes:** None

### Re-expand Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll back up | Expands when user scrolls up (any amount) | ✓ |
| Scroll to top only | Only expands at scroll position 0 | |
| You decide | Claude picks based on conventions | |

**User's choice:** Scroll back up
**Notes:** None

### Animation Style

| Option | Description | Selected |
|--------|-------------|----------|
| Smooth spring | Reanimated spring animation for fluid motion | ✓ |
| Snappy with threshold | Snaps at threshold | |
| You decide | Claude picks based on Reanimated 4 | |

**User's choice:** Smooth spring
**Notes:** None

---

## Icon Migration Scope

### Default Weight

| Option | Description | Selected |
|--------|-------------|----------|
| Regular | Medium weight, balanced visibility | ✓ |
| Light | Thinner, more refined look | |
| Bold | Thicker, better readability at small sizes | |

**User's choice:** Regular
**Notes:** None

### Migration Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All files at once | Migrate all 238 references across 50 files | ✓ |
| Tab bar + headers only | Only navigation chrome, others later | |
| You decide | Claude evaluates blast radius | |

**User's choice:** All files at once
**Notes:** None

### Package Choice

| Option | Description | Selected |
|--------|-------------|----------|
| phosphor-react-native | Official RN package, tree-shakable, typed | ✓ |
| You decide | Claude evaluates Expo compatibility | |

**User's choice:** phosphor-react-native
**Notes:** None

### Tab Icons

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Claude picks closest Phosphor equivalents | ✓ |
| I want to pick them | User specifies each icon | |

**User's choice:** You decide
**Notes:** None

---

## Font & Typography

### Weight Variants

| Option | Description | Selected |
|--------|-------------|----------|
| Regular + Medium + SemiBold + Bold | 4 weights (~100KB) | ✓ |
| Regular + Bold only | 2 weights, minimal bundle | |
| Full variable font | Single variable file (~300KB) | |

**User's choice:** Regular + Medium + SemiBold + Bold
**Notes:** None

### Loading Method

| Option | Description | Selected |
|--------|-------------|----------|
| expo-font config plugin | Build-time loading, no FOUT | ✓ |
| useFonts hook | Runtime loading, brief flash | |
| You decide | Claude picks based on Expo compat | |

**User's choice:** expo-font config plugin
**Notes:** None

### Token Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Shared tokens | fontFamily in shared token package | ✓ |
| Mobile only | fontFamily in mobile theme.ts only | |

**User's choice:** Shared tokens
**Notes:** None

### Mono Font

| Option | Description | Selected |
|--------|-------------|----------|
| Not needed | Inter handles numbers fine | |
| Yes, JetBrains Mono | Add for card IDs, stats | |
| You decide | Claude evaluates need | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Claude's Discretion

- Phosphor icon choices for all 6 tabs and 50 component files
- Whether to bundle a monospace font for numeric displays
- Collapsible header scroll thresholds
- Tab bar dimensions and pill indicator sizing
- Spring animation configuration values

## Deferred Ideas

None — discussion stayed within phase scope
