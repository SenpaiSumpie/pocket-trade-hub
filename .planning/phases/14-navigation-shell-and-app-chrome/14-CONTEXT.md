# Phase 14: Navigation Shell and App Chrome - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

The app frame (tab bar, headers, icons, typography) feels custom and polished before any screen content is touched. Custom animated tab bar replaces default, screen headers collapse on scroll, Inter font replaces system font, Phosphor icons replace all Ionicons, and tab switches produce haptic feedback. No screen content changes — that's Phases 16/17.

</domain>

<decisions>
## Implementation Decisions

### Tab Bar Design
- **D-01:** Custom animated tab bar with a sliding pill indicator (gold-tinted background pill that slides between tabs using Reanimated)
- **D-02:** Icon morphing: inactive tabs show regular-weight outline icons, active tab shows fill-weight icon
- **D-03:** All 6 tab labels always visible (icon + label) — not icon-only or active-only labels
- **D-04:** Trades badge replaced with a small gold dot indicator (no numeric count) when pending proposals exist
- **D-05:** Haptic feedback (light impact) on tab switch via expo-haptics (already installed)

### Collapsible Headers
- **D-06:** Collapsible scroll headers on scrollable list screens only: Cards, Market, Trades, Meta. Home and Profile keep static headers.
- **D-07:** Collapsed state shows just the tab title and notification bell — search bars and filter chips scroll away
- **D-08:** Header re-expands when user scrolls back up (any amount), standard iOS/Android pattern
- **D-09:** Collapse/expand uses Reanimated smooth spring animation

### Icon Migration
- **D-10:** Use `phosphor-react-native` package (official React Native package, tree-shakable, typed)
- **D-11:** Default weight: regular for inactive state, fill for active/selected state
- **D-12:** Migrate ALL 238 Ionicons references across all 50 files in this phase — no mixed icon sets shipped
- **D-13:** Tab icon selection is Claude's discretion (pick closest Phosphor equivalents for Home, Cards, Market, Trades, Meta, Profile)

### Font & Typography
- **D-14:** Bundle Inter font with 4 weight variants: Regular (400), Medium (500), SemiBold (600), Bold (700)
- **D-15:** Load via expo-font config plugin (build-time loading, no flash of unstyled text)
- **D-16:** Add fontFamily to shared typography tokens in `packages/shared/tokens/` — single source of truth for mobile and web
- **D-17:** Update typography token definitions to include fontFamily mapping (Inter-Regular, Inter-Medium, Inter-SemiBold, Inter-Bold)

### Claude's Discretion
- Specific Phosphor icon choices for each tab and throughout the app
- Whether to include a monospace font (e.g., JetBrains Mono) for numeric-heavy displays
- Collapsible header scroll threshold values
- Tab bar height and pill indicator dimensions
- Spring animation config values (damping, stiffness)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation Requirements
- `.planning/REQUIREMENTS.md` §Navigation — NAV-01 through NAV-05 define tab bar, headers, font, icons, haptics
- `.planning/ROADMAP.md` §Phase 14 — Success criteria with 5 verification points

### Current Navigation Implementation
- `apps/mobile/app/(tabs)/_layout.tsx` — Current tab bar using expo-router `<Tabs>` with Ionicons, 6 tabs, badge on trades
- `apps/mobile/app/_layout.tsx` — Root layout with Stack navigator, toast config, still uses hardcoded colors and Ionicons

### Design Token Infrastructure (Phase 13)
- `apps/mobile/src/constants/theme.ts` — Backward-compatible shim mapping old names to shared tokens
- `packages/shared/tokens/` — Shared token package (colors, typography, spacing, elevation, motion)

### Prior Decisions
- `.planning/phases/13-design-system-foundation/13-CONTEXT.md` — Token hierarchy, semantic colors, motion curve tokens
- `.planning/STATE.md` §Accumulated Context — Reanimated 4 exclusively, @gorhom/bottom-sheet v5 validation needed

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expo-haptics`: Already installed and used in CardThumbnail.tsx (light impact) — same pattern for tab haptics
- `@pocket-trade-hub/shared` tokens: Colors, spacing, typography, elevation, motion curves ready to consume
- `theme.ts` shim: Backward-compatible mapping — new tab bar can import directly from shared tokens

### Established Patterns
- `StyleSheet.create` with token imports — tab bar component follows same pattern
- expo-router `<Tabs>` — custom tab bar replaces via `tabBar` prop
- Zustand stores — badge state comes from `useTradesStore`

### Integration Points
- `app/(tabs)/_layout.tsx` — Primary file to replace with custom tab bar component
- `app/_layout.tsx` — Root layout needs expo-font plugin integration
- `app.json` plugins array — Add expo-font config plugin
- `packages/shared/tokens/typography.ts` — Add fontFamily definitions
- 50 files with Ionicons imports — All need `@expo/vector-icons` → `phosphor-react-native` swap

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for tab bar animation, icon mapping, and header collapse behavior.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-navigation-shell-and-app-chrome*
*Context gathered: 2026-03-21*
