"use client"

/**
 * The hook half of the layout engine — context plus the two resolvers that turn
 * config into element props. Split out of `grid-layout.tsx` so that file exports
 * nothing but components (Fast Refresh requirement).
 */

import * as React from "react"

import {
  type ColumnCountMap,
  type CssVars,
  resolveCellStyle,
  resolveGridLayout,
} from "./resolve"
import type { GridLayoutOptions, GridPlacement } from "./types"

/**
 * Published by the nearest grid so its cells can resolve `span` against the
 * live column count. Defaults to a single-column grid, which makes a stray
 * `SmartGridItem` degrade to a plain block instead of throwing.
 */
export interface GridLayoutContextValue {
  columnCounts: ColumnCountMap
}

const GridLayoutContext = React.createContext<GridLayoutContextValue>({
  columnCounts: { base: 1 },
})

/** Read the enclosing grid's resolved column counts. */
export const useGridLayoutContext = (): GridLayoutContextValue =>
  React.useContext(GridLayoutContext)

/** Publish a grid's column counts to the cells beneath it. */
export const GridLayoutProvider = GridLayoutContext.Provider

/** The two elements a layout needs, ready to spread. */
export interface GridLayoutModel {
  /** Query container — must wrap {@link gridProps}' element. */
  containerProps: { className: string }
  /** The grid itself, carrying the resolved custom properties. */
  gridProps: { className: string; style: CssVars }
  /** Value for {@link GridLayoutProvider}, so cells can resolve their spans. */
  context: GridLayoutContextValue
}

/**
 * Resolve {@link GridLayoutOptions} into element props. Use this when you own
 * the markup (`SmartForm` puts the container class on its `<form>`); reach for
 * `SmartGridLayout` otherwise.
 */
export const useGridLayout = (options: GridLayoutOptions): GridLayoutModel => {
  const { columns, gap, columnGap, rowGap, dense, align, justify } = options

  // Layout config is almost always an inline object literal, so identity
  // changes every render. Comparing structurally is what keeps the context
  // (and therefore every cell below it) stable.
  const signature = JSON.stringify([
    columns,
    gap,
    columnGap,
    rowGap,
    dense,
    align,
    justify,
  ])

  return React.useMemo(() => {
    const { style, columnCounts } = resolveGridLayout({
      columns,
      gap,
      columnGap,
      rowGap,
      dense,
      align,
      justify,
    })
    return {
      containerProps: { className: "sui-layout" },
      gridProps: { className: "sui-grid", style },
      context: { columnCounts },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])
}

/** Resolve a cell's placement against the enclosing grid. */
export const useGridCell = (placement: GridPlacement): CssVars => {
  const { columnCounts } = useGridLayoutContext()
  const { span, colStart, rowSpan, order, newRow } = placement

  // Same structural-comparison reasoning as `useGridLayout`.
  const signature = JSON.stringify([
    span,
    colStart,
    rowSpan,
    order,
    newRow,
    columnCounts,
  ])

  return React.useMemo(
    () =>
      resolveCellStyle(
        { span, colStart, rowSpan, order, newRow },
        columnCounts
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature]
  )
}
