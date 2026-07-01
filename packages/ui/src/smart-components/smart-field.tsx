"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Label } from "@workspace/ui/components/label"

export interface SmartFieldProps {
  /**
   * Auto-generated with `useId()` when omitted. Injected into a single
   * React-element child via `cloneElement` so the Label's `htmlFor`
   * connects without manual ID threading.
   */
  id?: string
  /** Field label rendered above the control. */
  label?: React.ReactNode
  /** Supporting hint rendered below the control. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error. Replaces `description` and marks the control invalid. */
  error?: React.ReactNode
  /** Appends a red asterisk to the label. */
  required?: boolean
  /** Appends a muted "(optional)" to the label. */
  optional?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Generic form-field wrapper: Label → control → hint/error.
 *
 * When `children` is a single React element SmartField injects `id`,
 * `aria-describedby`, and `aria-invalid` automatically so you never
 * have to thread IDs by hand.
 *
 * ```tsx
 * // Before
 * <div className="flex flex-col gap-1.5">
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" aria-describedby="email-hint" />
 *   <p id="email-hint" className="text-xs text-muted-foreground">We'll never share your email.</p>
 * </div>
 *
 * // After
 * <SmartField label="Email" description="We'll never share your email.">
 *   <Input type="email" />
 * </SmartField>
 * ```
 *
 * Fall back to raw Label + control when the field needs two controls
 * (e.g. a start/end date range) — `cloneElement` only works on a single child.
 */
export function SmartField({
  id: idProp,
  label,
  description,
  error,
  required,
  optional,
  className,
  children,
}: SmartFieldProps) {
  const autoId = React.useId()
  const resolvedId = idProp ?? autoId
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${resolvedId}-hint` : undefined

  const injected = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          id: (children.props as { id?: string }).id ?? resolvedId,
          ...(hintId && { "aria-describedby": hintId }),
          ...(error != null && { "aria-invalid": true }),
        }
      )
    : children

  return (
    <div data-slot="field" className={cn("flex flex-col gap-1.5", className)}>
      {label != null && (
        <Label htmlFor={resolvedId}>
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
      {injected}
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
