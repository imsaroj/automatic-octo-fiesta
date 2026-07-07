import type { TransferItem } from "./types"

/**
 * Text used to match an item against a search query. Prefers an explicit
 * `searchText`, then a string `label`, and finally the `id` so every item is at
 * least searchable by key.
 */
export function getItemText(item: TransferItem): string {
  if (item.searchText != null) return item.searchText
  if (typeof item.label === "string") return item.label
  if (typeof item.label === "number") return String(item.label)
  return item.id
}

/** Whether an item matches a (case-insensitive, trimmed) query. */
export function matchesQuery(item: TransferItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return getItemText(item).toLowerCase().includes(q)
}

/** Filter items by query; an empty query returns the input array unchanged. */
export function filterItems<T>(
  items: TransferItem<T>[],
  query: string
): TransferItem<T>[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((it) => getItemText(it).toLowerCase().includes(q))
}

/**
 * Split all items into the source (available) and target (selected) lists.
 *
 * The source list always follows the canonical `items` order. The target list
 * follows the `targetIds` order when `preserveTargetOrder` is true (i.e. the
 * order items were moved across), otherwise it follows the canonical order.
 * Ids in `targetIds` that no longer exist in `items` are dropped.
 */
export function partitionItems<T>(
  items: TransferItem<T>[],
  targetIds: readonly string[],
  preserveTargetOrder = true
): { source: TransferItem<T>[]; target: TransferItem<T>[] } {
  const targetSet = new Set(targetIds)
  const byId = new Map(items.map((it) => [it.id, it] as const))
  const source = items.filter((it) => !targetSet.has(it.id))
  const target = preserveTargetOrder
    ? targetIds
        .map((id) => byId.get(id))
        .filter((it): it is TransferItem<T> => it != null)
    : items.filter((it) => targetSet.has(it.id))
  return { source, target }
}

/** Append ids to the target list, preserving order and de-duplicating. */
export function addToTarget(
  targetIds: readonly string[],
  ids: readonly string[]
): string[] {
  const seen = new Set(targetIds)
  const next = [...targetIds]
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id)
      next.push(id)
    }
  }
  return next
}

/** Remove ids from the target list, keeping the remaining order intact. */
export function removeFromTarget(
  targetIds: readonly string[],
  ids: readonly string[]
): string[] {
  const remove = new Set(ids)
  return targetIds.filter((id) => !remove.has(id))
}

/** Ids of items that are allowed to move (i.e. not disabled). */
export function movableIds(items: TransferItem[]): string[] {
  return items.filter((it) => !it.disabled).map((it) => it.id)
}
