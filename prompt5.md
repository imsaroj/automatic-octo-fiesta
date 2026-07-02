# Project Vision — Within One Year

> Premise: `smart-component` becomes the **UI platform underneath a large enterprise product family** — multiple product apps, multiple teams, external-facing deployments, compliance obligations. This document designs that end-state and the bets required to reach it. Each recommendation carries: why, business value, technical value, complexity, risks, dependencies, success metrics. It assumes the 6-month roadmap (prompt4.md) is delivered.

---

## 1. Architecture: Modular monorepo with domain-driven package boundaries

**Recommendation:** Stay a **single pnpm/Turborepo monorepo**; grow it into a modular platform of independently versioned packages organized by domain (design tokens, primitives, smart layer, engines, contracts, tooling) plus product apps. **Explicitly rejected:** microservices (there is no server runtime to decompose — the only backend artifacts are _contracts_), and multi-repo (kills atomic cross-cutting changes, the platform team's superpower).

- **Why:** The current layering (primitives → smart → engines → apps) is already domain-shaped; the monorepo preserved atomic refactors through 27k LOC and will through 270k. Domain-Driven Design applies at the _package boundary_ level: `form-engine`, `data-grid`, `editor` are bounded contexts with published contracts (`ServerFetchParams`, `FieldDefinition`).
- **Business value:** One platform team serves N product teams; shared fixes ship everywhere in one PR.
- **Technical value:** Atomic changes, single toolchain, affected-only CI, no version skew between internal layers.
- **Complexity:** Medium (package splits + enforced boundaries).
- **Risks:** Monorepo scale pain (CI time, checkout size) — mitigated by remote cache, sparse checkout guidance, affected-graph CI already in place.
- **Dependencies:** 6-month workspace architecture (prompt4 C1).
- **Success metrics:** Cross-package refactor lead time < 1 day; dependency-cruiser boundary violations = 0 in CI; ≥ 3 product apps in-repo or consuming published packages.

## 2. Scalability: Performance as a contract

**Recommendation:** Publish performance _contracts_ per component (initial JS cost, render budget, interaction latency under standard fixtures) and enforce them in CI like types.

- **Why:** At enterprise scale the library is on every screen; unbudgeted regressions multiply by the whole product surface.
- **Business value:** Predictable UX quality; performance objections to adoption disappear.
- **Technical value:** Stress fixtures (100k-row grid, 100-field form) become regression instruments; INP/LCP tracked from real users feeds budget tuning.
- **Complexity:** Medium. **Risks:** brittle benchmarks — use bounded assertions and trend alerts, not exact numbers.
- **Dependencies:** prompt4 B3 profiling program.
- **Success metrics:** p75 INP < 200 ms on reference flows; initial route JS < 300 kB on product apps; zero budget-gate overrides per quarter.

## 3. Cloud & Infrastructure

**Recommendation:** Keep the platform's own footprint **static-first and vendor-light** (docs, Storybook, reference app on CDN/edge hosting via IaC), while providing product apps a paved road: standard Vite build targets, CDN caching policy, edge-header (CSP/security) presets, and container images only where a BFF exists.

- **Why:** The library itself needs almost no infrastructure; its job is to make _consumers'_ deployments boringly consistent.
- **Business value:** New product app goes from repo to deployed preview in < 1 day using the paved road.
- **Technical value:** One reviewed CSP/header set; reproducible environments; no snowflake dashboards.
- **Complexity:** Low–Medium. **Risks:** over-building for hypothetical scale — adopt serverless/edge only on demonstrated need.
- **Dependencies:** prompt4 A2 IaC baseline.
- **Success metrics:** Time-to-first-preview for a new app < 1 day; infra drift incidents = 0.

## 4. Developer Experience

**Recommendation:** Treat DX as a product with a named owner: scaffolding generators (`pnpm new:component|field|feature|app`), sub-10-minute onboarding (devcontainer/Nix optional), sub-8-minute PR CI held as an SLO, IDE-integrated docs (JSDoc already excellent → surfaces in hover), and a weekly DX-friction triage.

- **Business value:** Engineer throughput and retention; platform adoption is won on DX.
- **Technical value:** Generators encode standards (component+story+test+changeset in one shot), making the quality bar the path of least resistance.
- **Complexity:** Low–Medium. **Risks:** tooling sprawl — every tool needs an owner and a deletion criterion.
- **Dependencies:** prompt3 generators; prompt4 C2 handbook.
- **Success metrics:** New-hire first merged PR < 2 days; CI p95 < 8 min; DX survey ≥ 4/5 quarterly.

## 5. Testing

**Recommendation:** Full pyramid held at ratio by policy: unit (pure logic) → component/interaction (Testing Library + Storybook play) → visual (Chromatic/Playwright) → E2E (Playwright, MSW-deterministic) → contract tests for backend dialects → mutation testing (Stryker) on the two engines as the deepest layer.

- **Business value:** Change-failure rate becomes a managed number; regressions caught pre-canary.
- **Technical value:** Mutation testing keeps the _quality of tests_ honest on the highest-risk modules (form sync, grid datasource).
- **Complexity:** Medium. **Risks:** suite runtime — affected-only + sharding are prerequisites, already in place.
- **Dependencies:** prompt3/4 testing strata.
- **Success metrics:** Mutation score > 70% on engines; escaped-defect rate < 1/release; flake < 1%.

## 6. Automation

**Recommendation:** Automate every recurring decision: Renovate with auto-merge-on-green for patch/minor, release trains, changelog/release-notes generation, API-report diffs, stale-code detection (knip in CI — would have caught the orphaned primitives found in the audit), issue triage bots, and scheduled dead-flag cleanup (see §13).

- **Business value:** Platform team time goes to features, not ceremonies.
- **Technical value:** knip/api-extractor make "unused" and "public" machine-checked properties.
- **Complexity:** Low. **Risks:** automation acting on weak tests — gates depend on §5.
- **Success metrics:** ≥ 80% of dependency updates merged with zero human review; zero orphaned exports at any release.

## 7. Security

**Recommendation:** Graduate from hardening to assurance: SLSA-aligned provenance builds, SBOM per release, signed packages, quarterly threat-model refresh, pen-test of the reference deployment, security champions per consuming team, and library-level secure defaults (sanitizing editor renderer as default-on, injection-safe exports — both already seeded at month 1–3).

- **Business value:** Passes enterprise/procurement security review without bespoke effort per deal.
- **Technical value:** Compromise blast radius of a shared library is the whole product family — provenance + SBOM shrink response time from days to hours.
- **Complexity:** Medium. **Risks:** checkbox compliance — tie every control to an incident scenario.
- **Dependencies:** prompt4 D3.
- **Success metrics:** Critical vuln patch-to-release < 48 h; SBOM coverage 100% of releases; zero secrets incidents.

## 8. Observability & Analytics

**Recommendation:** One instrumentation spine: the library's `diagnostics` hooks (fetch timings, form outcomes, editor errors) flow into OpenTelemetry semantics; product apps attach RUM (web-vitals), error tracking, and **product analytics** (privacy-reviewed, consent-aware event schema owned per feature — the library ships the _hook points_, never the vendor SDK).

- **Business value:** Roadmap by data (which components/fields/filters are actually used); UX regressions visible in hours.
- **Technical value:** Vendor-neutral hooks avoid coupling every app to one APM; component-usage telemetry guides deprecation with evidence.
- **Complexity:** Medium. **Risks:** PII in events — schema review + consent gating mandatory.
- **Dependencies:** prompt3 §9, prompt4 D2.
- **Success metrics:** 100% of library instrumentation points documented and consumed by ≥ 1 app; deprecations justified by usage data.

## 9. Internationalization

**Recommendation:** Make the library i18n-ready **now-ish** (it is not today): extract every hardcoded string (`"Loading data…"`, `"Couldn't load data"`, `"Retry"`, `"{n} selected"`, `"Toggle columns"`, submit labels, empty-state defaults) behind an injectable `LocaleProvider` with typed message keys and English defaults; all date/number formatting already flows through `Intl`/date-fns — add locale plumbing. Product apps choose the message-catalog stack (e.g. Lingui/FormatJS); the library stays catalog-agnostic. Include RTL: logical CSS properties audit (Tailwind v4 supports it) + RTL Storybook mode.

- **Why:** Retrofitting i18n after 3 product apps hardcode English is a quarter of migration work; the string surface is still small.
- **Business value:** Unblocks non-English markets and localization compliance.
- **Technical value:** Typed message keys make missing translations compile-time errors.
- **Complexity:** Medium. **Risks:** partial adoption (some components localized, some not) — CI check: no string literals in JSX for `packages/ui` (lint rule with allowlist).
- **Success metrics:** 100% of library UI strings behind the provider; RTL visual suite green; one pilot locale shipped in a product app.

## 10. Accessibility

**Recommendation:** Maintain AA as a release gate (from prompt4 B4) and advance: per-component conformance matrix published, screen-reader test rotation (NVDA/VoiceOver) on the grid/editor/pickers quarterly, a11y acceptance criteria in the component-authoring checklist, and target selected AAA criteria where cheap (focus appearance, target size).

- **Business value:** Legal risk reduction (EAA/ADA); market access for public-sector deals.
- **Complexity:** Ongoing Medium. **Risks:** AG Grid Community ceilings — documented limitations + upstream advocacy.
- **Success metrics:** Zero serious axe violations sustained; SR test findings triaged < 1 sprint; conformance doc current at every release.

## 11. Feature Flags

**Recommendation:** Two distinct systems, deliberately: (a) **library-level flags** — the existing `experimental` stability tier for new component APIs (compile-time/entry-point based, no runtime service); (b) **product-level flags** — a runtime flag provider _interface_ in the reference architecture (OpenFeature standard) so apps can plug LaunchDarkly/Unleash/homegrown without the library caring.

- **Why:** Conflating design-system experiments with product rollouts creates coupling; OpenFeature keeps vendor choice open.
- **Business value:** Safe progressive rollouts of both new UI and new features; kill switches for canary regressions.
- **Complexity:** Low (interface) / Medium (org adoption). **Risks:** flag debt — expiry dates + scheduled cleanup automation (§6).
- **Success metrics:** 100% of flags with owner+expiry; stale flags > 90 days = 0.

## 12. Plugin Architecture

**Recommendation:** Complete the engines' extension story (from prompt4 C3) into a formal plugin model: form fields, grid cell renderers/filter dialects, editor toolbar sections/nodes, and _theme packs_ — each a typed, versioned contract with a compatibility matrix, discovered via explicit registration (no magic auto-discovery).

- **Why:** This is what stops the platform team being the bottleneck and what stops forks — the two failure modes of every enterprise design system.
- **Business value:** Product teams self-serve domain-specific needs (e.g. a finance-formatted cell renderer) without platform tickets.
- **Technical value:** Contracts already exist implicitly (`FieldBaseProps`, `DataGridColumn`); formalizing them is low-risk.
- **Complexity:** Medium–High. **Risks:** plugin API is forever — incubate everything one release in `experimental`.
- **Success metrics:** ≥ 5 plugins built outside the platform team; fork count = 0.

## 13. API Versioning & SDK Generation

**Recommendation:** (a) The library's TypeScript API: semver enforced by API-extractor reports + changesets (in place by month 6). (b) The **server contracts** (`ServerFetchParams`, filter dialect, Spring `Page<T>`): publish as a standalone `@workspace/contracts` package with JSON Schema + versioned dialects. (c) **SDK generation:** when real backends arrive, generate typed clients from OpenAPI (openapi-ts/orval) into per-domain SDK packages, with the Zod-at-the-boundary pattern preserved (generate Zod schemas, keep runtime validation).

- **Why:** The grid contract is already a de-facto wire API; making it explicit prevents N backends implementing N dialects. Codegen removes the hand-written `users.ts`-style adapters as the product grows.
- **Business value:** Backend/frontend teams parallelize against contracts; integration defects drop.
- **Technical value:** One source of truth for shapes; runtime validation stays (the repo's best habit).
- **Complexity:** Medium. **Risks:** generated-code churn in review — commit lockfile-style, review the spec not the output.
- **Success metrics:** 100% of API calls through generated, Zod-validated clients; contract-drift incidents = 0.

## 14. Documentation

**Recommendation:** A single docs platform (Storybook-embedded or a dedicated site, e.g. Astro Starlight) with generated props reference, guides, ADR log, conformance matrices, release notes, and **executable docs** (live examples sourced from the same stories CI tests — docs can't lie).

- **Business value:** Self-serve adoption; support load becomes a falling metric.
- **Complexity:** Medium. **Risks:** two doc systems drifting — one source of truth, generated everywhere else.
- **Success metrics:** Docs-accuracy test (new joiner exercise) pass rate 100%; support questions answered-by-link > 70%.

## 15. Deployment & Release Strategy

**Recommendation:** Continue trunk-based development with the merge queue; weekly release trains + canary channel (from prompt4 D1) graduate to: canary (every merge) → stable train (weekly) → LTS tags (quarterly, security-only backports for slow-moving product teams). Product apps deploy continuously behind flags with instant CDN rollback.

- **Business value:** Teams choose their risk appetite (canary/stable/LTS) instead of forking or freezing.
- **Complexity:** Medium. **Risks:** LTS backport cost — cap at security fixes only, one LTS line at a time.
- **Success metrics:** DORA elite band on the reference app (deploy freq daily+, lead time < 1 day, CFR < 15%, MTTR < 1 h); consumer upgrade lag p75 < 2 stable releases.

## 16. AI-assisted development

**Recommendation:** Institutionalize what this repo already does unusually well — it is _legible to AI agents_ (CLAUDE.md, repo-local skills like `shadcn-smart-wrappers`, exhaustive JSDoc). Extend: keep machine-readable architecture docs current as a CI-checked artifact; grow the skill library (form-engine field authoring, grid dialect adapters); AI code review as a _pre-human_ pass (bug hunting, standards checking against the handbook); generated-first drafts for stories/tests from component sources; and a policy: AI output ships only through the same gates as human code (types, tests, review, changesets — no exceptions).

- **Why:** The marginal cost of the platform team's standards drops when agents can apply them; the repo's documentation culture is precisely the substrate agents need.
- **Business value:** Throughput on rote work (wrappers, stories, migrations) without diluting quality.
- **Technical value:** Skills encode tribal knowledge executably; migrations (e.g. a future Tailwind v5) become largely agent-driven under test protection.
- **Complexity:** Low–Medium. **Risks:** unreviewed slop, license/provenance concerns — the "same gates" policy is the control.
- **Success metrics:** ≥ 30% of new stories/tests drafted by agents and accepted; zero AI-attributed escaped defects; skill docs updated within one release of API changes.

---

# Ideal Future Architecture

## Ideal folder structure

```
smart-platform/
├── apps/
│   ├── docs/                      # Docs site + embedded Storybook (deployed)
│   ├── reference/                 # Reference product app (canary consumer, feature-module blueprint)
│   │   └── src/features/<domain>/ # api/ queries/ components/ pages/ per bounded context
│   └── <product-apps…>/           # Real products, same blueprint
├── packages/
│   ├── tokens/                    # Design tokens (source of truth) + build outputs
│   ├── primitives/                # shadcn/Base UI vendored layer (regenerable)
│   ├── ui/                        # Smart wrappers + page system (stable public API)
│   ├── form-engine/               # Independently versioned engine + plugin API
│   ├── data-grid/                 # Engine + dialect adapters + contract tests
│   ├── editor/                    # Lexical editor + plugin slots
│   ├── contracts/                 # Wire contracts: schemas, JSON Schema, dialect specs
│   ├── sdk-<domain>/              # Generated, Zod-validated API clients
│   ├── diagnostics/               # Instrumentation spine (OTel-semantic hooks)
│   ├── testing/                   # Shared test utils, fixtures, contract-test kits, MSW factories
│   ├── eslint-config/ typescript-config/  # Shared presets
│   └── generators/                # Scaffolding (component/field/feature/app)
├── infra/                         # IaC: hosting, headers/CSP, DNS, preview envs
├── docs/adr/                      # Architecture Decision Records
└── .github/                       # CI/CD workflows, merge queue, release trains
```

## Recommended technology stack (target state)

- **Core:** TypeScript strict (single pinned version via shared config) · React 19+ · Vite/Rolldown · Tailwind v4 tokens
- **Engines:** TanStack Form + Zod · AG Grid (module-registered; Enterprise only if features demand) · Lexical
- **Data:** TanStack Query (apps) · generated OpenAPI clients with Zod · MSW for all non-prod environments
- **Quality:** ESLint flat + jsx-a11y + boundaries + custom rules · Prettier · Vitest (+ browser mode where jsdom limits) · Playwright (E2E, visual, axe) · Stryker on engines · knip · API-extractor
- **Delivery:** pnpm + Turborepo remote cache · Changesets · GitHub Actions + merge queue · SLSA provenance + SBOM · Renovate
- **Operations:** OpenTelemetry-semantic diagnostics · web-vitals RUM · Sentry-class error tracking · OpenFeature flags

## Coding standards (the enforced ten)

1. `strict` TypeScript; no `any` in production code (status quo — keep it).
2. Public props are JSDoc'd interfaces; comments explain _why_, never _what_.
3. Every component ships with story + test + changeset (generator-enforced).
4. Pure logic lives beside, not inside, components (`*-internals` pattern).
5. Validate at every boundary: Zod on inbound data, typed contracts on outbound.
6. No hardcoded user-facing strings in the library (i18n keys).
7. Import direction enforced: apps → ui → engines → primitives → tokens (no cycles).
8. Accessibility acceptance criteria on every interactive component.
9. `experimental` tier for every new public API for ≥ 1 release.
10. Deprecate with `@deprecated` + diagnostics warning + migration doc; remove after 2 minors.

## Architecture principles

- **Layered, one-way dependencies; bounded contexts at package seams** (DDD-lite — contexts, contracts, no ceremony).
- **Contracts over coupling:** engines speak published, versioned shapes; backends adapt via dialects.
- **Escape hatches by design:** flattened APIs for the 80%, documented primitive access for the rest.
- **Machine-checkable standards:** a rule that isn't enforced by CI is a suggestion — and gets deleted.
- **Event-driven only at the edges:** UI stays request/response; the diagnostics/analytics spine is the only pub/sub. **No microservices** — nothing here has independent scaling or deployment needs that justify the operational tax.

## Deployment workflow

PR → CI (affected graph) → ephemeral preview (app + Storybook + visual diff) → merge queue (full gates) → main → canary publish + reference-app deploy → weekly stable train → CDN deploy with instant rollback → LTS tags quarterly.

## CI/CD workflow (gates in order)

format-check → lint (incl. a11y, boundaries, no-console) → typecheck → unit/component (sharded, affected) → build + bundle budgets → API-report diff → visual regression → E2E smoke + axe sweep → changeset presence → merge queue re-run → release automation (provenance, SBOM, notes).

## Branching strategy

**Trunk-based.** Short-lived feature branches (< 3 days) → PR → merge queue → `main` always releasable. No develop branch, no gitflow. Release lines exist only as tags (+ at most one `lts/*` maintenance branch). Conventional commits (already enforced) feed release notes.

## Release strategy

Canary on every merge (`next`) → weekly stable train (semver via changesets, API-extractor-audited) → quarterly LTS tag (security backports only). Consumers pin minor, upgrade on their cadence; upgrade lag monitored and chased with codemods for breaking changes.

## Testing strategy

Pyramid ratios held by policy: ~60% unit/pure, ~25% component/interaction, ~10% visual, ~5% E2E; contract tests for every backend dialect; mutation testing on engines; determinism via MSW everywhere non-prod; flake budget < 1% with quarantine automation.

## Documentation standards

One source of truth per fact (tokens → generated docs; props → API report → generated reference; behavior → stories → embedded live examples). ADR for every architecturally significant decision within the PR that makes it. Docs-accuracy validated quarterly by a fresh-eyes exercise. CLAUDE.md/skills maintained as the machine-readable mirror of the handbook.

## Project governance

- **Ownership:** Platform team owns `packages/*` + standards; product teams own `apps/*`; CODEOWNERS enforces review routing.
- **Change process:** RFC (lightweight, issue template) for public-API or cross-cutting changes; ADR records the outcome; API-report diff is the enforcement.
- **Cadence:** Weekly release train · monthly library-health report (bundle, vitals, adoption, a11y, flake) · quarterly roadmap review driven by usage telemetry · quarterly deprecation/flag/dead-code cleanup.
- **Adoption contract:** Consumers get semver guarantees, migration codemods, canary access, and a support SLA; in exchange they stay within 2 stable releases and file issues instead of forking.

---

_The one-line vision: keep the discipline this codebase already shows — strict types, documented reasoning, validated boundaries — and industrialize it with gates, contracts, and automation until quality is a property of the system rather than of its authors._
