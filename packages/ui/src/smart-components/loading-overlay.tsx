import type { ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SmartSpinner } from "@workspace/ui/smart-components/spinner"

export interface SmartLoadingOverlayProps {
  /** When true, the overlay is shown. */
  loading: boolean
  /** Content to dim behind the overlay. When omitted, the overlay renders standalone. */
  children?: ReactNode
  /** Accessible status text (also displayed under the spinner). */
  label?: string
  /** Cover the whole viewport instead of the nearest positioned ancestor. */
  fullscreen?: boolean
  className?: string
}

/** Blocks interaction and shows a spinner while an async region is busy. */
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
      aria-live="polite"
      className={cn(
        "z-50 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm",
        fullscreen ? "fixed inset-0" : "absolute inset-0",
        className
      )}
    >
      <SmartSpinner size={28} className="text-primary" />
      {label ? (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      ) : null}
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
