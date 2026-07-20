import { cn } from "@iamsaroj/smart-ui/lib/utils"
import type { HTMLAttributes } from "react"

export interface SmartSpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Pixel size of the spinner. Defaults to `16`. */
  size?: number
  /** Accessible label announced to screen readers. */
  label?: string
}

/** A dependency-free, token-aware loading spinner. */
export const SmartSpinner = ({
  className,
  size = 16,
  label = "Loading",
  style,
  ...props
}: SmartSpinnerProps) => (
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
