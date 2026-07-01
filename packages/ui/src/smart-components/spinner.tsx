import { cn } from "@workspace/ui/lib/utils"
import type { HTMLAttributes } from "react"

export interface SSpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Pixel size of the spinner. Defaults to `16`. */
  size?: number
  /** Accessible label announced to screen readers. */
  label?: string
}

/** A dependency-free, token-aware loading spinner. */
export function SmartSpinner({
  className,
  size = 16,
  label = "Loading",
  style,
  ...props
}: SSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  )
}
