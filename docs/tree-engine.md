# Tree engine — `@iamsaroj/smart-ui/tree-engine`

## What it is

`SmartTree` — a generic, hierarchical tree / file-explorer. Generic over a
per-node `data` payload (`TreeNode<T>`). Supports selection, tri-state checkboxes,
keyboard nav, inline rename, drag-and-drop reordering, and search.

## Import

```ts
import {
  SmartTree,
  type TreeNode,
  type SmartTreeHandle,
} from "@iamsaroj/smart-ui/tree-engine"
```

## 80% example

```tsx
const data: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "index", label: "index.ts" },
      { id: "app", label: "app.tsx" },
    ],
  },
  { id: "readme", label: "README.md" },
]

<SmartTree data={data} selectionMode="multiple" checkable defaultExpandAll />
```

## Node shape

A node is a **folder** when it has `children` (even `[]`) **or** `isFolder: true`
(the latter enables lazy loading without eager children). Per-node flags
(`disabled` / `selectable` / `checkable` / `draggable`) gate each interaction.

## Key props

| Prop            | Type                                | Notes                              |
| --------------- | ----------------------------------- | ---------------------------------- |
| `data`          | `TreeNode<T>[]`                     | The nodes.                         |
| `selectionMode` | `"none" \| "single" \| "multiple"`  | Row selection.                     |
| `checkable`     | `boolean`                           | Tri-state checkboxes.              |
| `filterMode`    | `"highlight" \| "filter" \| "none"` | With `searchQuery`.                |
| `renamable`     | `boolean`                           | Inline rename (F2 / double-click). |

Each of expanded / selected / checked is independently controllable
(`*Ids` + `default*Ids` + `on*Change`) or uncontrolled — the state is **Set-backed**.

## Imperative handle

`SmartTreeHandle` (via `ref`): `expandAll`/`collapseAll`/`expand`/`collapse`/
`toggle`, `selectAll`/`clearSelection`, `checkAll`/`clearChecked`, `focusNode`,
`startRename`, and `getExpandedIds`/`getSelectedIds`/`getCheckedIds`.

## `tree-utils` recipes

Prefer the pure helpers over hand-rolled recursion: `buildNodeMap`,
`buildParentMap`, `getDescendantIds`/`getAncestorIds`, `insertNode`/`removeNode`/
`updateNode`/`moveNode`, `flattenVisible`, `computeMatches`, `walkTree`,
`computeCheckState` (derives parent indeterminate/checked from leaves).

## Gotchas

- Checking a folder cascades to all leaf descendants; checking some leaves makes
  the parent `indeterminate` (mixed).
- `filter` mode keeps the **ancestors** of matches visible so matched nodes stay
  reachable.

## Demo

`/smart/tree`, `/smart/tree-explorer` (editable, wired to a live inspector).
