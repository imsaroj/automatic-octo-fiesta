"use client"

import * as React from "react"
import { SmartPageLoading } from "../smart-page-loading"

/**
 * Inline full-page state renderers for {@link SmartPage}'s `loading` / `error` /
 * `empty` props. Kept as thin wrappers (separate from the richer
 * `SmartPageError` / `SmartPageEmpty` components users can drop in directly)
 * so `smart-page.tsx` doesn't import those and risk a cycle.
 *
 * Loading is the exception: `SmartPageLoading` imports nothing from this
 * folder, so there is no cycle to risk, and a page that loads via the
 * `loading` prop should look identical to one that renders the component
 * directly — a second, cheaper spinner here was just a fork of the design.
 */

export const PageLoadingState = ({ label }: { label?: string }) => (
  <SmartPageLoading label={label} />
)

export const PageErrorState = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 items-center justify-center p-8">{children}</div>
)

export const PageEmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 items-center justify-center p-8">{children}</div>
)
