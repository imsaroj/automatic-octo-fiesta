---
name: smart-component
description: >
  Expert usage guide for the smart-component library (@iamsaroj/smart-ui) — a config-driven,
  shadcn/Base-UI + Tailwind v4 React 19 component system with Smart* wrappers, a Zod-driven
  form engine, a search engine, AG Grid data grids, page layout slots, tree / transfer-list /
  calendar engines, and a Lexical rich-text editor. Load this skill whenever building or
  editing UI that consumes @iamsaroj/smart-ui so generated code matches the library's real APIs,
  conventions, and design tokens.
---

# Smart Component Skill

## Purpose

This skill teaches an AI agent to build application UI with the **smart-component** library
(`@iamsaroj/smart-ui`) exactly as its authors would: reaching for existing `Smart*` components and
engines first, importing only through the public exports map, styling only with the semantic
design tokens, and following the repo's controlled-state (`data`/`setData`) and config-driven
conventions.

## When to Use

Use this skill whenever a task involves:

- Building pages, forms, dialogs, dashboards, search bars, or data grids in an app that
  depends on `@iamsaroj/smart-ui`.
- Adding or modifying components inside `packages/ui`.
- Reviewing UI code for convention violations (wrong imports, duplicated components,
  bypassed tokens).

Do **not** use it to introduce another design system, another component library (MUI, AntD,
Chakra, Radix), or hand-rolled equivalents of components that already exist here.

---

## Project Overview

- **Monorepo:** pnpm workspaces + Turborepo.
  - `apps/web` — Vite + React 19 demo/playground (routing via `react-router-dom` v7,
    data fetching via TanStack Query, mock API via MSW). Path alias `@` → `apps/web/src`.
  - `packages/ui` — the library, published as **source** (`@iamsaroj/smart-ui`). **There is no
    build step**; the `exports` map in `packages/ui/package.json` points straight at `.ts`/`.tsx` files.
- **Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui v4 style on **Base UI**
  (`@base-ui/react`, _not_ Radix), Zod v4, TanStack Form, AG Grid Community, Lexical,
  lucide-react icons, sonner toasts, date-fns (library-side only).
- **Commits:** Conventional Commits enforced by commitlint + Husky. Don't bypass hooks.
- **Tests:** Vitest in `packages/ui` only (`cd packages/ui && pnpm exec vitest run`).

### Commands

```bash
pnpm install        # install
pnpm dev            # dev servers via Turbo
pnpm build          # build all
pnpm lint           # lint all
pnpm typecheck      # type-check all
pnpm test           # tests (packages/ui)
pnpm dlx shadcn@latest add <name> -c apps/web   # add a shadcn primitive (lands in packages/ui/src/components/)
```

---

## Architecture

### The exports map is the public API

Consumers may **only** import via these subpaths (from `packages/ui/package.json`):

```
@iamsaroj/smart-ui/globals.css               → src/styles/globals.css       (import once in app entry)
@iamsaroj/smart-ui/lib/*                     → src/lib/*.ts                 (cn, format, xlsx)
@iamsaroj/smart-ui/components/*              → src/components/*.tsx         (shadcn/Base-UI primitives)
@iamsaroj/smart-ui/hooks/*                   → src/hooks/*.ts               (useIsMobile)
@iamsaroj/smart-ui/smart-components/*        → src/smart-components/*.tsx   (Smart* wrappers)
@iamsaroj/smart-ui/smart-components/page     → page-layout barrel (SmartPage + slots)
@iamsaroj/smart-ui/smart-components/buttons  → action-button presets barrel
@iamsaroj/smart-ui/form               → SmartForm + FieldDefinition + Smart*Field
@iamsaroj/smart-ui/search             → SmartSearchForm
@iamsaroj/smart-ui/data-grid                 → SmartGrid, SmartServerGrid, pagination, action column
@iamsaroj/smart-ui/tree               → SmartTree
@iamsaroj/smart-ui/transfer-list      → SmartTransferList
@iamsaroj/smart-ui/calendar           → SmartCalendar
@iamsaroj/smart-ui/text-editor       → SmartTextEditor
```

`data-grid`, `form`, `search`, the engines, and `text-editor` are
**barrel entrypoints** — their internal files (`grid-internals.tsx`, `smart-form-internals.ts`,
`field-registry.ts` internals, editor plugins, …) are _not_ individually importable. Never
deep-import `@iamsaroj/smart-ui/src/...` or reach past a barrel.

### Placement rule for new components

- General-purpose component / shadcn wrapper → `packages/ui/src/smart-components/`.
- Domain-scoped helper → its domain folder (`data-grid/`, `form/`,
  `text-editor/`, …). Rule of thumb: if it only imports from / only makes sense
  inside one domain folder, it lives there.

### Two intentional repo-wide conventions (do not "fix")

1. **`forwardRef` everywhere.** Generic-handle components (`SmartServerGrid`, `SmartTree`,
   `SmartTransferList`, `SmartCalendar`) need it; `forwardRef` erases generics, so those are
   re-cast after definition — that cast is intentional, not a bug. Don't migrate files to
   React 19 ref-as-prop piecemeal.
2. **`"use client"` on every client component file.** A no-op under Vite, kept uniformly to
   future-proof for RSC. All-or-nothing by policy — don't add/remove selectively.

---

## Design Philosophy

- **Config over composition.** Each `Smart*` wrapper flattens a multi-part shadcn compound
  into one component driven by props (`header={{ title, subtitle, actions }}` instead of
  five nested tags). Prefer the flat API; every wrapper file also **re-exports the native
  primitives** so you can drop back to compound form for layouts the flat API can't express.
- **Schemas are the source of truth.** Zod schemas drive validation _and_ required-ness in
  forms; Zod validates server payloads in the grid fetch pipeline.
- **Semantic tokens only.** Colors, radii, and fonts come from CSS variables
  (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`), never hex/oklch
  literals in component code.
- **Pure logic is extracted and unit-tested** (`tree-utils.ts`, `transfer-utils.ts`,
  `recurrence.ts`, `booking.ts`, `pagination.ts`, `action-column.ts`, `build-query.ts`).
  Reuse these helpers instead of hand-rolling recursion, date math, or query encoding.
- **Base UI idiom:** triggers take a `render` prop, not `asChild`
  (`<DropdownMenuTrigger render={<Button />}>`); drawers (vaul) still use `asChild`.

### Design language

- **Typography:** Inter Variable (`--font-sans`) for UI, Noto Serif Variable
  (`--font-serif` / `--font-heading`) for headings.
- **Radius scale:** `--radius: 0.625rem` with derived `rounded-sm … rounded-4xl`.
- **Color:** oklch tokens; primary is a green hue (~165°); `--destructive` red;
  neutral grays elsewhere. Light theme on `:root`, dark theme on the `.dark` class
  (`@custom-variant dark (&:is(.dark *))`).
- **Density:** compact enterprise UI. Grids offer `"compact" | "normal" | "comfortable"`
  densities; cards/dialogs offer `size="sm"` variants.
- Icons are **lucide-react**, typically `className="size-4"` inline with text.

---

## Installation / App Integration

An app consuming the library must:

1. Depend on `@iamsaroj/smart-ui` (workspace protocol) — plus `react`, `react-dom`.
2. Import the stylesheet **once** in the entry point:
   ```tsx
   import "@iamsaroj/smart-ui/globals.css"
   ```
   The CSS's `@source` directives scan `apps/**` and `packages/ui/**` so Tailwind sees
   classes from both workspaces.
3. Mount `SmartToaster` once at the app root:
   ```tsx
   import { SmartToaster } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
   // ...
   <App />
   <SmartToaster />
   ```
4. Toggle dark mode by adding/removing the `dark` class on a root element
   (`next-themes` is available in the library for this pattern).
5. Data fetching is the **app's** concern — the library is fetch-agnostic. The reference
   app uses TanStack Query (`QueryClientProvider` in `main.tsx`).

---

## Theme

All theming is CSS variables in `packages/ui/src/styles/globals.css`:

- Semantic pairs: `--background/--foreground`, `--card/--card-foreground`,
  `--popover/--popover-foreground`, `--primary/--primary-foreground`,
  `--secondary/…`, `--muted/…`, `--accent/…`, `--destructive`, `--border`, `--input`,
  `--ring`, `--chart-1…5`, and a full `--sidebar-*` group.
- Consumed via Tailwind utilities: `bg-background`, `text-foreground`, `bg-primary`,
  `text-primary-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`, etc.
- **Customize by overriding the variables** (in the app's own CSS after importing
  `globals.css`), never by hard-coding colors in components.
- Dark mode = `.dark` class on an ancestor; every token has a dark value. When you need a
  raw Tailwind color (rare — e.g. status badges), always pair light + dark:
  `"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"`.

---

## Component Catalog

### Primitives (`@iamsaroj/smart-ui/components/*`) — shadcn on Base UI

accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar,
card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, data-table,
date-picker, dialog, drawer, dropdown-menu, hover-card, input, input-group, input-otp, kbd,
label, menubar, navigation-menu, pagination, popover, progress, radio-group, scroll-area,
select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea,
toggle, toggle-group, tooltip.

Use these directly only when no `Smart*` wrapper exists (e.g. `Tabs`, `Tooltip`, `Skeleton`,
`Progress`, `Popover`, `ScrollArea`). Some primitives currently have zero importers
(`chart`, `data-table`, `carousel`, `menubar`, `navigation-menu`, `input-otp`, `hover-card`,
`aspect-ratio`, `pagination`) — they are **deliberately kept** vendored code; don't delete
them or prune their deps.

### Smart wrappers (`@iamsaroj/smart-ui/smart-components/<file>`)

One component per file; import from the file name:

| Import path suffix                                                                                                                                                      | Export(s)                                              | Purpose                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smart-button`                                                                                                                                                          | `SmartButton`                                          | Button + `loading` / `loadingText` spinner state                                                                                                                      |
| `smart-card`                                                                                                                                                            | `SmartCard`                                            | Card with `header={{ title, subtitle, actions }}`, `footer`, `size`                                                                                                   |
| `smart-dialog`                                                                                                                                                          | `SmartDialog`                                          | Dialog with `trigger`, `header`, `footer`, `size`, `dividers`; controlled via `open`/`onOpenChange`                                                                   |
| `smart-confirm-dialog`                                                                                                                                                  | `SmartConfirmDialog`                                   | One-shot confirm (`title`, `description`, `confirmLabel`, `variant="destructive"`, `onConfirm`)                                                                       |
| `smart-sheet` / `smart-drawer`                                                                                                                                          | `SmartSheet`, `SmartDrawer`                            | Side panel / bottom drawer, flattened                                                                                                                                 |
| `smart-select`                                                                                                                                                          | `SmartSelect`                                          | Data-driven select: `options`/`groups`, `value`/`onValueChange`, plus `label`/`description`/`error` decoration. **Controlled empty value is `null`, not `undefined`** |
| `smart-native-select`                                                                                                                                                   | `SmartNativeSelect`                                    | Native `<select>` variant                                                                                                                                             |
| `smart-combobox`                                                                                                                                                        | `SmartCombobox`                                        | Searchable single select                                                                                                                                              |
| `smart-multi-select`                                                                                                                                                    | `SmartMultiSelect`                                     | Searchable multi select                                                                                                                                               |
| `smart-input`, `smart-textarea`, `smart-password-input`, `smart-input-group`                                                                                            | `SmartInput`, …                                        | Inputs with label/description/error decoration                                                                                                                        |
| `smart-search-input`                                                                                                                                                    | `SmartSearchInput`                                     | Debounced quick-search box                                                                                                                                            |
| `smart-checkbox`, `smart-checkbox-group`, `smart-radio-group`, `smart-switch`, `smart-segmented`                                                                        | toggles & choice groups                                |
| `smart-date-picker`, `smart-date-range-picker`, `smart-month-picker`, `smart-year-picker`, `smart-time-picker`, `smart-time-range-picker`, `smart-date-picker-calendar` | date/time pickers (react-day-picker v9 under the hood) |
| `smart-stepper`                                                                                                                                                         | `SmartStepper`                                         | Multi-step wizard header                                                                                                                                              |
| `smart-accordion`, `smart-alert`, `smart-avatar`, `smart-badge`, `smart-breadcrumb`, `smart-context-menu`, `smart-label`, `smart-separator`, `smart-field`              | flattened misc wrappers                                |
| `smart-nav-sidebar`                                                                                                                                                     | `SmartNavSidebar`                                      | App navigation sidebar                                                                                                                                                |
| `smart-stat-card`                                                                                                                                                       | `SmartStatCard`                                        | KPI card: `label`, `value`, `delta`, `trend`, `deltaLabel`, `icon`                                                                                                    |
| `smart-toaster`                                                                                                                                                         | `SmartToaster`, `toast`                                | Themed sonner toaster + the `toast()` function                                                                                                                        |
| `smart-loading-overlay`                                                                                                                                                 | `SmartLoadingOverlay`                                  | Branded loading overlay                                                                                                                                               |
| `smart-spinner`                                                                                                                                                         | `SmartSpinner`                                         | Inline spinner                                                                                                                                                        |

Each wrapper file also re-exports its underlying compound primitives for escape hatches.

### Action buttons (`@iamsaroj/smart-ui/smart-components/buttons`)

`ACTION_BUTTON_CONFIG` (single source of truth: icon, label, variant, loading text per
action) + generic `ActionButton` + 27 presets:

`AddButton, EditButton, DeleteButton, SaveButton, CancelButton, SearchButton, RefreshButton,
SyncButton, DownloadButton, UploadButton, ImportButton, ExportButton, CopyButton,
PrintButton, FilterButton, ResetButton, SubmitButton, ApproveButton, RejectButton,
ViewButton, CloseButton, BackButton, NextButton, PreviousButton, DuplicateButton,
ArchiveButton, RestoreButton`

Every preset accepts all `SmartButton` props plus `iconOnly`, `tooltip`, `tooltipSide`,
`permission`, `deniedBehavior: "hide" | "disable"`. Permission gating:

```tsx
import {
  ActionPermissionProvider,
  EditButton,
  DeleteButton,
} from "@iamsaroj/smart-ui/smart-components/buttons"
;<ActionPermissionProvider
  can={(action) => role === "admin" || action !== "delete"}
>
  <EditButton onClick={edit} />
  <DeleteButton iconOnly onClick={remove} loading={isDeleting} />
</ActionPermissionProvider>
```

**Rule:** for any standard CRUD/toolbar action, use a preset — never a hand-configured
`SmartButton` with its own Pencil/Trash icon. To add a new action kind, add one entry to
`ACTION_BUTTON_CONFIG` and one `createActionButton` line — don't fork the pattern.

### Page layout (`@iamsaroj/smart-ui/smart-components/page`)

`SmartPage` orchestrates named slots via `SMART_PAGE_SLOT`; children render into zones:

`SmartPageHeader` (+ `SmartPageTitle`, `SmartPageDescription`, `SmartPageActions`,
`SmartPageBreadcrumb`), `SmartPageHero`, `SmartToolbar`, `SmartPageSearch`,
`SmartPageFilters`, `SmartPageTabs`/`SmartPageTab`/`SmartPageTabPanel`, `SmartPageContent`,
`SmartPageSection`, `SmartSidebar`, `SmartGridArea`, `SmartPageStatusBar`, `SmartPageFooter`,
and state slots `SmartPageEmpty`, `SmartPageLoading`, `SmartPageError`. `SmartPageContainer`
is the simpler compound wrapper; `usePageContext` exposes layout/scroll/padding.

Use `SmartPage` for full screens (it has a `"grid"` layout mode where `SmartGridArea` fills
the viewport — pair with `SmartServerGrid fill`).

---

## Forms (`@iamsaroj/smart-ui/form`)

`SmartForm` = TanStack Form + Zod, fully declarative:

```tsx
import { z } from "zod"
import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  role: z.string().min(1, "Role is required"),
  mrr: z.number().min(0),
})
type Form = z.infer<typeof schema>

const fields: FieldDefinition<Form>[] = [
  { name: "name", type: "text", label: "Name", placeholder: "Ada Lovelace" },
  { name: "email", type: "email", label: "Email", colSpan: 2 },
  { name: "role", type: "select", label: "Role", options: ROLE_OPTIONS },
  { name: "mrr", type: "currency", label: "MRR", min: 0 },
]

<SmartForm schema={schema} fields={fields} columns={2} onSubmit={(value) => save(value)} />
```

Key rules:

- **The Zod schema is the single source of truth** for validation _and_ the required
  asterisk (`isFieldRequired` derives it). `FieldDefinition` is UI-only — don't duplicate
  validation there.
- `FieldDefinition<T>` is a **discriminated union on `type`** — each type only permits its
  own extras (`options` on selects, `decimalScale`/`min`/`max` on numerics, `rows` on
  textarea, …). Invalid combos fail to compile.
- Field types: text family (`text, email, url, password, tel, slug, textarea, text-editor`),
  numeric (`number, decimal, integer, currency, percentage`), date/time
  (`date, time, datetime, month, year, daterange, timerange`), selection
  (`select, combobox, autocomplete, multiselect, radio, checkbox, checkbox-group, switch,
segmented, yesno`).
- `data`/`setData` are **optional** — the form owns state internally and mirrors edits out.
  Don't wire per-field state.
- Empty optional strings are normalized to `undefined` pre-validation, so
  `z.email().optional()` doesn't flag a blank field.
- `submitLabel={null}` suppresses the default button; pass `children` for a custom action
  row, or set `id` and put a `<SubmitButton form={id} />` outside the form.
- Per-field `hidden: (data) => boolean` hides a field and skips its validation.
- Extend with new field types via the `registry` prop (merged over the built-in
  `defaultFieldRegistry`) — don't fork the engine.
- Standalone `Smart*Field` components (e.g. `SmartInputField`, `SmartSelectField`) are also
  exported from `@iamsaroj/smart-ui/form`; they all take `FieldBaseProps<T>`:
  **`data` / `setData(value)` — not `value` / `onChange`.** This is the library-wide
  controlled-field convention.

---

## Search Engine (`@iamsaroj/smart-ui/search`)

`SmartSearchForm` composes `SmartForm` into a filter bar:

```tsx
import { SmartSearchForm, type SearchFieldDefinition } from "@iamsaroj/smart-ui/search"
import type { ServerFilter } from "@iamsaroj/smart-ui/data-grid"

const searchFields: SearchFieldDefinition<Query>[] = [
  { name: "name", type: "text", label: "Name" },
  { name: "status", type: "multiselect", label: "Status", options: STATUS_OPTIONS },
  { name: "joined", type: "daterange", label: "Joined" },
]

<SmartSearchForm
  fields={searchFields}
  columns={3}
  showCount
  onSearch={(query) => setFilters(toServerFilters(query))}
/>
```

- `SearchFieldDefinition` = `FieldDefinition & { type: SearchFieldType }` — same fields,
  minus password/textarea/rich-text.
- Manual mode (default): Search button, emits on submit/Enter. Auto mode:
  `autoSearch` (or `search={false}`) emits debounced (`debounce`, default 400 ms) — gated by
  `schema.safeParse` and deduped so the first render doesn't fire.
- `onSearch` receives the **pruned** query: `buildSearchQuery` drops blanks, `null`, empty
  arrays, `false`, empty range objects, and trims strings. `countActiveFilters` backs the
  count badge.
- Feed the result into `SmartServerGrid`'s `filters` prop (swap the array identity to
  trigger a refetch).

---

## Data Grid (`@iamsaroj/smart-ui/data-grid`)

Two components, both taking `columns: DataGridColumn<TRow>[]` (a re-export of AG Grid's
`ColDef<TRow>` — consumers never import `ag-grid-community` directly):

### `SmartGrid` — client-side rows

```tsx
import { SmartGrid, type DataGridColumn } from "@iamsaroj/smart-ui/data-grid"

const columns: DataGridColumn<User>[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "email", headerName: "Email", flex: 1 },
  { field: "mrr", headerName: "MRR", valueFormatter: (p) => formatCurrency(p.value) },
]

<SmartGrid
  rows={users}
  columns={columns}
  loading={isLoading}
  selection="multiple"
  onSelectionChange={setSelected}
  getRowId={(u) => u.id}
  actionColumn={{ actions: { edit: { onClick: openEdit }, delete: { confirm: true, onClick: remove } } }}
/>
```

Built-ins (all default on): quick search, column visibility menu, CSV export, pagination
(`pageSize` 10). Also `title`, `toolbarActions`, `density`, `height` (default 480),
`emptyState`.

### `SmartServerGrid` — server-side / infinite row model

```tsx
import { SmartServerGrid, createPageFetcher } from "@iamsaroj/smart-ui/data-grid"

const fetchUsersPage = createPageFetcher({ url: "/api/users", itemSchema: userSchema })

<SmartServerGrid
  ref={gridRef}                      // SmartServerGridHandle: refresh/reload/getSelectedIds/getSelectedRows/clearSelection
  columns={columns}
  getRowId={(u) => u.id}             // required
  fetchRows={fetchUsersPage}
  filters={serverFilters}            // external filters (e.g. from SmartSearchForm); identity change ⇒ page 1 + refetch
  columnFilters={false}              // disable header filters when a search form drives filtering
  pagination                          // true = pager, false = infinite scroll
  pageSize={20}
  selection="multiple"               // cross-page selection survives block reloads
  onRowDoubleClick={openDetails}
  persistStateKey="users-grid"       // localStorage persistence of column state + sort + filters
  fill                               // fill parent (put inside a flex-1 min-h-0 container)
  actionColumn={{ actions: { edit: true, delete: { confirm: true, onClick: remove } } }}
/>
```

- `fetchRows(params, signal)` → `Promise<{ rows, total }>`; throwing shows an error overlay
  with Retry. `ServerFetchParams` carries normalized page/sort/filter state.
- **`createPageFetcher`** is the canonical transport: fetch → status check → Zod
  `pageSchema(itemSchema)` parse (Spring Data `Page<T>` envelope) → `{ rows, total }`.
  Customize with `encodeQuery` (defaults to `buildSpringQuery`), `mapError`, `fetchImpl`.
  The returned fetcher accepts an optional 3rd `extraParams` arg for per-call query params.
- Excel (`.xlsx`) export of loaded rows is built in (dependency-free writer in `lib/xlsx.ts`).

### Action column (both grids)

`actionColumn: GridActionColumnOptions<TRow>` — config-driven Edit/Delete column:
`pinned` (`"left"` default | `"right"` | `false`), `width`, `showLabel`, `exportable`,
`headerName`, and `actions.edit` / `actions.delete`, each `boolean | GridRowActionConfig`:
`visible` / `disabled` / `loading` (static or `(row) => boolean`), `tooltip`,
`confirm: boolean | { title, description, … }` (delete confirmation uses
`SmartConfirmDialog`), `onClick(row)`. The column auto-hides when everything is statically
hidden. Buttons reuse the `ActionButton` presets, so permissions gate them too.

**Internals warning:** the action ColDef is memoized on a structural signature and per-row
callbacks reach cells through a `useSyncExternalStore` store (AG Grid's `refreshCells`
doesn't reliably re-render memoized React cells). Never "fix" this by recreating the ColDef
per render.

---

## Other Engines

- **Tree (`@iamsaroj/smart-ui/tree`):** `SmartTree` — generic `TreeNode<T>`; a node is a
  folder if it has `children` (even `[]`) or `isFolder: true` (lazy loading). Selection
  `none|single|multiple`, tri-state checkboxes, keyboard nav, inline rename, drag-and-drop
  (`before|after|inside`), search modes `highlight|filter|none`. Expanded/selected/checked
  each independently controllable (`*Ids`/`default*Ids`/`on*Change`); imperative
  `SmartTreeHandle` via `ref`. Use `tree-utils` exports (`moveNode`, `insertNode`,
  `getDescendantIds`, …) for mutations — never hand-roll recursion.
- **Transfer list (`@iamsaroj/smart-ui/transfer-list`):** `SmartTransferList` — dual-list
  shuttle over `TransferItem<T>` keyed by stable `id`; `onChange(items, meta)` with
  `direction` + `moved`; `targetIds`/`defaultTargetIds` controllable;
  `SmartTransferListHandle` for move-all/move-selected.
- **Calendar (`@iamsaroj/smart-ui/calendar`):** `SmartCalendar` — `month|week|day|agenda`
  views; `date` and `view` independently controllable; `CalendarEvent<T>` with 8 preset
  color tokens; `editable` enables drag-to-move/resize emitting `onEventChange`; recurrence
  via `RecurrenceRule` + `expandEvents` and series helpers `detachOccurrence` / `splitSeries`
  / `updateSeries`; booking via `availability` + `generateFreeSlots` + `onSlotBook`.
  Prefer the exported date helpers over hand-rolled date arithmetic.
- **Rich text (`@iamsaroj/smart-ui/text-editor`):** `SmartTextEditor` — Lexical editor,
  value format `"html" | "json"`. In forms, just use field `type: "text-editor"`.

---

## Dialogs

- Standard dialog: `SmartDialog` — controlled (`open`/`onOpenChange`) or uncontrolled via
  `trigger={<Button>…</Button>}` (a single element passed to Base UI's `render` prop).
  `header={{ title, subtitle }}`, `footer`, `size` (up to `"full"`), `dividers`.
- Confirmation: `SmartConfirmDialog` — use for every destructive action, with
  `variant="destructive"`.
- Side panels: `SmartSheet` (Base UI) / `SmartDrawer` (vaul).
- Form-in-dialog: render `<SmartForm id="user-form" submitLabel={null} …/>` inside, put
  `<SaveButton type="submit" form="user-form" loading={pending} />` in the dialog `footer`.

## Notifications

```tsx
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"

toast.success("User created")
toast.error("Delete failed", { description: message })
```

`SmartToaster` must be mounted once at the app root. Toast colors track the theme tokens.

## Icons

lucide-react only. Inline sizing `className="size-4"`. Decorative icons get `aria-hidden`.
Don't add another icon set; don't inline custom SVGs when a lucide icon exists.

## Hooks

- `@iamsaroj/smart-ui/hooks/use-mobile` → `useIsMobile()` (viewport < 768px).
- Engine hooks come through their barrels (e.g. `useGridActionColumn`, `withActionColumn`
  from `data-grid`).

## Utilities (`@iamsaroj/smart-ui/lib/*`)

- `lib/utils` → `cn(...classes)` — clsx + tailwind-merge. Use for all conditional classes.
- `lib/format` → `formatCurrency`, `formatCompact`, `formatPercent`, `getInitials`,
  `truncate`. Use these instead of ad-hoc `Intl` calls.
- `lib/xlsx` → dependency-free `.xlsx` writer (used by grid export).

---

## Common Workflows

### CRUD page (the canonical recipe — mirrors `apps/web/src/pages/examples/crud-example-page.tsx`)

```tsx
import { useState } from "react"
import { z } from "zod"
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query"
import { SmartDialog } from "@iamsaroj/smart-ui/smart-components/smart-dialog"
import { SmartConfirmDialog } from "@iamsaroj/smart-ui/smart-components/smart-confirm-dialog"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import {
  AddButton,
  SaveButton,
} from "@iamsaroj/smart-ui/smart-components/buttons"
import {
  SmartPage,
  SmartToolbar,
  SmartGridArea,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"
import {
  SmartServerGrid,
  createPageFetcher,
  type DataGridColumn,
} from "@iamsaroj/smart-ui/data-grid"

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  role: z.string().min(1, "Role is required"),
})
type UserForm = z.infer<typeof userFormSchema>

const userFields: FieldDefinition<UserForm>[] = [
  { name: "name", type: "text", label: "Name" },
  { name: "email", type: "email", label: "Email" },
  { name: "role", type: "select", label: "Role", options: ROLE_OPTIONS },
]

export const UsersPage = () => {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User created")
      setCreateOpen(false)
    },
    onError: (e) => toast.error("Create failed", { description: e.message }),
  })

  const columns: DataGridColumn<User>[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "role", headerName: "Role" },
  ]

  return (
    <SmartPage layout="grid">
      <SmartToolbar>
        <AddButton onClick={() => setCreateOpen(true)}>Add user</AddButton>
      </SmartToolbar>
      <SmartGridArea>
        <SmartServerGrid
          columns={columns}
          getRowId={(u) => u.id}
          fetchRows={createPageFetcher({
            url: "/api/users",
            itemSchema: userSchema,
          })}
          actionColumn={{
            actions: {
              edit: { onClick: openEdit },
              delete: {
                confirm: true,
                onClick: (row) => deleteMutation.mutate(row.id),
              },
            },
          }}
          fill
        />
      </SmartGridArea>

      <SmartDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        header={{ title: "New user" }}
      >
        <SmartForm
          id="user-create"
          schema={userFormSchema}
          fields={userFields}
          submitLabel={null}
          onSubmit={(value) => createMutation.mutate(value)}
        >
          <div className="flex justify-end gap-2">
            <SaveButton type="submit" loading={createMutation.isPending} />
          </div>
        </SmartForm>
      </SmartDialog>
    </SmartPage>
  )
}
```

Delete pattern: **optimistic** — `onMutate` snapshot + cache update, rollback in `onError`,
`invalidateQueries` in `onSettled`, `toast` feedback.

### Login page

```tsx
import { z } from "zod"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  remember: z.boolean().optional(),
})
type Login = z.infer<typeof loginSchema>

const loginFields: FieldDefinition<Login>[] = [
  { name: "email", type: "email", label: "Email", autoComplete: "email" },
  {
    name: "password",
    type: "password",
    label: "Password",
    autoComplete: "current-password",
  },
  { name: "remember", type: "checkbox", label: "Remember me" },
]

export const LoginPage = () => (
  <div className="flex min-h-svh items-center justify-center bg-background p-4">
    <SmartCard
      className="w-full max-w-sm"
      header={{ title: "Sign in", subtitle: "Welcome back" }}
    >
      <SmartForm
        schema={loginSchema}
        fields={loginFields}
        submitLabel="Sign in"
        onSubmit={signIn}
      />
    </SmartCard>
  </div>
)
```

### Dashboard

```tsx
import { BarChart3, DollarSign, Users } from "lucide-react"
import { SmartStatCard } from "@iamsaroj/smart-ui/smart-components/smart-stat-card"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { formatCurrency } from "@iamsaroj/smart-ui/lib/format"
;<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <SmartStatCard
    label="Revenue"
    value={formatCurrency(48295)}
    delta={12.4}
    deltaLabel="vs last period"
    icon={<DollarSign className="size-4" />}
  />
  <SmartStatCard
    label="Sessions"
    value="248,392"
    delta={-3.1}
    deltaLabel="vs last period"
    icon={<BarChart3 className="size-4" />}
  />
  <SmartStatCard
    label="Users"
    value="3,842"
    delta={5.2}
    icon={<Users className="size-4" />}
  />
</div>
```

### Search form + server grid

Own the filter array in the page; `SmartSearchForm onSearch` maps the pruned query to
`ServerFilter[]` and sets it; pass it to `SmartServerGrid filters` with
`columnFilters={false}`. Typing never hits the server — only the array swap does.

### Wizard

`SmartStepper` for the step header + one `SmartForm` (or field group) per step; validate the
step's schema on Next (`schema.safeParse`); `NextButton` / `PreviousButton` / `SubmitButton`
presets for navigation.

---

## Accessibility

- Prefer `Smart*` components — labels, descriptions, and errors are wired to inputs for you
  (`label` / `description` / `error` props); don't re-implement with bare `<label>`.
- Icon-only buttons: use `iconOnly` on action buttons (keeps the label as `aria-label` +
  tooltip). Custom icon buttons need explicit `aria-label`.
- Decorative icons: `aria-hidden`.
- Destructive flows must confirm via `SmartConfirmDialog`.
- The repo lints with `eslint-plugin-jsx-a11y` and tests with `axe-core` — keep new code
  clean under both.
- Muted text contrast was deliberately tuned to WCAG AA (see `--muted-foreground` comment);
  don't lighten grays below the tokens.

## Performance

- Keep grid `columns` arrays and `actionColumn` configs stable (module-level or `useMemo`) —
  identity changes reset grid state; `filters` identity change intentionally refetches.
- Always pass `getRowId` for selectable/updatable grids.
- Don't recreate the action-column ColDef per render (see internals warning above).
- Tree-shaking depends on the exports map — deep-importing breaks it.
- Debounce comes built in (`SmartSearchInput`, `autoSearch debounce`); don't add another
  debounce layer on top.

## Responsive Design

- Mobile-first Tailwind: base classes for mobile, `sm:`/`md:`/`lg:` upward.
- `SmartSearchForm columns` collapses automatically (desktop N → tablet 2 → mobile 1).
- `useIsMobile()` for JS-level branches (e.g. dialog vs drawer).
- Full-viewport grid pages: `SmartPage` grid layout + `SmartServerGrid fill` inside a
  `flex-1 min-h-0` parent — not fixed pixel heights.

---

## Best Practices

1. **Smart first:** `Smart*` wrapper → action-button preset → engine → shadcn primitive →
   (last resort) new component placed by the placement rule.
2. **Barrels only:** import exactly the subpaths in the exports map.
3. **`data`/`setData`** for form fields; `value`/`onValueChange` for standalone
   wrappers like `SmartSelect` — match each component's documented API, never invent props.
4. **Zod first:** validation lives in the schema; payloads are Zod-parsed at the boundary.
5. **Tokens only:** semantic Tailwind classes; `cn()` for conditionals; light+dark pairs for
   any raw palette color.
6. **Presets over bespoke:** `DeleteButton confirm` flows, `actionColumn` for grid rows,
   `toast` for feedback.
7. **Match repo idiom:** Base UI `render` prop for triggers; `forwardRef`; `"use client"` on
   every client file; JSDoc on exported props.

## Anti-patterns (never do these)

- ❌ Deep-import internals (`@iamsaroj/smart-ui/src/...`, `data-grid/grid-internals`,
  `form/field-registry` internals, lexical plugins).
- ❌ Import `ag-grid-community`/`ag-grid-react` in app code — use `SmartGrid`/`SmartServerGrid`
  and `DataGridColumn`.
- ❌ Recreate an existing component (KPI card, confirm dialog, spinner, search input,
  toolbar button…). Search `smart-components/` first.
- ❌ Hand-configure a `SmartButton` for a standard action that has a preset.
- ❌ Hard-code colors/radii/fonts; introduce a second design system or icon set; use Radix
  (`asChild` on Base UI components won't work — use `render`).
- ❌ Pass `undefined` as a controlled `SmartSelect` value ("no selection" is `null`;
  `undefined` means uncontrolled and Base UI warns if it later flips).
- ❌ Duplicate validation between Zod schema and `FieldDefinition`.
- ❌ Remove `"use client"`, migrate `forwardRef` piecemeal, delete "unused" vendored
  primitives (`chart`, `carousel`, `data-table`, …) or their deps — all deliberate.
- ❌ Touch `SmartForm`'s sync effects without reading the `selfUpdateRef` comments (echo-loop
  guard), or "simplify" the grid action-column store.
- ❌ Add `date-fns` to `apps/web` (library-only dep) or `@tanstack/react-query` to
  `packages/ui` (app-only dep — the library stays fetch-agnostic).
- ❌ Bypass git hooks (`--no-verify`) or break Conventional Commits.

## AI Decision Rules

1. Need a UI element? Check, in order: `smart-components/` → `smart-components/buttons` →
   the engines (`form`, `search`, `data-grid`, `tree`,
   `transfer-list`, `calendar`, `text-editor`) → `components/`.
   Only then consider writing something new — in the correct folder.
2. Building a form? Always `SmartForm` + Zod schema + `FieldDefinition[]`. Never wire
   individual inputs with local state unless it's a one-off control outside a form.
3. Filter bar above a list? `SmartSearchForm`, not a hand-built row of inputs.
4. Table of data? `SmartGrid` (client data) or `SmartServerGrid` + `createPageFetcher`
   (server data). Never raw `<table>` for data-heavy views; `components/table` is fine for
   small static tables.
5. Row actions? The grids' `actionColumn` prop — not custom cell renderers with buttons.
6. Destructive action? `SmartConfirmDialog` (or `confirm: true` in the action column).
7. User feedback? `toast` from `smart-toaster`.
8. Full page? `SmartPage` slots. App chrome (sidebar/breadcrumbs) in the demo app is
   `PlaygroundShell` — don't confuse the two.
9. Unsure of a prop? Read the component's source file — every exported prop is JSDoc'd.
   Never guess or invent props.

## Common Mistakes / Troubleshooting

| Symptom                                                | Cause / Fix                                                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Tailwind classes not applying from a new folder        | The `@source` globs in `globals.css` scan `apps/**` and `packages/ui/**` — keep code inside the workspaces        |
| Base UI warns select flipped controlled/uncontrolled   | You passed `undefined` then a string — use `null` for "no selection"                                              |
| Trigger renders nothing / double button                | Base UI wants `render={<Button/>}` (or the wrapper's `trigger` prop), not `asChild`                               |
| Grid refetches on every keystroke                      | You're rebuilding the `filters` array per render — only swap identity on search submit                            |
| Grid selection lost on page change                     | Missing `getRowId`; `SmartServerGrid` needs it (required) and selection is id-`Set`-backed                        |
| Action buttons in grid not updating (loading/disabled) | Per-row state flows through the store — mutate your state normally, don't recreate ColDefs or call `refreshCells` |
| Optional email/url field errors when blank             | Only if you forced `required` — the engine already normalizes blanks to `undefined` for schema-optional fields    |
| Toasts don't show                                      | `SmartToaster` not mounted at the app root                                                                        |
| Import fails ("not exported")                          | You deep-imported past a barrel — use the exports-map subpath                                                     |
| Excel export includes the actions column               | It's excluded by default; `exportable: true` opts in (`context.suppressExport` internally)                        |

## Checklist (before finishing any UI task)

- [ ] Every import goes through the `@iamsaroj/smart-ui` exports map.
- [ ] No component duplicates an existing `Smart*`, preset, or engine feature.
- [ ] Forms: Zod schema + `FieldDefinition[]` + `SmartForm`; no duplicated validation.
- [ ] Buttons: action presets used for standard actions; `loading` wired to async state.
- [ ] Destructive actions confirmed; outcomes toasted.
- [ ] Only semantic tokens for color/radius/typography; dark mode holds up.
- [ ] Responsive: mobile-first classes; grid `fill` inside flex parents, not magic heights.
- [ ] Accessibility: labels/aria-labels present, icons `aria-hidden`, contrast tokens intact.
- [ ] New files: `"use client"` if a client component, `forwardRef` idiom, correct folder per
      the placement rule, props JSDoc'd.
- [ ] `pnpm lint && pnpm typecheck` pass; tests added for pure logic; Conventional Commit
      message.
