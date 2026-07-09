"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { usePageContext } from "./page-context"
import { SMART_PAGE_SLOT } from "./smart-page"

const WIDTH_CLASSES = {
  xs: "w-48",
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
  xl: "w-[28rem]",
} as const

export interface SmartSidebarProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Width of the sidebar panel.
   * @default "md"
   */
  width?: keyof typeof WIDTH_CLASSES
  /**
   * Which side of the content area the sidebar appears on.
   * @default "right"
   */
  position?: "left" | "right"
  /**
   * Render a border on the edge adjacent to the main content.
   * @default true
   */
  border?: boolean
  /**
   * Optional title rendered at the top of the sidebar with consistent padding.
   */
  title?: string
  /**
   * Internal padding.
   * @default true
   */
  padding?: boolean
}

/**
 * Vertical side panel for split-layout pages.
 *
 * Placing a SmartSidebar as a direct child of {@link SmartPage} causes
 * auto-detection of the `"split"` layout, where the main content area and
 * sidebar appear side by side.
 *
 * The sidebar scrolls independently — it has its own `overflow-y-auto` so
 * long content doesn't interfere with the main content scroll area.
 *
 * ## Width
 * Use the `width` token for standard sizes. For custom widths, pass a
 * `className` with a `w-[...]` value.
 *
 * ## Position
 * `"right"` (default) renders a `border-l`; `"left"` renders a `border-r`.
 *
 * @example Detail page with right sidebar
 * ```tsx
 * <SmartPage layout="split">
 *   <SmartPageHeader>
 *     <SmartPageTitle>Issue #1234</SmartPageTitle>
 *   </SmartPageHeader>
 *   <SmartPageContent padding="md">
 *     <IssueDescription />
 *     <CommentThread />
 *   </SmartPageContent>
 *   <SmartSidebar width="sm" title="Details">
 *     <IssueMetadata />
 *   </SmartSidebar>
 * </SmartPage>
 * ```
 */
export const SmartSidebar = React.forwardRef<HTMLElement, SmartSidebarProps>(
  (
    {
      width = "md",
      position = "right",
      border = true,
      title,
      padding = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { scroll } = usePageContext()
    const isContained = scroll === "content" || scroll === "grid"

    return (
      <aside
        ref={ref}
        data-slot="sidebar"
        className={cn(
          "flex shrink-0 flex-col",
          WIDTH_CLASSES[width],
          isContained && "overflow-y-auto",
          position === "right" && border && "border-l",
          position === "left" && border && "border-r",
          className
        )}
        {...props}
      >
        {title && (
          <div className="shrink-0 border-b px-4 py-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {title}
            </h3>
          </div>
        )}
        <div className={cn("flex flex-1 flex-col", padding && "p-4")}>
          {children}
        </div>
      </aside>
    )
  }
)
;(SmartSidebar as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "sidebar"
