"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { withLeadingSpaceGuard } from "@workspace/ui/lib/leading-space"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"

export interface SmartTextareaProps extends React.ComponentProps<"textarea"> {
  /** Field label rendered above the textarea. */
  label?: React.ReactNode
  /** Hint rendered below the textarea. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
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
 * Textarea with integrated label, description, and error message.
 *
 * ```tsx
 * <SmartTextarea
 *   label="Bio"
 *   placeholder="Tell us about yourself…"
 *   description="Max 160 characters."
 *   optional
 * />
 * ```
 */
export { Textarea }

export const SmartTextarea = ({
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
  ...textareaProps
}: SmartTextareaProps) => {
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
      <Textarea
        id={id}
        className={className}
        aria-describedby={hintId}
        aria-invalid={error != null ? true : undefined}
        {...textareaProps}
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
