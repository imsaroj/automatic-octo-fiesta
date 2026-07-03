# Project Improvement Roadmap — Within One Month

> Scope: medium-sized improvements building directly on the one-week roadmap (prompt1.md), which is assumed complete: CI exists, routes are lazy, dead code is gone, coverage has a baseline. This month turns the library from "excellent code" into "dependable product": tested, documented, structurally future-proof.

---

## Week 1 — Testing foundation

### 1.1 Component render-test suite for the Smart wrapper layer

- **Objective:** Render tests (Vitest + Testing Library, already configured) for the ten highest-traffic smart components: `SmartDialog`, `SmartForm` (per-field-type rendering), `SmartSelect`, `SmartCombobox`, `SmartDatePicker`, `SmartConfirmDialog`, `SmartInput`, `SmartCheckboxGroup`, `SmartPage` (slot bucketing + layout detection), `SmartEmptyState`/`SmartPageError`.
- **Implementation:** One `*.test.tsx` colocated per component. Test the _contract_, not the styling: trigger renders, open/close semantics, `header`/`footer` slots land where expected, controlled `data`/`setData` round-trips, error/required display. For `SmartPage`, assert `detectLayout` picks `grid`/`dashboard`/`split`/`document` correctly from children.
- **Complexity:** Medium (Base UI portal/popup patterns need `user-event` and sometimes fake timers).
- **Dependencies:** None (infra exists).
- **Expected benefits:** The public API surface most consumers touch gets regression protection; refactors later this month (field registry, page split) become safe.

### 1.2 Re-establish `SmartServerGrid` coverage with an explicit AG Grid boundary

- **Objective:** Restore the integration coverage deleted in commit `a2f5127` without fighting AG Grid in jsdom.
- **Implementation:** Two-pronged: (a) keep growing the pure-helper tests (already good); (b) add a thin "datasource harness" test that instantiates the component's datasource logic by extracting it into a testable `createGridDatasource(refs…)` factory in `server-grid-internals.ts` — then test paging/abort/error/filter-merge flows with a fake `IGetRowsParams`. Full-browser behavior goes to Playwright (1.3).
- **Complexity:** Medium.
- **Dependencies:** None.
- **Expected benefits:** The most complex stateful component in the repo regains executable specification; the extraction also shrinks `server-data-grid.tsx`.

### 1.3 Playwright smoke E2E against the MSW playground

- **Objective:** Stand up the already-installed `@playwright/test` with a small, fast suite (5–8 specs) that exercises real browser behavior CI can trust.
- **Implementation:** `playwright.config.ts` at root (`webServer: pnpm --filter web dev`, or `vite preview` on the built app). Specs: server grid loads rows through MSW → sort round-trips to the query string → filter → error route shows Retry panel → retry recovers; form-engine basic page validates + submits; theme toggle switches `documentElement` class; a lazy route chunk loads. Add a CI job (chromium only, trace on retry).
- **Complexity:** Medium.
- **Dependencies:** CI from week-1 roadmap.
- **Expected benefits:** End-to-end confidence covering exactly the layer jsdom can't (AG Grid canvas/virtualization, portals, real network through MSW).

---

## Week 2 — Architecture cleanup in the two engines (Done)

### 2.1 Field-registry refactor of the form engine

- **Objective:** Replace the ~250-line `switch` in `FieldRenderer` (`smart-form.tsx`) with a declarative registry: `Record<FieldType, FieldEntry>` where each entry knows its component, default empty value (absorbing `defaultForType`), and prop-mapping.
- **Implementation:** New `form-engine/field-registry.tsx`. Each entry: `{ component, defaultValue, mapProps(field, common) }`. `SmartForm` looks up by `field.type`. Export a `registerField()` (or accept a `registry` prop) so apps can add custom field types — the single most-requested extension point for form engines.
- **Complexity:** Medium.
- **Dependencies:** 1.1 SmartForm tests first (safety net).
- **Expected benefits:** `smart-form.tsx` drops from 719 to ~350 LOC; adding a field type becomes additive (new file + registry entry); custom fields become possible without forking.

### 2.2 Discriminated-union `FieldDefinition`

- **Objective:** Make invalid field configs unrepresentable: `{ type: "select"; options: … }` vs `{ type: "number"; min?; max?; decimalScale? }` etc., unioned as `FieldDefinition<T>`.
- **Implementation:** Define a `FieldBase<T>` (name/label/colSpan/hidden/…) and per-family extensions (TextField, NumberField, ChoiceField, DateTimeField, RangeField…). Keep the union assignable from today's wide type where sensible to soften migration; update demo pages (they are the only consumers).
- **Complexity:** Medium–High (type-level work; runtime unchanged).
- **Dependencies:** 2.1 (registry gives one natural place per type to anchor the mapping).
- **Expected benefits:** Compile-time rejection of `decimalScale` on a checkbox; editor autocomplete per field type; the registry and union document each other.

### 2.3 Decompose the Lexical toolbar plugin

- **Objective:** Break `toolbar-plugin.tsx` (1,375 LOC — 5% of the entire codebase) into cohesive modules.
- **Implementation:** `plugins/toolbar/` folder: `block-format-menu.tsx`, `inline-marks.tsx`, `insert-menu.tsx`, `align-menu.tsx`, `link-editor.tsx`, shared `use-toolbar-state.ts` (selection-derived state), thin `toolbar-plugin.tsx` composing them. No behavior change; respect the existing eslint override for Lexical node files.
- **Complexity:** Medium (mostly mechanical; selection-state hook is the careful part).
- **Dependencies:** None.
- **Expected benefits:** The largest change-risk concentration in the repo becomes reviewable; toolbar sections become individually testable and reusable (e.g. a minimal toolbar variant for `SmartTextEditorField`).

### 2.4 Split `SmartPage` layout renderers

- **Objective:** Reduce `smart-page.tsx` (553 LOC) by extracting the four layout render paths.
- **Implementation:** `page/layouts/{document,dashboard,split,grid}.tsx`, each receiving `SlotBuckets` + context value. `SmartPage` keeps slot collection, `detectLayout`, context wiring.
- **Complexity:** Low–Medium.
- **Dependencies:** 1.1 SmartPage tests.
- **Expected benefits:** Each layout evolves independently; slot logic stays in one auditable place.

---

## Week 3 — API layer, validation, and shared utilities

### 3.1 Generalize the validated page-fetcher

- **Objective:** Promote the pattern in `apps/web/src/api/users.ts` (fetch → status check → Zod `pageSchema` parse → `{rows,total}`) into a reusable helper so every future grid consumer gets validated fetching for free.
- **Implementation:** `data-grid/create-page-fetcher.ts`: `createPageFetcher({ url, itemSchema, buildQuery?, mapError? }) → fetchRows`. Default `buildQuery` = the Spring dialect currently in `users-query.ts` (move the encoder into the library next to `toSpringSort`; the _decoder_ stays app/mock-side). Refactor `users.ts` onto it.
- **Complexity:** Medium.
- **Dependencies:** None.
- **Expected benefits:** New server-grid pages go from ~40 lines of adapter code to ~5; the Spring dialect gets a single tested home.
- **Note:** This adds the first `fetch`-using module to the library — keep it transport-injectable (`fetchImpl` param) to preserve testability and future SSR use.

### 3.2 Introduce TanStack Query in the playground app (pattern-setting)

- **Objective:** Establish the data-fetching pattern real consumer apps will copy: caching, retries, invalidation — currently absent (raw `fetch` per grid block is fine, but CRUD/detail/settings demo pages simulate data with `useState`).
- **Implementation:** Add `@tanstack/react-query` to `apps/web` only (not the library). Wrap the app in a provider; convert the CRUD example page to `useQuery`/`useMutation` against new MSW handlers (add POST/PUT/DELETE for users). Document the recipe.
- **Complexity:** Medium.
- **Dependencies:** MSW handlers extension.
- **Expected benefits:** The playground demonstrates the full enterprise data story (grid + mutations + optimistic update + toast), not just reads; the library stays fetch-agnostic.

### 3.3 Shared demo-data module + `SmartStatCard`

- **Objective:** Deduplicate the inline fake datasets and hand-rolled KPI cards across `analytics-example-page`, `dashboard-example-page`, and grid pages.
- **Implementation:** `apps/web/src/demo-data/` with typed generators (seeded, deterministic); extract `SmartStatCard` (label, value, delta, icon) into `packages/ui/src/smart-components/` per the placement rule (general-purpose).
- **Complexity:** Low.
- **Dependencies:** None.
- **Expected benefits:** Demo pages shrink 20–40%; a genuinely reusable dashboard primitive joins the library.

### 3.4 Unify error-state primitives

- **Objective:** One error-panel implementation instead of three near-identical ones (`ErrorPanel` in `server-data-grid.tsx`, `SmartPageError`, ad-hoc demo error blocks).
- **Implementation:** Give `SmartPageError` (or a new `SmartErrorState`) a compact/overlay variant; use it inside the grid; keep the Retry affordance.
- **Complexity:** Low.
- **Dependencies:** 1.1 tests.
- **Expected benefits:** Consistent error UX and a11y in one place.

---

## Week 4 — CI/CD maturation, logging, and release readiness

### 4.1 CI hardening: Turbo remote cache, matrix, bundle budget

- **Objective:** Make CI fast and add the guardrails that keep month-one wins won.
- **Implementation:** Turborepo remote caching (Vercel remote cache or self-hosted); split jobs (lint/typecheck, unit, E2E) for parallelism; add a **bundle-size budget check** (e.g. `size-limit` or a script diffing `dist/assets` against committed budgets — initial JS chunk < 500 kB post-splitting); upload Playwright traces and coverage lcov as artifacts.
- **Complexity:** Medium.
- **Dependencies:** Week-1 CI, prompt1 Task 2 splitting.
- **Expected benefits:** Sub-5-minute PR feedback; the 2.6 MB regression can never silently return.

### 4.2 Changesets-based versioning

- **Objective:** Give `@workspace/ui` a real version/changelog lifecycle before anything external consumes it.
- **Implementation:** `pnpm add -w @changesets/cli`, `changeset init`; PR bot requiring a changeset for `packages/ui` changes; release workflow that versions + tags (publishing target decided later — private registry or repo tags only). Conventional commits already enforced, so changelog quality is high by default.
- **Complexity:** Low–Medium.
- **Dependencies:** CI.
- **Expected benefits:** Consumers can pin, upgrade deliberately, and read what changed; prerequisite for the 3-month "internal release" goal.

### 4.3 Library logging/diagnostics convention

- **Objective:** Replace ad-hoc `console.*` with a deliberate policy: the library never logs in production paths except through a tiny injectable reporter.
- **Implementation:** `lib/diagnostics.ts` — `onWarning?: (scope, message, detail) => void` set via a provider or module setter; route the `SmartTextEditor` `onError` console fallback and future dev-warnings through it; add an ESLint `no-console` rule (allow `warn`/`error` in `apps/web` dev code, forbid in `packages/ui/src` except `diagnostics.ts`).
- **Complexity:** Low.
- **Dependencies:** None.
- **Expected benefits:** Consumer apps can pipe library warnings into their own telemetry; no stray logs (the class of bug found in `users.ts:35`) can recur in the library.

### 4.4 Validation & security follow-through

- **Objective:** Close the two forward-looking security items from the audit.
- **Implementation:** (a) Document the `SmartTextEditor` HTML contract in JSDoc + README ("output is unsanitized editor HTML; sanitize at render"), and ship an optional `sanitizeEditorHtml()` helper (isomorphic-dompurify) so consumers fall into the pit of success. (b) Enable AG Grid CSV export formula-escaping and verify the XLSX writer's inline-string behavior with a formula-injection test case (`=cmd|…` stays literal text).
- **Complexity:** Low–Medium.
- **Dependencies:** None.
- **Expected benefits:** The two most likely future XSS/injection vectors are documented and defended before any real data flows through.

---

## Month-end definition of done

- [ ] ≥ 10 smart components with render tests; grid datasource factory tested; 5–8 Playwright specs green in CI
- [ ] Coverage thresholds raised from week-1 baseline (target: +15 pts on `smart-components/` + `form-engine/`)
- [ ] `smart-form.tsx` ≤ ~400 LOC with field registry; `FieldDefinition` discriminated; `toolbar-plugin.tsx` split; `smart-page.tsx` split
- [ ] `createPageFetcher` shipped; CRUD demo uses TanStack Query + MSW mutations
- [ ] CI < 5 min with remote cache; bundle budget enforced; Changesets releasing versioned changelogs
- [ ] Editor-HTML sanitization documented + helper shipped; export injection test in suite
