# Project Improvement Roadmap — Within One Week

> Scope: quick wins only. Every task below is independently shippable, low-risk, and sized so the full list fits in one focused week. Tasks are **sorted by priority**. Verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` stays green.

---

## Task 1 — Stand up a minimal CI pipeline

- **Description:** Add a GitHub Actions workflow that runs install → lint → typecheck → test → build on every push and pull request. Cache the pnpm store and Turborepo cache.
- **Why it matters:** Today every quality gate (husky pre-push typecheck/tests) is local and bypassable with `--no-verify`. This is the only **critical** gap in the repo: nothing prevents a broken `main`. All checks already pass, so CI is pure upside with zero refactoring.
- **Estimated effort:** 0.5–1 day
- **Affected files/folders:** `.github/workflows/ci.yml` (new)
- **Implementation steps:**
  1. Create `.github/workflows/ci.yml` with `pnpm/action-setup` (pnpm 10.33 to match `packageManager`), `actions/setup-node` (Node 20, `cache: pnpm`).
  2. Steps: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
  3. Add `pnpm format:check` as a step so Prettier drift fails CI, not just pre-commit.
  4. Enable branch protection on `main` requiring the workflow.
- **Expected outcome:** No unreviewed/broken code can merge; the existing local gates get a server-side backstop.

---

## Task 2 — Route-level code splitting in the playground app

- **Description:** Convert the 24 static page imports in `apps/web/src/App.tsx` to `React.lazy()` with a single `<Suspense>` fallback (use the existing `SmartSpinner`/`SmartPageLoading`).
- **Why it matters:** The production build is a **single 2.6 MB JS chunk**. AG Grid, Lexical, and every demo page load on first paint of any route. Lazy routes are the highest-leverage performance fix available and touch only one file plus a fallback.
- **Estimated effort:** 0.5–1 day
- **Affected files/folders:** `apps/web/src/App.tsx`; optionally `apps/web/vite.config.ts` (add `build.rollupOptions.output.manualChunks` for `ag-grid`, `lexical`, `react` vendor groups)
- **Implementation steps:**
  1. Replace each `import Page from "@/pages/…"` with `const Page = lazy(() => import("@/pages/…"))`.
  2. Wrap `<Routes>` in `<Suspense fallback={<SmartPageLoading />}>`.
  3. Add vendor `manualChunks` so ag-grid/lexical land in their own cacheable chunks.
  4. Run `pnpm build` and record before/after chunk sizes in the PR description.
- **Expected outcome:** Initial JS payload drops an estimated 60–75%; grid/editor code loads only on routes that use it.

---

## Task 3 — Dead code and dependency purge

- **Description:** Remove orphaned shadcn primitives with zero importers and the dependencies only they pull in; fix misplaced dev dependencies.
- **Why it matters:** `recharts` 3.8 and `@tanstack/react-table` exist solely for never-imported `chart.tsx`/`data-table.tsx`; `@playwright/test` is installed with no config or tests; `vitest` sits in `packages/ui` **`dependencies`** (runtime section) instead of `devDependencies`. Dead weight slows installs, inflates the audit surface, and misleads contributors about what's supported. All primitives are regenerable via `pnpm dlx shadcn@latest add <name>` if needed later.
- **Estimated effort:** 0.5 day
- **Affected files/folders:**
  - Delete (0 importers, verified): `packages/ui/src/components/{chart,data-table,carousel,menubar,navigation-menu,input-otp,hover-card,aspect-ratio,resizable,pagination}.tsx`
  - `packages/ui/package.json` (remove `recharts`, `@tanstack/react-table`, `embla-carousel-react`, `react-resizable-panels`, `input-otp`; move `vitest` to `devDependencies`; remove `@turbo/gen` unless generators are planned)
  - Root `package.json` (remove `@playwright/test` **or** keep it and do Task — see prompt2 E2E; if keeping, leave a note in README)
  - `packages/ui/tsconfig.json` (drop nonexistent `"turbo"` from `include`)
  - `packages/ui/src/hooks/.gitkeep` (delete — folder is no longer empty)
- **Implementation steps:**
  1. Re-verify zero importers per file (`grep -r "components/<name>" apps packages`).
  2. Delete files, prune `package.json` entries, `pnpm install` to refresh the lockfile.
  3. Run the full verification suite.
- **Expected outcome:** Leaner install, honest dependency list, no orphan maintenance illusion. (Decision point: if the team prefers keeping a full shadcn set "on the shelf", document that policy in README instead of deleting — but still fix `vitest` placement and truly unused deps.)

---

## Task 4 — Rewrite `README.md`

- **Description:** Replace the stock shadcn-template README (which still contains a garbled `automatic-octo-fiesta` artifact) with a real one: what the project is, the four library layers, quickstart, all root scripts, workspace layout, and pointers to the playground routes.
- **Why it matters:** The README is the front door and it currently describes a different (template) project. CLAUDE.md already contains accurate content to adapt — this is largely an editing task.
- **Estimated effort:** 0.5 day
- **Affected files/folders:** `README.md`
- **Implementation steps:**
  1. Sections: Overview · Architecture (layer diagram) · Getting started (`pnpm install`, `pnpm dev`) · Scripts table · Adding shadcn components · Package exports map · Testing · Conventions (commitlint, import guardrail).
  2. Adapt from CLAUDE.md; keep the two in sync by making README the human doc and CLAUDE.md the assistant doc that links to it.
- **Expected outcome:** A new engineer reaches a running playground and understands the layering in under 10 minutes without opening CLAUDE.md.

---

## Task 5 — Hygiene sweep: console.log, use-mobile dedupe, `@source` globs, working tree

- **Description:** Fix four small, confirmed issues in one PR.
- **Why it matters:** Each is trivial but user-visible or trust-eroding: a debug `console.log(res)` fires on **every** server-grid fetch; two divergent `use-mobile` implementations can behave differently across workspaces; two `@source` globs in `globals.css` resolve to nonexistent paths (`packages/apps/**`, `packages/components/**`) and only work today because the Tailwind Vite plugin auto-detects sources; the git working tree holds an uncommitted skill-file rename.
- **Estimated effort:** ~1 hour
- **Affected files/folders:**
  - `apps/web/src/api/users.ts` (line 35: delete `console.log(res)`)
  - `apps/web/src/hooks/use-mobile.ts` (delete; update importers to `@workspace/ui/hooks/use-mobile`)
  - `packages/ui/src/styles/globals.css` (fix `@source` relative depth: `../../../apps/**` → `../../../../apps/**`; remove the `components/**` glob or point it at a real path)
  - `.claude/skills/shadcn-smart-wrappers/` (commit the staged rename)
- **Implementation steps:** Make the edits; verify Tailwind classes on app pages still render after the glob change (`pnpm dev`, spot-check one styled page); run verification suite.
- **Expected outcome:** No log noise, one breakpoint hook, `@source` config that means what it says, clean git status.

---

## Task 6 — Visible theme toggle (and tame the hidden hotkey)

- **Description:** Add a Light/Dark/System selector to the app shell (natural home: the `NavUser` dropdown in `apps/web/src/components/dashboard/nav-user.tsx`), consuming the already-existing `useTheme()`. Make the global `d` keydown shortcut opt-in via a `ThemeProvider` prop (default off) or remove it.
- **Why it matters:** The entire theming system works but is unreachable: `useTheme` has **zero consumers**, and the only way to switch themes is an undocumented global `d` key handler (`theme-provider.tsx:142-180`) — a discoverability and accessibility problem (any non-input keypress of "d" flips the theme).
- **Estimated effort:** 0.5 day
- **Affected files/folders:** `apps/web/src/components/dashboard/nav-user.tsx`, `apps/web/src/components/theme-provider.tsx`
- **Implementation steps:**
  1. Add a `hotkey?: boolean` prop (default `false`) gating the keydown effect.
  2. Add a theme submenu/segmented control to `NavUser` using `useTheme()`.
  3. Verify system-preference tracking and cross-tab storage sync still work.
- **Expected outcome:** Dark mode is a discoverable feature; no surprise theme flips while typing outside inputs.

---

## Task 7 — Wire up coverage reporting with baseline thresholds

- **Description:** `@vitest/coverage-v8` is installed but inert. Add a `test:coverage` script, generate the first report, and set intentionally modest thresholds (so CI enforces "don't get worse", not an aspirational number).
- **Why it matters:** Without a measured baseline, the (known) component-test gap is invisible and unbudgeted. This is the prerequisite for the month-one testing push.
- **Estimated effort:** 0.5 day
- **Affected files/folders:** `packages/ui/vitest.config.ts`, `packages/ui/package.json`, `.github/workflows/ci.yml` (from Task 1)
- **Implementation steps:**
  1. Add `coverage` config (provider `v8`, reporters `text` + `lcov`, exclude `src/components/**` vendored primitives).
  2. Run once, record the real numbers, set thresholds ~2 points below them.
  3. Add the coverage step to CI.
- **Expected outcome:** Coverage is visible in every PR and cannot silently regress.

---

## Task 8 — Type-safety quick wins in the form engine

- **Description:** Two contained improvements: (a) narrow `FieldDefinition.options` reuse by extracting a named `FieldOption` type; (b) replace the `getErrorMessage` `String(first)` fallback chain with a typed Standard-Schema issue guard. Additionally align `packages/ui/tsconfig.json` with the app's stricter flags (`noUnusedLocals`, `noUnusedParameters`).
- **Why it matters:** The library tsconfig is looser than the app's, so unused code can accumulate only on the library side — the side that matters most. (The full discriminated-union `FieldDefinition` refactor is intentionally deferred to the one-month roadmap.)
- **Estimated effort:** 0.5 day
- **Affected files/folders:** `packages/ui/tsconfig.json`, `packages/ui/src/form-engine/smart-form.tsx`
- **Implementation steps:** Add the flags; fix any fallout (should be near-zero given lint cleanliness); extract types; run verification suite.
- **Expected outcome:** Library-side dead locals become compile errors; error normalization is typed.

---

## Task 9 — Add `eslint-plugin-jsx-a11y` (recommended preset)

- **Description:** Install and enable `jsx-a11y` flat-config recommended rules in both workspaces; fix whatever it flags (expected: a handful of issues — e.g. icon-only buttons missing labels in demo pages).
- **Why it matters:** The library's accessibility baseline is good (Base UI semantics, 63 files with `aria-*`, focus-first-error in forms) but nothing _enforces_ it. A linter is the cheapest possible a11y regression guard and pairs with Task 1's CI.
- **Estimated effort:** 0.5–1 day (includes fixing findings)
- **Affected files/folders:** `packages/ui/eslint.config.js`, `apps/web/eslint.config.js`, both `package.json`s, plus flagged components
- **Implementation steps:** Install → extend configs → `pnpm lint` → fix findings (add `aria-label` to icon buttons, etc.) → verify.
- **Expected outcome:** Static a11y violations fail lint from now on.

---

## Task 10 — Extract the shared `GridToolbar`

- **Description:** `SmartGrid` and `SmartServerGrid` duplicate ~70 lines of toolbar JSX (title, selected-count, actions slot, refresh, column-visibility dropdown, export button). Extract an internal `grid-toolbar.tsx` in `packages/ui/src/data-grid/` consumed by both.
- **Why it matters:** It's the largest true duplication in the library; the two copies have already begun to drift (CSV vs XLSX export, refresh button presence). One implementation means one place to fix a11y/behavior.
- **Estimated effort:** 0.5–1 day
- **Affected files/folders:** `packages/ui/src/data-grid/{data-grid.tsx,server-data-grid.tsx,grid-toolbar.tsx(new)}`
- **Implementation steps:**
  1. Design props: `{ title, selectedCount?, toolbarActions, onRefresh?, columns: {id,label,visible}[], onToggleColumn, exportLabel, onExport, className }`.
  2. Move JSX; keep it internal (not exported from the barrel), matching the `*-internals` convention.
  3. Verify both grid demo pages visually (`pnpm dev` → `/grids/simple`, `/grids/server`).
- **Expected outcome:** One toolbar implementation; `server-data-grid.tsx` drops ~70 LOC; future toolbar features land in both grids automatically.

---

## Suggested sequencing

| Day | Tasks                                                |
| --- | ---------------------------------------------------- |
| 1   | Task 1 (CI) + Task 5 (hygiene sweep)                 |
| 2   | Task 2 (code splitting)                              |
| 3   | Task 3 (dead code/deps) + Task 7 (coverage baseline) |
| 4   | Task 4 (README) + Task 6 (theme toggle)              |
| 5   | Task 9 (jsx-a11y) + Task 8 or 10 (whichever fits)    |

Every task lands as its own conventional-commit PR through the new CI.
