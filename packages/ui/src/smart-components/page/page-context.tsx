import { createContext, useContext } from "react"

/**
 * The high-level layout mode of the page.
 *
 * | Mode        | Description                                            |
 * |-------------|--------------------------------------------------------|
 * | document    | Natural page flow — blog posts, settings, forms        |
 * | grid        | Data grid fills remaining height — CRUD, list views    |
 * | dashboard   | Cards and widgets — analytics, overview pages          |
 * | split       | Left content + right sidebar — detail views, email     |
 * | fullscreen  | Fills entire area — canvas, maps, editors              |
 * | wizard      | Stepped flow with pinned footer — onboarding, checkout |
 * | detail      | Entity detail with sticky header — profile, item view  |
 */
export type PageLayout =
  | "document"
  | "grid"
  | "dashboard"
  | "split"
  | "fullscreen"
  | "wizard"
  | "detail"

/**
 * Which container owns the scroll behaviour.
 *
 * | Mode    | Scroll owner                                        |
 * |---------|-----------------------------------------------------|
 * | page    | Browser / outer shell scrolls (natural flow)        |
 * | content | SmartPageContent scrolls; header/footer stay fixed  |
 * | grid    | The data grid manages its own scroll                |
 * | none    | No scroll — useful for fullscreen editors / maps    |
 */
export type ScrollMode = "page" | "content" | "grid" | "none"

/** Named padding scale tokens used throughout the layout system. */
export type PaddingSize = "none" | "sm" | "md" | "lg"

export interface PageContextValue {
  /** Resolved layout preset (after auto-detection). */
  layout: PageLayout
  /** Resolved scroll mode. */
  scroll: ScrollMode
  /** Padding scale applied inside content areas. */
  padding: PaddingSize
  stickyHeader: boolean
  stickyToolbar: boolean
  stickySearch: boolean
  stickyFilters: boolean
  stickyStatusBar: boolean
  stickyFooter: boolean
  /** When true, content areas suppress max-width constraints. */
  fullWidth: boolean
  bordered: boolean
}

const defaultContext: PageContextValue = {
  layout: "document",
  scroll: "page",
  padding: "md",
  stickyHeader: false,
  stickyToolbar: false,
  stickySearch: false,
  stickyFilters: false,
  stickyStatusBar: false,
  stickyFooter: false,
  fullWidth: false,
  bordered: false,
}

export const PageContext = createContext<PageContextValue>(defaultContext)

/**
 * Returns the current page layout context.
 * Available to any component rendered inside a {@link SmartPage}.
 */
export const usePageContext = (): PageContextValue => useContext(PageContext)
