"use client"

import { cn } from "@iamsaroj/smart-ui/lib/utils"

export interface SmartPageLoadingProps {
  /** Accessible label announced to screen readers and displayed below the mark. */
  label?: string
  /** Additional class names on the root element. */
  className?: string
}

/**
 * Full-page loading indicator.
 *
 * A calm, centred composition — a brand mark under a breathing halo, the
 * label, and a thin sweeping rail — rather than a spinner. Use this for the
 * initial load of a page or route, not for incremental / background updates
 * (use SmartLoadingOverlay for those).
 *
 * ## Behaviour worth knowing
 * - It **fills its parent** (`flex-1` + `h-full`), so it is viewport-centred
 *   wherever the height chain reaches the viewport, and region-centred inside
 *   a `SmartPageContent`. No layout props to pass.
 * - It **waits ~140ms before appearing**, so a route that resolves quickly
 *   never flashes a loading screen. The delay is an animation delay, not a
 *   timer: the component holds no state and never re-renders.
 * - Motion is CSS-only and honours `prefers-reduced-motion`, which swaps the
 *   halo and rail for static resting states instead of freezing them.
 *
 * ## Usage
 * Pass to SmartPage's `loading` and `loadingLabel` props for automatic
 * placement, render it directly inside a content area, or use it as a
 * `<Suspense>` fallback for lazy routes:
 *
 * ```tsx
 * // Automatic — replaces all children while loading
 * <SmartPage loading={isLoading} loadingLabel="Loading users…">
 *   …children…
 * </SmartPage>
 *
 * // Route-level — the whole viewport while the chunk arrives
 * <Suspense fallback={<SmartPageLoading label="Preparing your workspace" />}>
 *   <Routes>…</Routes>
 * </Suspense>
 * ```
 */
export const SmartPageLoading = ({
  label = "Loading…",
  className,
}: SmartPageLoadingProps) => (
  <div
    role="status"
    aria-busy="true"
    aria-live="polite"
    aria-label={label}
    className={cn(
      "relative isolate flex h-full min-h-[280px] w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12",
      className
    )}
  >
    {/* One soft bloom in the brand hue, sat slightly above centre so the
        composition has a light source. Decorative and static — the only
        moving parts on screen are the halo and the rail. */}
    <div
      aria-hidden="true"
      className="sui-boot__bloom pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[22rem] max-w-[150%] -translate-x-1/2 -translate-y-[62%]"
    />

    <div className="sui-boot__stage flex w-full max-w-xs flex-col items-center">
      <div className="relative flex size-16 items-center justify-center">
        <span
          aria-hidden="true"
          className="sui-boot__halo absolute inset-0 rounded-[1.25rem] ring-1 ring-primary/45"
        />
        {/* The mark: three stacked bars in descending weight — the shape of
            the content that is about to arrive. Consumers with a real logo
            can swap the whole screen; this stays brand-neutral. */}
        <div className="sui-boot__mark relative flex size-16 items-center justify-center rounded-[1.25rem] border border-border/70 bg-card">
          <span aria-hidden="true" className="flex w-7 flex-col gap-1">
            <span className="h-[3.5px] w-full rounded-full bg-primary" />
            <span className="h-[3.5px] w-3/4 rounded-full bg-primary/60" />
            <span className="h-[3.5px] w-1/2 rounded-full bg-primary/30" />
          </span>
        </div>
      </div>

      <p className="mt-7 text-sm font-medium text-balance text-foreground">
        {label}
      </p>

      <div className="mt-4 h-[3px] w-48 max-w-full overflow-hidden rounded-full bg-foreground/[0.09]">
        <div className="sui-boot__rail h-full rounded-full" />
      </div>
    </div>
  </div>
)
