# Transfer list engine — `@iamsaroj/smart-ui/transfer-list-engine`

## What it is

`SmartTransferList` — a dual-list "shuttle" that moves items between a **source**
and a **target** list. Generic over a per-item `data` payload (`TransferItem<T>`).
Each item lives in exactly one side at a time, keyed by a stable `id`.

## Import

```ts
import {
  SmartTransferList,
  type TransferItem,
  type SmartTransferListHandle,
} from "@iamsaroj/smart-ui/transfer-list-engine"
```

## 80% example

```tsx
const items: TransferItem[] = [
  { id: "read", label: "Read" },
  { id: "write", label: "Write" },
  { id: "admin", label: "Admin" },
]

<SmartTransferList
  items={items}
  defaultTargetIds={["read"]}
  sourceTitle="Available"
  targetTitle="Granted"
  onChange={(targetIds, meta) => console.log(targetIds, meta.direction)}
/>
```

## Key props

| Prop               | Type                                         | Notes                             |
| ------------------ | -------------------------------------------- | --------------------------------- |
| `items`            | `TransferItem<T>[]`                          | Every item across both lists.     |
| `targetIds`        | `string[]`                                   | Controlled target contents.       |
| `defaultTargetIds` | `string[]`                                   | Uncontrolled initial target.      |
| `onChange`         | `(ids, meta: TransferChangeMeta<T>) => void` | `direction` + `moved`/`movedIds`. |
| `searchable`       | `boolean`                                    | Per-list filter inputs.           |

The **target ids array is the source of truth** — use it controlled
(`targetIds` + `onChange`) or uncontrolled (`defaultTargetIds`).

## Imperative handle

`SmartTransferListHandle` (via `ref`): `moveAllToTarget`/`moveAllToSource`,
`moveSelectedToTarget`/`moveSelectedToSource`, `clearSelection`, `getTargetIds`.

## Accessibility

Each list is an ARIA `listbox`; each row is an `option` on the `<li>` itself (no
nested interactive controls), with roving-tab keyboard support (Enter/Space to
toggle, double-activate to move).

## Escape hatches

- `renderItem(item, side)` for a custom row body (icon/checkbox/layout stay
  managed).
- Pure move/partition/filter helpers live in `transfer-utils.ts`.

## Gotchas

- Disabled items are skipped by move-all.

## Demo

`/smart/transfer-list`.
