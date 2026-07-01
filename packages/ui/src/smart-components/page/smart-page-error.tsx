"use client"

import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

export interface SmartPageErrorProps {
  /** Short headline describing the error. @default "Something went wrong" */
  title?: string
  /** Detailed message or guidance. */
  description?: React.ReactNode
  /**
   * Called when the user clicks the "Try again" button.
   * When omitted, the retry button is not rendered.
   */
  onRetry?: () => void
  /** Label for the retry button. @default "Try again" */
  retryLabel?: string
  /** Additional class names on the root element. */
  className?: string
}

/**
 * Full-page error state.
 *
 * Shown when a page fails to load its primary data set — network errors,
 * server errors, or permission denied. Offers an optional retry callback
 * and a consistent visual treatment across all page types.
 *
 * ## Usage
 * Pass to SmartPage's `error` prop for automatic placement:
 *
 * ```tsx
 * <SmartPage
 *   error={isError ? (
 *     <SmartPageError
 *       title="Failed to load users"
 *       description={error.message}
 *       onRetry={refetch}
 *     />
 *   ) : undefined}
 * >
 *   …children…
 * </SmartPage>
 * ```
 *
 * Or render it directly:
 * ```tsx
 * <SmartPageContent>
 *   {isError ? <SmartPageError onRetry={refetch} /> : <DataView />}
 * </SmartPageContent>
 * ```
 */
export function SmartPageError({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this page.",
  onRetry,
  retryLabel = "Try again",
  className,
}: SmartPageErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex h-full min-h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-10 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
