---
phase: 17-screen-migration-tier-2
plan: 03
subsystem: mobile-ui
tags: [profile-tab, glassmorphism, blur-view, card-primitive, button-variant, badge-premium, shimmer, stagger, pull-to-refresh, toast-migration, paywall-card, svg-gradient]
dependency_graph:
  requires: [phase-17-plan-01-badge-skeleton-expo-blur, phase-16-primitives, phase-15-animations]
  provides: [profile-tab-migrated, paywall-card-migrated]
  affects: []
tech_stack:
  added: []
  patterns: [glassmorphism-blur-header, card-primitive-wrapping, button-variant-actions, badge-premium-display-name, shimmer-loading, staggered-entrance, gold-pull-to-refresh, toast-feedback, svg-gradient-accent]
key_files:
  created: []
  modified:
    - apps/mobile/app/(tabs)/profile.tsx
    - apps/mobile/src/components/premium/PaywallCard.tsx
decisions:
  - Text primitive uses preset prop (not variant) matching actual Text component API
  - Button Icon prop has pre-existing type mismatch with Phosphor icons across all tabs (out of scope)
  - PaywallCard GoldTopBorder extracted as internal component for cleaner JSX
metrics:
  duration: 3min
  completed: "2026-03-22T01:15:29Z"
  tasks: 2
  files: 2
---

# Phase 17 Plan 03: Profile Tab + PaywallCard Migration Summary

Profile tab fully migrated with glassmorphism BlurView header (expo-blur, intensity 40, gold overlay at 8% opacity), Card primitive info sections, Button variant actions (primary/destructive/secondary), Badge premium for display name, ProfileHeaderSkeleton initial load, shimmer loading, staggered entrance, gold pull-to-refresh, and toast migration from react-native-toast-message to useToast. PaywallCard wrapped in Card primitive with 2px horizontal gold gradient SVG top-border accent.

## What Was Done

### Task 1: Profile Tab Full Migration
- **Glassmorphism header**: BlurView from expo-blur with intensity={40}, tint="dark", gold overlay rgba(240, 192, 64, 0.08), overflow: 'hidden' for Android border radius clipping
- **Badge premium**: Badge variant="premium" label="PRO" next to display name for premium users (replaces PremiumBadge)
- **Card sections**: Friend code, linked accounts, member info, and language sections wrapped in Card primitive
- **Button actions**: Edit Profile uses Button primary variant, Logout uses Button destructive variant, Link/Unlink account use Button secondary variant
- **Shimmer loading**: ActivityIndicator replaced with Button loading prop (built-in ActivityIndicator)
- **ProfileHeaderSkeleton**: Initial load state when user data is not yet available
- **Staggered entrance**: useStaggeredList with Animated.View on 6 info section cards
- **Gold PTR**: RefreshControl with tintColor="#f0c040" and colors={["#f0c040"]}
- **Toast migration**: All Toast.show calls replaced with useToast() (success/error patterns)
- **Text primitive**: All inline styled Text replaced with Text preset="heading|subheading|body|label"
- **Alert dialogs**: Logout confirmation with destructive style, Unlink confirmation preserved
- **Reputation stars**: Left unchanged per D-25

### Task 2: PaywallCard Migration
- **Card primitive**: View container replaced with Card primitive from ui library
- **Gold gradient top-border**: 2px SVG LinearGradient (horizontal, #f5d060 to #c9a020) absolutely positioned at top
- **Text primitive**: All inline Text replaced with Text preset variants
- **Button primitive**: Subscribe button uses Button primary variant with loading state; Dev unsubscribe uses Button destructive variant

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 804db1f | Profile tab glassmorphism header, Card sections, Button actions, Badge, stagger, PTR, toasts |
| 2 | 0e7f378 | PaywallCard Card primitive with gold gradient top-border |

## Known Stubs

None -- all data sources are wired to existing hooks and stores.

## Self-Check: PASSED
