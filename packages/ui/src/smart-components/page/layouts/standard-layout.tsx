"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import type { PageContextValue, ScrollMode } from "../page-context"
import type { SlotBuckets } from "./slot-buckets"

/**
 * The default vertical layout, used for the `document`, `dashboard`, and `grid`
 * presets: optional sticky header/toolbar/search/filter band on top, a single
 * flexible main region (grid area → content → loose body, in priority order),
 * and a sticky-or-flowing status-bar/footer band on the bottom.
 *
 * Sticky positioning only applies in `page` scroll mode — in contained modes
 * (`content` / `grid`) the bands sit outside the scroll container and are
 * naturally pinned by flexbox, so pinning them again would double up.
 */
export const StandardLayout = ({
  buckets: b,
  scroll,
  ctx,
}: {
  buckets: SlotBuckets
  scroll: ScrollMode
  ctx: PageContextValue
}) => {
  const isPageScroll = scroll === "page"

  // Collect which items are sticky (page-scroll mode only — in contained modes
  // items above the scroll container are naturally "pinned" by flexbox).
  const stickyTopItems: React.ReactNode[] = []
  const flowTopItems: React.ReactNode[] = []

  const pushTop = (items: React.ReactNode[], sticky: boolean) => {
    if (!items.length) return
    if (isPageScroll && sticky) {
      stickyTopItems.push(...items)
    } else {
      flowTopItems.push(...items)
    }
  }

  pushTop(b.header, ctx.stickyHeader)
  // hero is never sticky — always scrolls away
  if (b.hero.length) flowTopItems.push(...b.hero)
  pushTop(b.toolbar, ctx.stickyToolbar)
  pushTop(b.search, ctx.stickySearch)
  pushTop(b.filters, ctx.stickyFilters)
  if (b.tabs.length) flowTopItems.push(...b.tabs)

  const stickyBottomItems: React.ReactNode[] = []
  const flowBottomItems: React.ReactNode[] = []

  if (b.statusBar.length) {
    if (isPageScroll && ctx.stickyStatusBar)
      stickyBottomItems.push(...b.statusBar)
    else flowBottomItems.push(...b.statusBar)
  }
  if (b.footer.length) {
    if (isPageScroll && ctx.stickyFooter) stickyBottomItems.push(...b.footer)
    else flowBottomItems.push(...b.footer)
  }

  const mainContent =
    b.gridArea.length > 0
      ? b.gridArea
      : b.content.length > 0
        ? b.content
        : b.body

  const mainClasses = cn(
    "flex-1",
    scroll === "content" && "min-h-0 overflow-y-auto",
    scroll === "grid" && "flex min-h-0 flex-col"
  )

  return (
    <>
      {stickyTopItems.length > 0 && (
        <div className="sticky top-0 z-10 bg-background">{stickyTopItems}</div>
      )}
      {flowTopItems}
      <div className={mainClasses}>{mainContent}</div>
      {flowBottomItems}
      {stickyBottomItems.length > 0 && (
        <div className="sticky bottom-0 z-10 bg-background">
          {stickyBottomItems}
        </div>
      )}
    </>
  )
}
