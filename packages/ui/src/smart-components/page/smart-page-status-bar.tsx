"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartPageStatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render a top border separating the status bar from the grid / content.
   * @default true
   */
  border?: boolean
}

/**
 * Status bar pinned between the grid area and the footer.
 *
 * Shows lightweight contextual information about the primary data set:
 * total row counts, active selection counts, last-updated timestamps,
 * data quality warnings, or sync status indicators.
 *
 * ## Stickiness
 * Controlled by `stickyStatusBar` on SmartPage (default `true` for `"grid"`
 * layout). In contained modes it sits below the scroll container and is always
 * visible. In `"page"` mode it joins the bottom sticky band with the footer.
 *
 * @example
 * ```tsx
 * <SmartPageStatusBar>
 *   <span className="text-xs text-muted-foreground">
 *     {total.toLocaleString()} users — {selected} selected
 *   </span>
 *   <span className="ms-auto text-xs text-muted-foreground">
 *     Last synced 3 minutes ago
 *   </span>
 * </SmartPageStatusBar>
 * ```
 */
export const SmartPageStatusBar = React.forwardRef<
  HTMLDivElement,
  SmartPageStatusBarProps
>(({ border = true, className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="page-status-bar"
    className={cn(
      "flex shrink-0 items-center gap-4 px-4 py-1.5",
      border && "border-t",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
;(SmartPageStatusBar as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "status-bar"
