# Phase 19: Premium Touches and Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 19-premium-touches-and-polish
**Areas discussed:** Splash animation, Grid layout modes, Parallax headers, Haptic patterns

---

## Splash Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Animated logo reveal | Logo fades/scales in with spring + gold shimmer sweep, Reanimated only | ✓ |
| Lottie animation | Full motion sequence with Lottie JSON, requires lottie-react-native | |
| Simple branded fade | Static splash cross-fades into app, minimal | |

**User's choice:** Animated logo reveal
**Notes:** No new dependencies — uses Reanimated (already installed)

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + app name | Logo animates first, then app name fades in below | ✓ |
| Logo only | Just the logo icon | |
| You decide | Claude picks | |

**User's choice:** Logo + app name
**Notes:** Establishes brand identity on every launch

| Option | Description | Selected |
|--------|-------------|----------|
| Both (logo + name) | Shimmer sweeps across logo then continues through text | ✓ |
| Logo only | Shimmer on logo, name just fades in | |
| You decide | Claude picks | |

**User's choice:** Both — one continuous gold shimmer sweep

---

## Grid Layout Modes

| Option | Description | Selected |
|--------|-------------|----------|
| Header bar icon | Small icon button in collapsible header, next to filter | ✓ |
| Below search/filters | Segmented control between search bar and grid | |
| You decide | Claude picks | |

**User's choice:** Header bar icon
**Notes:** Unobtrusive, always accessible

| Option | Description | Selected |
|--------|-------------|----------|
| Grid: image-heavy | Grid=3col art only, Compact=2col art+name+set, List=1col full info | ✓ |
| Uniform density | All modes show art+name, differ only by column count | |
| You decide | Claude determines | |

**User's choice:** Grid: image-heavy — progressive information density
**Notes:** Grid is visual browsing, List is detailed comparison

| Option | Description | Selected |
|--------|-------------|----------|
| Cards tab only | Only the Cards tab gets layout toggle | ✓ |
| Cards + Collection views | Any screen showing card grid | |
| All list screens | Every screen with card data | |

**User's choice:** Cards tab only

---

## Parallax Headers

| Option | Description | Selected |
|--------|-------------|----------|
| Image moves slower than scroll | Classic parallax at ~50% scroll speed, image shrinks/fades on scroll up | ✓ |
| Sticky header with scale | Art stays pinned, scales down to thumbnail in header bar | |
| You decide | Claude picks | |

**User's choice:** Classic parallax — image moves slower than scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen detail view | Tap opens full-screen with parallax, long-press keeps bottom sheet | ✓ |
| Parallax inside bottom sheet | Keep bottom sheet, add parallax within it | |
| You decide | Claude determines | |

**User's choice:** Full-screen detail view for tap, bottom sheet for long-press quick-peek

| Option | Description | Selected |
|--------|-------------|----------|
| Card details only | Only card detail views get parallax | ✓ |
| All detail screens | Every detail view gets parallax treatment | |
| You decide | Claude evaluates | |

**User's choice:** Card details only — others stay as bottom sheets

---

## Haptic Patterns

| Option | Description | Selected |
|--------|-------------|----------|
| 4 contextual levels | Navigation=Light, Success=Medium, Error=Heavy, Destructive=notificationError | ✓ |
| 2 levels (simple) | Light for nav, Heavy for important | |
| You decide | Claude designs | |

**User's choice:** 4 contextual levels

| Option | Description | Selected |
|--------|-------------|----------|
| Centralized hook | useHaptics() with named methods | ✓ |
| Direct calls with constants | Haptics.impactAsync() with named constants | |
| You decide | Claude picks | |

**User's choice:** Centralized useHaptics() hook

| Option | Description | Selected |
|--------|-------------|----------|
| Keep haptics always | Reduced-motion only disables visual animations, not haptics | ✓ |
| Disable haptics too | Reduced-motion disables both animations and haptics | |
| Separate haptics toggle | In-app setting independent of reduced-motion | |

**User's choice:** Keep haptics always — iOS treats them independently

---

## Claude's Discretion

- Spring config values for splash animation
- Parallax header height and scroll interpolation ranges
- Layout mode icon choices and toggle interaction (cycle vs popover)
- Grid/Compact/List item dimensions and spacing
- Full-screen card detail navigation type (stack push vs modal)
- Implementation order across the five requirements

## Deferred Ideas

None — discussion stayed within phase scope
