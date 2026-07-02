"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SmartSpinner } from "@workspace/ui/smart-components/spinner"

export interface SmartPageLoadingProps {
  /** Accessible label announced to screen readers and displayed below the spinner. */
  label?: string
  /** Additional class names on the root element. */
  className?: string
}

/**
 * Full-page loading indicator.
 *
 * Renders a centred spinner with an accessible status announcement.
 * Use this for the initial data load of a page — not for incremental /
 * background updates (use SmartLoadingOverlay for those).
 *
 * ## Usage
 * Pass to SmartPage's `loading` and `loadingLabel` props for automatic
 * placement, or render it directly inside a content area:
 *
 * ```tsx
 * // Automatic — replaces all children while loading
 * <SmartPage loading={isLoading} loadingLabel="Loading users…">
 *   …children…
 * </SmartPage>
 *
 * // Manual — inside SmartPageContent
 * <SmartPageContent>
 *   {isLoading ? <SmartPageLoading label="Loading report…" /> : <Report />}
 * </SmartPageContent>
 * ```
 */
export function SmartPageLoading({
  label = "Loading…",
  className,
}: SmartPageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex h-full min-h-[240px] flex-col items-center justify-center gap-3",
        className
      )}
    >
      <SmartSpinner size={28} className="text-primary" label={label} />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
