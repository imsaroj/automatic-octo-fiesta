import type * as React from "react"

/**
 * A single transferable item. Lives in exactly one of the two lists (source or
 * target) at any time, keyed by its stable `id`. Generic over a `data` payload
 * so the list can carry domain objects (users, permissions, columns…) without
 * losing type information in the callbacks.
 */
export interface TransferItem<T = unknown> {
  /** Stable, unique identifier across both lists. */
  id: string
  /** Text or node rendered as the row label. */
  label: React.ReactNode
  /** Optional secondary line under the label. */
  description?: React.ReactNode
  /** Leading icon shown before the label. */
  icon?: React.ReactNode
  /** Trailing badge/count. */
  badge?: React.ReactNode
  /** Prevent this item from being selected or moved. */
  disabled?: boolean
  /**
   * Explicit text used for search matching. Falls back to the `label` when it
   * is a string, otherwise to the `id`.
   */
  searchText?: string
  /** Arbitrary payload returned in the change callback. */
  data?: T
}

/** Which of the two lists a value refers to. */
export type TransferSide = "source" | "target"

/** Row density. */
export type TransferSize = "sm" | "md" | "lg"

/** The direction items moved in a single transfer. */
export type TransferDirection = "toTarget" | "toSource"

/** Detail handed to `onChange` describing what just moved. */
export interface TransferChangeMeta<T = unknown> {
  direction: TransferDirection
  moved: TransferItem<T>[]
  movedIds: string[]
}

/** Imperative handle exposed via `ref`. */
export interface SmartTransferListHandle {
  moveAllToTarget: () => void
  moveAllToSource: () => void
  moveSelectedToTarget: () => void
  moveSelectedToSource: () => void
  /** Clear the highlighted selection in both lists. */
  clearSelection: () => void
  getTargetIds: () => string[]
}
