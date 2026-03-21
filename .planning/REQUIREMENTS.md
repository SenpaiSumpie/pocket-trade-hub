# Requirements: Pocket Trade Hub

**Defined:** 2026-03-20
**Core Value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.

## v3.0 Requirements

Requirements for UI/UX Overhaul. Each maps to roadmap phases.

### Design System

- [ ] **DS-01**: Shared design token package with colors, typography, spacing, elevation, motion curves
- [ ] **DS-02**: Semantic color aliases (surface, onSurface, accent, error, success, warning)
- [ ] **DS-03**: Backward-compatible theme.ts shim re-exporting tokens with old property names
- [ ] **DS-04**: Cross-platform token sync (mobile TS imports + web CSS custom properties)
- [ ] **DS-05**: Hardcoded value audit and migration across all 71 theme-referencing files

### Component Library

- [ ] **CL-01**: Shared primitive components (Button, Card, Text, Badge, Input, Divider)
- [ ] **CL-02**: Skeleton loading states with shimmer animation matching content layout
- [ ] **CL-03**: Empty states with illustrations and CTAs for all list/grid screens
- [ ] **CL-04**: Toast/snackbar system with success/error/info/warning variants
- [ ] **CL-05**: Animated Pressable with scale-down + haptic touch feedback
- [ ] **CL-06**: Branded pull-to-refresh with gold tint animation

### Navigation

- [ ] **NAV-01**: Custom animated tab bar with icon morphing and indicator slide
- [ ] **NAV-02**: Custom collapsible scroll header
- [ ] **NAV-03**: Inter font integration via expo-font config plugin
- [ ] **NAV-04**: Phosphor icon migration replacing Ionicons
- [ ] **NAV-05**: Haptic feedback on tab switch

### Motion

- [ ] **MOT-01**: Reusable animation hooks (useAnimatedPress, useStaggeredList, useScrollHeader)
- [ ] **MOT-02**: Animated counter component for numeric transitions
- [ ] **MOT-03**: Card flip and spring physics micro-interactions
- [ ] **MOT-04**: Bottom sheet gesture interactions replacing modal components
- [ ] **MOT-05**: Shimmer animation system for skeleton loading

### Screen Migration

- [ ] **SCR-01**: Home tab full visual refresh with new primitives and motion
- [ ] **SCR-02**: Cards tab refresh with rarity visual effects (holographic shimmer, crown glow)
- [ ] **SCR-03**: Trades tab refresh with animated proposal cards and match cards
- [ ] **SCR-04**: Market tab refresh with gradient accents on premium sections
- [ ] **SCR-05**: Meta tab refresh with deck cards and tier list visual overhaul
- [ ] **SCR-06**: Profile tab refresh with glassmorphism backdrops and settings redesign

### Web Sync

- [ ] **WEB-01**: CSS token generation script from shared TS token package
- [ ] **WEB-02**: Web primitive components (Button, Input, Badge, Card, Modal, Skeleton)
- [ ] **WEB-03**: Screen-by-screen web page refresh matching mobile visual language

### Polish

- [ ] **POL-01**: Branded splash/loading animation
- [ ] **POL-02**: Card grid layout modes (grid/compact/list toggle)
- [ ] **POL-03**: Parallax card headers on detail screens
- [ ] **POL-04**: Contextual haptic patterns across all interactions
- [ ] **POL-05**: Reduced-motion accessibility support

## Future Requirements

### Theming

- **THM-01**: Light mode / theme toggle engine
- **THM-02**: Storybook component documentation

### Advanced Visual

- **AVZ-01**: 3D/AR card effects
- **AVZ-02**: Shared React component package between mobile and web

## Out of Scope

| Feature | Reason |
|---------|--------|
| Light mode / theme engine | Dark+gold IS the brand identity — defer to v4+ |
| Storybook documentation | Overkill for current team size |
| 3D/AR card effects | Massive scope, marginal value |
| Navigation restructuring (tab count/IA) | Current 6-tab IA works well per research |
| Shared React component package | Anti-pattern — share tokens, not components |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | — | Pending |
| DS-02 | — | Pending |
| DS-03 | — | Pending |
| DS-04 | — | Pending |
| DS-05 | — | Pending |
| CL-01 | — | Pending |
| CL-02 | — | Pending |
| CL-03 | — | Pending |
| CL-04 | — | Pending |
| CL-05 | — | Pending |
| CL-06 | — | Pending |
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| NAV-03 | — | Pending |
| NAV-04 | — | Pending |
| NAV-05 | — | Pending |
| MOT-01 | — | Pending |
| MOT-02 | — | Pending |
| MOT-03 | — | Pending |
| MOT-04 | — | Pending |
| MOT-05 | — | Pending |
| SCR-01 | — | Pending |
| SCR-02 | — | Pending |
| SCR-03 | — | Pending |
| SCR-04 | — | Pending |
| SCR-05 | — | Pending |
| SCR-06 | — | Pending |
| WEB-01 | — | Pending |
| WEB-02 | — | Pending |
| WEB-03 | — | Pending |
| POL-01 | — | Pending |
| POL-02 | — | Pending |
| POL-03 | — | Pending |
| POL-04 | — | Pending |
| POL-05 | — | Pending |

**Coverage:**
- v3.0 requirements: 35 total
- Mapped to phases: 0
- Unmapped: 35 ⚠️

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
