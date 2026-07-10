import type * as React from "react"

/**
 * A single node in the tree. Generic over an arbitrary `data` payload so the
 * tree can carry domain objects (files, org units, categories…) without losing
 * type information in the callbacks.
 */
export interface TreeNode<T = unknown> {
  /** Stable, unique identifier across the whole tree. */
  id: string
  /** Text or node rendered as the row label. */
  label: React.ReactNode
  /** Child nodes. Presence (even empty `[]`) marks the node as a folder. */
  children?: TreeNode<T>[]
  /**
   * Force folder semantics without eager children — useful for lazy loading.
   * A node is treated as a folder when it has `children` or `isFolder` is set.
   */
  isFolder?: boolean
  /** Custom leading icon. Overrides the tree-level icon resolution. */
  icon?: React.ReactNode
  /** Trailing badge/count shown before the actions slot. */
  badge?: React.ReactNode
  /** Trailing actions (buttons, menus) revealed on hover/focus. */
  actions?: React.ReactNode
  /** Disable interaction (select, check, expand, drag) for this node. */
  disabled?: boolean
  /** Exclude this node from selection while still rendering it. */
  selectable?: boolean
  /** Exclude this node from checkbox toggling. */
  checkable?: boolean
  /** Prevent this node from being dragged. */
  draggable?: boolean
  /** Arbitrary payload returned in callbacks. */
  data?: T
}

export type TreeSelectionMode = "none" | "single" | "multiple"
export type TreeSide = "left" | "right"
export type TreeSize = "sm" | "md" | "lg"

/**
 * How a search query affects the tree:
 * - `highlight` — mark matches, keep every node visible.
 * - `filter` — hide non-matching branches (ancestors of a match stay visible).
 * - `none` — ignore the query.
 */
export type TreeFilterMode = "highlight" | "filter" | "none"

/** Where a drop lands relative to the target row. */
export type TreeDropPosition = "before" | "after" | "inside"

export interface TreeDropTarget {
  targetId: string
  position: TreeDropPosition
}

/** Context handed to per-node render/resolver callbacks. */
export interface TreeNodeState {
  /** Depth from the root, starting at 0. */
  level: number
  expanded: boolean
  selected: boolean
  checked: boolean
  indeterminate: boolean
  focused: boolean
  isFolder: boolean
  disabled: boolean
  /** True while this row matches the active search query. */
  matched: boolean
}

/** Imperative handle exposed via `ref`. */
export interface SmartTreeHandle {
  expandAll: () => void
  collapseAll: () => void
  expand: (id: string) => void
  collapse: (id: string) => void
  toggle: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  checkAll: () => void
  clearChecked: () => void
  /** Move DOM focus to a node's row. */
  focusNode: (id: string) => void
  /** Begin inline rename on a node (no-op unless `renamable`). */
  startRename: (id: string) => void
  getExpandedIds: () => string[]
  getSelectedIds: () => string[]
  getCheckedIds: () => string[]
}
