"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { Checkbox } from "@iamsaroj/smart-ui/components/checkbox"
import { Input } from "@iamsaroj/smart-ui/components/input"
import { Label } from "@iamsaroj/smart-ui/components/label"
import { ScrollArea } from "@iamsaroj/smart-ui/components/scroll-area"

import type {
  SmartTransferListHandle,
  TransferChangeMeta,
  TransferItem,
  TransferSide,
  TransferSize,
} from "./types"
import {
  addToTarget,
  filterItems,
  movableIds,
  partitionItems,
  removeFromTarget,
} from "./transfer-utils"

const SIZE: Record<
  TransferSize,
  { row: string; text: string; icon: string; header: string }
> = {
  sm: {
    row: "px-2 py-1 gap-2",
    text: "text-xs",
    icon: "size-3.5",
    header: "text-xs",
  },
  md: {
    row: "px-2.5 py-1.5 gap-2.5",
    text: "text-sm",
    icon: "size-4",
    header: "text-sm",
  },
  lg: {
    row: "px-3 py-2 gap-3",
    text: "text-sm",
    icon: "size-5",
    header: "text-sm",
  },
}

export interface SmartTransferListProps<T = unknown> {
  /** Every item across both lists, keyed by `id`. */
  items: TransferItem<T>[]

  /** Controlled ids currently in the target (right) list. */
  targetIds?: string[]
  /** Uncontrolled initial target ids. Ignored when `targetIds` is set. */
  defaultTargetIds?: string[]
  /** Called whenever items move, with the next target ids and what changed. */
  onChange?: (targetIds: string[], meta: TransferChangeMeta<T>) => void

  /** Heading over each list. */
  sourceTitle?: React.ReactNode
  targetTitle?: React.ReactNode

  /** Per-list search inputs. Default `true`. */
  searchable?: boolean
  sourceSearchPlaceholder?: string
  targetSearchPlaceholder?: string

  /** Show the move-all (double-chevron) buttons. Default `true`. */
  showMoveAll?: boolean

  /**
   * When `true` (default) the target keeps the order items were moved across;
   * when `false` it mirrors the canonical `items` order.
   */
  preserveTargetOrder?: boolean

  /** Show the `n / total` counts in each header. Default `true`. */
  showCount?: boolean

  /** Row density. Default `md`. */
  size?: TransferSize
  /** Height of each scrollable list. Default `16rem`. */
  listHeight?: number | string

  /** Disable the whole control. */
  disabled?: boolean

  /** Render a custom row body (icon/checkbox/layout stay tree-managed). */
  renderItem?: (item: TransferItem<T>, side: TransferSide) => React.ReactNode

  /** Placeholder shown when a list is empty. */
  sourceEmpty?: React.ReactNode
  targetEmpty?: React.ReactNode

  className?: string

  // Field wrappers ---------------------------------------------------------
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  id?: string
}

type ListPanelProps<T> = {
  side: TransferSide
  title?: React.ReactNode
  items: TransferItem<T>[]
  selected: Set<string>
  query: string
  onQueryChange: (q: string) => void
  onToggle: (id: string) => void
  onMoveOne: (id: string) => void
  onToggleAll: (checked: boolean) => void
  searchable: boolean
  searchPlaceholder?: string
  showCount: boolean
  size: TransferSize
  listHeight: number | string
  disabled: boolean
  renderItem?: (item: TransferItem<T>, side: TransferSide) => React.ReactNode
  empty?: React.ReactNode
}

function ListPanel<T>({
  side,
  title,
  items,
  selected,
  query,
  onQueryChange,
  onToggle,
  onMoveOne,
  onToggleAll,
  searchable,
  searchPlaceholder,
  showCount,
  size,
  listHeight,
  disabled,
  renderItem,
  empty,
}: ListPanelProps<T>) {
  const sz = SIZE[size]
  const visible = filterItems(items, query)
  const selectable = visible.filter((it) => !it.disabled)
  const allSelected =
    selectable.length > 0 && selectable.every((it) => selected.has(it.id))
  const someSelected = selectable.some((it) => selected.has(it.id))
  const selectedCount = items.filter((it) => selected.has(it.id)).length

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-2.5 py-1.5">
        <Checkbox
          checked={allSelected}
          indeterminate={!allSelected && someSelected}
          disabled={disabled || selectable.length === 0}
          onCheckedChange={(checked) => onToggleAll(checked === true)}
          aria-label={
            side === "source" ? "Select all available" : "Select all selected"
          }
        />
        <span className={cn("truncate font-medium", sz.header)}>
          {title ?? (side === "source" ? "Available" : "Selected")}
        </span>
        {showCount && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
            {selectedCount > 0 ? `${selectedCount} / ` : ""}
            {items.length}
          </span>
        )}
      </div>

      {searchable && (
        <div className="border-b p-1.5">
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            disabled={disabled}
            className="h-7 text-xs"
            aria-label={
              side === "source" ? "Search available" : "Search selected"
            }
          />
        </div>
      )}

      <ScrollArea style={{ height: listHeight }}>
        <ul
          role="listbox"
          aria-multiselectable
          aria-label={
            typeof title === "string"
              ? title
              : side === "source"
                ? "Available items"
                : "Selected items"
          }
          className="p-1"
        >
          {visible.length === 0 ? (
            <li
              role="presentation"
              className="px-3 py-6 text-center text-xs text-muted-foreground"
            >
              {query ? "No matches." : (empty ?? "Nothing here.")}
            </li>
          ) : (
            visible.map((item) => {
              const isSelected = selected.has(item.id)
              const itemDisabled = disabled || item.disabled === true
              return (
                // Option is the `<li>` itself (a direct child of the listbox),
                // not a nested <button> — an ARIA listbox option must not
                // contain nested interactive controls. Keyboard: the row is a
                // roving tab stop that toggles on Enter/Space and moves on
                // double-activation, mirroring the previous button semantics.
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={itemDisabled || undefined}
                  tabIndex={itemDisabled ? undefined : 0}
                  onClick={() => {
                    if (!itemDisabled) onToggle(item.id)
                  }}
                  onDoubleClick={() => {
                    if (!itemDisabled) onMoveOne(item.id)
                  }}
                  onKeyDown={(e) => {
                    if (itemDisabled) return
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onToggle(item.id)
                    }
                  }}
                  className={cn(
                    "flex w-full cursor-default items-center rounded-sm text-left transition-colors",
                    sz.row,
                    sz.text,
                    "hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none",
                    isSelected && "bg-accent hover:bg-accent",
                    itemDisabled && "pointer-events-none opacity-50"
                  )}
                >
                  {/* Visual-only checkbox — selection is conveyed by the
                      option's aria-selected, so this must not be interactive. */}
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input",
                      isSelected &&
                        "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    {isSelected && <CheckIcon className="size-3" />}
                  </span>
                  {item.icon != null && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4",
                        sz.icon
                      )}
                    >
                      {item.icon}
                    </span>
                  )}
                  {renderItem ? (
                    <span className="min-w-0 flex-1">
                      {renderItem(item, side)}
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.label}</span>
                      {item.description != null && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </span>
                  )}
                  {item.badge != null && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </ScrollArea>
    </div>
  )
}

/**
 * SmartTransferList — a dual-list "transfer" / shuttle control.
 *
 * Items live in one of two lists (source ⇄ target). Move them by clicking to
 * highlight then pressing a move button, or double-click a row to move it
 * immediately. The **target ids array is the source of truth**; use it
 * controlled (`targetIds` + `onChange`) or uncontrolled (`defaultTargetIds`).
 *
 * ```tsx
 * <SmartTransferList
 *   items={permissions}
 *   targetIds={granted}
 *   onChange={setGranted}
 *   sourceTitle="Available"
 *   targetTitle="Granted"
 * />
 * ```
 */
function SmartTransferListInner<T>(
  {
    items,
    targetIds,
    defaultTargetIds = [],
    onChange,
    sourceTitle,
    targetTitle,
    searchable = true,
    sourceSearchPlaceholder,
    targetSearchPlaceholder,
    showMoveAll = true,
    preserveTargetOrder = true,
    showCount = true,
    size = "md",
    listHeight = "16rem",
    disabled = false,
    renderItem,
    sourceEmpty,
    targetEmpty,
    className,
    label,
    description,
    error,
    required,
    id,
  }: SmartTransferListProps<T>,
  ref: React.ForwardedRef<SmartTransferListHandle>
) {
  const reactId = React.useId()
  const fieldId = id ?? reactId
  const hasHint = error != null || description != null

  const isControlled = targetIds != null
  const [internalTarget, setInternalTarget] =
    React.useState<string[]>(defaultTargetIds)
  const target = isControlled ? targetIds : internalTarget

  const [selectedSource, setSelectedSource] = React.useState<Set<string>>(
    () => new Set()
  )
  const [selectedTarget, setSelectedTarget] = React.useState<Set<string>>(
    () => new Set()
  )
  const [sourceQuery, setSourceQuery] = React.useState("")
  const [targetQuery, setTargetQuery] = React.useState("")

  const { source: sourceItems, target: targetItems } = React.useMemo(
    () => partitionItems(items, target, preserveTargetOrder),
    [items, target, preserveTargetOrder]
  )

  // Selections are only ever read for items currently on their side, and move
  // handlers drop moved ids, so a highlighted id can never leak across lists —
  // no separate pruning pass is needed.

  const commit = (next: string[], meta: TransferChangeMeta<T>) => {
    if (!isControlled) setInternalTarget(next)
    onChange?.(next, meta)
  }

  const moveToTarget = (ids: string[]) => {
    const byId = new Map(items.map((it) => [it.id, it] as const))
    const moved = ids
      .map((mid) => byId.get(mid))
      .filter((it): it is TransferItem<T> => it != null && !it.disabled)
    if (moved.length === 0) return
    const movedIds = moved.map((it) => it.id)
    commit(addToTarget(target, movedIds), {
      direction: "toTarget",
      moved,
      movedIds,
    })
    setSelectedSource((prev) => {
      const next = new Set(prev)
      for (const mid of movedIds) next.delete(mid)
      return next
    })
  }

  const moveToSource = (ids: string[]) => {
    const byId = new Map(items.map((it) => [it.id, it] as const))
    const moved = ids
      .map((mid) => byId.get(mid))
      .filter((it): it is TransferItem<T> => it != null && !it.disabled)
    if (moved.length === 0) return
    const movedIds = moved.map((it) => it.id)
    commit(removeFromTarget(target, movedIds), {
      direction: "toSource",
      moved,
      movedIds,
    })
    setSelectedTarget((prev) => {
      const next = new Set(prev)
      for (const mid of movedIds) next.delete(mid)
      return next
    })
  }

  // Move-all respects the current search filter (moves what's visible).
  const visibleSource = filterItems(sourceItems, sourceQuery)
  const visibleTarget = filterItems(targetItems, targetQuery)

  const moveSelectedToTarget = () =>
    moveToTarget(
      visibleSource.filter((it) => selectedSource.has(it.id)).map((it) => it.id)
    )
  const moveSelectedToSource = () =>
    moveToSource(
      visibleTarget.filter((it) => selectedTarget.has(it.id)).map((it) => it.id)
    )
  const moveAllToTarget = () => moveToTarget(movableIds(visibleSource))
  const moveAllToSource = () => moveToSource(movableIds(visibleTarget))

  React.useImperativeHandle(
    ref,
    (): SmartTransferListHandle => ({
      moveAllToTarget,
      moveAllToSource,
      moveSelectedToTarget,
      moveSelectedToSource,
      clearSelection: () => {
        setSelectedSource(new Set())
        setSelectedTarget(new Set())
      },
      getTargetIds: () => [...target],
    })
  )

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    (itemId: string) =>
      setter((prev) => {
        const next = new Set(prev)
        if (next.has(itemId)) next.delete(itemId)
        else next.add(itemId)
        return next
      })

  const toggleAll =
    (
      setter: React.Dispatch<React.SetStateAction<Set<string>>>,
      visible: TransferItem<T>[]
    ) =>
    (checked: boolean) =>
      setter((prev) => {
        const next = new Set(prev)
        for (const it of visible) {
          if (it.disabled) continue
          if (checked) next.add(it.id)
          else next.delete(it.id)
        }
        return next
      })

  const selectedSourceCount = visibleSource.filter((it) =>
    selectedSource.has(it.id)
  ).length
  const selectedTargetCount = visibleTarget.filter((it) =>
    selectedTarget.has(it.id)
  ).length
  const movableSourceCount = movableIds(visibleSource).length
  const movableTargetCount = movableIds(visibleTarget).length

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      id={fieldId}
    >
      {label != null && (
        <Label>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden>
              *
            </span>
          )}
        </Label>
      )}

      <div className="flex items-stretch gap-2">
        <ListPanel
          side="source"
          title={sourceTitle}
          items={sourceItems}
          selected={selectedSource}
          query={sourceQuery}
          onQueryChange={setSourceQuery}
          onToggle={toggle(setSelectedSource)}
          onMoveOne={(itemId) => moveToTarget([itemId])}
          onToggleAll={toggleAll(setSelectedSource, visibleSource)}
          searchable={searchable}
          searchPlaceholder={sourceSearchPlaceholder}
          showCount={showCount}
          size={size}
          listHeight={listHeight}
          disabled={disabled}
          renderItem={renderItem}
          empty={sourceEmpty}
        />

        <div className="flex flex-col justify-center gap-1.5">
          {showMoveAll && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              disabled={disabled || movableSourceCount === 0}
              onClick={moveAllToTarget}
              aria-label="Move all to target"
              title="Move all"
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            disabled={disabled || selectedSourceCount === 0}
            onClick={moveSelectedToTarget}
            aria-label="Move selected to target"
            title="Move selected"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            disabled={disabled || selectedTargetCount === 0}
            onClick={moveSelectedToSource}
            aria-label="Move selected to source"
            title="Move selected back"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          {showMoveAll && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              disabled={disabled || movableTargetCount === 0}
              onClick={moveAllToSource}
              aria-label="Move all to source"
              title="Move all back"
            >
              <ChevronsLeftIcon className="size-4" />
            </Button>
          )}
        </div>

        <ListPanel
          side="target"
          title={targetTitle}
          items={targetItems}
          selected={selectedTarget}
          query={targetQuery}
          onQueryChange={setTargetQuery}
          onToggle={toggle(setSelectedTarget)}
          onMoveOne={(itemId) => moveToSource([itemId])}
          onToggleAll={toggleAll(setSelectedTarget, visibleTarget)}
          searchable={searchable}
          searchPlaceholder={targetSearchPlaceholder}
          showCount={showCount}
          size={size}
          listHeight={listHeight}
          disabled={disabled}
          renderItem={renderItem}
          empty={targetEmpty}
        />
      </div>

      {hasHint && (
        <p
          className={cn(
            "text-xs",
            error != null ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  )
}

/**
 * `forwardRef` erases generics, so we cast the wrapped component back to a
 * generic-preserving signature — same pattern as `SmartServerGrid`.
 */
export const SmartTransferList = React.forwardRef(SmartTransferListInner) as <
  T = unknown,
>(
  props: SmartTransferListProps<T> & {
    ref?: React.ForwardedRef<SmartTransferListHandle>
  }
) => React.ReactElement
