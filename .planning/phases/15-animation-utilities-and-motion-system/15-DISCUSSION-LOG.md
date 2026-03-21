# Phase 15: Animation Utilities and Motion System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 15-animation-utilities-and-motion-system
**Areas discussed:** Bottom sheet migration scope, Animation hook behaviors, Card physics & micro-interactions, Shimmer system design

---

## Bottom Sheet Migration Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Detail views only | Convert 6 detail/browse modals to bottom sheets. Creation modals and small dialogs stay as modals. | ✓ |
| All 11 modals | Convert everything to bottom sheets for unified interaction pattern. | |
| Detail + creation modals | Convert 9 modals (all except RatingModal and LinkAccountModal). | |

**User's choice:** Detail views only
**Notes:** Forms benefit from full-screen focus — creation modals stay as-is.

| Option | Description | Selected |
|--------|-------------|----------|
| Two snap points | Open at ~60% height, drag up to full screen. Standard peek pattern. | ✓ |
| Full-screen only | Bottom sheets always expand to near-full height. | |
| Content-adaptive | Short content gets small sheet, long content gets two snap points. | |

**User's choice:** Two snap points

| Option | Description | Selected |
|--------|-------------|----------|
| Dark overlay | Semi-transparent black backdrop. Standard, no blur perf concerns. | ✓ |
| Blurred backdrop | iOS-style blur behind sheet. Premium feel but adds dependency. | |
| You decide | Claude picks based on dark theme compatibility. | |

**User's choice:** Dark overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Drag down + tap backdrop | Standard dismiss: drag down OR tap backdrop. | ✓ |
| Drag down only | No backdrop tap dismiss. Prevents accidental closes. | |

**User's choice:** Drag down + tap backdrop

---

## Animation Hook Behaviors

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle scale-down | Scale to ~0.97 with fast spring. iOS native feel. | ✓ |
| Pronounced scale-down | Scale to ~0.93 with bouncier spring. More playful. | |
| Scale + opacity | Scale to ~0.97 AND dim to 0.8 opacity. Double signal. | |

**User's choice:** Subtle scale-down

| Option | Description | Selected |
|--------|-------------|----------|
| Fade up with stagger | Fade in + translate up 10-15px, staggered 50ms apart. Clean, modern. | ✓ |
| Scale in with stagger | Scale from 0.9→1.0 + fade in, staggered 40ms apart. More playful. | |
| Slide in from right | Items slide from right edge, staggered. More dramatic. | |

**User's choice:** Fade up with stagger

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-up digits | Old number slides up, new slides up from below. Odometer style. | ✓ |
| Count-through | Rapidly counts through intermediate values. More dramatic. | |
| Morph/crossfade | Old fades out, new fades in. Simplest. | |

**User's choice:** Slide-up digits

| Option | Description | Selected |
|--------|-------------|----------|
| First mount only | Animate on initial render. Returning shows content instantly. | ✓ |
| Every focus | Re-animate each time tab gains focus. More lively. | |
| You decide | Claude picks per-screen. | |

**User's choice:** First mount only

---

## Card Physics & Micro-interactions

| Option | Description | Selected |
|--------|-------------|----------|
| 3D Y-axis flip | Card rotates around vertical axis. Classic TCG feel. | ✓ |
| Horizontal page turn | Card peels from right edge. More subtle. | |
| No flip | Skip flip, focus on other physics. | |

**User's choice:** 3D Y-axis flip

| Option | Description | Selected |
|--------|-------------|----------|
| Card detail view only | Flip in detail view or toggling art/stats. Not in grid. | ✓ |
| Grid thumbnail interaction | Long-press in grid to flip in place. | |
| Both grid and detail | Flip in both contexts. | |

**User's choice:** Card detail view only

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, subtle tilt on press | Card tilts 2-3° toward touch point. Premium physical feel. | ✓ |
| No tilt — scale only | Keep simple with just scale-down. | |
| Tilt on long-press only | Only during long-press, not regular taps. | |

**User's choice:** Subtle tilt on press

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, gentle overshoot | Scale 0.95→1.0 with slight overshoot to 1.02. Lively cascade. | ✓ |
| No spring — linear fade-up | Pure fade+translate from stagger. | |
| You decide | Claude picks best with stagger timing. | |

**User's choice:** Gentle overshoot

---

## Shimmer System Design

| Option | Description | Selected |
|--------|-------------|----------|
| Linear sweep | Bright gradient band sweeps left-to-right. Classic skeleton pattern. | ✓ |
| Pulse glow | Shapes pulse between two shades. Simpler. | |
| Gradient wave | Multiple gradient bands in wave pattern. More premium. | |

**User's choice:** Linear sweep

| Option | Description | Selected |
|--------|-------------|----------|
| Content-matched | Each skeleton mirrors real content shape. Smoother transition. | ✓ |
| Generic blocks | Reusable rectangle/circle primitives in rough approximations. | |
| Hybrid | Content-matched for high-traffic, generic for secondary. | |

**User's choice:** Content-matched

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle dark gradient | Base at surface color, sweep slightly lighter. No gold. | ✓ |
| Gold-tinted sweep | Faint gold tint in sweep. On-brand but might clash. | |
| You decide | Claude picks best with dark palette. | |

**User's choice:** Subtle dark gradient

| Option | Description | Selected |
|--------|-------------|----------|
| Primitives only | ShimmerBox, ShimmerCircle, ShimmerText + wrapper. Screen skeletons in 16/17. | ✓ |
| Primitives + 2-3 skeletons | Also build CardGridSkeleton, ListSkeleton, DetailSkeleton. | |
| Full skeleton library | Build skeletons for all major screens now. | |

**User's choice:** Primitives only

---

## Claude's Discretion

- Exact spring config values (damping, stiffness, mass) for all animations
- Bottom sheet snap point exact percentages
- Tilt angle calculation from touch point position
- AnimatedCounter digit height and timing
- Shimmer gradient width and animation duration
- Whether to create shared AnimatedCard component or keep as composable hooks

## Deferred Ideas

None — discussion stayed within phase scope
