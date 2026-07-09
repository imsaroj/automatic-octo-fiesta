"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartPageFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional label shown on the leading edge (e.g. "Filters:").
   */
  label?: React.ReactNode
  /**
   * Render a bottom border separating the filter bar from content.
   * @default true
   */
  border?: boolean
}

/**
 * Filter chip / tag bar rendered below the search input.
 *
 * Hosts active filter indicators, quick-filter toggles (status, assignee,
 * date range), and a "Clear all" action. Children are laid out in a wrapping
 * flex row so that many active filters expand gracefully.
 *
 * ## Stickiness
 * Controlled by `stickyFilters` on {@link SmartPage} (default `true` for
 * `"grid"` layout). Sits in the same sticky band as header/toolbar/search.
 *
 * @example
 * ```tsx
 * <SmartPageFilters label="Filters:">
 *   <Badge variant="secondary" className="gap-1">
 *     Status: Active <X className="size-3 cursor-pointer" onClick={clearStatus} />
 *   </Badge>
 *   <Badge variant="secondary" className="gap-1">
 *     Role: Admin <X className="size-3 cursor-pointer" onClick={clearRole} />
 *   </Badge>
 *   <Button variant="ghost" size="xs" onClick={clearAll}>Clear all</Button>
 * </SmartPageFilters>
 * ```
 */
export const SmartPageFilters = React.forwardRef<
  HTMLDivElement,
  SmartPageFiltersProps
>(({ label, border = true, className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="page-filters"
    className={cn(
      "flex shrink-0 flex-wrap items-center gap-2 px-4 py-2",
      border && "border-b",
      className
    )}
    {...props}
  >
    {label && (
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    )}
    {children}
  </div>
))
;(SmartPageFilters as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "filters"
