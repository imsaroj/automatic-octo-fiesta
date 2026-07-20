"use client"

import * as React from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import {
  PageContext,
  type PageContextValue,
  type PageLayout,
  type ScrollMode,
  type PaddingSize,
} from "./page-context"
import { SMART_PAGE_SLOT, type PageSlot } from "./slot"
import type { SlotBuckets } from "./layouts/slot-buckets"
import { StandardLayout } from "./layouts/standard-layout"
import { SplitLayout } from "./layouts/split-layout"
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "./layouts/page-states"
import {
  SmartPageHeader,
  type SmartPageHeaderProps,
  type SmartPageBreadcrumbItem,
} from "./smart-page-header"

// ─── Slot Detection ────────────────────────────────────────────────────────────

// `SMART_PAGE_SLOT` and `PageSlot` are re-exported here for backwards
// compatibility — they live in the dependency-free `./slot` leaf so this module
// can import a slot component (SmartPageHeader) without a circular import.
export { SMART_PAGE_SLOT, type PageSlot }

const SLOT_NAMES: ReadonlySet<string> = new Set<PageSlot>([
  "header",
  "hero",
  "toolbar",
  "search",
  "filters",
  "tabs",
  "content",
  "sidebar",
  "grid-area",
  "status-bar",
  "footer",
])

/**
 * A child's slot: the symbol stamped on its component type (how the built-in
 * slot components are tagged), or an explicit `slot` prop — the escape hatch
 * for app components that *wrap* a slot component, where the symbol on the
 * inner type is invisible to this walk.
 */
const slotOf = (child: React.ReactElement): PageSlot | undefined => {
  const fromType = (child.type as unknown as Record<symbol, unknown>)[
    SMART_PAGE_SLOT
  ] as PageSlot | undefined
  if (fromType) return fromType
  const explicit = (child.props as { slot?: unknown } | null)?.slot
  return typeof explicit === "string" && SLOT_NAMES.has(explicit)
    ? (explicit as PageSlot)
    : undefined
}

const collectSlots = (children: React.ReactNode): SlotBuckets => {
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
    const slot = slotOf(child)
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

const detectLayout = (b: SlotBuckets): PageLayout => {
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

  // ─── Flat header props (the common case) ─────────────────────────────────
  // Set any of these and SmartPage renders a {@link SmartPageHeader} for you —
  // no need to import or nest one. Nesting `<SmartPageHeader>` as a child stays
  // available as the escape hatch for full control.

  /** Breadcrumb trail rendered above the title in the auto-rendered header. */
  breadcrumb?: SmartPageBreadcrumbItem[]
  /** Page title. A string is styled automatically; pass a node for custom title rows (e.g. a badge beside it). */
  title?: React.ReactNode
  /** Supporting description rendered below the title. */
  description?: React.ReactNode
  /** Right-aligned header action group, on the same row as the title. */
  actions?: React.ReactNode
  /**
   * Extra props forwarded to the auto-rendered {@link SmartPageHeader} — e.g.
   * `border` / `compact` styling, or `children` for a custom row below the
   * flat block. Only applies when a flat header prop is set.
   */
  headerProps?: Omit<
    SmartPageHeaderProps,
    "breadcrumb" | "title" | "description" | "actions"
  >

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
 * ## Loose children & the `slot` prop
 * Children that aren't slot components are never dropped: they form the main
 * region when no `SmartGridArea`/`SmartPageContent` claims it, and otherwise
 * render right after the main region — so overlays (a create/edit
 * `SmartSheet`, dialogs) can live inside the page. An app component that
 * *wraps* a slot component can declare its placement explicitly with a
 * `slot` prop (e.g. `<MyToolbar slot="toolbar" />`), since the wrapper hides
 * the inner component's slot tag from SmartPage.
 *
 * ## States
 * Pass `loading`, `error`, or `empty` to replace children with the appropriate
 * full-page state — useful for data-driven views that haven't loaded yet.
 *
 * ## Header: flat props vs. composition
 * For the common case, pass `breadcrumb` / `title` / `description` / `actions`
 * straight to SmartPage — it renders a {@link SmartPageHeader} for you, so you
 * never import or nest one. Nesting `<SmartPageHeader>` as a child is still the
 * escape hatch for full control (custom border/compact, extra rows, …).
 *
 * @example Flat header (the common case — no SmartPageHeader import)
 * ```tsx
 * <SmartPage
 *   breadcrumb={[{ label: "Admin", href: "#" }, { label: "Users" }]}
 *   title="Users"
 *   description="Manage your organisation's members."
 *   actions={<Button>Invite user</Button>}
 * >
 *   <SmartGridArea>…</SmartGridArea>
 * </SmartPage>
 * ```
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
export const SmartPage = ({
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
  breadcrumb,
  title,
  description,
  actions,
  headerProps,
  className,
  children,
}: SmartPageProps) => {
  const buckets = React.useMemo(() => collectSlots(children), [children])

  // Flat header props render a SmartPageHeader for the consumer and slot it
  // ahead of any composed header children (the escape hatch).
  const hasFlatHeader =
    (breadcrumb?.length ?? 0) > 0 ||
    title != null ||
    description != null ||
    actions != null

  const resolvedBuckets = React.useMemo<SlotBuckets>(() => {
    if (!hasFlatHeader) return buckets
    const flatHeader = (
      <SmartPageHeader
        key="__smart-page-flat-header"
        breadcrumb={breadcrumb}
        title={title}
        description={description}
        actions={actions}
        {...headerProps}
      />
    )
    return { ...buckets, header: [flatHeader, ...buckets.header] }
  }, [
    buckets,
    hasFlatHeader,
    breadcrumb,
    title,
    description,
    actions,
    headerProps,
  ])

  const layout = layoutProp ?? detectLayout(resolvedBuckets)
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
    content = <PageLoadingState label={loadingLabel} />
  } else if (error) {
    content = <PageErrorState>{error}</PageErrorState>
  } else if (empty) {
    content = <PageEmptyState>{empty}</PageEmptyState>
  } else if (layout === "split") {
    content = (
      <SplitLayout buckets={resolvedBuckets} scroll={scroll} ctx={ctx} />
    )
  } else {
    content = (
      <StandardLayout buckets={resolvedBuckets} scroll={scroll} ctx={ctx} />
    )
  }

  return (
    <PageContext.Provider value={ctx}>
      <div className={pageClasses}>{content}</div>
    </PageContext.Provider>
  )
}
