"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartPageSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render a bottom border separating search from content.
   * @default true
   */
  border?: boolean
}

/**
 * Search bar container rendered below the toolbar.
 *
 * Provides consistent spacing and border treatment for a search input area.
 * Compose a {@link SmartSearchInput} (or the `SmartSearch` alias) and any
 * supporting controls (clear, scope selector) inside.
 *
 * Having a SmartPageSearch as a direct child of SmartPage does NOT by itself
 * trigger a specific layout — it is combined with other slots. Pair it with
 * {@link SmartGridArea} for a CRUD layout where search sticks above the grid.
 *
 * ## Stickiness
 * Controlled by `stickySearch` on {@link SmartPage} (default: `true` for
 * `"grid"` layout). In contained scroll modes the search bar sits above the
 * scroll container and is already pinned; in `"page"` mode it joins the top
 * sticky band.
 *
 * @example
 * ```tsx
 * <SmartPageSearch>
 *   <SmartSearch
 *     value={query}
 *     onValueChange={setQuery}
 *     placeholder="Search users…"
 *     className="w-80"
 *   />
 * </SmartPageSearch>
 * ```
 */
export const SmartPageSearch = React.forwardRef<HTMLDivElement, SmartPageSearchProps>(
  function SmartPageSearch({ border = true, className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="page-search"
        className={cn(
          "shrink-0 flex items-center gap-3 px-4 py-2",
          border && "border-b",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
;(SmartPageSearch as any)[SMART_PAGE_SLOT] = "search"
