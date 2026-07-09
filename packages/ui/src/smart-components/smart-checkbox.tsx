"use client"

import * as React from "react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Checkbox } from "@iamsaroj/smart-ui/components/checkbox"
import { Label } from "@iamsaroj/smart-ui/components/label"

export interface SmartCheckboxProps extends Omit<
  React.ComponentProps<typeof Checkbox>,
  "id" | "aria-describedby"
> {
  /** Visible label rendered to the right of the checkbox. */
  label?: React.ReactNode
  /** Secondary hint rendered below the label. */
  description?: React.ReactNode
  /** Class applied to the outer wrapper div. */
  wrapperClassName?: string
}

/**
 * Checkbox with integrated label and optional description — auto-wired with a
 * shared `useId()` so you never have to manage the `htmlFor`/`id` pair.
 *
 * ```tsx
 * // Before
 * <div className="flex items-start gap-2">
 *   <Checkbox id="terms" />
 *   <div>
 *     <Label htmlFor="terms">Accept terms</Label>
 *     <p className="text-xs text-muted-foreground">You must accept the terms to proceed.</p>
 *   </div>
 * </div>
 *
 * // After
 * <SmartCheckbox
 *   label="Accept terms"
 *   description="You must accept the terms to proceed."
 * />
 * ```
 */
export { Checkbox }

export const SmartCheckbox = ({
  label,
  description,
  wrapperClassName,
  className,
  disabled,
  ...checkboxProps
}: SmartCheckboxProps) => {
  const id = React.useId()
  const descId = description ? `${id}-desc` : undefined

  return (
    <div className={cn("flex items-start gap-2.5", wrapperClassName)}>
      <Checkbox
        id={id}
        disabled={disabled}
        aria-describedby={descId}
        className={cn("mt-0.5", className)}
        {...checkboxProps}
      />
      {(label != null || description != null) && (
        <div className="flex flex-col gap-0.5">
          {label != null && (
            <Label
              htmlFor={id}
              className={cn(disabled && "cursor-not-allowed opacity-50")}
            >
              {label}
            </Label>
          )}
          {description != null && (
            <p
              id={descId}
              className={cn(
                "text-xs text-muted-foreground",
                disabled && "opacity-50"
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
