"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render a bottom border separating the toolbar from page content.
   * @default true
   */
  border?: boolean
}

/**
 * Horizontal action bar rendered below the page header.
 *
 * The toolbar hosts controls that operate on the page's primary data set:
 * search inputs, filter toggles, view-density selectors, column pickers,
 * bulk action menus, and pagination controls. It is intentionally separate
 * from {@link SmartPageHeader} so header (identity) and toolbar (operations)
 * can be styled and positioned independently.
 *
 * ## Stickiness
 * When `stickyToolbar` is set on {@link SmartPage}, the toolbar sticks below
 * the header in `"page"` scroll mode (grouped in a single `sticky top-0`
 * band with the header). In `"grid"` / `"content"` modes it is above the
 * scroll container and always visible.
 *
 * ## Layout
 * Children are arranged in a flex row with a gap. Use `ms-auto` on a child
 * to push it to the trailing edge.
 *
 * @example
 * ```tsx
 * <SmartToolbar>
 *   <SmartSearch value={q} onValueChange={setQ} />
 *   <Button variant="outline" size="sm"><Filter /> Filters</Button>
 *   <span className="ms-auto" />
 *   <Button variant="ghost" size="icon"><LayoutList /></Button>
 *   <Button variant="ghost" size="icon"><LayoutGrid /></Button>
 * </SmartToolbar>
 * ```
 */
export const SmartToolbar = React.forwardRef<HTMLDivElement, SmartToolbarProps>(
  function SmartToolbar({ border = true, className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="toolbar"
        className={cn(
          "flex shrink-0 items-center gap-2 px-4 py-2",
          border && "border-b",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
;(SmartToolbar as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "toolbar"
