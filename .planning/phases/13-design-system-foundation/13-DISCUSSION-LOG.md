# Phase 13: Design System Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 13-design-system-foundation
**Areas discussed:** Color palette & semantics, Token hierarchy & structure, Migration & backward compat, Package layout & cross-platform sync

---

## Color Palette & Semantics

### Q1: Canonical palette source

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile colors | Keep #0f0f1a/#1a1a2e/#252540 — blue undertone depth. Update web to match. | |
| Web colors | Keep #0a0a0a/#18181b/#27272a — neutral zinc tones. Update mobile to match. | |
| New unified palette | Design a fresh set of dark values for both platforms. | ✓ |

**User's choice:** New unified palette
**Notes:** Neither current platform's colors are canonical. Fresh palette needed.

### Q2: Semantic color extent

| Option | Description | Selected |
|--------|-------------|----------|
| Core set | surface, onSurface, accent, error, success, warning — matches DS-02 | ✓ |
| Extended set | Core + surfaceVariant, onSurfaceVariant, accentContainer, outline, scrim | |
| Minimal | background, text, accent, error only | |

**User's choice:** Core set
**Notes:** None

### Q3: Warning color

| Option | Description | Selected |
|--------|-------------|----------|
| Orange warning (#f59e0b) | Amber/orange distinct from gold brand accent | |
| Reuse gold for warning | Gold doubles as warning — fewer tokens | |
| You decide | Claude picks appropriate warning color | ✓ |

**User's choice:** You decide
**Notes:** Claude has discretion on warning color selection.

### Q4: Rarity colors as tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Include in tokens now | Rarity colors used in 10+ files with hardcoded hex | ✓ |
| Defer to Phase 16 | Handle during screen migration | |

**User's choice:** Include in tokens now
**Notes:** None

---

## Token Hierarchy & Structure

### Q1: Token hierarchy organization

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier | Primitive → Semantic. Simple, matches current structure. | ✓ |
| Three-tier | Primitive → Semantic → Component. More precise but more upfront work. | |
| Flat | All tokens at one level. Simplest but harder to theme later. | |

**User's choice:** Two-tier
**Notes:** None

### Q2: Spacing naming convention

| Option | Description | Selected |
|--------|-------------|----------|
| Keep named sizes | xs/sm/md/lg/xl/xxl — matches existing code | ✓ |
| Numeric scale | spacing.1=4, spacing.2=8 — Tailwind-style | |
| Both | Named aliases over numeric base | |

**User's choice:** Keep named sizes
**Notes:** None

### Q3: Elevation tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Include now | DS-01 lists elevation. Define 3-4 levels. | ✓ |
| Defer to Phase 16 | Define when building components | |

**User's choice:** Include now
**Notes:** None

### Q4: Motion curve tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Define curves here | Easing + duration tokens in token package. Phase 15 consumes. | ✓ |
| Defer to Phase 15 | Let motion system define its own curves. | |

**User's choice:** Define curves here
**Notes:** None

---

## Migration & Backward Compat

### Q1: Backward-compatible shim approach

| Option | Description | Selected |
|--------|-------------|----------|
| Re-export shim | theme.ts re-exports old names from new tokens. Zero consumer changes. | ✓ |
| Deprecation + gradual | Mark old exports @deprecated, migrate incrementally. | |
| Big-bang rename | Update all 60 files to import from new package. | |

**User's choice:** Re-export shim
**Notes:** None

### Q2: Audit output format

| Option | Description | Selected |
|--------|-------------|----------|
| Tracking spreadsheet | File, line, hardcoded value, suggested token replacement. | ✓ |
| Fix during audit | Replace hardcoded values during Phase 13. | |
| Report only | Count and categorize only. | |

**User's choice:** Tracking spreadsheet
**Notes:** None

### Q3: Web backward compat

| Option | Description | Selected |
|--------|-------------|----------|
| Replace directly | Small blast radius (1 file + CSS). No shim needed. | ✓ |
| Shim like mobile | Web-side shim for consistency. | |

**User's choice:** Replace directly
**Notes:** None

### Q4: Hardcoded value migration timing

| Option | Description | Selected |
|--------|-------------|----------|
| Later phases | Phase 13 creates tokens + shim + audit. Phases 16/17 fix values. | ✓ |
| Phase 13 fixes all | Replace all 126 hardcoded values now. | |

**User's choice:** Later phases
**Notes:** None

---

## Package Layout & Cross-Platform Sync

### Q1: Token package location

| Option | Description | Selected |
|--------|-------------|----------|
| packages/shared/tokens/ | Subdirectory of existing shared package. Matches ROADMAP.md. | ✓ |
| packages/tokens/ | Separate package at monorepo root. | |
| packages/shared/src/tokens/ | Inside shared/src alongside schemas. | |

**User's choice:** packages/shared/tokens/
**Notes:** None

### Q2: CSS generation method

| Option | Description | Selected |
|--------|-------------|----------|
| Build script in Turborepo | Node script reads TS tokens, outputs CSS. Pipeline step. | ✓ |
| Runtime JS injection | Set CSS vars at runtime. FOUC risk. | |
| Dual source manually | Maintain separately, validate in CI. | |

**User's choice:** Build script in Turborepo
**Notes:** None

### Q3: Export format

| Option | Description | Selected |
|--------|-------------|----------|
| Raw values only | Plain objects. Each platform wraps as needed. | ✓ |
| Raw + helpers | Also export createTheme() or platform utilities. | |

**User's choice:** Raw values only
**Notes:** None

### Q4: CSS file strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Separate file, imported | Generate tokens.css, import in globals.css. | ✓ |
| Replace @theme block | Overwrite @theme section in globals.css directly. | |

**User's choice:** Separate file, imported in globals.css
**Notes:** None

---

## Claude's Discretion

- Warning color selection (distinct from gold accent)
- Unified dark palette exact values
- Elevation shadow values per level
- Motion easing functions and duration scale
- Audit spreadsheet format/tooling

## Deferred Ideas

None — discussion stayed within phase scope.
