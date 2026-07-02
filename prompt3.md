# Project Improvement Roadmap — Within Three Months

> Perspective: Staff Engineer. Assumes prompt1 (week) and prompt2 (month) are delivered: CI with budgets, tested engines, Changesets, split bundles. The three-month horizon is where `smart-component` graduates from "a very good component library in a monorepo" to **an internal design-system platform other teams can adopt without hand-holding**. Everything below is grouped into monthly milestones with measurable success criteria.

---

## Month 1 — Design-system workbench & documentation platform

### 1. Storybook (or Ladle) as the component workbench

**Why:** Today the playground app is the only way to see components, and it demonstrates _pages_, not _component states_. A workbench gives every component an enumerable, testable state matrix and becomes the substrate for visual regression and docs.

**Work:**

- Add a `packages/ui` Storybook 9 setup (Vite builder — config reuse is trivial since the library is source-exported) or Ladle if startup speed is preferred.
- Stories for: all 41 smart wrappers, the page-system layouts (document/dashboard/split/grid), every form-engine field type (wire a story-level `SmartForm` harness), both grids against a story-scoped MSW addon.
- Enforce via CI check: every new `smart-components/**` or `form-engine/**` component file must ship a colocated `*.stories.tsx` (script comparing globs).
- Deploy static Storybook per-PR (artifact) and on main (GitHub Pages/Netlify) — this becomes the shareable design-system URL.

**Success criteria:**

- ≥ 95% of exported smart components have stories with at least default/disabled/error/dark variants.
- Storybook URL linked from README; PR previews auto-posted.

### 2. Design-token formalization

**Why:** Tokens live implicitly in `globals.css` CSS variables. Formalizing them unlocks theming per-brand, dark-mode audits, and non-Tailwind consumers later.

**Work:**

- Extract a canonical token source (`packages/ui/src/styles/tokens.css` or a small JSON→CSS build with Style Dictionary only if multi-platform output is actually needed — avoid tooling for tooling's sake).
- Document token semantics (what `--muted-foreground` is _for_) in Storybook docs pages.
- Add a contrast-audit story/test (axe) across light/dark for token pairs.

**Success criteria:** Token reference page exists; automated contrast check passes AA for all standard pairs in both modes.

### 3. Documentation site content

**Why:** Storybook autodocs cover props; humans need guides.

**Work:** Author per-domain guides as MDX in Storybook (or a `docs/` folder surfaced there): "Building a CRUD page" (SmartPage + SmartServerGrid + createPageFetcher), "Schema-driven forms" (FieldDefinition patterns, custom fields via registry), "Extending the grid" (filters dialect, persistence), "Theming". Include the decision records: ADR-001 Base UI over Radix, ADR-002 source-only package, ADR-003 hand-rolled XLSX, ADR-004 Spring page contract (write these four ADRs — the reasoning currently lives only in code comments and CLAUDE.md).

**Success criteria:** Four guides + four ADRs published; a new team can build the CRUD reference page from docs alone (validated by having someone outside the project do it).

---

## Month 2 — Testing strategy at scale, automation, and a11y depth

### 4. Visual regression testing

**Why:** The library's value is visual consistency; unit tests can't see a broken layout. The slot-based SmartPage and grid fill-mode are exactly the kind of CSS that regresses silently.

**Work:**

- Chromatic (fastest path, pairs with Storybook) **or** Playwright screenshot testing against Storybook stories (self-hosted, no vendor).
- Baseline all stories in light + dark; gate PRs on approved diffs.

**Success criteria:** Visual diffs run on every PR touching `packages/ui`; zero unreviewed visual changes reach main; flake rate < 2%.

### 5. Interaction & accessibility test depth

**Why:** Month-one added jsx-a11y (static) and smoke E2E; this closes the loop at the component level.

**Work:**

- Storybook interaction tests (`play` functions) for stateful flows: combobox keyboard navigation, multi-select max-selected, date-range selection, form submit-focus-first-error, dialog focus trap/restore.
- `@axe-core/playwright` sweep across all Storybook stories and the playground's key routes, wired into CI with a zero-serious-violations gate.
- Keyboard-only walkthrough spec for the grid toolbar and page tabs.

**Success criteria:** axe: 0 serious/critical violations across stories; interaction tests cover the 10 riskiest widgets; a documented keyboard support table per component family.

### 6. Test pyramid rebalancing & CI performance

**Why:** As suites grow (unit + interaction + visual + E2E), CI time and flake become the constraint.

**Work:**

- Vitest projects/workspaces config (unit vs component), sharded in CI; investigate the 89 s jsdom environment cost (pool options, happy-dom evaluation for pure-logic suites).
- Turbo task graph: only affected packages test on PR (`turbo run test --filter=...[origin/main]`).
- Quarantine lane for flaky tests with auto-issue creation.

**Success criteria:** PR CI p95 < 8 min including visual tests; flaky-test escape rate tracked and < 1%/week; affected-only runs verified by touching a docs file (should skip tests entirely).

### 7. Release automation completion

**Why:** Changesets exists (month 1); now make releases boring.

**Work:** Auto-release on merge of the changeset PR; publish `@workspace/ui` to the org's private registry (GitHub Packages/npm private); tag Storybook deploys per release; generate release notes from changesets + conventional commits.

**Success criteria:** A release requires zero manual steps beyond merging the version PR; time-from-merge-to-consumable < 15 min.

---

## Month 3 — Domain organization, observability, security, and API maturity

### 8. Feature-module / domain reorganization of the playground into a reference app

**Why (Staff-level framing):** The playground's flat `pages/` works for demos but doesn't model how a real product should consume the library. Turning `apps/web` into a **reference architecture** multiplies the library's adoption value: teams copy structure, not just components.

**Work:**

- Restructure `apps/web/src` into feature modules: `features/users/` (api + queries + components + pages), `features/analytics/`, `features/settings/`, with a `shared/` layer. Route objects colocated per feature, composed in `App.tsx` (react-router lazy route objects).
- Each feature demonstrates the full stack: Zod contract → TanStack Query hooks → SmartServerGrid/SmartForm → toasts/error boundaries.
- Add route-level error boundaries (react-router `errorElement`) and 404 handling — currently absent.
- Document the structure as the recommended consumer blueprint.

**Success criteria:** Every feature is deletable by removing one folder + one route import; lint rule (import boundaries via `eslint-plugin-boundaries` or `no-restricted-imports` patterns) enforces feature isolation; blueprint doc published.

### 9. Observability & runtime monitoring hooks

**Why:** A component library can't ship telemetry itself, but it must be _instrumentable_, and the reference app should demonstrate the pattern.

**Work:**

- Extend the month-one `diagnostics` module into a stable instrumentation surface: grid fetch timings (`onFetchComplete(params, durationMs, rowCount)`), form submit outcomes, editor errors — all no-op by default.
- Reference app wires these to a demo sink (console table + optional Sentry/OTel example behind an env flag) showing Core Web Vitals capture (`web-vitals`), error boundary reporting, and MSW-visible request logging.
- Add `web-vitals` budget assertions to the Playwright suite (LCP/CLS on the CRUD page under MSW latency).

**Success criteria:** All library instrumentation points documented; reference app dashboards demo end-to-end; LCP < 2.5 s / CLS < 0.1 on the reference CRUD route in CI (built app, throttled).

### 10. Security hardening pass

**Why:** Before external teams consume the library and reference app, the security posture must be explicit rather than incidental.

**Work:**

- Dependency automation: Renovate (grouped, scheduled) + `pnpm audit` CI gate + OSV scanning; document the `allowBuilds` policy and review cadence.
- CSP for the deployed Storybook/reference app (no `unsafe-inline` scripts; hash Vite preamble if needed), plus standard headers (HSTS, X-Content-Type-Options, frame-ancestors).
- Threat-model workshop output for the library: editor HTML (sanitization helper adoption verified), export injection (tests from month one kept green), localStorage persistence keys (no PII guidance), postMessage/iframe guidance for future embeds.
- SECURITY.md with reporting process.

**Success criteria:** Renovate merging green minor updates weekly with < 30 min human time; CSP deployed with zero violations in report-only for a week then enforced; SECURITY.md + threat-model doc merged.

### 11. Server-contract API maturity

**Why:** `ServerFetchParams`/`ServerFilter` + the Spring dialect are the library's de-facto wire API. Three months in, other backends will appear.

**Work:**

- Version the contract: `ServerFetchParams` marked `@public` with semver guarantees; publish JSON Schema for the filter/sort dialect.
- Ship a second dialect adapter (`toRestQuery` for `?filter[field][op]=value` style, or OData) proving the abstraction, plus a contract-test kit (`runFetcherContractTests(fetchRows)`) consumers run against their backend adapters.
- Decide and document the `data-grid` exports-map question (it's consumed by the app but absent from `exports`; formalize as `./data-grid` public entry — it already exists — and document stability tiers: stable / experimental / internal per entry point).

**Success criteria:** Two dialect adapters with shared contract tests; stability tier table in docs; zero breaking changes to `ServerFetchParams` without a major changeset.

---

## Cross-cutting tracks (run all three months)

| Track               | Practice                                                                                                                                                                        | Measure                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Quality ratchet** | Coverage thresholds +5 pts/month on `form-engine/` + `smart-components/`; bundle budget tightened after each win                                                                | Coverage report trend; budget file history                  |
| **DX**              | Track `pnpm install` → first `pnpm dev` paint time; keep PR CI < 8 min; add `pnpm new:component` generator (restore `@turbo/gen` with real templates: component + story + test) | Onboarding time < 15 min measured quarterly                 |
| **Docs**            | Every PR touching public props updates stories/docs (CI glob check)                                                                                                             | Doc-drift issues found in review → 0                        |
| **Adoption**        | Monthly demo to prospective consumer teams; intake of their gaps as issues                                                                                                      | ≥ 1 external team building on the library by end of month 3 |

---

## Three-month scorecard (targets)

| Dimension (audit baseline) | Target                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| Testing (5/10)             | 8/10 — unit + interaction + visual + E2E pyramid, affected-only CI |
| Documentation (5/10)       | 8/10 — Storybook + guides + ADRs + blueprint                       |
| Performance (5/10)         | 8/10 — budgets enforced, vitals asserted, initial JS < 500 kB      |
| Accessibility (6/10)       | 8/10 — axe-clean stories, keyboard tables, contrast automation     |
| Security (6/10)            | 8/10 — Renovate, CSP, threat model, SECURITY.md                    |
| DX (7/10)                  | 9/10 — workbench, generators, < 8 min CI, one-command onboarding   |
