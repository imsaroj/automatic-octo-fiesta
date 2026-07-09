"use client"

import * as React from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartPageFooterProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Render a top border separating the footer from the content / status bar.
   * @default true
   */
  border?: boolean
  /**
   * Horizontal alignment of footer children.
   * @default "end"
   */
  justify?: "start" | "center" | "end" | "between"
}

const JUSTIFY_CLASSES: Record<
  NonNullable<SmartPageFooterProps["justify"]>,
  string
> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
}

/**
 * Footer action bar pinned at the bottom of the page.
 *
 * Hosts primary and secondary actions that apply to the page as a whole:
 * form submit / cancel buttons, wizard navigation controls, bulk-action
 * buttons, or pagination controls.
 *
 * ## Stickiness
 * Controlled by `stickyFooter` on SmartPage (default `true` for `"grid"` and
 * `"wizard"` layouts). In `"grid"` scroll mode the footer sits below the scroll
 * container, making it always visible without `position: sticky`.
 *
 * ## Layout
 * Uses `justify` to align children. Common patterns:
 * - `"end"` — submit/cancel buttons (default)
 * - `"between"` — back/next buttons in wizard steps
 * - `"start"` — status text + trailing actions
 *
 * @example Wizard footer
 * ```tsx
 * <SmartPageFooter justify="between">
 *   <Button variant="outline" onClick={prev}>Back</Button>
 *   <Button onClick={next}>Next</Button>
 * </SmartPageFooter>
 * ```
 *
 * @example Form footer
 * ```tsx
 * <SmartPageFooter>
 *   <Button variant="ghost" onClick={cancel}>Cancel</Button>
 *   <Button type="submit" form="settings-form">Save changes</Button>
 * </SmartPageFooter>
 * ```
 */
export const SmartPageFooter = React.forwardRef<
  HTMLElement,
  SmartPageFooterProps
>(({ border = true, justify = "end", className, children, ...props }, ref) => (
  <footer
    ref={ref}
    data-slot="page-footer"
    className={cn(
      "flex shrink-0 items-center gap-2 px-6 py-3",
      JUSTIFY_CLASSES[justify],
      border && "border-t",
      className
    )}
    {...props}
  >
    {children}
  </footer>
))
;(SmartPageFooter as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "footer"
