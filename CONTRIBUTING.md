# Contributing

## Dev setup

```bash
pnpm install     # Node ≥ 20, pnpm 10
pnpm dev         # all workspaces via Turbo (app on Vite)
```

Workspaces: `apps/web` (Vite playground/demo) and `packages/ui`
(`@imsaroj/smart-ui`, the source-only component library). See [`CLAUDE.md`](./CLAUDE.md)
for the architecture map and [`docs/`](./docs/README.md) for per-domain guides.

## Quality gates

Run before pushing (CI runs all of these):

```bash
pnpm lint          # ESLint 10 flat config (+ jsx-a11y)
pnpm typecheck     # tsc --noEmit, both workspaces
pnpm test          # Vitest (packages/ui) — keep it green and warning-free
pnpm build         # app build + bundle-budget check
pnpm test:e2e      # Playwright (dev server + MSW); run twice to confirm stability
pnpm docs:check    # every exports subpath is documented; doc snippets type-check
pnpm exports:check # the exports map resolves on disk
pnpm publint       # the exports map is publish-valid
pnpm api:check     # one import from every subpath type-checks from the outside
pnpm build:lib     # the library compiles standalone (ESM + .d.ts)
```

Local git hooks (husky): `pre-commit` runs `lint-staged` (Prettier), `commit-msg`
runs commitlint, `pre-push` runs typecheck + tests. Don't bypass them with
`--no-verify` unless asked.

## Commit conventions

**Conventional Commits** (enforced by commitlint): `feat:`, `fix:`, `chore:`,
`docs:`, `test:`, `refactor:`, … A scope is encouraged (`feat(ui): …`).

Commit types now drive releases (see below), so pick them deliberately:
`fix:` → patch, `feat:` → minor, a `BREAKING CHANGE:` footer or `!` (`feat!:`) →
major. `chore:`/`docs:`/`refactor:`/`test:` do not trigger a release.

## Releases — automatic on push to `main`

Publishing is fully automated by **semantic-release**
(`.github/workflows/release.yml`, config in `.releaserc.json`). On every push to
`main` it analyzes the conventional commits since the last tag and, if any are
release-worthy, it:

1. bumps `packages/ui/package.json` and prepends `packages/ui/CHANGELOG.md`,
2. builds (`build:lib`) and publishes `@imsaroj/smart-ui` to npm via
   `pnpm publish` (which swaps in the dist-facing `publishConfig.exports` —
   the in-repo `exports` map keeps pointing at source, per
   [ADR 0006](./docs/adr/0006-distribution-strategy.md)),
3. pushes a `chore(release): vX.Y.Z [skip ci]` commit + `vX.Y.Z` tag and creates
   a GitHub release.

There is nothing to run locally — no changesets, no manual version bumps. The
workflow needs the `NPM_TOKEN` repository secret (an npm automation/granular
token with publish rights).
