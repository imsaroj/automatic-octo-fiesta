"use client"

import { cn } from "@workspace/ui/lib/utils"
import type { PageContextValue, ScrollMode } from "../page-context"
import type { SlotBuckets } from "./slot-buckets"

/**
 * The `split` preset: an optional full-width header above a horizontal split of
 * a flexible main column (toolbar / search / filters / tabs / content) and a
 * fixed-width sidebar on the right, with status bar and footer below.
 */
export function SplitLayout({
  buckets: b,
  scroll,
  ctx,
}: {
  buckets: SlotBuckets
  scroll: ScrollMode
  ctx: PageContextValue
}) {
  const mainContent = b.content.length > 0 ? b.content : b.body
  const mainClasses = cn(
    "min-w-0 flex-1",
    scroll === "content" && "min-h-0 overflow-y-auto"
  )

  return (
    <>
      {b.header.length > 0 && (
        <div
          className={cn(ctx.stickyHeader && scroll !== "page" && "shrink-0")}
        >
          {b.header}
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className={mainClasses}>
          {b.toolbar}
          {b.search}
          {b.filters}
          {b.tabs}
          {mainContent}
        </div>
        {b.sidebar.length > 0 && (
          <div className="shrink-0 overflow-y-auto border-l">{b.sidebar}</div>
        )}
      </div>
      {b.statusBar}
      {b.footer}
    </>
  )
}
