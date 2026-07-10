# Search engine — `@iamsaroj/smart-ui/search`

## What it is

`SmartSearchForm` (aliased `SearchEngine`) — a declarative **search/filter bar**
that _composes_ `SmartForm` (not a fork). It reuses the same fields, Zod
validation, required derivation, layout, and field registry, and adds only search
concerns: a Search button (manual) or debounced auto-search, query pruning, and an
active-filter count badge.

## Import

```ts
import {
  SmartSearchForm,
  buildSearchQuery,
  type SearchFieldDefinition,
} from "@iamsaroj/smart-ui/search"
```

## 80% example

```tsx
const fields: SearchFieldDefinition<Filters>[] = [
  { name: "q", type: "text", label: "Search" },
  { name: "role", type: "select", label: "Role", options: ROLE_OPTIONS },
  { name: "active", type: "checkbox", label: "Active only" },
]

<SmartSearchForm
  fields={fields}
  columns={3}
  onSearch={(query) => refetch(query)} // query is already pruned
/>
```

## Manual vs auto search

| Mode   | Prop                            | Behavior                           |
| ------ | ------------------------------- | ---------------------------------- |
| Manual | `search` (default)              | Emits on Search button / Enter.    |
| Auto   | `autoSearch` / `search={false}` | Debounced; emits as fields change. |

Auto-search is gated by `schema.safeParse` and deduped via a serialized last-query
ref (seeded on mount so the first render doesn't fire).

## Query pruning

`buildSearchQuery` drops empty values (blank strings, `null`, empty arrays,
`false`, empty range objects) and trims strings, so only meaningful filters reach
the API. `countActiveFilters` backs the count badge.

## Composing with the grid

Feed the pruned query straight into `SmartServerGrid`'s `fetchRows` (external
filters merge on top of the grid's own column filters). See
[data-grid.md](./data-grid.md).

## Escape hatches

- `SearchFieldDefinition<T>` is `FieldDefinition<T> & { type: SearchFieldType }` —
  still assignable to `FieldDefinition<T>[]`; the intersection keeps each field's
  per-type extras while constraining `type` to the search-relevant subset.
- `columns` (1–4) is made responsive via a `grid-cols-*` override passed to
  `SmartForm`'s `className` (tailwind-merge wins).

## Gotchas

- No password / textarea / rich-text field types in search mode.

## Demo

`/grids/server` (search bar wired to the infinite grid).
