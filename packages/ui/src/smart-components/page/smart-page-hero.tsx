"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SMART_PAGE_SLOT } from "./smart-page"

export interface SmartPageHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual treatment of the hero background.
   * - `"muted"` — subtle muted fill (default)
   * - `"gradient"` — foreground-to-transparent gradient overlay
   * - `"none"` — transparent, useful when placing an image background yourself
   */
  background?: "muted" | "gradient" | "none"
  /**
   * Controls the vertical height of the hero.
   * - `"sm"` — compact banner (good for in-page section heroes)
   * - `"md"` — standard hero (default)
   * - `"lg"` — prominent hero (landing-style pages)
   */
  height?: "sm" | "md" | "lg"
}

const bgClasses: Record<
  NonNullable<SmartPageHeroProps["background"]>,
  string
> = {
  muted: "bg-muted",
  gradient: "bg-gradient-to-b from-foreground/5 to-transparent",
  none: "",
}

const heightClasses: Record<
  NonNullable<SmartPageHeroProps["height"]>,
  string
> = {
  sm: "py-8 md:py-10",
  md: "py-12 md:py-16",
  lg: "py-20 md:py-28",
}

/**
 * Full-width feature banner rendered at the top of a page, below the header.
 *
 * Designed for dashboard and landing-style pages where a visual introduction
 * sets context before cards or data appear. The hero always scrolls away with
 * the page content — it is never sticky.
 *
 * Presence of SmartPageHero causes SmartPage to auto-detect a `"dashboard"` layout
 * (natural page scroll, no height constraints).
 *
 * @example
 * ```tsx
 * <SmartPage>
 *   <SmartPageHeader>…</SmartPageHeader>
 *   <SmartPageHero height="md" background="muted">
 *     <SmartPageTitle>Welcome back, Sarah</SmartPageTitle>
 *     <SmartPageDescription>Here's what's happening today.</SmartPageDescription>
 *   </SmartPageHero>
 *   <SmartPageContent>
 *     <MetricCards />
 *   </SmartPageContent>
 * </SmartPage>
 * ```
 */
export const SmartPageHero = React.forwardRef<
  HTMLDivElement,
  SmartPageHeroProps
>(
  (
    { background = "muted", height = "md", className, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      data-slot="page-hero"
      className={cn(
        "w-full shrink-0 px-6",
        bgClasses[background],
        heightClasses[height],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
;(SmartPageHero as unknown as Record<symbol, unknown>)[SMART_PAGE_SLOT] = "hero"
