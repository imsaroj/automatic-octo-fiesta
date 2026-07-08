# 0005 — Flat-props `Smart*` wrappers over compound components

- **Status:** Accepted

## Context

shadcn/ui ships **compound** components — `Card` + `CardHeader` + `CardTitle` +
`CardContent` + `CardFooter`, etc. Expressive, but every usage repeats a stack of
boilerplate JSX, and the app has an ESLint guardrail steering consumers away from
raw primitives.

## Decision

Provide a **`Smart*` wrapper** per compound component that flattens the common case
into a single config-driven component with props like `header` / `footer` /
`trigger` / `children`. Each wrapper **re-exports the underlying primitives** so
the compound form stays available as an escape hatch. This flat-props API is the
repo's core public surface.

**Sanctioned exception:** `SmartPage` keeps a **slot-based compound** API
(`SMART_PAGE_SLOT` symbol tagging). Page layouts have too many optional regions
(header/hero/toolbar/search/filters/tabs/content/sidebar/grid/status/footer/states)
to flatten without an unwieldy prop explosion; slots read better there.

## Consequences

- **Pro:** Dramatically less JSX at call sites; consistent `header`/`footer`/
  `trigger` prop shapes across the library.
- **Pro:** The escape hatch means the flat API never becomes a ceiling — drop to
  the compound primitives for layouts it can't express.
- **Pro:** A `shadcn-smart-wrappers` skill mechanizes the compound → flat
  conversion.
- **Con:** Two ways to do everything (flat + compound) — contributors must know
  when each applies (rule of thumb: flat for the 80%, compound for bespoke layout).
- **Con:** Wrappers must track upstream shadcn prop changes when primitives are
  regenerated.
