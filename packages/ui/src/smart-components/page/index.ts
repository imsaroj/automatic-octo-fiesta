// ─── Context ──────────────────────────────────────────────────────────────────
export {
  PageContext,
  usePageContext,
  type PageLayout,
  type ScrollMode,
  type PaddingSize,
  type PageContextValue,
} from "./page-context"

// ─── Page (orchestrator) ──────────────────────────────────────────────────────
export {
  SmartPage,
  SMART_PAGE_SLOT,
  type SmartPageProps,
  type PageSlot,
} from "./smart-page"

// ─── Header zone ──────────────────────────────────────────────────────────────
export {
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageBreadcrumb,
  type SmartPageHeaderProps,
  type SmartPageTitleProps,
  type SmartPageBreadcrumbProps,
  type SmartPageBreadcrumbItem,
} from "./smart-page-header"

// ─── Hero ─────────────────────────────────────────────────────────────────────
export { SmartPageHero, type SmartPageHeroProps } from "./smart-page-hero"

// ─── Toolbar ──────────────────────────────────────────────────────────────────
export { SmartToolbar, type SmartToolbarProps } from "./smart-toolbar"

// ─── Search + Filters ─────────────────────────────────────────────────────────
export { SmartPageSearch, type SmartPageSearchProps } from "./smart-page-search"

export {
  SmartPageFilters,
  type SmartPageFiltersProps,
} from "./smart-page-filters"

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export {
  SmartPageTabs,
  SmartPageTab,
  SmartPageTabPanel,
  type SmartPageTabsProps,
  type SmartPageTabProps,
  type SmartPageTabPanelProps,
} from "./smart-page-tabs"

// ─── Content ──────────────────────────────────────────────────────────────────
export {
  SmartPageContent,
  type SmartPageContentProps,
} from "./smart-page-content"

export {
  SmartPageSection,
  type SmartPageSectionProps,
} from "./smart-page-section"

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export { SmartSidebar, type SmartSidebarProps } from "./smart-sidebar"

// ─── Grid area ────────────────────────────────────────────────────────────────
export { SmartGridArea, type SmartGridAreaProps } from "./smart-grid-area"

// ─── Status bar ───────────────────────────────────────────────────────────────
export {
  SmartPageStatusBar,
  type SmartPageStatusBarProps,
} from "./smart-page-status-bar"

// ─── Footer ───────────────────────────────────────────────────────────────────
export { SmartPageFooter, type SmartPageFooterProps } from "./smart-page-footer"

// ─── States ───────────────────────────────────────────────────────────────────
export { SmartPageEmpty, type SmartPageEmptyProps } from "./smart-page-empty"

export {
  SmartPageLoading,
  type SmartPageLoadingProps,
} from "./smart-page-loading"

export {
  SmartPageError,
  type SmartPageErrorProps,
  type SmartPageErrorKind,
  type SmartPageErrorTone,
} from "./smart-page-error"

export {
  SmartPageErrorBoundary,
  type SmartPageErrorBoundaryProps,
  type SmartPageErrorBoundaryState,
} from "./smart-page-error-boundary"

// The pure classification layer, exported so apps can reuse the same
// normalization for toasts, logging, or their own failure surfaces.
export {
  normalizeError,
  inferErrorKind,
  buildDiagnostics,
  ERROR_KIND_TONE,
  ERROR_KIND_RETRYABLE,
  type NormalizedError,
  type DiagnosticsInput,
} from "./error-kind"

// ─── Container (compound wrapper) ─────────────────────────────────────────────
export {
  SmartPageContainer,
  type SmartPageContainerProps,
} from "./smart-page-container"
