import * as React from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Label } from "@iamsaroj/smart-ui/components/label"

export interface SmartLabelProps extends React.ComponentProps<"label"> {
  /** Appends a red asterisk to signal a required field. */
  required?: boolean
  /** Appends a muted "(optional)" hint. */
  optional?: boolean
}

/**
 * Label with built-in required / optional indicators.
 *
 * ```tsx
 * <SmartLabel htmlFor="email" required>Email address</SmartLabel>
 * // → "Email address *"
 *
 * <SmartLabel htmlFor="bio" optional>Bio</SmartLabel>
 * // → "Bio (optional)"
 * ```
 */
export { Label }

export const SmartLabel = ({
  required,
  optional,
  children,
  className,
  ...props
}: SmartLabelProps) => (
  <Label className={cn(className)} {...props}>
    {children}
    {required && (
      <span className="text-destructive" aria-hidden="true">
        *
      </span>
    )}
    {optional && (
      <span className="font-normal text-muted-foreground"> (optional)</span>
    )}
  </Label>
)
