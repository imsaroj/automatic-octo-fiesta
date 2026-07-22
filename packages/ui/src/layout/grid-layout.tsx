"use client"

/**
 * The two components of the layout engine. A layout is always *two* elements —
 * a query container and the grid inside it — because a CSS grid cannot respond
 * to its own width. A host that owns its root element (SmartForm's `<form>`)
 * skips these and spreads `useGridLayout`'s props itself.
 */

import * as React from "react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"

import { GridLayoutProvider, useGridCell, useGridLayout } from "./context"
import { splitPlacement } from "./resolve"
import type { GridLayoutOptions, GridPlacement } from "./types"

export interface SmartGridLayoutProps
  extends
    GridLayoutOptions,
    Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  children?: React.ReactNode
  /** Extra classes for the inner grid element (the container takes `className`). */
  gridClassName?: string
}

/**
 * A responsive CSS Grid whose columns, gaps, and spans are all real runtime
 * values — no compiled utility classes, so any column count works — and which
 * measures **its own container**, not the viewport. Nest it freely; each level
 * becomes the query container for its own children.
 *
 * ```tsx
 * <SmartGridLayout columns={{ base: 1, md: 12 }} gap="lg">
 *   <SmartGridItem span="full"><Field /></SmartGridItem>
 *   <SmartGridItem span="1/2"><Field /></SmartGridItem>
 *   <SmartGridItem span="1/2"><Field /></SmartGridItem>
 *   <SmartGridItem span={4}><Field /></SmartGridItem>
 * </SmartGridLayout>
 * ```
 */
export const SmartGridLayout = React.forwardRef<
  HTMLDivElement,
  SmartGridLayoutProps
>(
  (
    {
      columns,
      gap,
      columnGap,
      rowGap,
      dense,
      align,
      justify,
      className,
      gridClassName,
      children,
      ...rest
    },
    ref
  ) => {
    const { containerProps, gridProps, context } = useGridLayout({
      columns,
      gap,
      columnGap,
      rowGap,
      dense,
      align,
      justify,
    })

    return (
      <div
        ref={ref}
        className={cn(containerProps.className, className)}
        {...rest}
      >
        <div
          className={cn(gridProps.className, gridClassName)}
          style={gridProps.style}
        >
          <GridLayoutProvider value={context}>{children}</GridLayoutProvider>
        </div>
      </div>
    )
  }
)
SmartGridLayout.displayName = "SmartGridLayout"

export interface SmartGridItemProps
  extends GridPlacement, React.ComponentPropsWithoutRef<"div"> {}

/**
 * One cell in a {@link SmartGridLayout}. Spans resolve against the enclosing
 * grid's column count *at each breakpoint*, so `span={6}` in a
 * `{ base: 1, md: 12 }` grid is half a row on desktop and a full row on mobile
 * with nothing extra to declare.
 */
export const SmartGridItem = React.forwardRef<
  HTMLDivElement,
  SmartGridItemProps
>((props, ref) => {
  const [placement, rest] = splitPlacement(props)
  const { className, style, children, ...domProps } = rest
  const cellStyle = useGridCell(placement)

  return (
    <div
      ref={ref}
      className={cn("sui-cell", className)}
      style={{ ...cellStyle, ...style }}
      {...domProps}
    >
      {children}
    </div>
  )
})
SmartGridItem.displayName = "SmartGridItem"
