"use client"

import * as React from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartGridAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional toolbar rendered inside the grid area, above the grid itself.
   * Use this for grid-specific controls (pagination, column visibility,
   * density selector, CSV export) that shouldn't be in the page toolbar.
   */
  toolbar?: React.ReactNode
  /**
   * Render a top border between the search area and the grid.
   * Set to `false` when the parent already provides the border (e.g. the
   * search or filter bar has `border` set).
   * @default false
   */
  border?: boolean
  /**
   * Clip the grid with rounded corners.
   * @default false
   */
  rounded?: boolean
}

/**
 * Fills the remaining viewport height and hosts a virtualized data grid.
 *
 * This is the central component of any CRUD or list page. SmartGridArea solves
 * the classic "100% height grid" problem without `calc()` or `100vh`:
 *
 * 1. The parent SmartPage is `flex flex-col flex-1 min-h-0 overflow-hidden`.
 * 2. All sibling regions (header, toolbar, footer) are `shrink-0`.
 * 3. SmartGridArea is `flex-1 min-h-0` — it takes every remaining pixel.
 * 4. The grid inside is rendered inside a `flex-1 min-h-0 flex flex-col`
 *    wrapper, so any height-filling grid (AG Grid, TanStack Virtual) works.
 *
 * **Critical**: your grid component must be configured with `height: 100%` or
 * equivalent. AG Grid needs `domLayout: "normal"` (the default) and the theme
 * height set to 100%.
 *
 * ## What grid libraries work?
 * - AG Grid Community / Enterprise
 * - TanStack Table + react-virtual
 * - Any virtualized list that expands to fill its container
 *
 * ## Presence of SmartGridArea triggers auto-detection
 * When SmartGridArea is a direct child of SmartPage, the page auto-selects
 * the `"grid"` layout: header/toolbar/search/filters/footer all become sticky,
 * and the scroll mode switches to `"grid"` so no outer scrollbar appears.
 *
 * @example Basic CRUD grid
 * ```tsx
 * <SmartGridArea>
 *   <AgGridReact
 *     rowData={rows}
 *     columnDefs={cols}
 *     className="ag-theme-quartz h-full"
 *   />
 * </SmartGridArea>
 * ```
 *
 * @example With an internal toolbar
 * ```tsx
 * <SmartGridArea
 *   toolbar={
 *     <>
 *       <span className="text-xs text-muted-foreground">{rows.length} rows</span>
 *       <span className="ms-auto" />
 *       <Button size="sm" variant="outline"><Download /> Export</Button>
 *     </>
 *   }
 * >
 *   <MyGrid />
 * </SmartGridArea>
 * ```
 */
export const SmartGridArea = React.forwardRef<
  HTMLDivElement,
  SmartGridAreaProps
>(
  (
    { toolbar, border = false, rounded = false, className, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      data-slot="grid-area"
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        border && "border-t",
        rounded && "overflow-hidden rounded-lg",
        className
      )}
      {...props}
    >
      {toolbar && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-4 py-2">
          {toolbar}
        </div>
      )}
      {/* This wrapper is the grid's direct parent and must have a defined height.
            flex-1 + min-h-0 achieves this through the flex chain established
            by SmartPage → SmartGridArea → here. */}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
)
;(SmartGridArea as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "grid-area"
