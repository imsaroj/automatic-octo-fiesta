"use client"

import * as React from "react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { withLeadingSpaceGuard } from "@imsaroj/smart-ui/lib/leading-space"
import { Input } from "@imsaroj/smart-ui/components/input"
import { Label } from "@imsaroj/smart-ui/components/label"

export interface SmartInputProps extends React.ComponentProps<"input"> {
  /** Field label rendered above the input. */
  label?: React.ReactNode
  /** Hint rendered below the input. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below the input instead of `description`. */
  error?: React.ReactNode
  /** Appends a red asterisk to the label. */
  required?: boolean
  /** Appends a muted "(optional)" to the label. */
  optional?: boolean
  /** Class applied to the outer field wrapper. */
  fieldClassName?: string
  /**
   * By default the value may not *start* with whitespace: Space at the
   * beginning is ignored (including a held space bar) and pasted leading
   * spaces are stripped; spaces after the first character work normally.
   * Set to `true` to allow a leading space.
   */
  allowLeadingSpace?: boolean
}

/**
 * Input with integrated label, description, and error message.
 *
 * ```tsx
 * // Before
 * <div className="flex flex-col gap-1.5">
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" />
 *   <p className="text-xs text-destructive">{error}</p>
 * </div>
 *
 * // After
 * <SmartInput
 *   label="Email"
 *   type="email"
 *   error={error}
 *   required
 * />
 * ```
 */
export { Input }

export const SmartInput = ({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  className,
  id: idProp,
  allowLeadingSpace,
  onKeyDown,
  onChange,
  ...inputProps
}: SmartInputProps) => {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label htmlFor={id}>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
          {optional && (
            <span className="font-normal text-muted-foreground">
              {" "}
              (optional)
            </span>
          )}
        </Label>
      )}
      <Input
        id={id}
        className={className}
        aria-describedby={hintId}
        aria-invalid={error != null ? true : undefined}
        {...inputProps}
        {...withLeadingSpaceGuard({ onKeyDown, onChange }, allowLeadingSpace)}
      />
      {hasHint && (
        <p
          id={hintId}
          className={cn(
            "text-xs",
            error != null ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  )
}
