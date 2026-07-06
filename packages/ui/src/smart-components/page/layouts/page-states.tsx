"use client"

import * as React from "react"

/**
 * Inline full-page state renderers for {@link SmartPage}'s `loading` / `error` /
 * `empty` props. Kept as thin wrappers (separate from the richer
 * `SmartPageLoading` / `SmartPageError` / `SmartPageEmpty` components users can
 * drop in directly) so `smart-page.tsx` doesn't import those and risk a cycle.
 */

export const PageLoadingState = ({
  label = "Loading…",
}: {
  label?: string
}) => (
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

export const PageErrorState = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 items-center justify-center p-8">{children}</div>
)

export const PageEmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 items-center justify-center p-8">{children}</div>
)
