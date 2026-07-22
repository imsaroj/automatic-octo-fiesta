import type { ReactNode } from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"

export interface SmartLoadingOverlayProps {
  /** When true, the overlay is shown. */
  loading: boolean
  /** Content to dim behind the overlay. When omitted, the overlay renders standalone. */
  children?: ReactNode
  /** Accessible status text (also displayed under the mark). */
  label?: string
  /** Cover the whole viewport instead of the nearest positioned ancestor. */
  fullscreen?: boolean
  className?: string
}

/**
 * Blocks interaction and marks a region busy while an async operation runs.
 *
 * The composition is the boot screen's, scaled down to overlay size: the mark
 * under a breathing halo, the label, and the sweeping rail — no spinner, so a
 * dialog waiting on a save and the app itself waiting to start read as the
 * same system. Motion is CSS-only (`.sui-boot__*` / `.sui-delayed-in` in
 * `styles/globals.css`), including the ~140ms entrance delay that keeps a fast
 * operation from flashing an overlay at all.
 *
 * Grids don't use this — a table's loading state describes the table (see
 * `data-grid/grid-loading.tsx`).
 */
const SmartLoadingOverlay = ({
  loading,
  children,
  label = "Loading…",
  fullscreen = false,
  className,
}: SmartLoadingOverlayProps) => {
  const overlay = loading ? (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "sui-delayed-in z-50 flex flex-col items-center justify-center gap-4 overflow-hidden bg-background/70 backdrop-blur-[3px]",
        fullscreen ? "fixed inset-0" : "absolute inset-0",
        className
      )}
    >
      <div className="relative flex size-11 items-center justify-center">
        <span
          aria-hidden="true"
          className="sui-boot__halo absolute inset-0 rounded-[0.9rem] ring-1 ring-primary/45"
        />
        <div className="sui-boot__mark relative flex size-11 items-center justify-center rounded-[0.9rem] border border-border/70 bg-card">
          <span aria-hidden="true" className="flex w-5 flex-col gap-[3px]">
            <span className="h-[2.5px] w-full rounded-full bg-primary" />
            <span className="h-[2.5px] w-3/4 rounded-full bg-primary/60" />
            <span className="h-[2.5px] w-1/2 rounded-full bg-primary/30" />
          </span>
        </div>
      </div>

      {label ? (
        <p className="max-w-[16rem] px-4 text-center text-sm font-medium text-balance text-foreground">
          {label}
        </p>
      ) : null}

      <div className="h-[3px] w-32 max-w-[60%] overflow-hidden rounded-full bg-foreground/[0.09]">
        <div className="sui-boot__rail h-full rounded-full" />
      </div>
    </div>
  ) : null

  if (children === undefined) {
    return overlay
  }

  return (
    <div className="relative">
      {children}
      {overlay}
    </div>
  )
}

export { SmartLoadingOverlay }
