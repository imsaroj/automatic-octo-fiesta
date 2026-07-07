import type { TreeNode, TreeDropPosition } from "./types"

/** A node paired with the ambient info the renderer needs for one row. */
export interface FlatNode<T = unknown> {
  node: TreeNode<T>
  level: number
  /** Parent id, or `null` for a root node. */
  parentId: string | null
  isFolder: boolean
  /** For guide lines: whether an ancestor at each depth still has siblings below. */
  ancestorHasNext: boolean[]
  /** Whether this node is the last child of its parent. */
  isLast: boolean
}

/** A node has folder semantics if it declares children or opts in via `isFolder`. */
export const isFolderNode = (node: TreeNode): boolean =>
  node.isFolder === true || Array.isArray(node.children)

/** Depth-first walk over every node, parent before its children. */
export function walkTree<T>(
  nodes: TreeNode<T>[],
  visit: (node: TreeNode<T>, parentId: string | null, level: number) => void,
  parentId: string | null = null,
  level = 0
): void {
  for (const node of nodes) {
    visit(node, parentId, level)
    if (node.children?.length) {
      walkTree(node.children, visit, node.id, level + 1)
    }
  }
}

/** Every node id in the tree. */
export function getAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = []
  walkTree(nodes, (n) => ids.push(n.id))
  return ids
}

/** Ids of every folder node (things that can expand). */
export function getAllFolderIds(nodes: TreeNode[]): string[] {
  const ids: string[] = []
  walkTree(nodes, (n) => {
    if (isFolderNode(n)) ids.push(n.id)
  })
  return ids
}

/** Ids of every leaf (non-folder) node. */
export function getLeafIds(nodes: TreeNode[]): string[] {
  const ids: string[] = []
  walkTree(nodes, (n) => {
    if (!isFolderNode(n)) ids.push(n.id)
  })
  return ids
}

/** Build a `id → node` map for O(1) lookups. */
export function buildNodeMap<T>(
  nodes: TreeNode<T>[]
): Map<string, TreeNode<T>> {
  const map = new Map<string, TreeNode<T>>()
  walkTree(nodes, (n) => map.set(n.id, n))
  return map
}

/** Build a `id → parentId` map (root nodes map to `null`). */
export function buildParentMap(nodes: TreeNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>()
  walkTree(nodes, (n, parentId) => map.set(n.id, parentId))
  return map
}

/** Ancestor ids of `id`, nearest parent first. */
export function getAncestorIds(
  id: string,
  parentMap: Map<string, string | null>
): string[] {
  const out: string[] = []
  let current = parentMap.get(id) ?? null
  while (current) {
    out.push(current)
    current = parentMap.get(current) ?? null
  }
  return out
}

/** All descendant ids of a node (excluding the node itself). */
export function getDescendantIds(node: TreeNode): string[] {
  const out: string[] = []
  if (node.children?.length) {
    walkTree(node.children, (n) => out.push(n.id))
  }
  return out
}

/** Does `ancestorId` sit above `id` in the tree? Guards against self/cycle drops. */
export function isDescendantOf(
  id: string,
  ancestorId: string,
  parentMap: Map<string, string | null>
): boolean {
  let current = parentMap.get(id) ?? null
  while (current) {
    if (current === ancestorId) return true
    current = parentMap.get(current) ?? null
  }
  return false
}

const plainText = (label: unknown): string =>
  typeof label === "string" || typeof label === "number" ? String(label) : ""

/** Default matcher: case-insensitive substring over the node's text label. */
export function defaultMatch(node: TreeNode, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return plainText(node.label).toLowerCase().includes(q)
}

/**
 * Ids of nodes that either match the query themselves or have a matching
 * descendant (so ancestors of a hit stay visible when filtering).
 */
export function computeMatches(
  nodes: TreeNode[],
  query: string,
  match: (node: TreeNode, query: string) => boolean
): { matched: Set<string>; visible: Set<string> } {
  const matched = new Set<string>()
  const visible = new Set<string>()

  const visit = (node: TreeNode): boolean => {
    const selfMatch = match(node, query)
    let childMatch = false
    if (node.children?.length) {
      for (const child of node.children) {
        if (visit(child)) childMatch = true
      }
    }
    if (selfMatch) matched.add(node.id)
    if (selfMatch || childMatch) visible.add(node.id)
    return selfMatch || childMatch
  }

  nodes.forEach(visit)
  return { matched, visible }
}

/**
 * Flatten the tree into the ordered list of visible rows, honoring which
 * folders are expanded and (optionally) a filter visibility set.
 */
export function flattenVisible<T>(
  nodes: TreeNode<T>[],
  expanded: Set<string>,
  options: { visibleIds?: Set<string>; forceExpandForFilter?: boolean } = {}
): FlatNode<T>[] {
  const { visibleIds, forceExpandForFilter } = options
  const out: FlatNode<T>[] = []

  const walk = (
    list: TreeNode<T>[],
    level: number,
    parentId: string | null,
    ancestorHasNext: boolean[]
  ) => {
    const shown = visibleIds ? list.filter((n) => visibleIds.has(n.id)) : list
    shown.forEach((node, index) => {
      const isLast = index === shown.length - 1
      const folder = isFolderNode(node)
      out.push({
        node,
        level,
        parentId,
        isFolder: folder,
        ancestorHasNext,
        isLast,
      })
      const open =
        expanded.has(node.id) || (forceExpandForFilter && Boolean(visibleIds))
      if (folder && open && node.children?.length) {
        walk(node.children, level + 1, node.id, [...ancestorHasNext, !isLast])
      }
    })
  }

  walk(nodes, 0, null, [])
  return out
}

export interface CheckState {
  checked: Set<string>
  indeterminate: Set<string>
}

/**
 * Given a set of explicitly-checked ids, cascade the state through the tree:
 * a folder is checked when all its checkable leaves are checked, and
 * indeterminate when only some are. Leaves keep their own checked value.
 */
export function computeCheckState(
  nodes: TreeNode[],
  checked: Set<string>,
  canCheckFolders: boolean
): CheckState {
  const resolvedChecked = new Set<string>()
  const indeterminate = new Set<string>()

  const visit = (node: TreeNode): { total: number; on: number } => {
    if (!node.children?.length) {
      const on = checked.has(node.id)
      if (on) resolvedChecked.add(node.id)
      return { total: 1, on: on ? 1 : 0 }
    }
    let total = 0
    let on = 0
    for (const child of node.children) {
      const r = visit(child)
      total += r.total
      on += r.on
    }
    if (total > 0 && on === total) {
      if (canCheckFolders) resolvedChecked.add(node.id)
    } else if (on > 0) {
      indeterminate.add(node.id)
    }
    return { total, on }
  }

  nodes.forEach(visit)
  return { checked: resolvedChecked, indeterminate }
}

/**
 * Toggle a node's checked state with parent/child cascade. Returns the next set
 * of *leaf* checked ids (folders are derived, never stored).
 */
export function toggleChecked(
  node: TreeNode,
  nextChecked: boolean,
  current: Set<string>,
  canCheckFolders: boolean
): Set<string> {
  const next = new Set(current)
  const apply = (n: TreeNode) => {
    const isLeaf = !n.children?.length
    if (n.checkable !== false && (isLeaf || canCheckFolders)) {
      if (nextChecked) next.add(n.id)
      else next.delete(n.id)
    }
    n.children?.forEach(apply)
  }
  apply(node)
  return next
}

/** Immutably move a node to a new position relative to a target. */
export function moveNode<T>(
  nodes: TreeNode<T>[],
  dragId: string,
  target: { targetId: string; position: TreeDropPosition }
): TreeNode<T>[] {
  let dragged: TreeNode<T> | null = null

  // 1. Remove the dragged node, remembering it.
  const remove = (list: TreeNode<T>[]): TreeNode<T>[] =>
    list
      .filter((n) => {
        if (n.id === dragId) {
          dragged = n
          return false
        }
        return true
      })
      .map((n) => (n.children ? { ...n, children: remove(n.children) } : n))

  const pruned = remove(nodes)
  if (!dragged) return nodes

  // 2. Re-insert at the target.
  const insert = (list: TreeNode<T>[]): TreeNode<T>[] => {
    const result: TreeNode<T>[] = []
    for (const n of list) {
      if (n.id === target.targetId && target.position === "before") {
        result.push(dragged as TreeNode<T>)
      }
      if (n.id === target.targetId && target.position === "inside") {
        result.push({
          ...n,
          children: [...(n.children ?? []), dragged as TreeNode<T>],
        })
        continue
      }
      result.push(n.children ? { ...n, children: insert(n.children) } : n)
      if (n.id === target.targetId && target.position === "after") {
        result.push(dragged as TreeNode<T>)
      }
    }
    return result
  }

  return insert(pruned)
}
