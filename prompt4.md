# Project Improvement Roadmap — Within Six Months

> Perspective: Principal Engineer. This is a **modernization and industrialization roadmap**: months 1–3 (prompt3.md) made the design system adoptable; months 4–6 make it — and the practices around it — an organizational asset with predictable cost, provable quality, and low bus-factor. Recommendations are phased, costed, risk-assessed, and tied to ROI.

---

## Where the six-month mark should leave us

| Dimension      | 3-month state (assumed)                  | 6-month target                                                                       |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Architecture   | Layered library + reference app          | Stability-tiered public API, plugin-ready engines, second consumer app in production |
| Infrastructure | Static Storybook + reference deploys     | Ephemeral preview envs per PR, IaC-managed, remote-cached builds org-wide            |
| Quality        | Test pyramid + budgets                   | Quality gates as _policy_ (merge queue, required checks, DORA tracking)              |
| Release        | Automated changesets to private registry | Trained-release cadence, canary channel, semver-audited API extractor                |
| Security       | Renovate + CSP + threat model            | Signed provenance builds, SBOM, dependency SLOs                                      |
| Knowledge      | Docs site + ADRs                         | Standards handbook + governance model; onboarding < 1 day                            |

---

## Phase A (Months 4–4.5) — Platform infrastructure & deployment modernization

### A1. Ephemeral preview environments per PR

- **What:** Deploy the reference app + Storybook for every PR (Vercel/Netlify/Cloudflare Pages, or an internal k8s namespace if org policy requires). Post URLs on the PR; tear down on merge.
- **Why:** Reviewers currently rebuild locally to see changes; designers and PMs can't review at all. Preview links move design review left and are the single biggest collaboration unlock for a UI platform.
- **Effort:** 3–5 days (vendor) / 2–3 weeks (internal infra).
- **Risks:** Secrets isolation in previews (mitigate: MSW-only data, no real backends); cost sprawl (mitigate: TTL auto-teardown).
- **ROI:** Review cycle time typically drops 30–50% for UI changes; catches "works in Storybook, broken in app" integration issues pre-merge.

### A2. Infrastructure as code + environment parity

- **What:** Whatever hosts docs/reference/previews, define it declaratively (Terraform/Pulumi or the vendor's config-as-code), including DNS, headers (CSP from month 3), and redirects. One `infra/` folder, reviewed like code.
- **Why:** Today infrastructure is zero; the first deployment decisions will otherwise be made ad-hoc in dashboards and become unreproducible.
- **Effort:** 3–5 days.
- **Risks:** Over-engineering for a static-site footprint — keep it minimal; IaC is for _reproducibility_, not complexity.
- **ROI:** Rebuild-from-zero capability; security headers and caching policies versioned and auditable.

### A3. Org-wide Turborepo remote cache & build observability

- **What:** Promote the remote cache to a shared org service; add build telemetry (task timings, cache hit rates) to a dashboard; set a cache-hit SLO (> 80% on CI).
- **Why:** As more packages/apps join (see C1), build time is the tax every engineer pays daily.
- **Effort:** 2–3 days.
- **Risks:** Cache poisoning concerns — restrict write tokens to CI.
- **ROI:** Compounding: each new workspace inherits < 1 min no-op builds.

---

## Phase B (Months 4.5–5) — Quality gates as policy, performance, accessibility

### B1. Merge queue + required-check policy

- **What:** GitHub merge queue with required checks (lint, typecheck, unit, interaction, visual, E2E-smoke, bundle budget, axe gate, changeset presence). Batch-tested merges keep main always-green.
- **Why:** With 5+ contributors, "green on my branch" stops implying "green on main". A merge queue is the cheapest always-releasable-main guarantee.
- **Effort:** 1–2 days.
- **Risks:** Queue latency if CI is slow — depends on the < 8 min CI target from month 3 being held.
- **ROI:** Main-branch breakage → ~0; enables continuous release trains (D1).

### B2. Public-API governance with API Extractor / attw

- **What:** Run `@microsoft/api-extractor` (or `api-report` style tooling) + `are-the-types-wrong` over `@workspace/ui`'s export map. Commit the API report; CI fails on unreviewed public-surface changes; wire severity into changeset type (major/minor).
- **Why:** The library's contract _is_ its types. Today a renamed prop is discoverable only by consumer breakage. This makes every API change an explicit, reviewed diff — the single most Principal-Engineer-flavored control for a shared library.
- **Effort:** 3–4 days (source-exported package needs a d.ts build step for extraction — add a types-only `tsc` emit; this also future-proofs publishing).
- **Risks:** Friction complaints — mitigate by auto-labeling PRs and documenting the review path.
- **ROI:** Breaking-change escapes to consumers → ~0; semver becomes trustworthy, enabling wider adoption.

### B3. Performance program: from budgets to profiles

- **What:** Beyond the month-2 budgets: (1) React Profiler-based render-count assertions for the grid and form engine (e.g. typing in one field must not re-render other field components — the current whole-grid `values` subscription makes this a real, measurable target); (2) INP tracking added to vitals asserts; (3) `SmartServerGrid` stress fixture (100k-row mock) in Storybook with scripted scroll benchmark; (4) XLSX export moved to a Web Worker above a size threshold.
- **Why:** The library will be judged on the worst page built with it. Institutionalizing profiling prevents the classic "design system = slow app" reputation.
- **Effort:** 1.5–2 weeks.
- **Risks:** Render-count tests can be brittle — assert bounds, not exact counts.
- **ROI:** Documented headroom numbers become a sales tool for adoption; INP regressions caught pre-release.

### B4. Accessibility certification pass

- **What:** Formal WCAG 2.2 AA audit of the component set (external auditor or trained internal), remediation sprint, then publish a per-component conformance/keyboard-support matrix (VPAT-lite) in the docs.
- **Why:** Enterprise procurement increasingly requires it; the 3-month automated gates catch regressions but not conceptual gaps (focus order in the slot-based SmartPage, grid header filter announcements, editor toolbar semantics).
- **Effort:** 2 weeks (incl. remediation).
- **Risks:** AG Grid Community internals limit some fixes — document known limitations honestly and file/track upstream issues.
- **ROI:** Unblocks adoption by teams with compliance requirements; concentrates a11y expertise in the platform instead of every product team.

---

## Phase C (Month 5–5.5) — Architecture & technical standards

### C1. Workspace architecture for growth

- **What:** Split the monorepo along stable seams _only where pain exists_: `packages/typescript-config` and `packages/eslint-config` (shared presets — drift already observed between the two workspaces), and evaluate extracting `form-engine`, `data-grid`, `lexical-text-editor` into separately versioned packages consuming a `@workspace/ui-core`.
- **Why:** Shared config packages are pure win now. The engine split is a _decision to make deliberately at month 5_, not a default: separate packages let consumers take the grid without Lexical's weight in their dependency tree and give each engine its own semver cadence — but multiply release overhead. Decide on evidence: if by month 5 consumers ask for partial adoption or the engines' change cadences visibly diverge, split; otherwise document why not (ADR).
- **Effort:** Config packages 2 days; engine split 1.5–2 weeks if warranted.
- **Risks:** Premature fragmentation; cyclic dep temptation (engines importing smart-components importing engines) — enforce with dependency-cruiser rules either way.
- **ROI:** Config drift → 0 immediately; optional-engine adoption removes the biggest "your library is too heavy" objection if/when raised.

### C2. Technical standards handbook

- **What:** Codify what's currently implicit excellence into short, enforced standards: component authoring checklist (props JSDoc, story, test, a11y notes, changeset), state-management guidance (when TanStack Store vs context vs local), comment policy (the repo's own "explain why, not what" practice, written down), naming/file conventions, error-handling and diagnostics usage, deprecation policy (`@deprecated` JSDoc → console warn via diagnostics → removal after 2 minors).
- **Why:** Today the standards live in one or two heads and in the code's example. Handbook + automation is how quality survives team growth and author turnover.
- **Effort:** 1 week writing + 2–3 days automating the checkables (ESLint custom rules / CI globs).
- **Risks:** Shelfware — mitigate by linking each rule to its enforcing check; unenforced rules get deleted.
- **ROI:** Review comments shift from conventions to substance; onboarding time drops (target: first merged PR < 2 days from joining).

### C3. Extensibility architecture: make the engines pluggable

- **What:** Finish what the month-1 field registry started: (1) form engine — public `registerField` API with typed custom-field contract + docs; (2) grid — cell-renderer/formatter registry and a documented custom-filter-dialect adapter interface; (3) editor — plugin slot API for toolbar sections and Lexical nodes (the decomposed toolbar from month 1 becomes the extension points).
- **Why:** The difference between a component library and a _platform_ is whether teams can extend without forking. Every fork is a future migration project.
- **Effort:** 2 weeks.
- **Risks:** Extension APIs are forever — gate behind `experimental` stability tier (from month 3) for one release cycle before stabilizing.
- **ROI:** Consumer feature requests become consumer-built plugins; core team stops being the bottleneck.

---

## Phase D (Months 5.5–6) — Release engineering, monitoring, supply chain

### D1. Release trains + canary channel

- **What:** Scheduled weekly release train from the changesets queue; `next` dist-tag canary published on every main merge; reference app runs canary, consumer apps run stable.
- **Why:** Predictable cadence beats ad-hoc releases: consumers plan upgrades, and canary gives one week of real usage before stable.
- **Effort:** 2–3 days.
- **Risks:** Canary drift if reference app is the only canary consumer — recruit one product team to canary.
- **ROI:** Upgrade pain reports drop; regressions caught in canary cost 10× less than in stable.

### D2. Production monitoring & feedback loop

- **What:** For the deployed reference app + docs: real-user monitoring (web-vitals → analytics endpoint), error tracking (Sentry or OTel-based), uptime checks, and a monthly "library health" report (bundle trend, vitals trend, error signatures, adoption stats from registry download counts).
- **Why:** Months 1–3 built instrumentation _hooks_; this turns them into an operating feedback loop that informs the roadmap with data instead of anecdotes.
- **Effort:** 1 week.
- **Risks:** Metric theater — tie each dashboard to a decision it informs (budget tuning, deprecation timing).
- **ROI:** Roadmap debates shortened by data; regressions detected in hours not release cycles.

### D3. Supply-chain hardening: SBOM, provenance, dependency SLOs

- **What:** CycloneDX SBOM generated per release; npm provenance/signed builds from CI (`--provenance`); dependency SLOs (security patches < 48 h via Renovate auto-merge on green, minors < 2 weeks, majors scheduled quarterly); pin GitHub Actions by SHA; secrets scanning (gitleaks) in CI.
- **Why:** A shared UI library is a supply-chain amplifier: one compromised dependency ships to every consumer app. The repo already leads here (pnpm `allowBuilds`) — finish the job.
- **Effort:** 3–4 days.
- **Risks:** Auto-merge trust requires the test pyramid to stay strong — gate on the full suite.
- **ROI:** Audit-readiness; incident response for a bad upstream release drops from days to hours.

### D4. Documentation & knowledge completeness audit

- **What:** Close the loop on docs: generated props reference from the API-extractor output (B2) embedded in Storybook; migration guides for every deprecation; "internals" docs for the three subtle machines (form sync effects, grid ref-plumbing/datasource lifecycle, SmartPage slot system) so maintenance doesn't depend on the original author; quarterly docs-accuracy test (new joiner builds the reference feature from docs, gaps filed as bugs).
- **Effort:** 1 week.
- **Risks:** None material.
- **ROI:** Bus factor > 1 on the three hardest modules; support-question volume becomes a tracked, falling metric.

---

## Phase summary table

| Phase                         | Duration | Effort (eng-weeks) | Key risk                 | Primary ROI                                    |
| ----------------------------- | -------- | ------------------ | ------------------------ | ---------------------------------------------- |
| A — Infra & previews          | 2 wks    | ~2.5               | Preview cost sprawl      | Review cycle −30–50%                           |
| B — Quality gates & perf/a11y | 3 wks    | ~5                 | Gate friction            | Zero breaking-change escapes; AA conformance   |
| C — Architecture & standards  | 3 wks    | ~5                 | Premature package splits | Platform extensibility; onboarding < 1 day     |
| D — Release & supply chain    | 2.5 wks  | ~3.5               | Metric/process theater   | Predictable releases; audit-ready supply chain |

Total: ~16 engineer-weeks across 3 months — sized for a 2–3 person platform team alongside feature work.

---

## Go/no-go decision points for leadership

1. **Month 4:** Vendor previews vs internal infra (cost vs policy).
2. **Month 5:** Engine package split — driven by consumer evidence, not aesthetics (C1).
3. **Month 5:** External a11y audit spend vs internal-only (B4).
4. **Month 6:** Which product team joins the canary channel (D1) — requires a real adoption commitment, which is itself the six-month success signal.
