/**
 * Slot tagging primitive, kept in a dependency-free leaf module.
 *
 * Every SmartPage slot component (header, toolbar, footer, …) stamps this
 * symbol onto itself so {@link SmartPage} can bucket children by slot without
 * relying on class identity (which breaks with HOCs or lazy imports).
 *
 * It lives here rather than in `smart-page.tsx` so that `smart-page.tsx` can
 * import a slot component (to auto-render a header from flat props) without a
 * circular import: the slot component depends only on this leaf, never back on
 * the page orchestrator.
 */

/**
 * Well-known symbol placed as a static property on every slot component.
 * SmartPage reads this to bucket children.
 */
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
