# 0006 — Distribution strategy: source-only now, buildable on demand

- **Status:** Accepted

## Context

[ADR 0002](./0002-source-only-package-no-build-step.md) established that
`@imsaroj/smart-ui` ships as **source** through its `exports` map with no build step.
That is ideal for monorepo consumption but leaves two questions for the future:
can the package be consumed outside the monorepo (git dependency, private
registry), and does the source actually _compile_ as a standalone library?

Three options:

- **A. Stay source-only forever.** Zero build; document the consumer requirements
  and never emit an artifact.
- **B. Add a full `tsup`/`vite lib` build now** and publish to a registry.
- **C. Hybrid.** Keep source-only as the shipped form, but add a `build:lib`
  script that CI runs to _prove the package can build_ (ESM + `.d.ts`) — without
  publishing.

## Decision

**Option C.** The primitives:

- The `exports` map continues to point at **source** — nothing about
  in-monorepo consumption changes, and there is no runtime/build cost for the
  app (it compiles the source itself via its own Vite/TS build).
- `pnpm build:lib` (in `packages/ui`, `tsc -p tsconfig.lib.json`) emits ESM `.js`
  - `.d.ts` (+ source maps) to `dist/`, proving the whole library compiles as a
    standalone unit and that public types resolve. `"use client"` directives are
    preserved. CI runs it so a change that breaks standalone compilation fails
    fast. `dist/` is git-ignored — it is a proof artifact, not a committed one.
- `publint` runs against the package in CI to keep the `exports` map
  publish-valid, and `tooling/api-check` type-checks one import from every
  subpath from the outside.

## Consumer requirements (for source-only consumption)

A consumer compiling the source must provide:

- **TypeScript ≥ 5.5** (bundler module resolution; the repo uses `~6`).
- **React 19** (`react` / `react-dom` ≥ 19).
- **Tailwind CSS v4**, importing `@imsaroj/smart-ui/globals.css` once at the app
  entry, with `@source` directives that scan the package (the shipped
  `globals.css` already does).
- A **bundler that reads the `exports` map** (Vite/Rolldown, webpack 5, esbuild,
  Rollup) — the package is unusable from a no-bundler or plain-JS context.

## Consequences

- **Pro:** No maintenance of a bundler config or a dual-package layout today, yet
  the "can it build?" question is answered continuously in CI.
- **Pro:** The path to registry publishing later is short — point a publish-time
  `exports` at `dist/` and run `publint` on the built output.
- **Con:** `build:lib` is not the shipped form, so it can drift from a _publishing_
  config that doesn't exist yet; the remaining step before actual publishing is to
  generate a `dist`-facing `package.json` and `publint` **its** built output (not
  just the source). Named follow-up, gated on a real decision to publish.
- **Con:** `tsc` emits file-per-module (no bundling/minification) — fine as a
  proof and for tree-shaking consumers, but a registry release may still want a
  bundler pass.
