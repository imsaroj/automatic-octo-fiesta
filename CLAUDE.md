# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Run dev server (all workspaces via Turbo)
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type-check all packages
pnpm typecheck

# Format code
pnpm format

# Run tests (Vitest — only packages/ui has tests) via Turbo
pnpm test

# Run tests directly in the UI package
cd packages/ui && pnpm exec vitest run

# Run a single test file
cd packages/ui && pnpm exec vitest run src/data-grid/pagination.test.ts

# Add a shadcn component (installs into packages/ui/src/components/)
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

Commits are governed by **commitlint** (`config-conventional`) via a Husky `commit-msg` hook, so messages must follow
Conventional Commits (`feat:`, `fix:`, `chore:`…). A `pre-commit` hook runs `lint-staged` and `pre-push` runs checks —
don't bypass them with `--no-verify` unless asked.

## Architecture

This is a **pnpm + Turborepo monorepo** with two workspaces:

- **`apps/web`** — Vite + React 19 demo/playground app. Consumes components from `@workspace/ui`. Path alias `@` →
  `apps/web/src`.
- **`packages/ui`** — The shared UI library (`@workspace/ui`). All reusable components live here. No build step —
  exported directly as source via the `exports` map in `package.json`.

### `packages/ui` exports map

Consumers import via the subpaths declared in `packages/ui/package.json` `exports` — always match those, don't reach
into arbitrary files:

```
@workspace/ui/globals.css            → src/styles/globals.css          (import once in app entry)
@workspace/ui/components/*           → src/components/*.tsx             (shadcn/ui primitives)
@workspace/ui/hooks/*                → src/hooks/*.ts
@workspace/ui/lib/*                  → src/lib/*.ts
@workspace/ui/smart-components/*     → src/smart-components/*.tsx       (Smart* wrappers)
@workspace/ui/smart-components/page  → src/smart-components/page/index.ts   (page composition barrel)
@workspace/ui/form-engine            → src/form-engine/index.ts        (declarative form engine)
@workspace/ui/search-engine          → src/search-engine/index.ts      (search/filter bar on the form engine)
@workspace/ui/data-grid              → src/data-grid/index.ts          (AG Grid wrappers)
@workspace/ui/lexical-text-editor    → src/lexical-text-editor/index.ts
```

Note there is no build step: everything is exported as source. `data-grid`, `form-engine`, and `lexical-text-editor`
are barrel entrypoints (`index.ts`); their internal files are not individually importable.

### Shadcn/ui setup

Components are added to `packages/ui/src/components/` (not to `apps/web`). The `components.json` files in both
workspaces point to the same destination. Primitives use **Base UI** (`@base-ui/react`) under the hood (shadcn v4
style), not Radix UI. Dropdown menus use the `render` prop pattern (e.g. `<DropdownMenuTrigger render={<Button />}>`).

Tailwind v4 is used. The stylesheet entry is `packages/ui/src/styles/globals.css`, which must be imported by the app's
entry point. The `@source` directives in that file scan `apps/**` and `packages/ui/**` so Tailwind finds classes in both
workspaces.

### Data grid layer (`packages/ui/src/data-grid/`)

Two public components backed by AG Grid Community:

| Component         | Row model              | Use case                                               |
| ----------------- | ---------------------- | ------------------------------------------------------ |
| `SmartGrid`       | Client-side            | All rows in memory; built-in quick search + CSV export |
| `SmartServerGrid` | Infinite (server-side) | Large datasets; `fetchRows` callback does the fetching |

**Key internals:**

- `grid-internals.tsx` — shared AG Grid module registration (`ensureGridModules`), column type aliases, density
  constants, `NoRowsOverlay`.
- `pagination.ts` — `ServerFetchParams` / `ServerFetchResult` types, `buildServerFetchParams` (translates AG Grid's
  `IGetRowsParams` → normalized params), `pageSchema` (Zod schema for Spring Data `Page<T>` responses), `toSpringSort`
  helper.
- `server-grid-internals.ts` — pure helpers for state persistence (`readPersistedGridState`/`writePersistedGridState`),
  Excel export shaping (`collectGridExport`), filter merging, debounce.
- `use-server-grid-selection.ts` — cross-page selection hook; the selected-id `Set` is the source of truth so selections
  survive block reloads.
- `grid-theme.ts` — AG Grid theme configuration.

`SmartServerGrid` is a generic `forwardRef` component. Because `forwardRef` erases generics, it is cast after definition
to restore the generic signature — this is intentional and not a bug.

### `smart-components/` (`packages/ui/src/smart-components/`)

The largest layer: **`Smart*` wrappers** that flatten shadcn/ui compound components into a single config-driven
component to cut JSX boilerplate (e.g. `SmartCard`, `SmartDialog`, `SmartSheet`, `SmartDrawer`, `SmartSelect`,
`SmartCombobox`, `SmartMultiSelect`, `SmartDatePicker`, `SmartStepper`, `SmartToaster`, plus utility ones like
`SmartSearchInput`, `SmartLoadingOverlay`, `SmartSpinner`). Each wrapper file also **re-exports the underlying native
primitives**, so you can drop back to the compound form for layouts the flat API can't express (see the doc comment in
`smart-card.tsx` for the pattern).

There is a `shadcn-smart-wrappers` skill that converts native shadcn compound usage (`SCard`, `SDialog`, …) into these
wrappers — prefer `Smart*` wrappers when writing or editing TSX in this repo.

**Field/value convention:** input-like Smart components are controlled through a `data` / `setData(value)` pair (not
`value`/`onChange`) — see `FieldBaseProps<T>` in `form-engine/base.ts`. The form engine relies on this convention.

**`smart-components/page/`** — a compound **page-layout system** (barrel: `@workspace/ui/smart-components/page`). `SmartPage`
is the orchestrator that arranges named slots (`SMART_PAGE_SLOT` / `PageSlot`) — header, hero, toolbar, search, filters,
tabs, content, sidebar, grid area, status bar, footer, and empty/loading/error states — coordinated through
`PageContext` (layout, scroll mode, padding). `SmartPageContainer` is a simpler compound wrapper. This is distinct from
`apps/web`'s `PlaygroundShell`, which is the demo app's chrome.

**Placement rule for new components:**

- Any new component or shadcn/ui wrapper that is **general-purpose** (usable across features) goes in `packages/ui/src/smart-components/`.
- Components that are **scoped to a specific feature domain** go inside that domain's folder instead:
  - Grid-only helpers → `packages/ui/src/data-grid/`
  - Form-engine field wrappers → `packages/ui/src/form-engine/`
  - Rich-text-editor internals → `packages/ui/src/lexical-text-editor/`
- The rule of thumb: if the component imports from or is only meaningful within a single domain folder, it belongs there. If it could be reused across domains, it belongs in `smart-components/`.

### Form engine (`packages/ui/src/form-engine/`)

Declarative forms built on **TanStack Form (`@tanstack/react-form`) + Zod v4**, exported as `@workspace/ui/form-engine`.
`SmartForm` takes a Zod `schema` plus a `FieldDefinition[]` and renders the right `Smart*Field` control per entry —
no per-field wiring. Key design points (see `smart-form.tsx`):

- The **Zod schema is the single source of truth** for both validation _and_ required-ness (the required asterisk is
  derived from the schema via `isFieldRequired`); `FieldDefinition` is UI-only.
- `FieldType` is a large union (`text`/`email`/`currency`/`select`/`multiselect`/`date`/`daterange`/`text-editor`/…);
  `FieldRenderer` maps each type to a `Smart*Field` wrapper. Adding a field type means extending that union and switch.
- `data`/`setData` are optional — the form owns its state internally and mirrors edits out. The two sync effects use a
  `selfUpdateRef` guard to avoid an echo loop between the mirror-out and reconcile-in effects; read those comments
  before touching state logic.
- Empty optional strings are normalized to `undefined` before validation so blank optional fields don't error.

Individual `Smart*Field` files (`smart-input-field.tsx`, etc.) all take `FieldBaseProps<T>` (from `base.ts`) and are
also exported for standalone use.

### Search engine (`packages/ui/src/search-engine/`)

`SmartSearchForm` (aliased `SearchEngine`) — a declarative **search/filter bar** exported as
`@workspace/ui/search-engine`. It **composes** `SmartForm` (not a fork): it reuses the same fields, Zod validation,
required derivation, layout, and field registry, and adds only search concerns on top. Key design points:

- `SearchFieldDefinition<T>` is derived, not duplicated: `FieldDefinition<T> & { type: SearchFieldType }` —
  intersection distributes over the union, so each field keeps its per-type extras while `type` is constrained to the
  search-relevant subset (no password / textarea / rich-text). Still assignable to `FieldDefinition<T>[]`.
- `search` (manual — Search button, emit on submit/Enter) vs `autoSearch`/`search={false}` (debounced auto-search).
  Auto-search is gated by `schema.safeParse` and deduped via a serialized last-query ref (seeded on mount so the first
  render doesn't fire).
- `build-query.ts` — `buildSearchQuery` prunes empty values (blank strings, `null`, empty arrays, `false`, empty
  range objects) and trims strings, so only meaningful filters reach the API. `countActiveFilters` backs the count badge.
- Layout delegates to `SmartForm`, but `columns` (1–4) is made responsive by passing a `grid-cols-*` override as
  `SmartForm`'s `className` (tailwind-merge wins over the fixed grid). `SmartForm` gained additive 4-column support.

### Rich text editor (`packages/ui/src/lexical-text-editor/`)

`SmartTextEditor` — a **Lexical**-based rich-text editor exported as `@workspace/ui/lexical-text-editor`. `editorNodes`
registers the node set (including custom `image-node` and `page-break-node`), `editorTheme` styles them, and
`plugins/` holds the toolbar, auto-link, and code-highlight plugins. Value format is HTML or JSON
(`SmartTextEditorFormat`). See the memory note on Lexical gotchas for known pitfalls.

### `lib/` (`packages/ui/src/lib/`)

- `utils.ts` — `cn()` (clsx + tailwind-merge).
- `format.ts` — pure number/string formatters (`formatCurrency`, `formatCompact`, `formatPercent`, `getInitials`,
  `truncate`).
- `xlsx.ts` — dependency-free `.xlsx` writer (builds OOXML ZIP by hand; no external spreadsheet library).

### `apps/web` routing & mock API

All routes (`react-router-dom` v7, defined in `App.tsx`) are nested under `PlaygroundShell` (sidebar + breadcrumb
layout). Routes follow the pattern `/section/page` (`grids/*`, `examples/*`, `projects/*`, `smart/*`, `form-engine/*`) —
the shell derives breadcrumb labels from the URL path segments automatically. Page components under `src/pages/` are
thin leaf components with no shared state.

**MSW mock API:** `src/mocks/` holds an [MSW](https://mswjs.io) worker (`browser.ts`, `handlers.ts`, `users-dataset.ts`)
started by `enableMocking()` in `main.tsx` **before first render** — dev-only (no-op in prod, `onUnhandledRequest:
"bypass"`). It backs the server/infinite data-grid pages with a real endpoint (the Spring Data `Page<T>` shape that
`pagination.ts` expects). `SmartToaster` is mounted once at the app root.
