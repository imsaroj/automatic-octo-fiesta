"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  PageContext,
  type PageContextValue,
  type PageLayout,
  type ScrollMode,
  type PaddingSize,
} from "./page-context"

// ─── Slot Detection ────────────────────────────────────────────────────────────

/**
 * Well-known symbol placed as a static property on every slot component.
 * SmartPage reads this to bucket children without relying on class identity,
 * which would break with HOCs or lazy imports.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const SMART_PAGE_SLOT = Symbol.for("@workspace/smart-page-slot")

export type PageSlot =
  | "header"
  | "hero"
  | "toolbar"
  | "search"
  | "filters"
  | "tabs"
  | "content"
  | "sidebar"
  | "grid-area"
  | "status-bar"
  | "footer"

interface SlotBuckets {
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

function collectSlots(children: React.ReactNode): SlotBuckets {
  const b: SlotBuckets = {
    header: [],
    hero: [],
    toolbar: [],
    search: [],
    filters: [],
    tabs: [],
    content: [],
    sidebar: [],
    gridArea: [],
    statusBar: [],
    footer: [],
    body: [],
  }
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      b.body.push(child)
      return
    }
    const slot = (child.type as unknown as Record<symbol, unknown>)[
      SMART_PAGE_SLOT
    ] as PageSlot | undefined
    switch (slot) {
      case "header":
        b.header.push(child)
        break
      case "hero":
        b.hero.push(child)
        break
      case "toolbar":
        b.toolbar.push(child)
        break
      case "search":
        b.search.push(child)
        break
      case "filters":
        b.filters.push(child)
        break
      case "tabs":
        b.tabs.push(child)
        break
      case "content":
        b.content.push(child)
        break
      case "sidebar":
        b.sidebar.push(child)
        break
      case "grid-area":
        b.gridArea.push(child)
        break
      case "status-bar":
        b.statusBar.push(child)
        break
      case "footer":
        b.footer.push(child)
        break
      default:
        b.body.push(child)
        break
    }
  })
  return b
}

function detectLayout(b: SlotBuckets): PageLayout {
  if (b.gridArea.length > 0) return "grid"
  if (b.hero.length > 0) return "dashboard"
  if (b.sidebar.length > 0) return "split"
  return "document"
}

// ─── Layout Defaults ───────────────────────────────────────────────────────────

type LayoutDefaults = Omit<
  PageContextValue,
  "layout" | "fullWidth" | "bordered"
>

const LAYOUT_DEFAULTS: Record<PageLayout, LayoutDefaults> = {
  document: {
    scroll: "page",
    padding: "md",
    stickyHeader: false,
    stickyToolbar: false,
    stickySearch: false,
    stickyFilters: false,
    stickyStatusBar: false,
    stickyFooter: false,
  },
  grid: {
    scroll: "grid",
    padding: "none",
    stickyHeader: true,
    stickyToolbar: true,
    stickySearch: true,
    stickyFilters: true,
    stickyStatusBar: true,
    stickyFooter: true,
  },
  dashboard: {
    scroll: "page",
    padding: "md",
    stickyHeader: false,
    stickyToolbar: false,
    stickySearch: false,
    stickyFilters: false,
    stickyStatusBar: false,
    stickyFooter: false,
  },
  split: {
    scroll: "content",
    padding: "none",
    stickyHeader: true,
    stickyToolbar: false,
    stickySearch: false,
    stickyFilters: false,
    stickyStatusBar: false,
    stickyFooter: false,
  },
  fullscreen: {
    scroll: "none",
    padding: "none",
    stickyHeader: false,
    stickyToolbar: false,
    stickySearch: false,
    stickyFilters: false,
    stickyStatusBar: false,
    stickyFooter: false,
  },
  wizard: {
    scroll: "content",
    padding: "md",
    stickyHeader: true,
    stickyToolbar: false,
    stickySearch: false,
    stickyFilters: false,
    stickyStatusBar: false,
    stickyFooter: true,
  },
  detail: {
    scroll: "content",
    padding: "md",
    stickyHeader: true,
    stickyToolbar: false,
    stickySearch: false,
    stickyFilters: false,
    stickyStatusBar: false,
    stickyFooter: false,
  },
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SmartPageProps {
  /**
   * Layout preset. Omit to let SmartPage auto-detect from children:
   * - `SmartGridArea` → `"grid"` (grid fills height, regions sticky)
   * - `SmartPageHero` → `"dashboard"` (natural page scroll)
   * - `SmartSidebar` → `"split"` (horizontal split)
   * - Otherwise → `"document"` (natural flow)
   */
  layout?: PageLayout

  /**
   * Override the scroll mode (derived from `layout` by default).
   *
   * - `"page"` — outer shell scrolls (default for document/dashboard)
   * - `"content"` — SmartPageContent scrolls independently
   * - `"grid"` — grid manages its own scroll (default for grid layout)
   * - `"none"` — no scroll
   */
  scroll?: ScrollMode

  /** Stick the header to the top while the page scrolls. */
  stickyHeader?: boolean
  /** Stick the toolbar below the header. */
  stickyToolbar?: boolean
  /** Stick the search bar below the toolbar. */
  stickySearch?: boolean
  /** Stick the filter bar below the search. */
  stickyFilters?: boolean
  /** Stick the status bar above the footer. */
  stickyStatusBar?: boolean
  /** Stick the footer to the bottom. */
  stickyFooter?: boolean

  /**
   * Stretch the page to fill its parent's height.
   * Auto-enabled when `scroll` is `"content"` or `"grid"`.
   */
  fullHeight?: boolean

  /** Remove max-width constraints so content spans edge to edge. */
  fullWidth?: boolean

  /**
   * Padding applied inside content areas.
   * `true` → `"md"`, `false` → `"none"`, or an explicit token.
   */
  padding?: boolean | PaddingSize

  /** Render a visible border around the page container. */
  bordered?: boolean

  /** Render a full-page loading state instead of children. */
  loading?: boolean
  /** Accessible label shown beside the loading indicator. */
  loadingLabel?: string

  /** Render an error state instead of children. Pass `<SmartPageError />` or custom content. */
  error?: React.ReactNode

  /** Render an empty state instead of children. Pass `<SmartPageEmpty />` or custom content. */
  empty?: React.ReactNode

  className?: string
  children?: React.ReactNode
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * SmartPage is the top-level layout engine for any route or view.
 *
 * It assembles seven named layout zones (header, toolbar, search, filters,
 * content / grid, status bar, footer) into one of seven layout presets, manages
 * scroll containment automatically, and broadcasts configuration to all
 * descendants via context — so child components self-style without extra props.
 *
 * ## Auto-detection
 * Drop in named slot components and SmartPage configures itself:
 * ```tsx
 * // Detected as "grid" layout — grid fills viewport, regions are sticky
 * <SmartPage>
 *   <SmartPageHeader>…</SmartPageHeader>
 *   <SmartToolbar>…</SmartToolbar>
 *   <SmartGridArea><MyDataGrid /></SmartGridArea>
 *   <SmartPageFooter>…</SmartPageFooter>
 * </SmartPage>
 * ```
 *
 * ## Scroll philosophy
 * Only one element scrolls at a time. The `scroll` prop (or its layout default)
 * decides which element that is. Nested scrollbars never appear.
 *
 * ## States
 * Pass `loading`, `error`, or `empty` to replace children with the appropriate
 * full-page state — useful for data-driven views that haven't loaded yet.
 *
 * @example Dashboard (natural page scroll, no detection needed)
 * ```tsx
 * <SmartPage layout="dashboard">
 *   <SmartPageHero>…</SmartPageHero>
 *   <SmartPageContent>
 *     <DashboardCards />
 *   </SmartPageContent>
 * </SmartPage>
 * ```
 *
 * @example Split detail (auto-detected from SmartSidebar)
 * ```tsx
 * <SmartPage>
 *   <SmartPageHeader>…</SmartPageHeader>
 *   <SmartPageContent>Main content</SmartPageContent>
 *   <SmartSidebar>Right panel</SmartSidebar>
 * </SmartPage>
 * ```
 */
export function SmartPage({
  layout: layoutProp,
  scroll: scrollProp,
  stickyHeader: stickyHeaderProp,
  stickyToolbar: stickyToolbarProp,
  stickySearch: stickySearchProp,
  stickyFilters: stickyFiltersProp,
  stickyStatusBar: stickyStatusBarProp,
  stickyFooter: stickyFooterProp,
  fullHeight: fullHeightProp,
  fullWidth = false,
  padding: paddingProp,
  bordered = false,
  loading = false,
  loadingLabel,
  error,
  empty,
  className,
  children,
}: SmartPageProps) {
  const buckets = React.useMemo(() => collectSlots(children), [children])
  const layout = layoutProp ?? detectLayout(buckets)
  const defaults = LAYOUT_DEFAULTS[layout]

  const scroll = scrollProp ?? defaults.scroll
  const stickyHeader = stickyHeaderProp ?? defaults.stickyHeader
  const stickyToolbar = stickyToolbarProp ?? defaults.stickyToolbar
  const stickySearch = stickySearchProp ?? defaults.stickySearch
  const stickyFilters = stickyFiltersProp ?? defaults.stickyFilters
  const stickyStatusBar = stickyStatusBarProp ?? defaults.stickyStatusBar
  const stickyFooter = stickyFooterProp ?? defaults.stickyFooter

  const padding: PaddingSize =
    paddingProp === true
      ? "md"
      : paddingProp === false
        ? "none"
        : (paddingProp ?? defaults.padding)

  const isContained = scroll === "content" || scroll === "grid"
  const fullHeight = fullHeightProp ?? isContained

  const ctx: PageContextValue = {
    layout,
    scroll,
    padding,
    stickyHeader,
    stickyToolbar,
    stickySearch,
    stickyFilters,
    stickyStatusBar,
    stickyFooter,
    fullWidth,
    bordered,
  }

  const pageClasses = cn(
    "flex flex-col",
    isContained && "overflow-hidden",
    fullHeight && "min-h-0 flex-1",
    !isContained && "min-h-full",
    bordered && "rounded-lg border",
    className
  )

  let content: React.ReactNode

  if (loading) {
    // Lazy-import to avoid circular deps; render inline for simplicity
    content = <PageLoadingState label={loadingLabel} />
  } else if (error) {
    content = <PageErrorState>{error}</PageErrorState>
  } else if (empty) {
    content = <PageEmptyState>{empty}</PageEmptyState>
  } else if (layout === "split") {
    content = renderSplitLayout(buckets, scroll, ctx)
  } else {
    content = renderStandardLayout(buckets, scroll, ctx)
  }

  return (
    <PageContext.Provider value={ctx}>
      <div className={pageClasses}>{content}</div>
    </PageContext.Provider>
  )
}

// ─── Layout Renderers ──────────────────────────────────────────────────────────

function renderStandardLayout(
  b: SlotBuckets,
  scroll: ScrollMode,
  ctx: PageContextValue
): React.ReactNode {
  const isPageScroll = scroll === "page"

  // Collect which items are sticky (page-scroll mode only — in contained modes
  // items above the scroll container are naturally "pinned" by flexbox).
  const stickyTopItems: React.ReactNode[] = []
  const flowTopItems: React.ReactNode[] = []

  const pushTop = (
    items: React.ReactNode[],
    flag: boolean,
    sticky: boolean
  ) => {
    if (!items.length) return
    if (isPageScroll && sticky) {
      stickyTopItems.push(...items)
    } else {
      flowTopItems.push(...items)
    }
  }

  pushTop(b.header, ctx.stickyHeader, ctx.stickyHeader)
  // hero is never sticky — always scrolls away
  if (b.hero.length) flowTopItems.push(...b.hero)
  pushTop(b.toolbar, ctx.stickyToolbar, ctx.stickyToolbar)
  pushTop(b.search, ctx.stickySearch, ctx.stickySearch)
  pushTop(b.filters, ctx.stickyFilters, ctx.stickyFilters)
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

function renderSplitLayout(
  b: SlotBuckets,
  scroll: ScrollMode,
  ctx: PageContextValue
): React.ReactNode {
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

// ─── Inline State Components ───────────────────────────────────────────────────
// Kept here to avoid circular imports. Users use SmartPageLoading / SmartPageError
// / SmartPageEmpty directly when they want more control.

function PageLoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3 py-16"
    >
      <span
        className="inline-block size-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function PageErrorState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      {children}
    </div>
  )
}

function PageEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      {children}
    </div>
  )
}
