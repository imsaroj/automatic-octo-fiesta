# Data grid — `@workspace/ui/data-grid`

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
} from "@workspace/ui/data-grid"
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

| Prop               | Grid            | Notes                                               |
| ------------------ | --------------- | --------------------------------------------------- |
| `rows`             | SmartGrid       | All data up front.                                  |
| `fetchRows`        | SmartServerGrid | `(params, signal) => Promise<{rows,total}>`.        |
| `columns`          | both            | `DataGridColumn<TRow>` (AG Grid `ColDef` alias).    |
| `selection`        | both            | `"single" \| "multiple" \| "none"`.                 |
| `getRowId`         | both            | Stable id — recommended for selection + updates.    |
| `exportCsv`/export | both            | CSV (client) / XLSX (server); both formula-guarded. |
| `persistStateKey`  | SmartServerGrid | Persist column/filter state to localStorage.        |

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

`/grids/simple`, `/grids/server`, `/grids/infinite`, `/examples/crud`.
