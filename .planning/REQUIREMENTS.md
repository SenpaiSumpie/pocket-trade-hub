# Requirements: Pocket Trade Hub

**Defined:** 2026-03-20
**Core Value:** Players can instantly find other players who have cards they want AND want cards they have, eliminating the friction of manual trade hunting.

## v3.0 Requirements

Requirements for UI/UX Overhaul. Each maps to roadmap phases.

### Design System

- [x] **DS-01**: Shared design token package with colors, typography, spacing, elevation, motion curves
- [x] **DS-02**: Semantic color aliases (surface, onSurface, accent, error, success, warning)
- [x] **DS-03**: Backward-compatible theme.ts shim re-exporting tokens with old property names
- [x] **DS-04**: Cross-platform token sync (mobile TS imports + web CSS custom properties)
- [x] **DS-05**: Hardcoded value audit and migration across all 71 theme-referencing files

### Component Library

- [x] **CL-01**: Shared primitive components (Button, Card, Text, Badge, Input, Divider)
- [x] **CL-02**: Skeleton loading states with shimmer animation matching content layout
- [x] **CL-03**: Empty states with illustrations and CTAs for all list/grid screens
- [x] **CL-04**: Toast/snackbar system with success/error/info/warning variants
- [x] **CL-05**: Animated Pressable with scale-down + haptic touch feedback
- [x] **CL-06**: Branded pull-to-refresh with gold tint animation

### Navigation

- [x] **NAV-01**: Custom animated tab bar with icon morphing and indicator slide
- [x] **NAV-02**: Custom collapsible scroll header
- [x] **NAV-03**: Inter font integration via expo-font config plugin
- [x] **NAV-04**: Phosphor icon migration replacing Ionicons
- [x] **NAV-05**: Haptic feedback on tab switch

### Motion

- [x] **MOT-01**: Reusable animation hooks (useAnimatedPress, useStaggeredList, useScrollHeader)
- [x] **MOT-02**: Animated counter component for numeric transitions
- [x] **MOT-03**: Card flip and spring physics micro-interactions
- [x] **MOT-04**: Bottom sheet gesture interactions replacing modal components
- [x] **MOT-05**: Shimmer animation system for skeleton loading

### Screen Migration

- [x] **SCR-01**: Home tab full visual refresh with new primitives and motion
- [x] **SCR-02**: Cards tab refresh with rarity visual effects (holographic shimmer, crown glow)
- [x] **SCR-03**: Trades tab refresh with animated proposal cards and match cards
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
| DS-01 | Phase 13 | Complete |
| DS-02 | Phase 13 | Complete |
| DS-03 | Phase 13 | Complete |
| DS-04 | Phase 13 | Complete |
| DS-05 | Phase 13 | Complete |
| CL-01 | Phase 16 | Complete |
| CL-02 | Phase 16 | Complete |
| CL-03 | Phase 16 | Complete |
| CL-04 | Phase 16 | Complete |
| CL-05 | Phase 16 | Complete |
| CL-06 | Phase 16 | Complete |
| NAV-01 | Phase 14 | Complete |
| NAV-02 | Phase 14 | Complete |
| NAV-03 | Phase 14 | Complete |
| NAV-04 | Phase 14 | Complete |
| NAV-05 | Phase 14 | Complete |
| MOT-01 | Phase 15 | Complete |
| MOT-02 | Phase 15 | Complete |
| MOT-03 | Phase 15 | Complete |
| MOT-04 | Phase 15 | Complete |
| MOT-05 | Phase 15 | Complete |
| SCR-01 | Phase 16 | Complete |
| SCR-02 | Phase 16 | Complete |
| SCR-03 | Phase 16 | Complete |
| SCR-04 | Phase 17 | Pending |
| SCR-05 | Phase 17 | Pending |
| SCR-06 | Phase 17 | Pending |
| WEB-01 | Phase 18 | Pending |
| WEB-02 | Phase 18 | Pending |
| WEB-03 | Phase 18 | Pending |
| POL-01 | Phase 19 | Pending |
| POL-02 | Phase 19 | Pending |
| POL-03 | Phase 19 | Pending |
| POL-04 | Phase 19 | Pending |
| POL-05 | Phase 19 | Pending |

**Coverage:**
- v3.0 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation*
