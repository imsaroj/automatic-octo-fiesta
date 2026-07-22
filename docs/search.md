# Search engine — `@iamsaroj/smart-ui/search`

## What it is

`SmartSearchForm` — a declarative **search/filter bar**
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

Feed the pruned query straight into `SmartServerGrid` via its `filters` or
`query` prop; those external filters drive the server fetch. See
[data-grid.md](./data-grid.md).

## Escape hatches

- `SearchFieldDefinition<T>` is `FieldDefinition<T> & { type: SearchFieldType }` —
  still assignable to `FieldDefinition<T>[]`; the intersection keeps each field's
  per-type extras while constraining `type` to the search-relevant subset.
- `columns` takes anything the [layout engine](./layout.md) accepts. A plain
  number is read as a _desktop_ target and expanded into a 1 → 2 → n ramp
  (`toSearchColumns`), since nobody wants four filters side by side in a 400px
  drawer; pass a breakpoint map or `{ auto: "fit", min }` to control it exactly.
- `SearchNode<T>` mirrors the form engine's layout tree with its children
  re-narrowed to search fields, so an "Advanced filters" `section` can collapse
  inside the bar and still reject a password field at compile time.

## Gotchas

- No password / textarea / rich-text field types in search mode.

## Demo

`/grids/server` (search bar wired to the infinite grid).
