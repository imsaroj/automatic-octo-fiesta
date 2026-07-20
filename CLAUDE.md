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

- **`apps/web`** — Vite + React 19 demo/playground app. Consumes components from `@iamsaroj/smart-ui`. Path alias `@` →
  `apps/web/src`.
- **`packages/ui`** — The shared UI library (`@iamsaroj/smart-ui`). All reusable components live here. No build step —
  exported directly as source via the `exports` map in `package.json`.

### Conventions (ref idiom & `"use client"`)

Two intentional, uniform conventions in the hand-written library:

- **`forwardRef` is kept, not migrated to React 19 ref-as-prop.** React 19 supports `ref` as a plain prop, but
  `forwardRef` is not deprecated and the generic-handle components (`SmartServerGrid`, `SmartTree`,
  `SmartTransferList`, `SmartCalendar`) genuinely need it (`forwardRef` erases generics, so they are re-cast after
  definition — see `server-data-grid.tsx`). Rather than split the codebase into two ref idioms, all hand-written
  components use `forwardRef` consistently. A blanket ref-as-prop migration is a deferred, cosmetic follow-up.
- **`"use client"` is kept on every client component file uniformly.** The app is Vite-only today so the directive is
  a no-op, but keeping it costs nothing and future-proofs the library for React Server Components consumption. Don't
  add or remove it selectively — it's all-or-nothing by policy.

### `packages/ui` exports map

Consumers import via the subpaths declared in `packages/ui/package.json` `exports` — always match those, don't reach
into arbitrary files:

```
@iamsaroj/smart-ui/globals.css            → src/styles/globals.css          (import once in app entry)
@iamsaroj/smart-ui/components/*           → src/components/*.tsx             (shadcn/ui primitives)
@iamsaroj/smart-ui/hooks/*                → src/hooks/*.ts
@iamsaroj/smart-ui/lib/*                  → src/lib/*.ts
@iamsaroj/smart-ui/smart-components/*     → src/smart-components/*.tsx       (Smart* wrappers)
@iamsaroj/smart-ui/smart-components/page  → src/smart-components/page/index.ts   (page composition barrel)
@iamsaroj/smart-ui/smart-components/buttons → src/smart-components/buttons/index.ts (action-button presets barrel)
@iamsaroj/smart-ui/form            → src/form/index.ts        (declarative form engine)
@iamsaroj/smart-ui/search          → src/search/index.ts      (search/filter bar on the form engine)
@iamsaroj/smart-ui/data-grid              → src/data-grid/index.ts          (AG Grid wrappers)
@iamsaroj/smart-ui/tree            → src/tree/index.ts        (SmartTree)
@iamsaroj/smart-ui/transfer-list   → src/transfer-list/index.ts (SmartTransferList)
@iamsaroj/smart-ui/calendar        → src/calendar/index.ts    (SmartCalendar)
@iamsaroj/smart-ui/text-editor    → src/text-editor/index.ts
```

Note there is no build step: everything is exported as source. `data-grid`, `form`, and `text-editor`
are barrel entrypoints (`index.ts`); their internal files are not individually importable.

### Shadcn/ui setup

Components are added to `packages/ui/src/components/` (not to `apps/web`). The `components.json` files in both
workspaces point to the same destination. Primitives use **Base UI** (`@base-ui/react`) under the hood (shadcn v4
style), not Radix UI. Dropdown menus use the `render` prop pattern (e.g. `<DropdownMenuTrigger render={<Button />}>`).

Tailwind v4 is used. The stylesheet entry is `packages/ui/src/styles/globals.css`, which must be imported by the app's
entry point. The `@source` directives in that file scan `apps/**` and `packages/ui/**` so Tailwind finds classes in both
workspaces.

#### Vendored primitives policy

Some primitives in `packages/ui/src/components/` currently have zero importers (e.g. `chart.tsx`, `data-table.tsx`,
`carousel.tsx`, `menubar`, `navigation-menu`, `input-otp`, `hover-card`, `aspect-ratio`, `pagination`). They are
**kept deliberately**: shadcn primitives are regenerable vendor code, and unused ones may be adopted by future
features. Their runtime deps (`recharts`, `@tanstack/react-table`, `embla-carousel-react`) stay in `dependencies` so
adopting a primitive never requires a dependency change. This costs nothing at runtime — the app imports only via the
exports map, so tree-shaking keeps unimported primitives and their deps out of the built bundle (verified in the
2026-07 audit by checking `apps/web/dist/assets` for recharts/embla signatures). Don't delete these primitives or
"clean up" their deps as dead code.

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
  helper, and the Spring **query encoder** (`buildSpringQuery` / `encodeSpringFilter`) — the matching decoder stays
  app/mock-side.
- `create-page-fetcher.ts` — `createPageFetcher({ url, itemSchema?, encodeQuery?, pageIndexBase?, unwrap?, request?,
mapError?, fetchImpl? }) → fetchRows`: the reusable encode → request → unwrap → Zod-`pageSchema`-parse → `{rows,total}`
  pipeline for `SmartServerGrid`. Four transport knobs adapt it to any backend, all defaulting to today's behavior:
  `request` (any transport — axios/ky/fetch; returns the parsed body), `pageIndexBase` (`0` default | `1` for 1-indexed
  APIs), `unwrap` (peel a response envelope to `Page<T>`), `encodeQuery` (`buildSpringQuery` default | `buildFlatQuery` |
  custom; `buildQuery` is a deprecated alias). `itemSchema` is optional (omit to skip Zod for a trusted source). The
  default transport still takes an injectable `fetchImpl` (testability/SSR) + `mapError`. Returned fetcher takes an
  optional 3rd `extraParams` arg for per-call query params. `SmartServerGrid` also accepts this config directly via its
  `source` prop (builds `fetchRows` for you). `apps/web/src/api/users.ts` is built on it.
- `server-grid-internals.ts` — pure helpers for state persistence (`readPersistedGridState`/`writePersistedGridState`),
  Excel export shaping (`collectGridExport`), filter merging, debounce.
- `use-server-grid-selection.ts` — cross-page selection hook; the selected-id `Set` is the source of truth so selections
  survive block reloads.
- `grid-theme.ts` — AG Grid theme configuration.
- **Action column** (`action-column.ts` / `action-column-cell.tsx` / `use-action-column.ts`) — both grids take an
  `actionColumn` prop that injects a config-driven Edit/Delete column (pinning, per-row visible/disabled/loading,
  delete confirmation via `SmartConfirmDialog`, auto-hide when all actions are statically hidden, export opt-out via
  `context.suppressExport`). Pure logic in `action-column.ts` is unit-tested; the ColDef is memoized on a structural
  signature and per-row callbacks reach the cells via a `useSyncExternalStore` store (AG Grid's `refreshCells` does
  NOT reliably re-render memoized React cells) — don't "fix" that by recreating the ColDef per render. Buttons reuse
  the `ActionButton` presets. Demo: `/grids/actions`.

`SmartServerGrid` is a generic `forwardRef` component. Because `forwardRef` erases generics, it is cast after definition
to restore the generic signature — this is intentional and not a bug.

### `smart-components/` (`packages/ui/src/smart-components/`)

The largest layer: **`Smart*` wrappers** that flatten shadcn/ui compound components into a single config-driven
component to cut JSX boilerplate (e.g. `SmartCard`, `SmartDialog`, `SmartSheet`, `SmartDrawer`, `SmartSelect`,
`SmartCombobox`, `SmartMultiSelect`, `SmartDatePicker`, `SmartStepper`, `SmartToaster`, plus utility ones like
`SmartSearchInput`, `SmartLoadingOverlay`, `SmartSpinner`, and the `SmartStatCard` KPI/metric primitive). Each wrapper
file also **re-exports the underlying native primitives**, so you can drop back to the compound form for layouts the
flat API can't express (see the doc comment in `smart-card.tsx` for the pattern).

There is a `shadcn-smart-wrappers` skill that converts native shadcn compound usage (`SCard`, `SDialog`, …) into these
wrappers — prefer `Smart*` wrappers when writing or editing TSX in this repo.

**`smart-components/provider.tsx`** — `SmartUIProvider` (`@iamsaroj/smart-ui/smart-components/provider`): one optional
context for app-wide **labels** (i18n), **defaults** (per-instance prop fallbacks), and **formats** (date/number hooks).
It is a leaf module (declares its own `SmartUIDensity` union rather than importing from `data-grid`) so every layer —
`data-grid`, `form`, `search`, `smart-components` — can consume it without a cycle. Components read via
`useSmartUILabels()` / `useSmartUIDefaults()` / `useSmartUIFormats()`; a passed prop always wins over a provider value,
and with no provider the built-in English labels (`DEFAULT_LABELS`) + canonical defaults (`DEFAULT_DEFAULTS`) apply, so
it is purely additive. Wired so far: server/client grid (loading/error/retry/empty/selected/search-placeholder + grid
`pageSize`/`density`/`pageSizeOptions` on the **server** grid only — the client grid's pagination defaults diverge and
converge under I8), `SmartConfirmDialog` (title/confirm/cancel), `SmartSearchForm` (search/reset), `SmartForm`
(submit label + `columns`). Remaining hard-coded strings migrate onto the same label keys incrementally.

**`smart-components/buttons/`** — action-button presets (barrel: `@iamsaroj/smart-ui/smart-components/buttons`). One
`ACTION_BUTTON_CONFIG` map (`action-config.ts`) is the single source of truth for each action's icon, label, variant,
loading text, and button type; the generic `ActionButton` resolves it and adds icon-only mode, tooltip, and optional
permission gating (`ActionPermissionProvider`); `createActionButton` stamps out the 27 named presets (`AddButton`,
`DeleteButton`, `SaveButton`, …) in `action-buttons.tsx`. Prefer these presets over hand-configured `SmartButton`s for
standard CRUD/toolbar actions; extend by adding a config entry plus one `createActionButton` line.

**Field/value convention:** input-like Smart components are controlled through a `data` / `setData(value)` pair (not
`value`/`onChange`) — see `FieldBaseProps<T>` in `form/base.ts`. The form engine relies on this convention.

**`smart-components/page/`** — a compound **page-layout system** (barrel: `@iamsaroj/smart-ui/smart-components/page`). `SmartPage`
is the orchestrator that arranges named slots (`SMART_PAGE_SLOT` / `PageSlot`) — header, hero, toolbar, search, filters,
tabs, content, sidebar, grid area, status bar, footer, and empty/loading/error states — coordinated through
`PageContext` (layout, scroll mode, padding). `SmartPageContainer` is a simpler compound wrapper. This is distinct from
`apps/web`'s `PlaygroundShell`, which is the demo app's chrome.

**Placement rule for new components:**

- Any new component or shadcn/ui wrapper that is **general-purpose** (usable across features) goes in `packages/ui/src/smart-components/`.
- Components that are **scoped to a specific feature domain** go inside that domain's folder instead:
  - Grid-only helpers → `packages/ui/src/data-grid/`
  - Form-engine field wrappers → `packages/ui/src/form/`
  - Rich-text-editor internals → `packages/ui/src/text-editor/`
- The rule of thumb: if the component imports from or is only meaningful within a single domain folder, it belongs there. If it could be reused across domains, it belongs in `smart-components/`.

### Form engine (`packages/ui/src/form/`)

Declarative forms built on **TanStack Form (`@tanstack/react-form`) + Zod v4**, exported as `@iamsaroj/smart-ui/form`.
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
- **Typed & async options** (option-based fields — select/combobox/multiselect/radio/segmented/checkbox-group):
  `FieldOption<V extends string | number | boolean>` keeps the real value in the store (an honest `roleId: z.number()`
  schema, no `String()`/`Number()`), and `options` may be an async resolver `(ctx: { search?; signal }) =>
Promise<FieldOption<V>[]>`. Both flow through one adapter, `OptionField` (`option-field.tsx`), wired in as the registry
  `component` for those types: it resolves options via `useFieldOptions` (`use-field-options.ts` — array passthrough vs
  aborted async fetch with loading/error state), maps typed store values ↔ string DOM keys via a codec
  (`option-utils.ts` — `buildOptionCodec`/`serializeOptionValue`), and renders the underlying string-based `Smart*Field`
  (which stay string-only for standalone use). Loading shows the `form.loadingOptions` provider label as a placeholder.

Individual `Smart*Field` files (`smart-input-field.tsx`, etc.) all take `FieldBaseProps<T>` (from `base.ts`) and are
also exported for standalone use.

### Search engine (`packages/ui/src/search/`)

`SmartSearchForm` (aliased `SearchEngine`) — a declarative **search/filter bar** exported as
`@iamsaroj/smart-ui/search`. It **composes** `SmartForm` (not a fork): it reuses the same fields, Zod validation,
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

### Rich text editor (`packages/ui/src/text-editor/`)

`SmartTextEditor` — a **Lexical**-based rich-text editor exported as `@iamsaroj/smart-ui/text-editor`. `editorNodes`
registers the node set (including custom `image-node` and `page-break-node`), `editorTheme` styles them, and
`plugins/` holds the toolbar, auto-link, and code-highlight plugins. Value format is HTML or JSON
(`SmartTextEditorFormat`). See the memory note on Lexical gotchas for known pitfalls.

### Tree engine (`packages/ui/src/tree/`)

`SmartTree` — a generic, hierarchical tree/file-explorer exported as `@iamsaroj/smart-ui/tree`. Generic over a per-node
`data` payload (`TreeNode<T>`). Key design points:

- **Node shape:** a node is a folder when it has `children` (even `[]`) **or** `isFolder: true` — the latter enables lazy
  loading without eager children. Per-node flags (`disabled`/`selectable`/`checkable`/`draggable`) gate each interaction
  independently.
- Selection (`none`/`single`/`multiple`), tri-state checkboxes (`computeCheckState` derives parent
  indeterminate/checked from leaves), keyboard nav, inline rename, and drag-and-drop reordering (`TreeDropPosition`
  `before`/`after`/`inside`, `moveNode`).
- Search has three modes (`TreeFilterMode`): `highlight` (mark, keep all visible), `filter` (hide non-matching branches,
  keep ancestors of matches), `none`.
- **State is Set-backed** via `useControllable`/`useIdSet` (`use-tree.ts`) — each of expanded/selected/checked is
  independently controllable (`*Ids` + `default*Ids` + `on*Change`) or uncontrolled. Imperative actions
  (expand/collapse/select/check/rename/focus, plus `get*Ids` getters) are exposed through `SmartTreeHandle` via `ref`.
- `tree-utils.ts` — pure tree algorithms (`buildNodeMap`, `buildParentMap`, `getDescendantIds`/`getAncestorIds`,
  `insertNode`/`removeNode`/`updateNode`/`moveNode`, `flattenVisible`, `computeMatches`, `walkTree`); unit-tested in
  `tree-utils.test.tsx`. Prefer these for tree mutations rather than hand-rolling recursion.

### Transfer list engine (`packages/ui/src/transfer-list/`)

`SmartTransferList` — a dual-list "shuttle" (move items between a source and target list) exported as
`@iamsaroj/smart-ui/transfer-list`. Generic over a per-item `data` payload (`TransferItem<T>`). Each item lives in
exactly one side at a time, keyed by stable `id`. `onChange` receives a `TransferChangeMeta` describing the
`direction` and which items `moved`. Target ids are controllable (`targetIds`/`defaultTargetIds`); imperative
move-all/move-selected/`getTargetIds` actions come through `SmartTransferListHandle` via `ref`. Pure move/partition/filter
helpers live in `transfer-utils.ts` (unit-tested in `transfer-utils.test.tsx`).

### Calendar engine (`packages/ui/src/calendar/`)

`SmartCalendar` — a calendar & booking surface exported as `@iamsaroj/smart-ui/calendar`. Generic over a per-event
`data` payload (`CalendarEvent<T>`). Key design points:

- **Views:** `month` / `week` / `day` / `agenda`. Week & day share the time-grid (`time-grid-view.tsx`); month is
  `month-view.tsx`; agenda is a flat list. `date` and `view` are each independently controllable (`date`/`defaultDate`,
  `view`/`defaultView`) or uncontrolled via `useControllable` (`use-calendar.ts`); imperative
  next/prev/today/goToDate/setView come through `SmartCalendarHandle` via `ref`.
- **Events:** timed, all-day, and multi-day; 8 preset color tokens (`event-color.ts`). Overlapping timed events are
  packed into side-by-side lanes by `layoutDayEvents`.
- **Editing:** `editable` turns on pointer **drag-to-move (across day columns) + edge-resize** in the time-grid (a
  movement threshold preserves plain clicks) and **drag-to-reschedule** in month; both emit `onEventChange`
  (`EventChangeMeta`, `kind: "move" | "resize"`). Per-event opt-out via `event.editable`.
- **Recurrence (`recurrence.ts`):** a compact RRULE subset (`RecurrenceRule`: daily/weekly/monthly, `interval`,
  `byWeekday`, `count`/`until`, `exceptions`). `expandEvents` turns templates into concrete instances across the visible
  range before rendering (instances carry `occurrence: { templateId, date }`). Series editing helpers —
  `detachOccurrence` (this only), `splitSeries` (this & following), `updateSeries` (all) — implement the three-way edit
  choice.
- **Booking (`booking.ts`):** `availability` (weekly `AvailabilityWindow[]`) drives `generateFreeSlots` (windows minus
  booked events, honoring `slotCapacity` and dropping past slots); the time-grid renders them as pickable chips firing
  `onSlotBook`. `onSlotSelect` fires for clicks on empty grid/day cells.
- All date math + layout is pure and unit-tested (`calendar-utils.test.tsx`, `recurrence.test.tsx`, `booking.test.tsx`);
  prefer those helpers over hand-rolled date arithmetic. `apps/web`'s `calendar-page.tsx` is the reference recipe
  (create/edit/delete dialog, recurring-scope prompt, drag/resize, availability booking). Note `apps/web` does **not**
  depend on `date-fns` — the demo uses native `Date` helpers; `date-fns` lives in `packages/ui` only.

### `lib/` (`packages/ui/src/lib/`)

- `utils.ts` — `cn()` (clsx + tailwind-merge).
- `format.ts` — pure number/string formatters (`formatCurrency`, `formatCompact`, `formatPercent`, `getInitials`,
  `truncate`).
- `xlsx.ts` — dependency-free `.xlsx` writer (builds OOXML ZIP by hand; no external spreadsheet library).

### `apps/web` routing & mock API

All routes (`react-router-dom` v7, defined in `App.tsx`) are nested under `PlaygroundShell` (sidebar + breadcrumb
layout). Routes follow the pattern `/section/page` (`grids/*`, `examples/*`, `projects/*`, `smart/*`, `form/*`) —
the shell derives breadcrumb labels from the URL path segments automatically. Page components under `src/pages/` are
thin leaf components with no shared state.

**MSW mock API:** `src/mocks/` holds an [MSW](https://mswjs.io) worker (`browser.ts`, `handlers.ts`, `users-dataset.ts`)
started by `enableMocking()` in `main.tsx` **before first render** — dev-only (no-op in prod, `onUnhandledRequest:
"bypass"`). It backs the server/infinite data-grid pages with a real endpoint (the Spring Data `Page<T>` shape that
`pagination.ts` expects). `users-dataset.ts` is a **mutable** in-memory table (seeded deterministically); the
`GET`/`POST`/`PUT`/`DELETE` `/api/users` handlers read and edit it. `SmartToaster` is mounted once at the app root.

**Data fetching (TanStack Query):** `@tanstack/react-query` lives in `apps/web` only (the library stays fetch-agnostic).
`main.tsx` wraps the app in a `QueryClientProvider` (configured client in `lib/query-client.ts`). The **CRUD example page**
(`pages/examples/crud-example-page.tsx`) is the reference recipe: `useQuery` for the paged/searchable list, `useMutation`
for create/edit/delete against the MSW mutation handlers, an **optimistic** delete (`onMutate` → rollback `onError` →
`invalidateQueries` `onSettled`), and `toast` feedback. The typed transport it calls is `api/users-crud.ts`.

**Demo data:** `src/demo-data/` holds typed, seeded/deterministic generators (`series`, `mulberry32`) and shared
datasets (`dashboardStats`, `analyticsKpis`, breakdown lists, etc.) so the dashboard/analytics example pages don't
re-inline fake data. Those pages render KPIs with the reusable `SmartStatCard`.
