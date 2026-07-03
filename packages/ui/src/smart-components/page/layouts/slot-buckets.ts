import type * as React from "react"

/**
 * Children of {@link SmartPage} bucketed by their `SMART_PAGE_SLOT` tag. Built
 * once by `collectSlots` in `smart-page.tsx` and handed to the layout renderers,
 * which are the only readers — so the shape lives here, shared between them.
 */
export interface SlotBuckets {
  header: React.ReactNode[]
  hero: React.ReactNode[]
  toolbar: React.ReactNode[]
  search: React.ReactNode[]
  filters: React.ReactNode[]
  tabs: React.ReactNode[]
  content: React.ReactNode[]
  sidebar: React.ReactNode[]
  gridArea: React.ReactNode[]
  statusBar: React.ReactNode[]
  footer: React.ReactNode[]
  body: React.ReactNode[]
}
