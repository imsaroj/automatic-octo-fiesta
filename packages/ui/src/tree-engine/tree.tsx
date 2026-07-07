"use client"

import * as React from "react"
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  CheckIcon,
  MinusIcon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type {
  TreeNode,
  TreeNodeState,
  TreeSelectionMode,
  TreeSide,
  TreeSize,
  TreeFilterMode,
  TreeDropPosition,
  TreeDropTarget,
  SmartTreeHandle,
} from "./types"
import {
  buildNodeMap,
  buildParentMap,
  computeCheckState,
  computeMatches,
  defaultMatch,
  flattenVisible,
  getAllFolderIds,
  getAllIds,
  getLeafIds,
  isDescendantOf,
  isFolderNode,
  moveNode,
  type FlatNode,
} from "./tree-utils"
import { useIdSet } from "./use-tree"

// ── Size tokens ────────────────────────────────────────────────────────────

const SIZE: Record<
  TreeSize,
  { row: string; icon: string; text: string; check: string }
> = {
  sm: { row: "h-7", icon: "size-3.5", text: "text-xs", check: "size-3.5" },
  md: { row: "h-8", icon: "size-4", text: "text-sm", check: "size-4" },
  lg: { row: "h-9", icon: "size-5", text: "text-[15px]", check: "size-4" },
}

export interface SmartTreeProps<T = unknown> {
  /** The nodes to render. */
  data: TreeNode<T>[]

  // ── Expansion ──
  /** Controlled expanded folder ids. */
  expandedIds?: string[]
  /** Uncontrolled initial expanded folder ids. */
  defaultExpandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  /** Expand every folder on first render (uncontrolled only). */
  defaultExpandAll?: boolean
  /** Expand a folder when its label (not just the caret) is clicked. */
  expandOnLabelClick?: boolean

  // ── Selection ──
  /** `none` | `single` | `multiple`. @default "single" */
  selectionMode?: TreeSelectionMode
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectedChange?: (ids: string[]) => void
  /** Fired on any row activation with the node payload. */
  onNodeClick?: (node: TreeNode<T>) => void
  /** Allow selecting folder rows too (default: folders select normally). */
  selectableFolders?: boolean

  // ── Checkboxes ──
  /** Render selection checkboxes. */
  checkable?: boolean
  checkboxSide?: TreeSide
  checkedIds?: string[]
  defaultCheckedIds?: string[]
  onCheckedChange?: (ids: string[]) => void
  /** Cascade checks to descendants and reflect indeterminate on ancestors. */
  cascadeChecks?: boolean
  /** Let folder rows be checked directly (stores the folder id). */
  canCheckFolders?: boolean

  // ── Icons & carets ──
  /** Show leading icons. @default true */
  showIcons?: boolean
  /** Resolve a custom icon per node. Overrides defaults but not `node.icon`. */
  getIcon?: (node: TreeNode<T>, state: TreeNodeState) => React.ReactNode
  /** Which side the expand caret sits on. @default "left" */
  caretSide?: TreeSide
  /** Hide the caret entirely (rows still expand via click/keyboard). */
  hideCaret?: boolean

  // ── Layout ──
  /** Pixels of indentation per depth level. @default 20 */
  indent?: number
  /** Draw vertical guide lines connecting nested rows. */
  showLines?: boolean
  size?: TreeSize
  /** Zebra-stripe rows. */
  striped?: boolean

  // ── Search / filter ──
  /** Active query string. */
  searchQuery?: string
  /** What the query does to the tree. @default "highlight" */
  filterMode?: TreeFilterMode
  /** Custom match predicate (defaults to case-insensitive label substring). */
  matchNode?: (node: TreeNode<T>, query: string) => boolean

  // ── Rename ──
  /** Enable inline rename (double-click or F2). */
  renamable?: boolean
  onRename?: (node: TreeNode<T>, nextLabel: string) => void

  // ── Drag & drop ──
  /** Enable HTML5 drag-and-drop reordering. */
  draggable?: boolean
  /** Fired after a valid drop; you own the data, so apply the move. */
  onMove?: (
    node: TreeNode<T>,
    target: TreeDropTarget,
    /** `data` with the move already applied — convenient for controlled data. */
    nextData: TreeNode<T>[]
  ) => void
  /** Veto a drop before it fires `onMove`. */
  canDrop?: (dragNode: TreeNode<T>, target: TreeDropTarget) => boolean

  // ── Render hooks ──
  /** Fully replace label rendering. */
  renderLabel?: (node: TreeNode<T>, state: TreeNodeState) => React.ReactNode
  /** Shown when `data` is empty (or everything is filtered out). */
  emptyState?: React.ReactNode

  className?: string
  style?: React.CSSProperties
  /** Accessible label for the tree. */
  "aria-label"?: string
}

/** Split a plain-text label on the query so matches can be emphasized. */
function highlight(label: React.ReactNode, query: string): React.ReactNode {
  if (!query || (typeof label !== "string" && typeof label !== "number")) {
    return label
  }
  const text = String(label)
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return label
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-yellow-200 text-inherit dark:bg-yellow-500/40">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ── Inline tri-state checkbox ──────────────────────────────────────────────

const TreeCheckbox = ({
  checked,
  indeterminate,
  disabled,
  size,
  onToggle,
}: {
  checked: boolean
  indeterminate: boolean
  disabled?: boolean
  size: string
  onToggle: () => void
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    tabIndex={-1}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation()
      onToggle()
    }}
    className={cn(
      "flex shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
      (checked || indeterminate) &&
        "border-primary bg-primary text-primary-foreground",
      size
    )}
  >
    {indeterminate ? (
      <MinusIcon className="size-3" />
    ) : checked ? (
      <CheckIcon className="size-3" />
    ) : null}
  </button>
)

// ── Component ──────────────────────────────────────────────────────────────

function SmartTreeInner<T>(
  props: SmartTreeProps<T>,
  ref: React.Ref<SmartTreeHandle>
) {
  const {
    data,
    expandedIds,
    defaultExpandedIds,
    onExpandedChange,
    defaultExpandAll,
    expandOnLabelClick,
    selectionMode = "single",
    selectedIds,
    defaultSelectedIds,
    onSelectedChange,
    onNodeClick,
    selectableFolders = true,
    checkable = false,
    checkboxSide = "left",
    checkedIds,
    defaultCheckedIds,
    onCheckedChange,
    cascadeChecks = true,
    canCheckFolders = false,
    showIcons = true,
    getIcon,
    caretSide = "left",
    hideCaret = false,
    indent = 20,
    showLines = false,
    size = "md",
    striped = false,
    searchQuery = "",
    filterMode = "highlight",
    matchNode,
    renamable = false,
    onRename,
    draggable = false,
    onMove,
    canDrop,
    renderLabel,
    emptyState,
    className,
    style,
  } = props

  const sizes = SIZE[size]

  // ── Derived maps ──
  const nodeMap = React.useMemo(() => buildNodeMap(data), [data])
  const parentMap = React.useMemo(() => buildParentMap(data), [data])

  // ── State (controlled or not) ──
  const [expanded, setExpanded] = useIdSet(
    expandedIds,
    defaultExpandAll ? getAllFolderIds(data) : defaultExpandedIds,
    onExpandedChange
  )
  const [selected, setSelected] = useIdSet(
    selectedIds,
    defaultSelectedIds,
    onSelectedChange
  )
  const [checkedLeaves, setCheckedLeaves] = useIdSet(
    checkedIds,
    defaultCheckedIds,
    onCheckedChange
  )

  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<{
    id: string
    position: TreeDropPosition
  } | null>(null)

  const anchorRef = React.useRef<string | null>(null)
  const rowRefs = React.useRef(new Map<string, HTMLDivElement>())
  const dragIdRef = React.useRef<string | null>(null)

  // ── Search ──
  const activeQuery = filterMode === "none" ? "" : searchQuery.trim()
  const match = matchNode ?? defaultMatch
  const { matched, visible } = React.useMemo(
    () =>
      activeQuery
        ? computeMatches(data, activeQuery, match as never)
        : { matched: new Set<string>(), visible: new Set<string>() },
    [data, activeQuery, match]
  )
  const filtering = activeQuery.length > 0 && filterMode === "filter"

  // ── Check state cascade ──
  const checkState = React.useMemo(
    () =>
      cascadeChecks
        ? computeCheckState(data, checkedLeaves, canCheckFolders)
        : { checked: checkedLeaves, indeterminate: new Set<string>() },
    [data, checkedLeaves, cascadeChecks, canCheckFolders]
  )

  // ── Flatten to visible rows ──
  const flat = React.useMemo(
    () =>
      flattenVisible(data, expanded, {
        visibleIds: filtering ? visible : undefined,
        forceExpandForFilter: filtering,
      }),
    [data, expanded, filtering, visible]
  )
  const flatIds = React.useMemo(() => flat.map((f) => f.node.id), [flat])

  // ── Helpers ──
  const toggleExpand = React.useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [setExpanded]
  )

  const focusNode = React.useCallback((id: string) => {
    setFocusedId(id)
    rowRefs.current.get(id)?.focus()
  }, [])

  const commitSelection = React.useCallback(
    (node: TreeNode<T>, e?: React.MouseEvent) => {
      if (selectionMode === "none") return
      const isFolder = isFolderNode(node)
      if (node.selectable === false) return
      if (isFolder && !selectableFolders) return

      if (selectionMode === "single") {
        setSelected(new Set([node.id]))
        anchorRef.current = node.id
        return
      }
      // multiple
      const additive = e?.metaKey || e?.ctrlKey
      const range = e?.shiftKey
      if (range && anchorRef.current) {
        const from = flatIds.indexOf(anchorRef.current)
        const to = flatIds.indexOf(node.id)
        if (from !== -1 && to !== -1) {
          const [lo, hi] = from < to ? [from, to] : [to, from]
          setSelected(new Set(flatIds.slice(lo, hi + 1)))
          return
        }
      }
      if (additive) {
        setSelected((prev) => {
          const next = new Set(prev)
          if (next.has(node.id)) next.delete(node.id)
          else next.add(node.id)
          return next
        })
        anchorRef.current = node.id
        return
      }
      setSelected(new Set([node.id]))
      anchorRef.current = node.id
    },
    [selectionMode, selectableFolders, flatIds, setSelected]
  )

  const toggleCheck = React.useCallback(
    (node: TreeNode<T>) => {
      if (node.checkable === false || node.disabled) return
      const isFolder = isFolderNode(node)
      const currentlyChecked = checkState.checked.has(node.id)
      const nextChecked = checkState.indeterminate.has(node.id)
        ? true
        : !currentlyChecked

      setCheckedLeaves((prev) => {
        const next = new Set(prev)
        if (cascadeChecks && isFolder) {
          const leaves = getLeafIds([node])
          for (const leaf of leaves) {
            if (nextChecked) next.add(leaf)
            else next.delete(leaf)
          }
          if (canCheckFolders) {
            if (nextChecked) next.add(node.id)
            else next.delete(node.id)
          }
        } else {
          if (nextChecked) next.add(node.id)
          else next.delete(node.id)
        }
        return next
      })
    },
    [checkState, cascadeChecks, canCheckFolders, setCheckedLeaves]
  )

  const beginRename = React.useCallback(
    (id: string) => {
      if (!renamable) return
      setRenamingId(id)
    },
    [renamable]
  )

  const activate = React.useCallback(
    (node: TreeNode<T>, e?: React.MouseEvent) => {
      if (node.disabled) return
      onNodeClick?.(node)
      const isFolder = isFolderNode(node)
      if (isFolder && expandOnLabelClick) toggleExpand(node.id)
      commitSelection(node, e)
    },
    [onNodeClick, expandOnLabelClick, toggleExpand, commitSelection]
  )

  // ── Imperative handle ──
  React.useImperativeHandle(
    ref,
    () => ({
      expandAll: () => setExpanded(new Set(getAllFolderIds(data))),
      collapseAll: () => setExpanded(new Set()),
      expand: (id) => setExpanded((p) => new Set(p).add(id)),
      collapse: (id) =>
        setExpanded((p) => {
          const n = new Set(p)
          n.delete(id)
          return n
        }),
      toggle: toggleExpand,
      selectAll: () => setSelected(new Set(getAllIds(data))),
      clearSelection: () => setSelected(new Set()),
      checkAll: () => setCheckedLeaves(new Set(getLeafIds(data))),
      clearChecked: () => setCheckedLeaves(new Set()),
      focusNode,
      startRename: beginRename,
      getExpandedIds: () => [...expanded],
      getSelectedIds: () => [...selected],
      getCheckedIds: () => [...checkState.checked],
    }),
    [
      data,
      expanded,
      selected,
      checkState,
      setExpanded,
      setSelected,
      setCheckedLeaves,
      toggleExpand,
      focusNode,
      beginRename,
    ]
  )

  // ── Keyboard nav ──
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (renamingId) return
    const id = focusedId
    if (!id && e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const index = id ? flatIds.indexOf(id) : -1
    const node = id ? nodeMap.get(id) : undefined
    const row = flat[index]

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault()
        const next =
          flatIds[Math.min(index + 1, flatIds.length - 1)] ?? flatIds[0]
        if (next) focusNode(next)
        break
      }
      case "ArrowUp": {
        e.preventDefault()
        const prev =
          flatIds[Math.max(index - 1, 0)] ?? flatIds[flatIds.length - 1]
        if (prev) focusNode(prev)
        break
      }
      case "ArrowRight": {
        if (!node || !row) break
        e.preventDefault()
        if (row.isFolder && !expanded.has(id!)) toggleExpand(id!)
        else if (row.isFolder) {
          const child = flatIds[index + 1]
          if (child) focusNode(child)
        }
        break
      }
      case "ArrowLeft": {
        if (!row) break
        e.preventDefault()
        if (row.isFolder && expanded.has(id!)) toggleExpand(id!)
        else if (row.parentId) focusNode(row.parentId)
        break
      }
      case "Home":
        e.preventDefault()
        if (flatIds[0]) focusNode(flatIds[0])
        break
      case "End":
        e.preventDefault()
        if (flatIds.length) focusNode(flatIds[flatIds.length - 1])
        break
      case "Enter":
        if (node) {
          e.preventDefault()
          activate(node)
        }
        break
      case " ":
        if (node) {
          e.preventDefault()
          if (checkable) toggleCheck(node)
          else activate(node)
        }
        break
      case "F2":
        if (id && renamable) {
          e.preventDefault()
          beginRename(id)
        }
        break
      case "a":
        if ((e.metaKey || e.ctrlKey) && selectionMode === "multiple") {
          e.preventDefault()
          setSelected(new Set(flatIds))
        }
        break
    }
  }

  // ── Drag & drop ──
  const clearDrag = () => {
    dragIdRef.current = null
    setDropTarget(null)
  }

  const onRowDrop = () => {
    const dragId = dragIdRef.current
    if (!dragId || !dropTarget) return clearDrag()
    const dragNode = nodeMap.get(dragId)
    if (!dragNode) return clearDrag()
    const target: TreeDropTarget = {
      targetId: dropTarget.id,
      position: dropTarget.position,
    }
    // Guard: never drop onto self or a descendant.
    if (
      dragId === target.targetId ||
      isDescendantOf(target.targetId, dragId, parentMap)
    ) {
      return clearDrag()
    }
    if (canDrop && !canDrop(dragNode as TreeNode<T>, target)) return clearDrag()
    const nextData = moveNode(data, dragId, target)
    onMove?.(dragNode as TreeNode<T>, target, nextData)
    clearDrag()
  }

  const isEmpty = flat.length === 0

  return (
    <div
      role="tree"
      tabIndex={-1}
      aria-label={props["aria-label"]}
      aria-multiselectable={selectionMode === "multiple" || undefined}
      onKeyDown={onKeyDown}
      className={cn("select-none", sizes.text, className)}
      style={style}
    >
      {isEmpty ? (
        <div className="px-3 py-6 text-center text-muted-foreground">
          {emptyState ?? (activeQuery ? "No matches." : "Nothing here yet.")}
        </div>
      ) : (
        flat.map((row, rowIndex) => (
          <TreeRow
            key={row.node.id}
            row={row}
            rowIndex={rowIndex}
            sizes={sizes}
            indent={indent}
            showLines={showLines}
            striped={striped}
            showIcons={showIcons}
            getIcon={getIcon}
            caretSide={caretSide}
            hideCaret={hideCaret}
            checkable={checkable}
            checkboxSide={checkboxSide}
            canCheckFolders={canCheckFolders}
            expanded={expanded.has(row.node.id)}
            selected={selected.has(row.node.id)}
            checked={checkState.checked.has(row.node.id)}
            indeterminate={checkState.indeterminate.has(row.node.id)}
            focused={focusedId === row.node.id}
            matched={matched.has(row.node.id)}
            query={filterMode === "highlight" ? activeQuery : ""}
            renaming={renamingId === row.node.id}
            renderLabel={renderLabel as never}
            draggable={draggable}
            dropIndicator={
              dropTarget?.id === row.node.id ? dropTarget.position : null
            }
            registerRef={(el) => {
              if (el) rowRefs.current.set(row.node.id, el)
              else rowRefs.current.delete(row.node.id)
            }}
            onCaretClick={() => toggleExpand(row.node.id)}
            onActivate={(e) => activate(row.node as TreeNode<T>, e)}
            onDoubleClick={() => {
              if (renamable) beginRename(row.node.id)
              else if (row.isFolder) toggleExpand(row.node.id)
            }}
            onToggleCheck={() => toggleCheck(row.node as TreeNode<T>)}
            onFocusRow={() => setFocusedId(row.node.id)}
            onRenameCommit={(value) => {
              setRenamingId(null)
              const trimmed = value.trim()
              if (trimmed) onRename?.(row.node as TreeNode<T>, trimmed)
            }}
            onRenameCancel={() => setRenamingId(null)}
            onDragStart={() => {
              dragIdRef.current = row.node.id
            }}
            onDragOverRow={(position) =>
              setDropTarget({ id: row.node.id, position })
            }
            onDropRow={onRowDrop}
            onDragEnd={clearDrag}
          />
        ))
      )}
    </div>
  )
}

// ── Row ────────────────────────────────────────────────────────────────────

interface TreeRowProps<T> {
  row: FlatNode<T>
  rowIndex: number
  sizes: (typeof SIZE)[TreeSize]
  indent: number
  showLines: boolean
  striped: boolean
  showIcons: boolean
  getIcon?: (node: TreeNode<T>, state: TreeNodeState) => React.ReactNode
  caretSide: TreeSide
  hideCaret: boolean
  checkable: boolean
  checkboxSide: TreeSide
  canCheckFolders: boolean
  expanded: boolean
  selected: boolean
  checked: boolean
  indeterminate: boolean
  focused: boolean
  matched: boolean
  query: string
  renaming: boolean
  renderLabel?: (node: TreeNode<T>, state: TreeNodeState) => React.ReactNode
  draggable: boolean
  dropIndicator: TreeDropPosition | null
  registerRef: (el: HTMLDivElement | null) => void
  onCaretClick: () => void
  onActivate: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onToggleCheck: () => void
  onFocusRow: () => void
  onRenameCommit: (value: string) => void
  onRenameCancel: () => void
  onDragStart: () => void
  onDragOverRow: (position: TreeDropPosition) => void
  onDropRow: () => void
  onDragEnd: () => void
}

function TreeRow<T>({
  row,
  rowIndex,
  sizes,
  indent,
  showLines,
  striped,
  showIcons,
  getIcon,
  caretSide,
  hideCaret,
  checkable,
  checkboxSide,
  canCheckFolders,
  expanded,
  selected,
  checked,
  indeterminate,
  focused,
  matched,
  query,
  renaming,
  renderLabel,
  draggable,
  dropIndicator,
  registerRef,
  onCaretClick,
  onActivate,
  onDoubleClick,
  onToggleCheck,
  onFocusRow,
  onRenameCommit,
  onRenameCancel,
  onDragStart,
  onDragOverRow,
  onDropRow,
  onDragEnd,
}: TreeRowProps<T>) {
  const { node, level, isFolder } = row
  const state: TreeNodeState = {
    level,
    expanded,
    selected,
    checked,
    indeterminate,
    focused,
    isFolder,
    disabled: Boolean(node.disabled),
    matched,
  }

  const canDrag = draggable && node.draggable !== false && !node.disabled

  const caret =
    !hideCaret && isFolder ? (
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => {
          e.stopPropagation()
          onCaretClick()
        }}
        className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      >
        <ChevronRightIcon
          className={cn(
            "size-3.5 transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>
    ) : (
      <span className="size-4 shrink-0" aria-hidden />
    )

  const resolvedIcon = showIcons
    ? (node.icon ??
      getIcon?.(node, state) ??
      (isFolder ? (
        expanded ? (
          <FolderOpenIcon className={cn(sizes.icon, "text-muted-foreground")} />
        ) : (
          <FolderIcon className={cn(sizes.icon, "text-muted-foreground")} />
        )
      ) : (
        <FileIcon className={cn(sizes.icon, "text-muted-foreground")} />
      )))
    : null

  const checkbox =
    checkable &&
    node.checkable !== false &&
    (isFolder ? canCheckFolders || row.isFolder : true) ? (
      <TreeCheckbox
        checked={checked}
        indeterminate={indeterminate}
        disabled={node.disabled}
        size={sizes.check}
        onToggle={onToggleCheck}
      />
    ) : null

  const label = renaming ? (
    <RenameInput
      initial={typeof node.label === "string" ? node.label : ""}
      className={sizes.text}
      onCommit={onRenameCommit}
      onCancel={onRenameCancel}
    />
  ) : renderLabel ? (
    renderLabel(node, state)
  ) : (
    <span className="truncate">{highlight(node.label, query)}</span>
  )

  return (
    // Keyboard is handled centrally at the tree container (roving tabindex).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      ref={registerRef}
      role="treeitem"
      aria-level={level + 1}
      aria-expanded={isFolder ? expanded : undefined}
      aria-selected={selected}
      aria-disabled={node.disabled || undefined}
      tabIndex={focused ? 0 : -1}
      draggable={canDrag || undefined}
      onFocus={onFocusRow}
      onClick={(e) => !node.disabled && !renaming && onActivate(e)}
      onDoubleClick={() => !node.disabled && onDoubleClick()}
      onDragStart={(e) => {
        if (!canDrag) return
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onDragOver={(e) => {
        if (!draggable) return
        e.preventDefault()
        const rect = e.currentTarget.getBoundingClientRect()
        const offset = (e.clientY - rect.top) / rect.height
        const position: TreeDropPosition = isFolder
          ? offset < 0.25
            ? "before"
            : offset > 0.75
              ? "after"
              : "inside"
          : offset < 0.5
            ? "before"
            : "after"
        onDragOverRow(position)
      }}
      onDrop={(e) => {
        if (!draggable) return
        e.preventDefault()
        onDropRow()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group/row relative flex items-center gap-1.5 rounded-md px-1.5",
        sizes.row,
        "cursor-pointer transition-colors",
        striped && rowIndex % 2 === 1 && "bg-muted/30",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/60",
        focused && "ring-2 ring-ring/40",
        node.disabled && "cursor-not-allowed opacity-50",
        dropIndicator === "inside" && "ring-2 ring-primary/60"
      )}
    >
      {/* Drop line indicators */}
      {dropIndicator === "before" && (
        <span className="pointer-events-none absolute inset-x-1 top-0 h-0.5 rounded-full bg-primary" />
      )}
      {dropIndicator === "after" && (
        <span className="pointer-events-none absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-primary" />
      )}

      {/* Indentation. With `showLines`, each cell draws classic file-tree
          connectors: pass-through verticals for ancestors that still have
          siblings below, plus an elbow (└) / tee (├) at the node's own column. */}
      {Array.from({ length: level }).map((_, i) => {
        const isConnector = i === level - 1
        // Pass-through column `i` belongs to the ancestor at depth `i + 1`;
        // draw its vertical only while that ancestor has a following sibling.
        const passThrough = row.ancestorHasNext[i + 1]
        return (
          <span
            key={i}
            aria-hidden
            className="relative shrink-0 self-stretch"
            style={{ width: indent }}
          >
            {showLines && isConnector && (
              <>
                {/* Vertical: top half always connects up to the parent line. */}
                <span className="absolute top-0 left-1/2 h-1/2 border-l border-muted-foreground/30" />
                {/* Vertical: bottom half only when a sibling follows (├ vs └). */}
                {!row.isLast && (
                  <span className="absolute top-1/2 left-1/2 h-1/2 border-l border-muted-foreground/30" />
                )}
                {/* Elbow reaching toward the row content. */}
                <span className="absolute top-1/2 right-1 left-1/2 border-t border-muted-foreground/30" />
              </>
            )}
            {showLines && !isConnector && passThrough && (
              <span className="absolute top-0 left-1/2 h-full border-l border-muted-foreground/30" />
            )}
          </span>
        )
      })}

      {caretSide === "left" && caret}
      {checkboxSide === "left" && checkbox}
      {resolvedIcon && <span className="flex shrink-0">{resolvedIcon}</span>}

      <span className="min-w-0 flex-1 truncate">{label}</span>

      {node.badge && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {node.badge}
        </span>
      )}
      {node.actions && (
        // Wrapper only stops row-selection when interacting with actions.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <span
          className="shrink-0 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {node.actions}
        </span>
      )}
      {checkboxSide === "right" && checkbox}
      {caretSide === "right" && caret}
    </div>
  )
}

// ── Inline rename input ────────────────────────────────────────────────────

const RenameInput = ({
  initial,
  className,
  onCommit,
  onCancel,
}: {
  initial: string
  className?: string
  onCommit: (value: string) => void
  onCancel: () => void
}) => {
  const [value, setValue] = React.useState(initial)
  return (
    <input
      // Focusing the field immediately is the point of entering rename mode.
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === "Enter") onCommit(value)
        else if (e.key === "Escape") onCancel()
      }}
      className={cn(
        "w-full min-w-0 rounded border border-input bg-background px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      )}
    />
  )
}

/**
 * SmartTree — a declarative, headless-friendly tree built on Base UI patterns.
 *
 * Data-driven: pass a `TreeNode[]` and toggle behaviors via props. Supports
 * single/multiple selection, cascading tri-state checkboxes, expand/collapse
 * (with imperative expand-all), icons, guide lines, search highlight/filter,
 * inline rename (F2 / double-click), drag-and-drop reordering, and full
 * keyboard navigation.
 *
 * ```tsx
 * <SmartTree
 *   data={nodes}
 *   selectionMode="multiple"
 *   checkable
 *   showLines
 *   searchQuery={q}
 *   filterMode="filter"
 * />
 * ```
 */
export const SmartTree = React.forwardRef(SmartTreeInner) as <T>(
  props: SmartTreeProps<T> & { ref?: React.Ref<SmartTreeHandle> }
) => React.ReactElement
