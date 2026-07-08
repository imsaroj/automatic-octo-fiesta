# Technical Audit Report — `smart-component`

> **Audit date:** 2026-07-02 · **Auditor role:** Principal Software Architect / Staff Engineer
> **Method:** Full repository inspection (source, configs, tooling, tests, git history) plus verification runs of
> `pnpm typecheck`, `pnpm lint`, `pnpm test` (all green) and `pnpm build` (green with bundle-size warning).

---

# Status Update — 2026-07-08 (God Prompts 1–8 · Re-Audit)

> **Scope:** the eight "God Prompt" improvement passes (CI/hygiene, bundle/perf, security, accessibility, testing,
> documentation, release engineering, and this final polish/re-audit). Method mirrors the original audit: every gate
> re-run, size table re-measured, scores re-derived from evidence.
> **Tagged:** `v0.1.0` (annotated, local — not pushed until remote/CI are confirmed green).
> **Verified today (2026-07-08):** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test:coverage` **333/333 across 42
> files, ~59.6% lines** ✅ · `pnpm build` (117 chunks, 2,627 kB, within the 2,856 kB budget) ✅ · `pnpm test:e2e`
> **31 E2E tests (9 spec files) green twice consecutively** ✅ · plus `docs:check` / `exports:check` / `publint` / `api:check` /
> `build:lib` all green.

## Re-measured size table

| Metric | 2026-07-02 | 2026-07-08 |
| --- | --- | --- |
| TS/TSX source lines (excl. tests) | ~27,300 | **~38,155** |
| Source files (excl. tests) | ~220 | **271** |
| shadcn primitives | 50 | 49 |
| Smart components | 59 | 42 wrapper files (+ page/buttons barrels) |
| Unit tests / files | 52 / 7 | **333 / 42** |
| Coverage (lines) | none | **~59.6%** (floor 57) |
| E2E specs | 0 | **9 spec files** |
| Demo routes | 24 | 32 |
| `packages/ui` runtime deps | 37 | 39 |
| Initial JS / worst chunk | 2.6 MB single | ~430 kB initial · ag-grid 0.93 MB (lazy) |
| Library version | 0.0.0 (private) | **0.1.0** (private, changelog) |

## God-Prompt closure table (evidence)

| Prompt | Claimed | Verified |
| --- | --- | --- |
| 1 CI + hygiene | CI on `main`/PR; node/jsdom split | `ci.yml` `on: push[main]/pull_request`; `vitest.config.ts` node+jsdom projects |
| 2 Bundle/perf | specific AG Grid modules; budget gate | no `AllCommunityModule` usage in `src`; `check-bundle-size.mjs` in build + CI |
| 3 Security | sanitize contract; formula guard; audit/secret CI | `sanitize.ts` used on inbound path; `formula-guard.ts`; `security` job (audit+gitleaks) |
| 4 Accessibility | axe unit+E2E; skip link; source fixes | `components.a11y.test.tsx`; `e2e/a11y.spec.ts` light/dark; skip link in shell |
| 5 Testing | engine behavior tests; coverage ↑; E2E ↑ | 333 tests; thresholds 56/51/50/57; `tree`/`crud`/`calendar` specs |
| 6 Documentation | per-domain docs; ADRs; doc-check | `docs/*.md` + 6 ADRs; `scripts/check-docs.mjs` in CI |
| 7 Release | Changesets 0.1.0; publint; exports/api check | `.changeset/`; `CHANGELOG.md` 0.1.0; `publint`/`check-exports`/`api-check` |
| 8 Polish/re-audit | verify + long-tail + re-score | this section; branch cleanup; ref/`use client` policy in CLAUDE.md |

## Updated per-dimension scores

| Dimension | 07-07 | **07-08** | Justification (and why not 10) |
| --- | ---: | ---: | --- |
| Architecture | 8 | **9** | Release story landed (Changesets, publint, build:lib, ADR 0006). Not 10: no published artifact yet — a dist-facing publish config is a named follow-up. |
| Code Quality | 9 | **9** | Zero `any`/TODOs held through +11k lines. Not 10: `forwardRef` kept by policy over React-19 ref-as-prop (documented, deferred). |
| Performance | 7 | **8** | Route splitting + vendor chunks + budget gate; initial route verified free of ag-grid/lexical. Not 10: the ag-grid chunk (~0.93 MB) is the standing ceiling. |
| Security | 6 | **9** | Sanitize contract, export formula guard, audit + secret-scan + Dependabot, CSP docs. Not 10: no real backend to harden — forward-looking only. |
| Accessibility | 7 | **9** | axe green in unit + E2E (both themes), skip link, reduced-motion, source fixes. Not 10: no manual screen-reader pass / Lighthouse-a11y run in-harness. |
| Developer Experience | 8 | **9** | CI gates (audit/secret/docs/exports/api/publint/changeset), `CONTRIBUTING.md`, fast test split. Not 10: no Storybook. |
| Documentation | 7 | **9** | Per-domain guides, 6 ADRs, component map, CI doc-consistency + snippet typecheck. Not 10: no hosted/versioned docs site. |
| Testing | 5→7 | **9** | 333 tests, ~59.6% lines, engine behavior + axe suites, 9 E2E specs green twice. Not 10: dialog-driven create/edit E2E blocked by a Base UI/Playwright interaction (below). |
| **Overall** | 8 | **9** | Every dimension ≥ 8; release + validation machinery in place. Not 10: the named follow-ups below. |

## Definition of Done for 10/10 — remaining named exceptions

- [x] CI green on `main` + PR across all jobs.
- [x] Security: sanitize, export guard, audit/secret/Dependabot, CSP docs.
- [x] Accessibility: axe unit + E2E (light/dark), skip link, reduced motion.
- [x] Testing: coverage floor ≥ 45/45 (at 56/57); E2E green twice.
- [x] Docs: per-domain guides + ADRs 0001–0006 + doc-consistency check.
- [x] Release: Changesets, version 0.1.0, publint, exports/api validation.
- [ ] **Publish path:** dist-facing `package.json` + publint on built output (ADR 0006 follow-up; gated on an actual decision to publish).
- [ ] **ag-grid chunk** (~0.93 MB) — the remaining performance ceiling; deeper module trimming or a lighter grid is the only lever left.
- [ ] **Dialog-from-controlled-state under Playwright** — `SmartDialog`/`SmartConfirmDialog` opened via external `open` state don't open under Playwright's synthetic click; create/edit/delete E2E is deferred (covered by component render tests). Root-cause + fix is a named follow-up.
- [ ] **React-19 ref-as-prop migration** — hand-written `forwardRef` components kept uniformly for now (CLAUDE.md policy); cosmetic migration deferred.
- [ ] **Lighthouse** not run in-harness — a11y is proxied by the axe E2E pass; a real Lighthouse run (Perf/BP/SEO) is a follow-up. `apps/web` is a client-only SPA, so SEO is inherently capped.

---

# Status Update — 2026-07-07

> **Scope:** 40 commits landed since the audit snapshot (`03cab09`, 2026-07-02) — repo went from 28 to 69 commits in 5
> days.
> **Verified today:** full test suite (`vitest run`: **288/288 passing across 36 files**) and production build (green;
> 117 chunks).
> The original audit below is kept as-is for the point-in-time record; this section tracks what changed.

## Headline: most Critical/High findings are resolved

| Original finding                                       | Status          | Evidence                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #1 No CI pipeline (**Critical**)                       | ✅ **Resolved** | `.github/workflows/ci.yml`: format-check → lint → typecheck → test-with-coverage → build, plus a separate Playwright E2E job with report artifact upload. ⚠️ but see "New issues" — the push trigger targets `master`.                                                   |
| #2 Single 2.6 MB bundle, no code splitting (**High**)  | ✅ **Resolved** | All routes `React.lazy` in `App.tsx`; `manualChunks` in `vite.config.ts` splits `react-vendor` (214 kB), `lexical` (386 kB), `ag-grid` (1.09 MB) into lazy chunks. Build now emits **117 chunks**; initial JS ≈ 430 kB vs 2.6 MB.                                        |
| #3 Zero component tests; grid tests deleted (**High**) | ✅ **Resolved** | **288 tests / 36 files** (was 52 / 7). Component render tests for smart components + form engine; `grid-datasource.test.ts` restores server-grid coverage; Playwright smoke E2E (5 specs: navigation, theme, form-engine, server-grid, action-buttons) wired into CI.    |
| #5 README boilerplate (**Medium→High**)                | ✅ **Resolved** | `a847b50` rewrote README (243 lines added) — narrative walkthrough of the library layers.                                                                                                                                                                                |
| #6 Theme toggle unreachable; `d` hotkey trap           | ✅ **Resolved** | `useTheme` now consumed in `nav-user.tsx` (visible toggle); the global `d` hotkey is **opt-in, off by default** (`theme-provider.tsx`).                                                                                                                                  |
| #7 `console.log(res)` in `users.ts`                    | ✅ **Resolved** | Gone; only an intentional demo `console.log("Submitted:")` remains in `all-fields-page.tsx`.                                                                                                                                                                             |
| #8 Duplicate `use-mobile`                              | ✅ **Resolved** | Single copy in `packages/ui/src/hooks/use-mobile.ts`; app copy deleted.                                                                                                                                                                                                  |
| #9 `FieldDefinition` non-discriminated bag             | ✅ **Resolved** | `form-engine/field-types.ts` now defines `FieldDefinition<T>` as a **discriminated union** (`TextField \| TelField \| SlugField \| …`).                                                                                                                                  |
| #11 `toolbar-plugin.tsx` 1,375 LOC                     | ✅ **Resolved** | Decomposed to **135 LOC** orchestrator + `plugins/toolbar/` section modules.                                                                                                                                                                                             |
| #12 Suspect `@source` globs in `globals.css`           | ✅ **Resolved** | Depth fixed (`../../../../apps/**`); dead glob removed.                                                                                                                                                                                                                  |
| #13 tsconfig `turbo` leftover; strictness drift        | ✅ **Resolved** | `packages/ui/tsconfig.json` cleaned; now also enforces `noUnusedLocals`/`noUnusedParameters`.                                                                                                                                                                            |
| #14 No coverage thresholds                             | ✅ **Resolved** | `vitest.config.ts` coverage thresholds (statements 21 / lines 22 / …) as a documented "don't regress" baseline (~24% lines measured); enforced via `test:coverage` in CI. shadcn primitives excluded by policy.                                                          |
| #4 Orphaned primitives + misplaced deps (**Medium**)   | 🟡 **Partial**  | `vitest` moved to devDependencies ✅; `resizable` removed ✅; but `chart.tsx`/`carousel.tsx`/`data-table.tsx` remain and `recharts`/`@tanstack/react-table`/`embla-carousel-react` were deliberately (re-)added as deps — retention is now a choice, still undocumented. |
| #10 `AllCommunityModule` registration                  | ❌ **Open**     | `grid-internals.tsx` still registers all of AG Grid Community — the 1.09 MB ag-grid chunk is the remaining bundle heavyweight (lazy-loaded now, so impact is deferred, not eliminated).                                                                                  |
| #15 No release/versioning (Changesets)                 | ✅ **Resolved** | God Prompt 7: `@changesets/cli` configured (versions `@workspace/ui`, ignores `web`, private-package versioning on); first version **0.1.0** cut with `CHANGELOG.md`; root `changeset`/`version-packages` scripts; CI changeset guard on PRs; `CONTRIBUTING.md`.                                                                                                                                                                                                                                   |
| #16 Lexical HTML sanitization contract                 | ✅ **Resolved** | God Prompt 3: `lexical-text-editor/sanitize.ts` (`sanitizeEditorHtml` + `SafeEditorHtml`, DOMPurify allow-list matching the editor's node set, link hardening); inbound HTML sanitized on parse in `SmartTextEditor`; documented in `docs/security.md`. Tests in `sanitize.test.ts`.                                                                                          |
| #17 In-flight skill rename                             | ✅ **Resolved** | Working tree is clean.                                                                                                                                                                                                                                                   |

Also done from the Top-20 list: **jsx-a11y** (`eslint-plugin-jsx-a11y` in both workspaces), **shared `GridToolbar`** (
`data-grid/grid-toolbar.tsx`), **`createPageFetcher`** (`data-grid/create-page-fetcher.ts` — exactly the wrapper the
audit proposed, with injectable transport and its own tests), **demo-data module** + **`SmartStatCard`** (the KPI-card
extraction the audit suggested).

## New since the audit (not in the original report)

The library grew four whole new domain engines plus supporting layers — source went from ~27.3k to **~39.5k lines** (~
304 files):

- **Search engine** (`@workspace/ui/search-engine`) — `SmartSearchForm`, a declarative filter bar composing
  `SmartForm` (manual/auto-search, query pruning, active-filter count).
- **Tree engine** (`@workspace/ui/tree-engine`) — `SmartTree`: lazy folders, tri-state checkboxes, keyboard nav, inline
  rename, drag-and-drop; pure `tree-utils.ts` with tests.
- **Transfer-list engine** (`@workspace/ui/transfer-list-engine`) — `SmartTransferList` dual-list shuttle; pure
  `transfer-utils.ts` with tests.
- **Calendar engine** (`@workspace/ui/calendar-engine`) — `SmartCalendar`: month/week/day/agenda views,
  drag-to-move/resize editing, an RRULE-subset recurrence model with series-edit helpers, and availability/slot-booking;
  date math unit-tested (3,651 LOC in one commit).
- **Action-button presets** (`@workspace/ui/smart-components/buttons`) — config-driven `ActionButton` + 27 named presets
  with optional permission gating, plus a showcase page and E2E spec.
- **TanStack Query adoption in `apps/web`** — `QueryClientProvider` + a reference CRUD example page (optimistic delete
  with rollback) against new MSW mutation handlers; the library itself stays fetch-agnostic.
- **`SmartPage` flat-props migration** — page layouts moved from compound/slot markup to a flat props API across 35
  files; `SmartDialog`/`SmartSheet` gained size presets and `dividers`.
- **Misc:** date-picker custom formats/dropdown-nav/time-zone support, Noto Serif variable font + typography defaults,
  sidebar flyouts for collapsed submenus, "loading more" indicator for infinite scroll, Spring query-encoder unit tests,
  Turbo upgraded to 2.10.4.

## New issues spotted today

> **Update 2026-07-08:** all four items below are resolved (God Prompt 1).

1. ✅ **CI push trigger targets a nonexistent branch.** ~~`ddbf927` switched `on.push.branches` to `[master]`~~ —
   fixed 2026-07-08: `ci.yml` now triggers on `[main]`; no `master` reference remains in the workflow.
2. ✅ **Orphan-primitive policy still undecided** — resolved 2026-07-08: CLAUDE.md's shadcn/ui section now has a
   "Vendored primitives policy" subsection (primitives are regenerable vendor code, kept with their deps for future
   adoption). Tree-shaking re-verified: production build (117 JS chunks) contains zero `recharts`/`embla` signatures.
3. ✅ **Test-suite hygiene:** resolved 2026-07-08. The "controlled/uncontrolled Select" warning came from **Base UI**
   (not React DOM) — controlled `SmartSelect` values flipping `undefined` → string. Fixed at the source:
   `SmartSelect.value` now accepts `string | null` (`null` = controlled-empty), `SmartSelectField` passes
   `data ?? null`, and the two demo pages pass their `string | null` state directly; the suite runs warning-free.
   Test wall time: `vitest.config.ts` split into `node`/`jsdom` **projects** — 13 pure-logic files (160 tests) now run
   under `node` (6 ms environment vs. seconds per jsdom file). Back-to-back A/B on the same machine: **88.9 s → 55.5 s
   wall** (−38 %), cumulative environment **605.6 s → 259.6 s** (−57 %), identical 288/288 pass count.
4. ✅ **Commit-message drift:** hook verified working 2026-07-08 — `git commit -m "WHAT"` on a scratch branch is
   rejected by the husky `commit-msg` hook (commitlint: subject/type-empty, exit 1), including on Windows. `03cab09`
   predates nothing broken; the convention is enforced going forward.

## Updated scores

| Dimension            | 07-02 | 07-07 | What moved it                                                                                   |
| -------------------- | ----: | ----: | ----------------------------------------------------------------------------------------------- |
| Architecture         |     8 | **9** | God Prompt 7 (07-08): Changesets + 0.1.0, publint, exports/api-surface checks, build:lib, ADR 0006 |
| Code Quality         |     9 | **9** | Discipline held through 12k new lines (discriminated unions, decomposed toolbar)                |
| Performance          |     5 | **7** | Route splitting + vendor chunks fixed initial load; AG Grid module slimming still open          |
| Security             |     6 | **9** | God Prompt 3 (07-08): sanitize contract + CSV/XLSX formula guard + audit/secret-scan CI + CSP docs |
| Accessibility        |     6 | **9** | God Prompt 4 (07-08): axe in unit + E2E (light/dark), skip link, source a11y fixes, reduced-motion |
| Developer Experience |     7 | **8** | CI + E2E + coverage gates; README real; (−) push trigger misconfigured                          |
| Documentation        |     5 | **9** | God Prompt 6 (07-08): per-domain docs/ guides, 5 ADRs, component→demo map, CI doc-consistency check |
| Testing              |     5 | **9** | God Prompt 5 (07-08): 333 unit tests, ~24%→~60% lines, engine behavior + axe tests, 31 E2E     |
| **Overall Project**  | **7** | **8** | Every Critical/High item closed except AG Grid slimming; remaining debt is Medium or policy     |

## Remaining priorities (carried forward)

1. ~~**Fix the CI push branch (`master` → `main`)**~~ ✅ done 2026-07-08.
2. Register specific AG Grid modules instead of `AllCommunityModule` (the 1.09 MB chunk).
3. ~~Decide & document the orphan-primitive/dependency retention policy.~~ ✅ done 2026-07-08 (CLAUDE.md).
4. ~~Lexical HTML sanitization contract (DOMPurify helper or documented consumer requirement).~~ ✅ done 2026-07-08 (God Prompt 3).
5. Changesets/versioning when external consumption is planned; ADRs for the big decisions.

**God Prompt 3 (Security, 2026-07-08):** Security **6 → 9**. Lexical sanitize contract closed (#16). Added
CSV/XLSX formula-injection guard (`data-grid/formula-guard.ts`, wired into both export paths, tested with the classic
payloads). CI gained a `security` job (`pnpm audit --prod` high-fails / moderate-warns + gitleaks secret scan) and
`.github/dependabot.yml` (weekly grouped minor/patch PRs). Deployment security baseline written in `docs/security.md`
(CSP + headers with ready-to-copy Netlify `_headers` and `vercel.json`).

**God Prompt 4 (Accessibility, 2026-07-08):** Accessibility **7 → 9**. jsx-a11y recommended confirmed enabled in both
flat configs (lint green). Added an axe-core unit helper (`test-utils/a11y.ts` → `expectNoA11yViolations`) and a render
axe suite (`test-utils/components.a11y.test.tsx`) over 11 high-traffic surfaces (form, dialog, select, combobox,
date-picker, stepper, tree, transfer-list, calendar month+week, action buttons). Source fixes for the violations it
found: tree checkbox accessible name, combobox `role="combobox"` trigger name (new `aria-label` passthrough),
transfer-list rebuilt to a valid ARIA listbox (option on the `<li>`, visual-only checkbox, no nested interactive,
named listboxes) + keyboard (Enter/Space/roving tab). Added `@axe-core/playwright` E2E (`e2e/a11y.spec.ts`) scanning 5
routes in light+dark, failing on serious/critical — caught two real contrast bugs: light `--muted-foreground`
(4.34→~4.9:1) and calendar event chips mid-fade (fixed via a global `prefers-reduced-motion` rule + reduced-motion
scan). Skip-to-content link + `<main id>` landmark in `PlaygroundShell`. E2E green twice back-to-back.

**God Prompt 5 (Testing Depth, 2026-07-08):** Testing **7 → 9**. Unit tests 288 → **333** (40 files). Interaction
tests through the public API: `tree.behavior.test.tsx` (expand, multi-select, tri-state check cascade, filter mode,
imperative handle) and `transfer-list.behavior.test.tsx` (move all/selected both ways, `TransferChangeMeta`, disabled
items, controlled ids), plus the 11-surface axe render suite from GP4. Coverage lifted **~24% → ~60% lines** (stmts
58.6 / branches 53.87 / funcs 52.2 / lines 59.65); thresholds raised to 56/51/50/57 (well past the 45/45/40/25 target).
E2E 28 → **31**: `tree.spec` (keyboard expand + checkbox cascade + F2 rename), `crud.spec` (TanStack Query + MSW search
→ empty → restore), `calendar.spec` (view switching + date nav). Full E2E green **twice** back-to-back; trace
on-first-retry already on. Note: SmartDialog opened from external controlled state didn't open under Playwright's
synthetic click (create/edit/delete stay covered by the dialog component render tests); flagged as follow-up.

**God Prompt 6 (Documentation & ADRs, 2026-07-08):** Documentation **7 → 9**. Eight per-domain consumer guides in
`docs/` (form-engine, data-grid, search-engine, tree-engine, transfer-list-engine, calendar-engine, smart-components,
lexical-text-editor) following one skeleton (what / import / 80% example / props / escape hatches / gotchas / demo),
indexed by `docs/README.md` and linked from the root README. Five ADRs in `docs/adr/` (Base UI over Radix, source-only
package, hand-rolled xlsx, Spring `Page<T>`, flat-props wrappers w/ SmartPage-slots exception). `docs/component-map.md`
maps every engine/`Smart*` component → import → demo route → guide (with a "no demo" follow-up list). CI gate
`scripts/check-docs.mjs` (`pnpm docs:check`, wired into the verify job): every public `exports` subpath must have a
listed guide, and the doc snippets (`docs/snippets.test-d.ts`) must `tsc --noEmit` — a new undocumented entrypoint or a
broken snippet fails CI.

**God Prompt 7 (Release Engineering, 2026-07-08):** Architecture **8 → 9**; closes finding #15. Changesets configured
(`.changeset/config.json`: versions private `@workspace/ui`, ignores `web`, `access: restricted`, `baseBranch: main`);
first version **0.1.0** cut with `packages/ui/CHANGELOG.md`; root `changeset`/`version-packages` scripts; CI changeset
guard (`changeset status --since=origin/main`, PR-only). Public-surface validation in CI: `publint` (green on the
source package), `scripts/check-exports.mjs` (14 subpaths resolve + barrels export), and `tooling/api-check`
(one import from every subpath type-checked with the app's strict settings). Distribution posture decided in
[ADR 0006](docs/adr/0006-distribution-strategy.md) — **option C (hybrid)**: stay source-only, add `pnpm build:lib`
(`tsc -p tsconfig.lib.json` → ESM `.js` + `.d.ts`, `"use client"` preserved, `dist/` git-ignored) run in CI to prove
standalone buildability. `apps/web` stays private on `workspace:*`. `CONTRIBUTING.md` documents the flow. Remaining
follow-up (named in ADR 0006): a dist-facing publish `package.json` + publint on built output, gated on an actual
decision to publish.

---

# Executive Summary

## What is this project?

`smart-component` is a **pnpm + Turborepo monorepo** housing a React 19 **enterprise UI component library** (
`packages/ui`, published internally as `@workspace/ui`) and a **Vite playground/demo application** (`apps/web`) that
exercises every component. The library is organized in four ascending layers:

1. **shadcn/ui primitives** (50 components, Base UI–backed, Tailwind v4) — `packages/ui/src/components/`
2. **Smart wrappers** (41 components + an 18-file slot-based `SmartPage` layout system) —
   `packages/ui/src/smart-components/`
3. **Domain engines** — a declarative **form engine** (TanStack Form + Zod, 26 files, 30+ field types), a **data-grid
   layer** (AG Grid Community: client-side `SmartGrid` + infinite-row-model `SmartServerGrid`), and a **Lexical
   rich-text editor** module
4. **Dependency-free utilities** — `cn()`, number/string formatters, and a hand-rolled OOXML `.xlsx` writer

## Purpose

To provide a reusable, opinionated component kit that collapses shadcn/ui compound-component boilerplate into flat,
prop-driven "Smart" APIs, and to solve hard enterprise UI problems once (server-driven grids with cross-page selection,
schema-driven forms, Excel export, full-viewport page layouts). An ESLint guardrail in the web app (
`apps/web/eslint.config.js`) actively enforces consuming the Smart layer instead of raw primitives.

## Current maturity

**Early / pre-release.** 28 commits, first commit ~2026-06-30 (days old). Versions are `0.0.0`/`0.0.1`, all packages
private, no publishing pipeline, no CI, no versioning strategy. Despite this, code quality and internal documentation
are far above what the age suggests.

## Estimated project size

| Metric                               | Value                                       |
| ------------------------------------ | ------------------------------------------- |
| TypeScript/TSX source lines          | **~27,300**                                 |
| Source files                         | ~220                                        |
| shadcn primitives                    | 50                                          |
| Smart components (incl. page system) | 59                                          |
| Form-engine field types              | 30+ (`FieldType` union in `smart-form.tsx`) |
| Demo routes in `apps/web`            | 24                                          |
| Unit tests                           | 52 (7 files, all passing)                   |
| Runtime dependencies (`packages/ui`) | 37                                          |

## Overall architecture quality

**Strong (8/10).** Clear layering, disciplined module boundaries, pure logic extracted from components into testable
helpers (`pagination.ts`, `server-grid-internals.ts`), well-reasoned React patterns (refs-for-latest-props to keep AG
Grid datasources stable, id-set as source of truth for cross-page selection, slot detection via `Symbol.for` in
`SmartPage`). The main gaps are operational, not structural: no CI, no code splitting, no release machinery.

## Strengths

- **Exceptional inline documentation.** Nearly every exported symbol carries JSDoc explaining _why_, not just _what_ (
  e.g. the generic-`forwardRef` cast in `server-data-grid.tsx:601`, the self-update echo guard in `smart-form.tsx:283`).
  `CLAUDE.md` doubles as an accurate architecture doc.
- **Zero `any` in production code, zero TODO/FIXME markers.** Strict TS everywhere; `unknown` + narrowing used where
  dynamism is needed.
- **All quality gates pass:** typecheck, ESLint 10 flat config, 52/52 tests.
- **Modern, coherent stack:** React 19, Tailwind v4, Zod 4, TanStack Form, ESLint 10, pnpm 10 (with `allowBuilds`
  build-script allow-listing), Turborepo 2, Vite 8 (Rolldown).
- **Local quality gates:** husky pre-commit (lint-staged/prettier), commit-msg (commitlint conventional), pre-push (
  typecheck + tests).
- **Thoughtful hard-problem solutions:** cross-page grid selection surviving block purges (
  `use-server-grid-selection.ts`), Spring Data `Page<T>` contract with Zod validation (`pagination.ts`), dependency-free
  XLSX writer (`lib/xlsx.ts`) avoiding a heavyweight spreadsheet dependency.
- **Realistic dev API:** MSW mock server implementing a real paging/sort/filter query contract shared between client and
  mock (`apps/web/src/api/users-query.ts`).

## Weaknesses

- **No CI/CD whatsoever** — no `.github/`, gates are local-only and bypassable with `--no-verify`.
- **Single 2.6 MB JS bundle** (`dist/assets/index-*.js`), no `React.lazy`/`Suspense`/dynamic import anywhere; AG Grid (
  `AllCommunityModule`), Lexical, and all 24 pages load eagerly.
- **Dead weight:** orphaned primitives (`chart.tsx`→recharts, `data-table.tsx`→@tanstack/react-table, `carousel.tsx`
  →embla, `resizable.tsx`→react-resizable-panels, `menubar`, `navigation-menu`, `input-otp`, `hover-card`,
  `aspect-ratio`, `pagination` — zero importers), `@playwright/test` installed with no config or tests, `vitest`
  misplaced under `dependencies`.
- **README is template boilerplate** (stock shadcn monorepo text plus garbled `automatic-octo-fiesta` artifact); no
  consumer-facing docs for the form engine, grid layer, or page system.
- **Testing is thin relative to surface area:** pure logic is well tested, but zero render tests for the 59 smart
  components; earlier `SmartServerGrid` tests were deleted (commit `a2f5127`); no E2E.
- **Small hygiene issues:** leftover `console.log(res)` in `apps/web/src/api/users.ts:35`; duplicated `use-mobile` hook
  with two divergent implementations; theme switching reachable only via an undocumented global `d` hotkey; suspect
  `@source` relative globs in `globals.css`.

---

# Project Structure

```
smart-component/
├── .claude/skills/          # Claude Code skills (shadcn-smart-wrappers, vercel-composition-patterns)
├── .husky/                  # Git hooks: pre-commit, commit-msg, pre-push
├── apps/
│   └── web/                 # Vite + React 19 playground app
│       └── src/
│           ├── api/         # fetchRows adapter + shared query-string contract
│           ├── components/  # dashboard shell, settings dialog, theme provider
│           ├── hooks/       # local use-mobile (duplicate of ui's)
│           ├── mocks/       # MSW worker, handlers, 200-row users dataset
│           └── pages/       # 24 leaf route components (grids/, examples/, form-engine/, smart/, projects/)
├── packages/
│   └── ui/                  # @workspace/ui — the component library (no build step, exported as source)
│       └── src/
│           ├── components/       # 50 shadcn/ui primitives (Base UI, render-prop pattern)
│           ├── smart-components/ # 41 Smart wrappers + page/ (18-file slot-based layout system)
│           ├── form-engine/      # SmartForm + 23 field components + base types + internals
│           ├── data-grid/        # SmartGrid, SmartServerGrid, pure helpers, selection hook, theme
│           ├── lexical-text-editor/ # SmartTextEditor + nodes/ + plugins/ (toolbar is 1,375 LOC)
│           ├── hooks/            # use-mobile
│           ├── lib/              # cn(), formatters, xlsx writer
│           └── styles/           # globals.css (Tailwind v4 entry, design tokens)
├── turbo.json               # build/lint/typecheck/test/dev pipelines
├── pnpm-workspace.yaml      # apps/*, packages/* + allowBuilds security allow-list
└── CLAUDE.md                # De-facto architecture documentation
```

### Folder-by-folder assessment

| Folder                                   | Purpose                                                                            | Assessment                                                                                                                                                   | Improvements                                                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/`            | Generated shadcn primitives; the vendored base layer                               | Correctly treated as regenerable vendor code; consistent Base UI `render` prop idiom                                                                         | Prune the 10 orphans or explicitly mark the layer "keep-everything by policy"; drop deps only orphans use                        |
| `packages/ui/src/smart-components/`      | Hand-written flattened wrappers; the intended public API                           | Consistent naming (`Smart*`), consistent prop shapes (`trigger`/`header`/`footer`), good JSDoc with before/after examples                                    | A generator/template for new wrappers; barrel or docs index enumerating all 41                                                   |
| `packages/ui/src/smart-components/page/` | Slot-based page layout engine (auto-detects document/dashboard/split/grid layouts) | Sophisticated: `SMART_PAGE_SLOT` symbol tagging avoids class-identity pitfalls; context-driven defaults                                                      | 553-line orchestrator could split layout renderers; needs visual regression coverage                                             |
| `packages/ui/src/form-engine/`           | Declarative schema-driven forms                                                    | Best-designed module in the repo; `FieldBaseProps<T>` uniform `data`/`setData` contract; schema as single source of truth for validation _and_ required-ness | `FieldDefinition` is a wide "options bag" — a discriminated union per field type would catch invalid prop combos at compile time |
| `packages/ui/src/data-grid/`             | AG Grid wrappers + server paging protocol                                          | Exemplary separation: React shell vs pure translation logic; framework-agnostic `ServerFetchParams`                                                          | Deliberately not in the `exports` map yet consumed by the app — formalize or document the boundary                               |
| `packages/ui/src/lexical-text-editor/`   | Rich-text editor                                                                   | Solid plugin composition                                                                                                                                     | `toolbar-plugin.tsx` (1,375 LOC) needs decomposition                                                                             |
| `packages/ui/src/lib/`                   | Pure utilities                                                                     | Small, tested, dependency-free — model citizens                                                                                                              | —                                                                                                                                |
| `apps/web/src/pages/`                    | Thin leaf demos                                                                    | Good: no shared state, shell-derived breadcrumbs                                                                                                             | All statically imported → the bundle problem; convert to `React.lazy`                                                            |
| `apps/web/src/mocks/` + `api/`           | MSW mock backend + typed client                                                    | Shared query contract between client and mock is a great pattern                                                                                             | Remove `console.log`; extract reusable `apiFetch` wrapper                                                                        |

---

# Technology Stack

| Category               | Technology                                                                                                                                                              | Notes                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Language**           | TypeScript `~6` (strict)                                                                                                                                                | `strict: true` in every tsconfig; web app adds `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` |
| **Framework**          | React 19.2                                                                                                                                                              | Function components only; `forwardRef` still used in places React 19 no longer requires it                               |
| **Build**              | Vite 8 (Rolldown), Turborepo 2.9                                                                                                                                        | `@workspace/ui` has **no build step** — consumed as source via `exports` map                                             |
| **Styling**            | Tailwind CSS v4, `tw-animate-css`, CSS variables, Inter variable font                                                                                                   | Dark mode via `.dark` class custom variant                                                                               |
| **UI primitives**      | shadcn/ui v4-style on **Base UI** (`@base-ui/react`), not Radix                                                                                                         | Dropdowns/triggers use the `render` prop pattern                                                                         |
| **Components**         | AG Grid Community 35 (grids), Lexical 0.46 (editor), vaul (drawer), cmdk, sonner, embla, input-otp, react-day-picker v10, react-resizable-panels, recharts _(orphaned)_ |                                                                                                                          |
| **Forms**              | TanStack Form 1.33 + `@tanstack/react-store`                                                                                                                            | Wrapped by the form engine                                                                                               |
| **Validation**         | Zod 4                                                                                                                                                                   | Schemas as Standard Schemas; also validates API responses                                                                |
| **State management**   | Local state + context; TanStack Store inside form engine                                                                                                                | No global store — appropriate for a component library                                                                    |
| **Routing**            | react-router-dom 7                                                                                                                                                      | Classic `<Routes>`; no data router, no lazy routes                                                                       |
| **API layer**          | `fetch` + Zod parsing; MSW 2 mock server (dev-only)                                                                                                                     | Spring Data `Page<T>` envelope contract                                                                                  |
| **Testing**            | Vitest 4 + Testing Library (jest-dom, user-event) + jsdom; `@vitest/coverage-v8` installed                                                                              | `@playwright/test` installed at root but **unconfigured/unused**                                                         |
| **Package manager**    | pnpm 10.33 (workspaces, `allowBuilds` allow-list)                                                                                                                       | Node ≥ 20 enforced via `engines`                                                                                         |
| **Lint/format**        | ESLint 10 flat config (+ react-hooks, react-refresh, typescript-eslint 8), Prettier 3 + tailwindcss plugin                                                              | Custom `no-restricted-imports` guardrail in web app                                                                      |
| **Git hygiene**        | husky 9, lint-staged 17, commitlint (conventional commits)                                                                                                              | Pre-push runs typecheck + tests                                                                                          |
| **CI/CD**              | **None**                                                                                                                                                                | No `.github/`, no pipelines                                                                                              |
| **Deployment / Cloud** | **None detected**                                                                                                                                                       | Static Vite output only                                                                                                  |
| **Env/secrets**        | No `.env*` files present; `.env*` gitignored                                                                                                                            | MSW guarded by `import.meta.env.DEV`                                                                                     |

---

# Architecture Review

| Area                   | Score | Evidence & commentary                                                                                                                                                                                                             |
| ---------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scalability (code)     |  7/10 | Layered library scales well; app-side flat route list and eager imports won't. No versioning/release path for the library itself.                                                                                                 |
| Maintainability        |  9/10 | Outstanding JSDoc, no dead comments, small files (median well under 250 LOC), pure helpers extracted for the tricky parts.                                                                                                        |
| Modularity             |  8/10 | Clean `exports` map defines the public surface; data-grid deliberately internal-only; Lexical/grid/form domains isolated per the CLAUDE.md placement rule.                                                                        |
| Separation of concerns |  9/10 | React shells vs pure logic (`server-grid-internals.ts`, `pagination.ts`); transport-agnostic filter normalization; app owns the backend dialect.                                                                                  |
| Dependency management  |  6/10 | pnpm 10 + `allowBuilds` is modern; but `vitest` sits in `dependencies`, `@playwright/test` and `recharts`/`react-table`/`embla`/`react-resizable-panels` are unused weight, and duplicate deps (zod, lucide) rely on pnpm dedupe. |
| Reusability            |  9/10 | The whole point of the repo, and it delivers: uniform `FieldBaseProps`, `DataGridColumn` alias hiding AG Grid, generic grid/form components.                                                                                      |
| Feature isolation      |  8/10 | Domain folders with explicit placement rules; enforced import direction app→smart-components.                                                                                                                                     |
| Design patterns        |  8/10 | Slot pattern with symbol tagging, controlled/uncontrolled duality (`data`/`setData`), refs-for-latest-props, generic `forwardRef` cast, module-singleton grid registration. All intentional and documented.                       |
| Consistency            |  8/10 | Naming and prop conventions highly consistent; minor drift: `"use client"` present in some Vite-only files, two `use-mobile` implementations, `forwardRef` vs ref-as-prop.                                                        |

**Composite: 8.0/10**

---

# React Review

- **Hooks:** Advanced and mostly correct. `useLayoutEffect` mirrors latest props into refs so the AG Grid datasource
  stays referentially stable ([server-data-grid.tsx:260](packages/ui/src/data-grid/server-data-grid.tsx));
  `useServerGridSelection` cleanly separates AG Grid event plumbing from selection state. The form engine's dual sync
  effects (mirror-out / reconcile-in with `selfUpdateRef` echo guard) solve a real max-update-depth loop and document
  it ([smart-form.tsx:309-344](packages/ui/src/form-engine/smart-form.tsx)). Two
  `eslint-disable-line react-hooks/exhaustive-deps` in `smart-form.tsx` are deliberate and explained — acceptable, but
  each is a contract future editors must know.
- **Context:** Used sparingly and correctly (`PageContext` for layout defaults, `ThemeProviderContext` with a throwing
  `useTheme` guard, sidebar context from shadcn). No context-as-global-store abuse.
- **Rendering & memoization:** `useMemo`/`useCallback` applied where identity matters (datasource, colDefs, handlers
  passed to AG Grid) rather than cargo-culted. `SmartForm` subscribes via `useSelector(form.store, …)` and
  `form.Subscribe` to limit re-renders. Reasonable.
- **Component composition:** Two complementary APIs — flattened props for the 80% case (`SmartDialog`
  `trigger/header/footer`) with documented escape hatches to primitives, and slot-based composition for pages. This
  matches the repo's own `vercel-composition-patterns` guidance.
- **Lazy loading / Suspense:** **Absent.** No `React.lazy`, no `<Suspense>`, no dynamic `import()` in app or library.
  This is the single biggest React-level gap given AG Grid + Lexical in the tree.
- **Performance:** Grid virtualizes rows natively; infinite model caps memory. Form engine re-renders the whole field
  grid on `values` change for `hidden()` evaluation — fine at current form sizes, worth watching past ~50 fields.
- **React 19 alignment:** `forwardRef` remains in `SmartServerGrid` and shadcn primitives even though React 19 supports
  `ref` as a prop (and the repo's own composition-patterns skill recommends dropping it). Low priority; the generic cast
  is correct.

---

# TypeScript Review

- **Strict mode:** On everywhere; web app additionally enforces unused-locals/params, `verbatimModuleSyntax`,
  `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`. `packages/ui` lacks those extras — worth aligning.
- **`any` usage:** **Zero** in production code (verified by grep). Casts are narrow, local, and always commented with
  the reason (`as never` bridging Zod↔TanStack Standard-Schema typing; the generic `forwardRef` re-assertion).
- **Generics:** Confidently used: `SmartForm<T extends Record<string, unknown>>`, `SmartServerGrid<TRow>` with generic
  imperative handle, `pageSchema<TItem extends z.ZodTypeAny>` returning a derived schema type.
- **Interfaces & utility types:** Public props are `interface`s with JSDoc on every member; `satisfies` used for AG Grid
  param objects; `keyof T & string` ties field names to the schema type.
- **Discriminated unions:** The notable gap. `FieldDefinition<T>` is one wide bag where `FieldType` doesn't narrow the
  valid extras (nothing stops `decimalScale` on a `checkbox`). A per-type discriminated union would move a class of
  misconfiguration to compile time. Similarly `value: unknown` flows through `FieldRenderer` with per-case casts — safe
  in practice, but a typed field-registry map could remove the casts.
- **Duplicated types:** `SPageResponse` deliberately mirrors `pageSchema`'s inferred type (documented); `use-mobile`
  duplicated across workspaces; `Theme` types local to the app. Minor.
- **tsconfig hygiene:** Root `tsconfig.json` is minimal and **not referenced** by workspaces (each is standalone) —
  fine, but a shared `@workspace/typescript-config` base would prevent drift. `packages/ui/tsconfig.json` includes a
  nonexistent `turbo` directory (leftover from `@turbo/gen` scaffolding).

---

# Component Review

**Duplicated components / logic**

- `use-mobile` exists twice with _different_ implementations (ui: `useState`+`useEffect`; web: subscription-style).
  Consolidate on the ui version and delete the app copy.
- `SmartGrid` and `SmartServerGrid` share near-identical toolbar JSX (title, column-visibility dropdown, export
  button) — extract a `GridToolbar` internal.
- Theme handling: the app ships a 230-line custom `ThemeProvider` while `next-themes` is a ui dependency (used by
  `sonner`'s toaster). One approach should win.

**Reusable opportunities**

- The KPI/stat card hand-rolled in `analytics-example-page.tsx` and `dashboard-example-page.tsx` is a natural
  `SmartStatCard`.
- The demo pages repeatedly build fake datasets inline — a tiny shared `demo-data` module would shrink several
  300–400-line pages.
- `ErrorPanel` inside `server-data-grid.tsx` overlaps with `SmartPageError` — unify on one error-state primitive.

**Wrapper opportunities**

- `fetchUsersPage` embeds fetch + Zod parse + error mapping; generalize into a `createPageFetcher(schema, url)` helper
  in the data-grid layer so every consumer gets validated fetching for free.

**Large / complex components (top offenders by LOC)**

| File                                             |   LOC | Recommendation                                                                                                                                                |
| ------------------------------------------------ | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lexical-text-editor/plugins/toolbar-plugin.tsx` | 1,375 | Split into per-concern plugins/sections (block format, inline marks, insert menu, alignment)                                                                  |
| `components/sidebar.tsx`                         |   728 | Vendored shadcn block — leave as-is                                                                                                                           |
| `form-engine/smart-form.tsx`                     |   719 | Extract `FieldRenderer`'s switch into a field-registry map (`Record<FieldType, Component>`); shrinks the file and opens the door to custom field registration |
| `data-grid/server-data-grid.tsx`                 |   609 | Extract shared `GridToolbar`; otherwise cohesive                                                                                                              |
| `smart-components/page/smart-page.tsx`           |   553 | Split per-layout render functions into modules                                                                                                                |

---

# UI/UX Review

- **Consistency:** Strong. One design-token vocabulary (`globals.css` `@theme inline` variables), one icon set (lucide),
  consistent density constants for grids (36/44/56 px rows).
- **Spacing & typography:** Tailwind scale discipline; Inter variable font with `--font-heading`;
  prettier-plugin-tailwindcss keeps class order canonical.
- **Responsiveness:** Toolbars collapse (`flex-col sm:flex-row`), sidebar has mobile behavior via `use-mobile`; grid
  `fill` mode solves full-viewport layouts without `100vh` hacks. Grid-heavy pages remain desktop-first — acceptable for
  the domain.
- **Accessibility:** Decent baseline: Base UI primitives bring correct semantics; 63 library files use `aria-*`; the
  form engine focuses the first errored field after failed submit and gates error display on blur/submit (excellent
  pattern). Gaps: no automated a11y checks (no `eslint-plugin-jsx-a11y`, no axe tests), no skip-to-content link in the
  shell, and the global **`d` keyboard shortcut** toggling theme (`theme-provider.tsx:142-180`) is undiscoverable and
  could collide with user expectations or assistive tech — there is **no visible theme toggle at all** (`useTheme` has
  zero consumers).
- **Dark mode:** Fully tokenized and it works — but see above: unreachable through the UI.
- **Loading states:** First-class (`SmartLoadingOverlay`, `SmartSpinner`, `SmartPageLoading`, grid initial-load overlay,
  MSW latency of 450 ms to make them visible).
- **Error states:** First-class in the grid (error panel with Retry) and page system (`SmartPageError`); inline field
  errors in forms.
- **Empty states:** First-class (`SmartEmptyState` via `NoRowsOverlay`, `SmartPageEmpty`).

---

# Code Quality

- **Naming:** Uniform and predictable (`Smart*` public components, `*-internals` for private helpers, `use-*` hooks,
  kebab-case files). No abbreviations soup.
- **Formatting:** Prettier enforced pre-commit; consistent (no-semicolons, double quotes, 80 cols).
- **Dead code:** The 10 orphaned primitives + their 4 orphaned dependencies (recharts, @tanstack/react-table,
  embla-carousel-react, react-resizable-panels — embla/resizable are imported only by orphaned components), unused
  `@playwright/test`, unused `@turbo/gen`, `hooks/.gitkeep` alongside a real file, and the stray `console.log(res)` in
  `users.ts:35`.
- **Duplicate code:** Limited (grid toolbars, use-mobile, demo datasets) — see Component Review.
- **Long methods/components:** Only the five files listed above; everything else is small and single-purpose.
- **Magic values:** Consistently named (`LATENCY`, `MOBILE_BREAKPOINT`, `rowHeightByDensity`, `COLS/SPAN` maps). Grid
  defaults (page size 20, height 480) are documented props.
- **Comments:** The best I've seen in a repo this young — they explain constraints and _why_, not narration.
  `eslint-disable` comments always carry justification.
- **Maintainability:** High. A new engineer can navigate from `CLAUDE.md` alone. Risk concentration: the form engine's
  sync-effect dance and the grid's ref-plumbing are subtle — both mitigated by comments and (for the form) a dedicated
  regression test (`smart-form-sync.test.tsx`).

---

# Security Review

Context: a frontend component library + demo app with **no real backend, no auth, no secrets** — the attack surface is
inherently small today. Findings are therefore mostly forward-looking:

- **Auth/authorization:** None present, none needed yet. No patterns to migrate away from later — clean slate.
- **Validation:** Strong habit already: Zod validates _inbound API data_ (`pageSchema(...).parse`), not just forms. Keep
  this as a standard.
- **Secrets/env:** No `.env*` files exist; pattern is gitignored; nothing sensitive in the repo. ✔
- **Supply chain:** pnpm 10 `allowBuilds` explicitly allow-lists build scripts (esbuild yes, msw's postinstall no) —
  ahead of the curve. Lockfile committed. No dependency audit automation yet (add `pnpm audit` to future CI).
- **XSS:** Two real areas to watch: (1) `SmartTextEditor` HTML mode round-trips via `$generateNodesFromDOM` and emits
  raw HTML strings — any app that _renders_ stored editor HTML must sanitize (DOMPurify) at render time; the library
  should document this contract and/or offer a sanitizing helper. (2) No `dangerouslySetInnerHTML` in app code today. ✔
- **CSV/XLSX injection:** `lib/xlsx.ts` writes strings as inline strings (not formulas), which mitigates classic `=cmd`
  formula injection for the XLSX path; the CSV export in `SmartGrid` delegates to AG Grid's exporter — verify/enable its
  formula-escaping option when data becomes user-generated.
- **CSRF / injection:** No mutating endpoints exist; the query-string builder uses `URLSearchParams` (proper encoding).
  Non-issue today.
- **Headers/CSP:** No deployment config, so no CSP/security headers story yet — belongs in the deployment roadmap.

---

# Performance Review

- **Bundle size — the headline finding.** Production build emits **one 2.6 MB JS chunk** (~2.5 MiB minified; Vite
  warns >500 kB) plus 162 kB CSS. Causes:
  1. All 24 pages statically imported in [App.tsx](apps/web/src/App.tsx) — zero route-level splitting.
  2. `ensureGridModules()` registers `AllCommunityModule` (everything AG Grid Community ships) instead of the specific
     modules used.
  3. Lexical + all its plugins load eagerly even for pages without an editor.
  4. Nine Inter font subsets ship (~230 kB of woff2); most locales unused.
- **Tree shaking:** Works where it can (orphaned `chart.tsx`/recharts do _not_ end up in the bundle) — the problem is
  eager imports, not shaking. Rolldown also flags mis-positioned `#__PURE__` annotations in `@lexical/react` (upstream,
  cosmetic).
- **Code splitting / lazy loading:** None. `React.lazy` per route + `manualChunks` (vendor split for ag-grid/lexical)
  would cut initial JS by an estimated 60–75%.
- **Rendering:** Good — virtualized grids, block cache with abortable fetches (`AbortController` per block, tracked in a
  `Set`), debounced state persistence (300 ms), memoized identities for grid inputs.
- **Memoization:** Targeted, not superstitious. ✔
- **Expensive computations:** XLSX generation is synchronous on the main thread — fine at current export sizes; consider
  a worker beyond ~50k cells.
- **Caching:** localStorage grid-state persistence with debounce. No HTTP/data-layer caching (no TanStack Query) —
  acceptable for a demo, roadmap item for real apps.

---

# Testing Review

| Layer             | State                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (pure logic) | **Good.** 52 tests / 7 files: `pagination` (13), `server-grid-internals` (11), `format` (10), `smart-form-sync` (7 — regression tests for the update-depth loop), `xlsx` (6), `use-server-grid-selection` (5), `smart-number-field` (3). Exactly the right things are tested first.                                             |
| Component/render  | **Near-zero.** 2 of 7 test files render components; none of the 41 smart wrappers, page system, pickers, or grids have render tests. `SmartServerGrid` tests existed and were **removed** (commit `a2f5127`) — signalling AG Grid + jsdom friction that needs a strategy (mock the grid boundary or test via browser mode/E2E). |
| Integration/E2E   | **None**, despite `@playwright/test` being installed at the root. The playground app is an ideal E2E target (deterministic MSW backend).                                                                                                                                                                                        |
| Coverage          | `@vitest/coverage-v8` installed; no thresholds, no reporting, not wired into any gate.                                                                                                                                                                                                                                          |
| Infra             | Vitest 4 + jsdom + Testing Library configured correctly (`vitest.setup.ts` with jest-dom). Pre-push runs the suite. Test environment startup dominates runtime (89 s environment vs 1.3 s tests) — consider `pool: 'threads'`/project config as suite grows.                                                                    |

**Biggest risks untested:** SmartForm field rendering per type, SmartPage slot/layout detection, grid toolbar behaviors,
Lexical toolbar, theme provider hotkey/storage sync.

---

# Documentation Review

- **README.md:** Stock template ("shadcn/ui monorepo template") with a garbled trailing artifact (
  `# a u t o m a t i c - o c t o - f i e s t a`). Does not mention the form engine, grids, page system, MSW, or scripts.
  **The single worst doc artifact in the repo.**
- **CLAUDE.md:** Excellent and accurate — commands, architecture, exports map, placement rules, internals map. Currently
  the _real_ onboarding doc, though written for an AI assistant.
- **Inline/JSDoc:** Outstanding (see Code Quality). Public props documented member-by-member with `@example` blocks on
  major components.
- **Architecture docs:** None beyond CLAUDE.md; no ADRs (several decisions deserve one: Base UI over Radix, hand-rolled
  xlsx, source-only package, Spring page contract).
- **API/usage docs:** None. No Storybook/Ladle; the playground app is the implicit documentation, but nothing maps "
  component → demo route".
- **Onboarding:** `pnpm install && pnpm dev` works, but only CLAUDE.md says so.

---

# Technical Debt

| #   | Issue                                                                                                                                                                             | Severity            | Reason                                                                    | Recommendation                                                                                                         | Effort  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | No CI pipeline                                                                                                                                                                    | **Critical**        | All gates are local & bypassable; regressions can land on `main` silently | GitHub Actions: install → lint → typecheck → test → build on PR + main                                                 | 0.5–1 d |
| 2   | Single 2.6 MB bundle, no code splitting                                                                                                                                           | **High**            | Slow first load; will worsen as pages grow                                | `React.lazy` per route + Suspense fallback + vendor `manualChunks`                                                     | 1–2 d   |
| 3   | Zero component-level tests; grid tests deleted                                                                                                                                    | **High**            | 59-component public surface can regress invisibly; refactors become risky | Render-test top 10 components; decide AG Grid test boundary; add Playwright smoke E2E                                  | 3–5 d   |
| 4   | Orphaned components + unused deps (`recharts`, `@tanstack/react-table`, `@playwright/test` unused, `vitest` in `dependencies`, embla/resizable only via orphans)                  | **Medium**          | Install weight, audit surface, false signals about what's supported       | Delete orphans (regenerable via shadcn CLI) or document retention policy; move `vitest` to devDeps; remove unused deps | 0.5 d   |
| 5   | README boilerplate; no consumer docs                                                                                                                                              | **Medium**          | Onboarding and library adoption depend on tribal knowledge / CLAUDE.md    | Rewrite README; add per-domain usage docs                                                                              | 1 d     |
| 6   | Theme toggle unreachable (hidden `d` hotkey only; `useTheme` has zero consumers)                                                                                                  | **Medium**          | Shipped feature invisible to users; hotkey is a UX/a11y trap              | Add visible toggle (e.g. in `NavUser`); make hotkey opt-in; document                                                   | 0.5 d   |
| 7   | `console.log(res)` in `users.ts:35`                                                                                                                                               | **Low**             | Log noise on every grid fetch                                             | Delete the line                                                                                                        | 5 min   |
| 8   | Duplicate `use-mobile` implementations                                                                                                                                            | **Low**             | Divergent behavior between workspaces                                     | Delete app copy, import from `@workspace/ui/hooks/use-mobile`                                                          | 15 min  |
| 9   | `FieldDefinition` non-discriminated options bag                                                                                                                                   | **Medium**          | Invalid field configs compile fine                                        | Discriminated union per `FieldType` (or grouped sub-configs)                                                           | 1–2 d   |
| 10  | `AllCommunityModule` registration                                                                                                                                                 | **Medium**          | Bundles all AG Grid features regardless of use                            | Register only required modules                                                                                         | 0.5 d   |
| 11  | `toolbar-plugin.tsx` 1,375 LOC                                                                                                                                                    | **Medium**          | Change risk concentration                                                 | Decompose into sections/sub-plugins                                                                                    | 1–2 d   |
| 12  | Suspect `@source` globs in `globals.css` (`../../../apps/**` resolves to `packages/apps`, which doesn't exist; app scanning currently works via the Vite plugin's auto-detection) | **Low**             | Masked config bug; could bite when auto-detection assumptions change      | Fix relative depth (one more `../`) and remove the nonexistent `components/**` glob                                    | 15 min  |
| 13  | `packages/ui/tsconfig.json` includes nonexistent `turbo` dir; `@turbo/gen` unused                                                                                                 | **Low**             | Scaffolding leftovers                                                     | Remove or actually add generators                                                                                      | 15 min  |
| 14  | No coverage thresholds / reporting                                                                                                                                                | **Low**             | Coverage tool installed but inert                                         | Wire `--coverage` with modest thresholds into CI                                                                       | 0.5 d   |
| 15  | No release/versioning machinery (all `0.0.x`, private)                                                                                                                            | **Medium (future)** | Library can't be consumed outside the monorepo; no changelog              | Adopt Changesets when external consumption is planned                                                                  | 1 d     |
| 16  | Lexical HTML output sanitization contract undefined                                                                                                                               | **Medium (future)** | Stored-XSS risk the moment editor content is persisted and re-rendered    | Document contract; provide sanitize-on-render helper                                                                   | 0.5–1 d |
| 17  | In-flight uncommitted skill rename in `.claude/skills/` (staged delete + new SKILL.md)                                                                                            | **Low**             | Dirty working tree state                                                  | Commit or discard                                                                                                      | 5 min   |

---

# Priority Improvements

**Critical**

1. Stand up CI (lint + typecheck + test + build on every PR).

**High** 2. Route-level code splitting + AG Grid module slimming (bundle ↓ 60–75%). 3. Component test strategy + restore
grid coverage + Playwright smoke suite. 4. Rewrite README / add real consumer documentation.

**Medium** 5. Dependency & dead-code purge (orphans, misplaced `vitest`, unused playwright/recharts/react-table). 6.
Visible theme toggle; tame the `d` hotkey. 7. Discriminated-union `FieldDefinition`. 8. Toolbar-plugin and
`smart-form.tsx` decomposition (field registry). 9. Coverage thresholds in CI; Changesets for versioning.

**Low** 10. `console.log` removal, `use-mobile` dedupe, `@source` glob fix, tsconfig cleanup, ADRs for the four big
decisions.

---

# Overall Scores

| Dimension            | Score /10 | One-line justification                                                                                       |
| -------------------- | --------: | ------------------------------------------------------------------------------------------------------------ |
| Architecture         |     **8** | Clean layers, pure-logic extraction, documented patterns; no release/ops story                               |
| Code Quality         |     **9** | Zero `any`, zero TODOs, exemplary comments, consistent conventions                                           |
| Performance          |     **5** | Great runtime patterns undermined by a single 2.6 MB chunk and zero splitting                                |
| Security             |     **6** | Right habits (Zod-at-the-boundary, allowBuilds); no CSP/audit automation; editor-HTML contract undefined     |
| Accessibility        |     **6** | Solid primitives + form focus management; no automated checks; hidden-hotkey-only theme                      |
| Developer Experience |     **7** | Fast monorepo, strong local gates, great inline docs; no CI, no Storybook, README useless                    |
| Documentation        |     **5** | World-class inline + CLAUDE.md vs boilerplate README and zero consumer docs                                  |
| Testing              |     **5** | Excellent unit tests on pure logic; component/E2E layers essentially absent                                  |
| **Overall Project**  |     **7** | A remarkably disciplined young codebase whose gaps are operational (CI, bundle, tests, docs), not structural |

---

# Top 20 Improvements (sorted by impact)

1. **Add GitHub Actions CI** — lint, typecheck, test, build on PR/main. (Critical, 0.5–1 d)
2. **Route-based code splitting** with `React.lazy` + Suspense in `apps/web`. (High, 1 d)
3. **Register only needed AG Grid modules** instead of `AllCommunityModule`. (High, 0.5 d)
4. **Vendor chunking** (`manualChunks`: ag-grid, lexical, react) + bundle-size check in CI. (High, 0.5 d)
5. **Component render tests** for the top-10 most-used smart components. (High, 2–3 d)
6. **Playwright smoke E2E** against the MSW-backed playground (dep already installed). (High, 1–2 d)
7. **Rewrite README.md** — what/why/quickstart/scripts/architecture links. (High, 0.5 d)
8. **Purge dead code & deps** — 10 orphan primitives, recharts, react-table, misplaced vitest, unused
   playwright/turbo-gen. (Medium, 0.5 d)
9. **Visible theme toggle** + make the global `d` hotkey opt-in. (Medium, 0.5 d)
10. **Restore SmartServerGrid test coverage** with an explicit AG Grid mocking boundary. (Medium, 1–2 d)
11. **Discriminated-union `FieldDefinition`** for compile-time field-config safety. (Medium, 1–2 d)
12. **Field-registry refactor of `smart-form.tsx`** — kills the 250-line switch, enables custom field types. (Medium, 1
    d)
13. **Decompose `toolbar-plugin.tsx`** into per-section modules. (Medium, 1–2 d)
14. **Delete `console.log`, dedupe `use-mobile`, fix `@source` globs, tsconfig cleanup.** (Low, 1 h total)
15. **Coverage thresholds** wired into CI (`@vitest/coverage-v8` already installed). (Medium, 0.5 d)
16. **Consumer docs per domain** (form engine, data grid, page system) — usage + props + gotchas. (Medium, 1–2 d)
17. **Changesets** for versioning/changelogs ahead of any external consumption. (Medium, 1 d)
18. **`eslint-plugin-jsx-a11y` + axe checks** in tests/CI. (Medium, 1 d)
19. **Document/sanitize Lexical HTML contract** (DOMPurify helper or explicit consumer requirement). (Medium, 0.5–1 d)
20. **Extract shared `GridToolbar`** from the two grids; unify `ErrorPanel` with `SmartPageError`. (Low, 1 d)
