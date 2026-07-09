# 0002 — Source-only package, no build step

- **Status:** Accepted

## Context

`@imsaroj/smart-ui` is consumed inside the monorepo by `apps/web`. It could be
pre-compiled (tsc/tsup) into `dist/`, or exported directly as TypeScript source.

## Decision

Ship **no build step**. The `exports` map in `packages/ui/package.json` points at
`src/**` `.ts`/`.tsx` files directly; consumers compile the source as part of their
own Vite/TS build.

## Consequences

- **Pro:** Zero build/watch overhead in development; edits are picked up instantly.
- **Pro:** No dual-package hazard, no stale `dist/`, no sourcemap indirection.
- **Pro:** Tree-shaking is the consumer's concern and works well — the app imports
  only via the exports map, so unused primitives never enter the bundle (verified
  by auditing `apps/web/dist/assets`).
- **Con:** Consumers **must** be able to compile TS + Tailwind from source — the
  package is unusable from a plain-JS or no-bundler context.
- **Con:** No published, versioned artifact yet (all `0.0.x`, private). Adopting
  external consumption later means adding a build + Changesets.
- The `@source` globs in `globals.css` scan both workspaces so Tailwind finds
  classes in the un-built source.
