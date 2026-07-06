"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { usePageContext, type PaddingSize } from "./page-context"
import { SMART_PAGE_SLOT } from "./smart-page"

const PADDING_CLASSES: Record<PaddingSize, string> = {
  none: "",
  sm: "p-3",
  // Trim the top padding so content sits close to the page header (whose own
  // py-4 already contributes ~16px). Sides/bottom keep the full padding.
  md: "p-4 pt-2 md:px-6 md:pt-2 md:pb-6",
  lg: "p-6 pt-3 md:px-8 md:pt-3 md:pb-8",
}

const MAX_WIDTH_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "w-full max-w-none",
} as const

export interface SmartPageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Local padding override. Inherits from SmartPage `padding` prop by default.
   */
  padding?: boolean | PaddingSize
  /**
   * Constrain the inner content to a readable max-width and centre it.
   * Ignored when SmartPage has `fullWidth` enabled.
   */
  maxWidth?: keyof typeof MAX_WIDTH_CLASSES
  /**
   * Horizontally centre the inner content block (requires `maxWidth`).
   * @default false
   */
  centered?: boolean
}

/**
 * Main content area of the page.
 *
 * SmartPageContent adapts its behaviour based on the scroll mode set by
 * the parent {@link SmartPage}:
 *
 * | Scroll mode | Behaviour                                              |
 * |-------------|--------------------------------------------------------|
 * | `"page"`    | Grows to fill remaining space; page scrolls naturally   |
 * | `"content"` | Becomes the scroll container (`flex-1 overflow-y-auto`) |
 * | `"grid"`    | Grows; no scroll (grid manages its own)                |
 * | `"none"`    | Grows; no scroll at all                                |
 *
 * The `"content"` mode is the critical one: the outer container is
 * `overflow-hidden` (preventing page scroll) while SmartPageContent
 * has `overflow-y-auto`, creating exactly one scrollbar on the inner area.
 *
 * ## max-width and centering
 * For document and settings pages, pass `maxWidth` to constrain the reading
 * width and `centered` to horizontally centre the content block.
 *
 * @example Document page with centred content
 * ```tsx
 * <SmartPage layout="document">
 *   <SmartPageHeader>…</SmartPageHeader>
 *   <SmartPageContent maxWidth="2xl" centered>
 *     <SmartPageSection title="Profile">…</SmartPageSection>
 *   </SmartPageContent>
 * </SmartPage>
 * ```
 *
 * @example Settings page (detail layout, scrollable body)
 * ```tsx
 * <SmartPage layout="detail">
 *   <SmartPageHeader>…</SmartPageHeader>
 *   <SmartPageContent maxWidth="xl" centered>
 *     <SettingsForm />
 *   </SmartPageContent>
 * </SmartPage>
 * ```
 */
export const SmartPageContent = React.forwardRef<
  HTMLDivElement,
  SmartPageContentProps
>(function SmartPageContent(
  {
    padding: localPadding,
    maxWidth,
    centered = false,
    className,
    children,
    ...props
  },
  ref
) {
  const { scroll, padding: ctxPadding, fullWidth } = usePageContext()

  const resolvedPadding: PaddingSize =
    localPadding === true
      ? "md"
      : localPadding === false
        ? "none"
        : (localPadding ?? ctxPadding)

  const isScrollContainer = scroll === "content"

  const outerClasses = cn(
    "flex-1",
    isScrollContainer && "min-h-0 overflow-y-auto",
    className
  )

  const innerClasses = cn(
    PADDING_CLASSES[resolvedPadding],
    !fullWidth && maxWidth && MAX_WIDTH_CLASSES[maxWidth],
    (centered || (!fullWidth && maxWidth)) && "mx-auto"
  )

  return (
    <div ref={ref} data-slot="page-content" className={outerClasses} {...props}>
      {innerClasses ? <div className={innerClasses}>{children}</div> : children}
    </div>
  )
})
;(SmartPageContent as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] =
  "content"
