# Data grid — `@iamsaroj/smart-ui/data-grid`

## What it is

Two AG Grid Community wrappers behind a small prop API.

| Component         | Row model         | Use case                                            |
| ----------------- | ----------------- | --------------------------------------------------- |
| `SmartGrid`       | Client-side       | All rows in memory; quick search + CSV export.      |
| `SmartServerGrid` | Infinite (server) | Large datasets; a `fetchRows` callback does paging. |

Decision rule: if every row fits in memory, use `SmartGrid`. If the data is
paged/sorted/filtered on a server, use `SmartServerGrid`.

## Import

```ts
import {
  SmartGrid,
  SmartServerGrid,
  createPageFetcher,
  type DataGridColumn,
} from "@iamsaroj/smart-ui/data-grid"
```

## 80% example — client grid

```tsx
const columns: DataGridColumn<User>[] = [
  { field: "name", headerName: "Name" },
  { field: "email", headerName: "Email" },
]

<SmartGrid rows={users} columns={columns} selection="multiple" exportCsv />
```

## 80% example — server grid

```tsx
// createPageFetcher builds a fetch → status-check → Zod-parse → {rows,total} pipeline.
const fetchUsers = createPageFetcher({
  url: "/api/users",
  itemSchema: userSchema, // validates each row
})

<SmartServerGrid columns={columns} fetchRows={fetchUsers} getRowId={(u) => u.id} />
```

## Key props

| Prop               | Grid            | Notes                                                                                                                                     |
| ------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `rows`             | SmartGrid       | All data up front.                                                                                                                        |
| `fetchRows`        | SmartServerGrid | `(params, signal) => Promise<{rows,total}>`.                                                                                              |
| `columns`          | both            | `DataGridColumn<TRow>` (AG Grid `ColDef` alias).                                                                                          |
| `selection`        | both            | `"single" \| "multiple" \| "none"`.                                                                                                       |
| `getRowId`         | both            | Stable id — recommended for selection + updates.                                                                                          |
| `exportCsv`/export | both            | CSV (client) / XLSX (server); both formula-guarded.                                                                                       |
| `persistStateKey`  | SmartServerGrid | Persist column/filter state to localStorage.                                                                                              |
| `filters`          | SmartServerGrid | External `ServerFilter[]`; identity change = reset to page 1 + refetch.                                                                   |
| `query`            | SmartServerGrid | External filters as a plain object (the `SmartSearchForm` `onSearch` shape); normalized via `toServerFilters` and merged after `filters`. |

## External filters from a search form

`SmartSearchForm` emits a pruned query object; the server grid accepts it
directly — no per-page conversion:

```tsx
const [query, setQuery] = useState<Partial<UserSearch>>({})

<SmartSearchForm onSearch={setQuery} onReset={() => setQuery({})} … />
<SmartServerGrid query={query} columnFilters={false} … />
```

Each query value becomes an `equals` filter (arrays → `set`, numbers →
`number`, `{ from, to }` / `{ start, end }` range objects → `inRange`). When a
field needs a different operator, normalize yourself with `toServerFilters`
and pass `filters` instead:

```ts
const filters = toServerFilters(query, {
  name: { type: "contains" },
  email: { type: "contains" },
})
```

## Action column

Both grids take an `actionColumn` prop that injects a config-driven **Edit /
Delete** column — no custom cell renderers in app code. Buttons are the shared
`ActionButton` presets (ghost, icon-only by default, destructive treatment for
delete) with proper `aria-label`s, tooltips ("Edit row" / "Delete row") and
native keyboard support.

<!-- prettier-ignore -->
{% raw %}

```tsx
const [deletingId, setDeletingId] = useState<string | null>(null)

<SmartGrid
  rows={rows}
  columns={columns}
  actionColumn={{
    pinned: "left",          // "left" (default) | "right" | false
    width: 110,              // omit to auto-size (80–120px icon-only)
    showLabel: false,        // true renders "Edit"/"Delete" text
    exportable: false,       // default: excluded from CSV/XLSX export
    actions: {
      edit: {
        visible: permissions.canEdit,          // boolean or (row) => boolean
        disabled: (row) => row.locked,         // disable instead of hiding
        onClick: handleEdit,                   // receives the row
      },
      delete: {
        visible: (row) => row.ownerId === me.id,
        loading: (row) => deletingId === row.id, // per-row spinner + disable
        confirm: {                             // or just `confirm: true`
          title: "Delete this user?",
          description: "This cannot be undone.",
        },
        onClick: handleDelete,
      },
    },
  }}
/>
```

{% endraw %}

Key contracts:

- **Auto-hide**: the column disappears when `enabled: false` or when every
  action is statically hidden (`false`, `enabled: false`, or a literal
  `visible: false`). Per-row `visible` functions keep the column and decide
  per row.
- **Shorthands**: `edit: true` enables an action with defaults; `edit: false`
  hides it.
- **Loading** only affects the matching row's Delete button — Edit stays
  enabled, row height doesn't change (the spinner replaces the icon inside a
  fixed-size button).
- **Utility-column lockdown**: not sortable / filterable / editable /
  resizable (by default) / movable / hidable, no header menu, excluded from
  grouping, pivot, aggregation and (unless `exportable: true`) from exports.
- **Performance**: the injected `ColDef` is memoized on structural fields only;
  per-row callbacks reach the cells through a tiny external store
  (`useSyncExternalStore`), so only the mounted action cells re-render when
  the prop changes — safe with thousands of virtualized rows and the infinite
  row model.
- Lower-level pieces (`useGridActionColumn`, `buildActionColumnDef`,
  `GridActionCell`, `ACTION_COLUMN_ID`) are exported for grids that aren't
  `SmartGrid`/`SmartServerGrid`.

## Contracts

- **Spring `Page<T>`**: server responses use the Spring Data envelope
  (`content`, `totalElements`, …), validated by `pageSchema` in `pagination.ts`.
  `buildSpringQuery`/`toSpringSort` encode the request; the decoder is app-side.
- **Cross-page selection** (`SmartServerGrid`): the selected-id `Set` is the
  source of truth, so selections survive block reloads (`useServerGridSelection`).
- **Export safety**: string cells starting with `= + - @` / tab / CR are prefixed
  with `'` to neutralize spreadsheet formula injection (see [security.md](./security.md)).

## Escape hatches

- `createPageFetcher` takes an injectable `fetchImpl` (testability/SSR) and a
  `buildQuery`/`mapError` override.
- Column defs are plain AG Grid `ColDef`s — anything AG Grid Community supports
  (cell renderers, value formatters) works.

## Gotchas

- `SmartServerGrid` is a generic `forwardRef` cast after definition to restore the
  generic signature — intentional, not a bug.
- Handing AG Grid a **new** datasource purges its cache; the datasource object is
  kept referentially stable via refs-for-latest-props.

## Demo

`/grids/simple`, `/grids/server`, `/grids/infinite`, `/grids/actions`,
`/examples/crud`.
