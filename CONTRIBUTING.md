# Contributing

## Dev setup

```bash
pnpm install     # Node ≥ 20, pnpm 10
pnpm dev         # all workspaces via Turbo (app on Vite)
```

Workspaces: `apps/web` (Vite playground/demo) and `packages/ui`
(`@workspace/ui`, the source-only component library). See [`CLAUDE.md`](./CLAUDE.md)
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

## Changesets — one per user-facing change

Any PR that changes `packages/ui/src/**` **must include a changeset** describing
the change (CI fails otherwise):

```bash
pnpm changeset            # pick @workspace/ui, choose semver bump, write a summary
```

- Choose `patch` for fixes, `minor` for new components/props, `major` for breaking
  API changes. `apps/web` is never versioned (ignored in `.changeset/config.json`).
- If a change genuinely needs no release (internal-only refactor with no API
  effect), run `pnpm changeset --empty`.
- Commit the generated `.changeset/*.md` with your change.

## Release steps

The library is **private and source-only** ([ADR 0002](./docs/adr/0002-source-only-package-no-build-step.md),
[ADR 0006](./docs/adr/0006-distribution-strategy.md)) — "release" means cutting a
version + changelog, not publishing to a registry (yet).

```bash
pnpm version-packages   # changeset version → bumps @workspace/ui, updates CHANGELOG.md
# review the diff, then commit:
git commit -am "chore(release): version packages"
```

`pnpm build:lib` proves the package still compiles standalone; when registry
publishing is adopted, see the follow-up noted in ADR 0006.
