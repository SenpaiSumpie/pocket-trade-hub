# Phase 18: Web Companion Sync - Research

**Researched:** 2026-03-21
**Domain:** Next.js 15 / Tailwind v4 / CSS custom properties / React 19 design system alignment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Web matches mobile visual language (same tokens, colors, elevation, spacing) but adapts layout for desktop — more information density, wider content grids, sidebar navigation stays
- **D-02:** Web gets skeleton loading states with shimmer animation on all data-fetching pages (CSS-based shimmer, not Reanimated)
- **D-03:** Web gets empty states with illustrations and CTAs matching mobile's pattern
- **D-04:** Web gets a toast/snackbar system with success/error/info/warning variants — CSS transitions, not spring physics
- **D-05:** Gradient accents on premium sections (market premium posts, proposal boost) carry over from mobile refresh
- **D-06:** No glassmorphism on web — the blur backdrop effects are mobile-specific; web uses elevation + subtle borders instead
- **D-07:** Load Inter font on web via Google Fonts / next/font for brand consistency — already integrated in `apps/web/src/app/layout.tsx`
- **D-08:** Keep Lucide icons on web — no Phosphor migration; brand consistency from tokens, not icon library matching
- **D-09:** Typography scale uses the token CSS custom properties (`--font-size-heading`, `--font-size-body`, etc.)
- **D-10:** Upgrade existing Button — consume token CSS vars, add icon prop support, add outline variant
- **D-11:** Upgrade existing Input — consume token CSS vars, add textarea variant for multi-line
- **D-12:** Upgrade existing Skeleton — add shimmer animation (CSS keyframe gradient sweep), add shaped variants (circle, text line, card)
- **D-13:** Upgrade existing Modal — consume token CSS vars, add entrance/exit transitions
- **D-14:** Add Badge component — status + rarity variants with matching token colors
- **D-15:** Add Card component — elevation via token shadows, optional pressable hover effect, padding sizes
- **D-16:** Add EmptyState component — icon + title + description + optional CTA button
- **D-17:** Add Toast system — Zustand store + fixed overlay in app layout, auto-dismiss with progress bar
- **D-18:** No web Text primitive — Tailwind utility classes handle typography on web
- **D-19:** Validate that `generate-css-tokens.ts` runs as part of Turborepo pipeline before web build
- **D-20:** Audit all web files for remaining hardcoded color/spacing values and replace with token CSS vars or Tailwind classes
- **D-21:** Refresh every page screen-by-screen: Cards, Collection, Market, Proposals, Meta, Tier Lists, Auth pages
- **D-22:** Each page gets: token-based colors/spacing, new primitive components, skeleton loading, empty states
- **D-23:** Sidebar gets visual refresh — token colors, Inter font, hover effects matching the premium feel

### Claude's Discretion

- Shimmer animation CSS implementation details (gradient angle, speed, colors) — **fully resolved in UI-SPEC**
- Toast positioning (top-right vs bottom-right) — **resolved: top-right, `fixed top-4 right-4 z-[100]`**
- Exact Card component elevation levels and hover transitions — **resolved in UI-SPEC**
- Empty state illustration approach — **Lucide icons at 64px in `--color-on-surface-muted`**
- Page layout grid specifics — **resolved in UI-SPEC: `max-w-7xl`, 3–5 columns responsive**

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WEB-01 | CSS token generation script from shared TS token package, integrated into Turborepo pipeline | Script exists at `packages/shared/scripts/generate-css-tokens.ts`; `turbo.json` `generate-tokens` task wired with `build` dependency. Validation: confirm `outputs` field and pipeline order are correct. |
| WEB-02 | Web primitive components (Button, Input, Badge, Card, Modal, Skeleton) consume tokens via CSS custom properties | 4 existing components to upgrade, 4 new components to add. All token vars live in `apps/web/src/app/tokens.css` as `@theme` block — 68 vars. Tailwind v4 maps these as utility classes. |
| WEB-03 | All web pages refreshed to match mobile visual language — same colors, spacing, typography scale, and component patterns | 6 app pages + 2 auth pages. Each needs: skeleton loading, empty states, token-based colors. Stores all have `loading: boolean`. Existing Zustand stores have full data-fetching already wired. |
</phase_requirements>

---

## Summary

Phase 18 brings the web companion into visual alignment with the refreshed mobile app by consuming the same shared design token package. The infrastructure is already established: `generate-css-tokens.ts` generates `apps/web/src/app/tokens.css` (68 CSS custom properties in a Tailwind v4 `@theme` block), and the Turborepo pipeline wires `generate-tokens` as a dependency of `build`. The planner should treat WEB-01 as a validation task, not a build task.

The bulk of the work is WEB-02 (primitive components) and WEB-03 (page refresh). Four existing components (Button, Input, Skeleton, Modal) need token-var upgrades and feature additions. Four new components (Badge, Card, EmptyState, Toast+ToastOverlay) need to be built from scratch. The mobile counterparts in `apps/mobile/src/components/ui/` serve as the authoritative reference for variant sets and API shape — web adapts the API to HTML/CSS idioms (no React Native StyleSheet, no Reanimated, no Phosphor).

Page refresh touches 8 pages total (6 under `(app)`, 2 under `(auth)`). All app-page Zustand stores expose a `loading: boolean` flag that drives skeleton states. The planner should structure work as: (1) validate token pipeline, (2) build/upgrade primitives, (3) refresh pages using those primitives, (4) sidebar refresh and hardcoded-value audit.

**Primary recommendation:** Build primitives first in a dedicated plan so page-refresh plans can depend on them. The token pipeline validation is a single checklist task, not a full plan.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.2 | App router, SSR, next/font | Already in use; app router patterns established |
| React | ^19.1 | Component model | Already in use |
| Tailwind CSS | ^4.0 | Utility-first CSS with CSS-first @theme config | Already in use; v4 CSS-first mode integrates directly with token CSS vars |
| Zustand | ^5.0 | State management | Already in use for all data stores; Toast store mirrors mobile pattern |
| Lucide React | ^0.500 | Icon library | Already in use; locked by D-08 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/font | built-in (Next.js 15) | Inter font loading | Already integrated in `apps/web/src/app/layout.tsx`; no additional install |
| react-dom/createPortal | built-in (React 19) | Modal and Toast overlay mounting | Keep existing pattern from Modal.tsx; extend for ToastOverlay |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CSS keyframe shimmer | Tailwind `animate-pulse` | Current Skeleton uses animate-pulse; switching to keyframe shimmer (D-12) gives the gradient sweep the UI-SPEC requires |
| Custom Toast store | react-hot-toast, sonner | External libraries introduce un-themed defaults; Zustand store matches mobile pattern exactly |
| CSS transitions for Modal | Framer Motion | Framer Motion adds bundle weight; pure CSS transitions with `--motion-duration-normal` vars are sufficient for scale+opacity entrance |

**No new dependencies required.** All tooling is already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx        # UPGRADE (D-10)
│   │   ├── Input.tsx         # UPGRADE (D-11)
│   │   ├── Skeleton.tsx      # UPGRADE (D-12)
│   │   ├── Modal.tsx         # UPGRADE (D-13)
│   │   ├── Badge.tsx         # NEW (D-14)
│   │   ├── Card.tsx          # NEW (D-15)
│   │   ├── EmptyState.tsx    # NEW (D-16)
│   │   ├── Toast.tsx         # NEW (D-17) — store + single toast item
│   │   └── ToastOverlay.tsx  # NEW (D-17) — fixed overlay rendering queue
│   └── layout/
│       ├── Sidebar.tsx       # REFRESH (D-23)
│       └── NotificationToast.tsx  # UNCHANGED — socket notifications coexist
├── stores/
│   └── toast.ts              # NEW — mirrors apps/mobile/src/stores/toast.ts
└── app/
    ├── globals.css            # ADD shimmer @keyframes here
    ├── tokens.css             # AUTO-GENERATED — do not edit
    ├── (app)/
    │   ├── layout.tsx         # ADD <ToastOverlay /> alongside <NotificationToast />
    │   ├── cards/page.tsx     # REFRESH (WEB-03)
    │   ├── collection/page.tsx # REFRESH (WEB-03)
    │   ├── market/page.tsx    # REFRESH (WEB-03)
    │   ├── proposals/page.tsx # REFRESH (WEB-03)
    │   ├── meta/page.tsx      # REFRESH (WEB-03)
    │   └── tierlists/page.tsx # REFRESH (WEB-03)
    └── (auth)/
        ├── login/page.tsx     # REFRESH (WEB-03)
        └── signup/page.tsx    # REFRESH (WEB-03)
```

### Pattern 1: Token CSS Var Consumption in Tailwind v4

**What:** Tailwind v4 CSS-first config registers all `@theme` vars as utility classes automatically. However, for precise token consumption without Tailwind utility intermediaries, reference vars directly in inline styles or Tailwind's arbitrary value syntax.

**When to use:** For values not covered by Tailwind utilities (e.g., motion durations as CSS transition durations, elevation shadows).

```tsx
// Source: apps/web/src/app/tokens.css + Tailwind v4 CSS-first config
// Token vars as Tailwind utilities (auto-generated from @theme):
<div className="bg-[var(--color-surface)] text-[var(--color-on-surface)]" />

// Elevation as box-shadow (not a standard Tailwind utility — use arbitrary):
<div style={{ boxShadow: 'var(--elevation-medium)' }} />

// Motion duration in CSS transition:
<div className="transition-all duration-[var(--motion-duration-fast)]" />
```

### Pattern 2: Shimmer Keyframe in globals.css

**What:** CSS keyframe animation defined globally in `globals.css`, consumed via className in Skeleton variants.

**When to use:** All Skeleton component variants. Defined once globally, not per-component.

```css
/* Source: 18-UI-SPEC.md Shimmer Animation Spec — add to apps/web/src/app/globals.css */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface-hover) 25%,
    var(--color-surface-light) 50%,
    var(--color-surface-hover) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Pattern 3: Toast Zustand Store

**What:** Mirrors the mobile `apps/mobile/src/stores/toast.ts` API — `show(variant, message)` and `dismiss(id)`.

**When to use:** Any component that needs to surface success/error/info/warning feedback instead of using `alert()` or `console.error`.

```tsx
// Source: apps/mobile/src/stores/toast.ts (reference) — web version at apps/web/src/stores/toast.ts
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem { id: string; variant: ToastVariant; message: string; }
interface ToastState {
  queue: ToastItem[];
  show: (variant: ToastVariant, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  queue: [],
  show: (variant, message) => set((s) => ({
    queue: [...s.queue.slice(-3), { id: Date.now().toString(), variant, message }],
  })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));
```

Note: Web caps queue at 4 items (slice(-3) before push keeps max 4). Mobile shows one at a time.

### Pattern 4: Modal CSS Entrance/Exit Transitions

**What:** CSS `transition` on scale + opacity replaces immediate show/hide. Requires a mounted-but-hidden state vs unmounted pattern.

**When to use:** Modal and any overlay that needs animate-in/animate-out.

```tsx
// Source: 18-UI-SPEC.md Component Upgrade Contract — Modal
// Use data-open attribute + CSS transition (avoids React state timing issues):
<div
  data-open={open}
  className="transition-all duration-[var(--motion-duration-normal)] data-[open=false]:opacity-0 data-[open=false]:scale-95 data-[open=true]:opacity-100 data-[open=true]:scale-100"
>
```

### Pattern 5: Zustand `loading` Flag Drives Skeleton

**What:** All web Zustand stores expose `loading: boolean`. Pages check this to conditionally render Skeleton components vs real content.

```tsx
// Source: apps/web/src/stores/cards.ts
const { cards, loading } = useCardStore();

if (loading) return <CardsPageSkeleton />;  // Grid of ShimmerCard × 12
if (!cards.length) return <EmptyState icon={LayoutGrid} title="No cards found" ... />;
return <CardGrid />;
```

### Anti-Patterns to Avoid

- **Hardcoded hex values in component classes:** `bg-[#1a1a2e]` instead of `bg-[var(--color-surface)]`. The token audit (D-20) must sweep and replace all of these.
- **Tailwind opacity modifier on non-Tailwind colors:** `bg-gold/10` works only because `gold` is a Tailwind color alias. For token vars use `bg-[color-mix(in_srgb,_var(--color-accent)_10%,_transparent)]` or inline style.
- **Editing `tokens.css` manually:** It is auto-generated. All token changes go to `packages/shared/src/tokens/`.
- **Mounting ToastOverlay outside `(app)/layout.tsx`:** The app-level layout is the correct mounting point. Do not mount in `(auth)/layout.tsx` (auth pages don't use the toast system).
- **Nesting `createPortal` calls:** Both Modal and ToastOverlay use `createPortal` to `document.body`. They are independent — do not nest.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gradient shimmer sweep | Manual JS interval animating background-position | CSS `@keyframes shimmer` + `.shimmer` class | GPU-composited, no JS, exactly matches mobile pattern |
| Toast auto-dismiss | Custom timer component with internal ref | `useEffect` + `setTimeout` in ToastItem + Zustand `dismiss` | Same pattern as `NotificationToast.tsx` already in the codebase |
| Inter font loading | Google Fonts `<link>` in layout | `next/font` — already in `apps/web/src/app/layout.tsx` | next/font handles preloading, swap, and self-hosting automatically |
| Token CSS pipeline | Manual copy of token values | `generate-css-tokens.ts` + Turborepo `generate-tokens` task | Already wired; re-running `pnpm run generate-tokens` regenerates all 68 vars |
| Modal focus trap | Custom keyboard event listeners | Existing `useEffect` in Modal.tsx handles Escape key; browser handles tab trapping in portals | Existing implementation is sufficient |

**Key insight:** The project already has the entire token infrastructure working. Phase 18 is consumer work, not infrastructure work.

---

## Common Pitfalls

### Pitfall 1: Tailwind Color Aliases vs Token Vars

**What goes wrong:** Existing code uses Tailwind shorthand like `bg-gold`, `text-text`, `bg-surface`, `text-text-muted`. These are Tailwind aliases defined via the `@theme` block in `tokens.css`. When upgrading components to "use token CSS vars," developers mistakenly think they need to replace these with `var(--color-accent)` inline styles — but the Tailwind alias already maps to the token var.

**Why it happens:** Confusion between Tailwind utility classes (generated from `@theme`) and raw CSS var references.

**How to avoid:** Only replace hardcoded hex literals (e.g., `bg-[#1a1a2e]`) and non-token Tailwind colors (e.g., `bg-red-500` → `bg-[var(--color-error)]`). Keep `bg-surface`, `text-gold`, etc. — they are already token-backed.

**Warning signs:** If you see `bg-[var(--color-surface)]` replacing `bg-surface`, it's unnecessary work.

### Pitfall 2: Toast Z-Index Collision with NotificationToast

**What goes wrong:** NotificationToast is already at `z-[60]`. The new ToastOverlay must be at `z-[100]` (per UI-SPEC) to appear above modals (`z-50`) and above NotificationToast. If ToastOverlay is placed at `z-50` it will render behind open modals.

**Why it happens:** The existing NotificationToast pattern was added ad-hoc; the new system must be explicitly layered above it.

**How to avoid:** Use `z-[100]` for ToastOverlay. NotificationToast stays at `z-[60]`. Both mount in `(app)/layout.tsx` as siblings.

### Pitfall 3: Modal Transition Timing vs `createPortal` Unmounting

**What goes wrong:** If Modal returns `null` when `!open`, the exit animation never plays because the element is removed from DOM before it can animate out.

**Why it happens:** Current Modal.tsx does `if (!open || typeof document === 'undefined') return null` — correct for no-animation, wrong for CSS transitions.

**How to avoid:** Keep the portal mounted, toggle visibility via CSS classes on `data-open` attribute. Or use a two-phase approach: set `isVisible` false (triggers CSS fade), then set `isOpen` false after `--motion-duration-normal` (300ms) delay to unmount. The simpler approach for this phase is `data-open` attribute CSS.

### Pitfall 4: Shimmer Keyframe Defined Per-Component

**What goes wrong:** `@keyframes shimmer` defined inside a `<style>` tag in `Skeleton.tsx` causes duplication and specificity issues when multiple skeleton instances render simultaneously.

**Why it happens:** Component-level CSS-in-JS instinct.

**How to avoid:** Define `@keyframes shimmer` and `.shimmer` class once in `apps/web/src/app/globals.css`. Skeleton component consumes via `className="shimmer"`.

### Pitfall 5: Hardcoded Color Audit Miss

**What goes wrong:** Pages that were refreshed still have hardcoded Tailwind color literals from the pre-token era (e.g., `text-gray-400`, `bg-zinc-800`, `border-gray-700`).

**Why it happens:** The audit pass (D-20) and page refresh (D-21) may happen in separate plans; if the audit is skipped or incomplete, hardcoded values survive.

**How to avoid:** Plan the audit as a discrete task in the same plan as page refresh, not as an afterthought. Run a grep for `text-gray`, `text-zinc`, `bg-gray`, `bg-zinc`, `border-gray`, `border-zinc` across `apps/web/src` to find remnants.

---

## Code Examples

### Button with Icon Prop (Upgraded)

```tsx
// Source: 18-UI-SPEC.md Component Upgrade Contract; reference apps/web/src/components/ui/Button.tsx
import { type LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--color-accent)] text-[var(--color-background)] hover:bg-[var(--color-accent-dark)]',
  secondary: 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]',
  ghost: 'bg-transparent text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]',
  outline: 'bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
};
```

### Badge Component

```tsx
// Source: 18-UI-SPEC.md; reference apps/mobile/src/components/ui/Badge.tsx
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'rarity-diamond' | 'rarity-star' | 'rarity-crown' | 'premium';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface-light)] text-[var(--color-on-surface)]',
  success: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  warning: 'bg-[rgba(230,126,34,0.2)] text-[var(--color-warning)]',
  error: 'bg-[rgba(231,76,60,0.2)] text-[var(--color-error)]',
  'rarity-diamond': 'bg-[rgba(126,200,227,0.15)] text-[var(--color-rarity-diamond)]',
  'rarity-star': 'bg-[rgba(240,192,64,0.15)] text-[var(--color-rarity-star)]',
  'rarity-crown': 'bg-[rgba(232,180,248,0.15)] text-[var(--color-rarity-crown)]',
  premium: 'bg-[var(--color-accent)] text-[var(--color-background)]',
};
```

### Card Component

```tsx
// Source: 18-UI-SPEC.md Card Elevation Spec
type Elevation = 'none' | 'low' | 'medium' | 'high';

const elevationStyles: Record<Elevation, React.CSSProperties> = {
  none: { boxShadow: 'var(--elevation-none)' },
  low: { boxShadow: 'var(--elevation-low)' },
  medium: { boxShadow: 'var(--elevation-medium)' },
  high: { boxShadow: 'var(--elevation-high)' },
};

// Hover: translate-y-[-2px] + medium shadow, transition var(--motion-duration-fast)
// Default elevation: 'low'
```

### ToastOverlay Positioning

```tsx
// Source: 18-UI-SPEC.md Toast Positioning
// Mounts in apps/web/src/app/(app)/layout.tsx alongside <NotificationToast />
<div className="fixed top-4 right-4 z-[100] flex w-80 flex-col gap-2">
  {queue.slice(0, 4).map((toast) => (
    <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
  ))}
</div>
```

### Skeleton Shaped Variants

```tsx
// Source: 18-UI-SPEC.md Skeleton shaped variants
// globals.css defines .shimmer keyframe
// Skeleton component applies it via className

function Skeleton({ className = '', variant = 'default' }: { className?: string; variant?: 'default' | 'circle' | 'text' | 'card' }) {
  const shapeClass = {
    default: '',
    circle: 'rounded-full',
    text: 'h-[14px] rounded-[4px]',
    card: 'rounded-[var(--border-radius-md)]',
  }[variant];

  return <div className={`shimmer ${shapeClass} ${className}`} aria-hidden="true" />;
}
```

---

## Token Pipeline Validation

This is a WEB-01 prerequisite — must be verified before any WEB-02/WEB-03 work begins.

| Check | Location | Finding |
|-------|----------|---------|
| `generate-css-tokens.ts` is executable | `packages/shared/scripts/generate-css-tokens.ts` | File exists. CLI entry point uses `require.main === module` pattern — runs via `ts-node` or compiled JS |
| Turborepo `generate-tokens` task | `turbo.json` | Task defined with `"dependsOn": []` and `"outputs": ["apps/web/src/app/tokens.css"]`. Build depends on it via `"dependsOn": ["^build", "generate-tokens"]` — CONFIRMED WIRED |
| `tokens.css` current | `apps/web/src/app/tokens.css` | 68 vars present across colors, spacing, border-radius, typography, motion, elevation |
| `globals.css` imports `tokens.css` | `apps/web/src/app/globals.css` | `@import "./tokens.css"` — CONFIRMED |
| `layout.tsx` loads Inter font | `apps/web/src/app/layout.tsx` | Inter font currently NOT using next/font — uses standard CSS only. **Action required: add `next/font/google` import and apply className to `<html>` element.** |

**Key finding on Inter font:** The root `layout.tsx` does NOT currently use `next/font` — it only imports `globals.css`. D-07 requires Inter be loaded via `next/font`. This is a Wave 0 task.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind config via `tailwind.config.js` | CSS-first `@theme` block in CSS file | Tailwind v4 (this project) | Token vars registered directly in CSS; no JS config needed for theme values |
| `animate-pulse` for skeleton | CSS `@keyframes shimmer` gradient sweep | Phase 18 (this phase) | Visual parity with mobile shimmer pattern |
| Hardcoded Tailwind color names (`text-gray-400`) | Token CSS vars via `@theme` mappings | Phase 13 (foundation), Phase 18 (audit completion) | All colors traceable to shared token package |

**Deprecated/outdated:**
- `animate-pulse` on Skeleton: replaced by `shimmer` class per D-12
- Hardcoded color references (`bg-red-500`, `text-gray-400`, etc.): replaced by token vars per D-20

---

## Open Questions

1. **Inter font in layout.tsx**
   - What we know: `apps/web/src/app/layout.tsx` does not import `next/font/google` — it only sets `globals.css`
   - What's unclear: Whether Inter is loading via the CSS `@import` chain or not at all on production
   - Recommendation: Wave 0 task — add `next/font/google` Inter import and apply `className` to `<html>` element. This is low risk.

2. **Hardcoded value scope in component files**
   - What we know: Page-level files use token-backed Tailwind aliases (`bg-surface`, `text-gold`). Sub-components in `cards/`, `collection/`, `trading/`, `meta/` directories have not been audited.
   - What's unclear: How many component files under `apps/web/src/components/` contain non-token color references
   - Recommendation: The D-20 audit task should grep for `text-gray`, `text-zinc`, `bg-gray`, `bg-zinc`, `border-gray`, `border-zinc`, `bg-red-`, `bg-green-`, `bg-blue-` and log all hits before deciding scope. These may not all need fixing in Phase 18.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | not present in `apps/web/` root — inferred from `package.json` test scripts |
| Quick run command | `pnpm --filter web test` |
| Full suite command | `pnpm --filter web test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WEB-01 | `tokens.css` contains expected CSS vars after script runs | smoke | `pnpm generate-tokens && grep --count "color-accent" apps/web/src/app/tokens.css` | ❌ Wave 0 |
| WEB-02 | Badge renders correct variant classes | unit | `pnpm --filter web test` | ❌ Wave 0 |
| WEB-02 | Toast store `show/dismiss` state mutations | unit | `pnpm --filter web test` | ❌ Wave 0 |
| WEB-02 | Skeleton renders shimmer class for each variant | unit | `pnpm --filter web test` | ❌ Wave 0 |
| WEB-03 | Manual — visual review of all 8 pages | manual-only | N/A — requires browser | N/A |

### Sampling Rate

- **Per task commit:** None mandated (all visual work, minimal unit logic)
- **Per wave merge:** `pnpm --filter web test` (covers Badge/Toast store unit tests)
- **Phase gate:** Full suite green + manual visual review before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/src/components/ui/__tests__/Badge.test.tsx` — covers WEB-02 Badge variant rendering
- [ ] `apps/web/src/stores/__tests__/toast.test.ts` — covers WEB-02 Toast store show/dismiss
- [ ] `apps/web/src/components/ui/__tests__/Skeleton.test.tsx` — covers WEB-02 Skeleton variants
- [ ] Vitest config file — `package.json` references `vitest run` but no `vitest.config.ts` found; may be relying on defaults. Confirm before writing tests.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection: `apps/web/src/app/tokens.css` — 68 generated vars confirmed
- Codebase direct inspection: `turbo.json` — pipeline wiring confirmed
- Codebase direct inspection: `apps/web/src/components/ui/{Button,Input,Skeleton,Modal}.tsx` — current component state
- Codebase direct inspection: `apps/mobile/src/components/ui/{Badge,EmptyState,ToastOverlay}.tsx` — mobile reference for API parity
- Codebase direct inspection: `apps/mobile/src/stores/toast.ts` — Toast Zustand store reference
- `.planning/phases/18-web-companion-sync/18-CONTEXT.md` — locked decisions D-01 through D-23
- `.planning/phases/18-web-companion-sync/18-UI-SPEC.md` — resolved discretionary decisions (shimmer, toast positioning, card elevation, grid layout)
- `apps/web/package.json` — confirmed: Next.js 15.2, React 19.1, Tailwind 4.0, Zustand 5.0, Lucide React 0.500, Vitest 4.1.0

### Secondary (MEDIUM confidence)

- Tailwind v4 `@theme` block behavior: confirmed via existing `tokens.css` structure and Tailwind v4 CSS-first config documentation patterns

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from `package.json`; all libraries already installed
- Token pipeline (WEB-01): HIGH — script, output file, and Turborepo task all verified by direct file inspection
- Architecture (WEB-02, WEB-03): HIGH — mobile reference components read directly; all patterns derived from existing codebase
- Pitfalls: HIGH — derived from reading actual existing code (Modal unmount pattern, NotificationToast z-index, existing `animate-pulse` pattern)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable stack, no fast-moving dependencies)
